import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import HomeHeader from "../components/ui/HomeHeader";
import ProjectCard from "../components/ui/ProjectCard";
import ProjectListRow from "../components/ui/ProjectListRow";
import ProjectsToolbar from "../components/ui/ProjectsToolbar";
import { chatApi } from "../services/api";
import type { LibraryViewMode, ProjectDisplay, SortOption } from "../types/project";
import { toProjectDisplay } from "../types/project";

type FilterValue = "Todos" | "in_progress" | "completed" | "draft";

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

  useEffect(() => {
    document.title = "Proyectos — Nori";
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { conversations } = await chatApi.getConversations();
      const seen = new Set<string>();
      const unique = conversations.filter((p: any) => {
        if (seen.has(p.project_id)) return false;
        seen.add(p.project_id);
        return true;
      });
      const displayProjects = unique.map(toProjectDisplay);
      setProjects(displayProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
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
              onClick={loadProjects}
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
        />

        {viewMode === "grid" ? (
          <section className="dashboard-grid" aria-label="Proyectos en cuadrícula">
            {visibleProjects.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
          </section>
        ) : visibleProjects.length > 0 ? (
          <section className="dashboard-projects-list" aria-label="Proyectos en lista">
            <div className="dashboard-projects-table-wrap">
              <table className="projects-table">
                <thead>
                  <tr>
                    <th scope="col">Proyecto</th>
                    <th scope="col">Categorías</th>
                    <th scope="col">Progreso</th>
                    <th scope="col">Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((project) => (
                    <ProjectListRow key={project.project_id} project={project} />
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
