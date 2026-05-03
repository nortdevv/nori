import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import HomeHeader from "../components/ui/HomeHeader";
import ProjectCard from "../components/ui/ProjectCard";
import ProjectListRow from "../components/ui/ProjectListRow";
import ProjectsToolbar from "../components/ui/ProjectsToolbar";
import { chatApi } from "../services/api";
import type { LibraryViewMode, Project, ProjectDisplay, SortOption } from "../types/project";
import { toProjectDisplay } from "../types/project";
import { getErrorMessage } from "../lib/utils";

type FilterValue = "Todos" | "in_progress" | "completed" | "draft";

function truncateEnd(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, Math.max(0, maxLen - 1))}…`;
}

/** Short list of selected project titles for the selection bar. */
function formatSelectionNamePreview(names: string[]): string {
  if (names.length === 0) return "";
  const t = (s: string) => truncateEnd(s, 40);
  if (names.length === 1) return t(names[0]);
  if (names.length === 2) return `${t(names[0])} · ${t(names[1])}`;
  return `${t(names[0])} · ${t(names[1])} y ${names.length - 2} más`;
}

function Proyectos() {
  const { user } = useAuth();
  const welcomeName = user?.name || user?.email || "Usuario";
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<LibraryViewMode>("grid");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Proyectos — Nori";
    loadProjects(true);
  }, []);

  const loadProjects = async (showLoadingIndicator = false) => {
    try {
      if (showLoadingIndicator) setIsLoading(true);
      setError(null);
      const { conversations } = await chatApi.getConversations();
      const seen = new Set<string>();
      const unique = conversations.filter((p: Project) => {
        if (seen.has(p.project_id)) return false;
        seen.add(p.project_id);
        return true;
      });
      const displayProjects = unique.map(toProjectDisplay);
      setProjects(displayProjects);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load projects"));
      console.error("Error loading projects:", err);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  };

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...projects]
      .filter((project) => {
        const matchesFilter =
          activeFilter === "Todos" || project.status === activeFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          project.name.toLowerCase().includes(normalizedSearch) ||
          (project.tags && project.tags.some(tag => tag.toLowerCase().includes(normalizedSearch)));

        return matchesFilter && matchesSearch;
      })
      .sort((first, second) => {
        if (sortBy === "name") {
          return first.name.localeCompare(second.name, "es");
        }
        // Sort by last_updated date (most recent first)
        return new Date(second.last_updated).getTime() - new Date(first.last_updated).getTime();
      });
  }, [activeFilter, searchTerm, sortBy, projects]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkActionError(null);
  };

  const toggleProjectSelected = (projectId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const allVisibleSelected =
    visibleProjects.length > 0 &&
    visibleProjects.every((p) => selectedIds.has(p.project_id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleProjects.forEach((p) => next.delete(p.project_id));
      } else {
        visibleProjects.forEach((p) => next.add(p.project_id));
      }
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  const selectedProjectNames = useMemo(() => {
    return projects
      .filter((p) => selectedIds.has(p.project_id))
      .map((p) => p.name)
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [projects, selectedIds]);

  const selectionBarSummary = useMemo(() => {
    const visible = visibleProjects.length;
    const total = projects.length;
    if (selectedCount > 0) {
      const preview = formatSelectionNamePreview(selectedProjectNames);
      const count =
        selectedCount === 1
          ? "1 proyecto seleccionado"
          : `${selectedCount} proyectos seleccionados`;
      return preview ? `${count}: ${preview}` : count;
    }
    if (visible === 0) {
      return "No hay proyectos en esta vista. Prueba otros filtros o búsqueda.";
    }
    if (visible === total) {
      return `Toca tarjetas o filas para marcar proyectos (${total} en tu biblioteca).`;
    }
    return `Toca tarjetas o filas para marcar proyectos (${visible} de ${total} con esta búsqueda y filtros).`;
  }, [
    selectedCount,
    selectedProjectNames,
    visibleProjects.length,
    projects.length,
  ]);

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || bulkDeleting) return;
    if (
      !window.confirm(
        `¿Eliminar ${ids.length === 1 ? "este proyecto" : `estos ${ids.length} proyectos`}? Se borrarán la conversación, el documento en borrador y los archivos asociados. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    setBulkActionError(null);
    try {
      for (const pid of ids) {
        await chatApi.deleteConversation(pid);
      }
      exitSelectionMode();
      await loadProjects(false);
    } catch (err: unknown) {
      setBulkActionError(getErrorMessage(err, "No se pudieron eliminar todos los proyectos"));
    } finally {
      setBulkDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <HomeHeader />
        <main className="dashboard-content">
          <div
            className="dashboard-loading-skeleton"
            aria-busy="true"
            aria-label="Cargando proyectos"
          >
            <div className="dashboard-loading-skeleton__hero" />
            <div className="dashboard-loading-skeleton__toolbar" />
            <div className="dashboard-loading-skeleton__grid">
              <div className="dashboard-loading-skeleton__card" />
              <div className="dashboard-loading-skeleton__card" />
              <div className="dashboard-loading-skeleton__card" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <HomeHeader />
        <main className="dashboard-content">
          <div className="dashboard-error-panel" role="alert">
            <p className="dashboard-error-panel__message">Error: {error}</p>
            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => loadProjects(true)}
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <HomeHeader />

      <main className="dashboard-content">
        <section className="dashboard-hero">
          <div>
            <h1 className="dashboard-title">Bienvenido, {welcomeName}</h1>
            <p className="dashboard-subtitle">
              Gestiona y genera la documentación de tus proyectos de software.
            </p>
          </div>

          <Link to="/crear" className="dashboard-create-button">
            <Plus size={18} strokeWidth={2.5} />
            <span>Crear Nuevo Proyecto</span>
          </Link>
        </section>

        <ProjectsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectionMode={selectionMode}
          onSelectionModeToggle={() =>
            selectionMode ? exitSelectionMode() : setSelectionMode(true)
          }
        />

        {bulkActionError && (
          <div className="dashboard-bulk-error" role="alert">
            {bulkActionError}
          </div>
        )}

        {(selectionMode || selectedCount > 0) && projects.length > 0 ? (
          <div
            className="dashboard-selection-bar"
            role="region"
            aria-label="Acciones de selección"
          >
            <div className="dashboard-selection-bar__text">
              <p className="dashboard-selection-bar__summary">{selectionBarSummary}</p>
            </div>
            <div className="dashboard-selection-bar__actions">
              {selectedCount > 0 ? (
                <button
                  type="button"
                  className="dashboard-selection-bar__btn dashboard-selection-bar__btn--danger"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                >
                  <Trash2 size={16} strokeWidth={2.2} aria-hidden />
                  {bulkDeleting ? "Eliminando…" : "Eliminar"}
                </button>
              ) : null}
              <button
                type="button"
                className="dashboard-selection-bar__btn dashboard-selection-bar__btn--muted"
                onClick={exitSelectionMode}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        {viewMode === "grid" ? (
          <section className="dashboard-grid" aria-label="Proyectos en cuadrícula">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                selectionMode={selectionMode}
                selected={selectedIds.has(project.project_id)}
                onToggleSelected={() => toggleProjectSelected(project.project_id)}
              />
            ))}
          </section>
        ) : visibleProjects.length > 0 ? (
          <section className="dashboard-projects-list" aria-label="Proyectos en lista">
            <div className="dashboard-projects-table-wrap">
              <table
                className={`projects-table${selectionMode ? " projects-table--selecting" : ""}`}
              >
                <thead>
                  <tr>
                    {selectionMode ? (
                      <th scope="col" className="projects-table__th-select">
                        <input
                          type="checkbox"
                          className="project-select-checkbox project-select-checkbox--circle"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label="Seleccionar todos los proyectos visibles"
                        />
                      </th>
                    ) : null}
                    <th scope="col">Proyecto</th>
                    <th scope="col">Categorías</th>
                    <th scope="col">Progreso</th>
                    <th scope="col">Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((project) => (
                    <ProjectListRow
                      key={project.project_id}
                      project={project}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(project.project_id)}
                      onToggleSelected={() => toggleProjectSelected(project.project_id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {visibleProjects.length === 0 &&
          (projects.length === 0 ? (
            <section className="dashboard-empty-state">
              <h2>Aún no tienes proyectos</h2>
              <p>
                Crea tu primer proyecto para empezar a generar la documentación
                de tu software.
              </p>
              <p className="dashboard-empty-state__cta">
                <Link to="/crear" className="dashboard-create-button">
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Crear Nuevo Proyecto</span>
                </Link>
              </p>
            </section>
          ) : (
            <section className="dashboard-empty-state">
              <h2>No encontramos proyectos</h2>
              <p>
                Ajusta los filtros o prueba con otra búsqueda para ver más
                resultados.
              </p>
            </section>
          ))}
      </main>
    </div>
  );
}

export default Proyectos;
