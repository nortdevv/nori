import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Users, CheckCircle2, FileText, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
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
  const [adminProjects, setAdminProjects] = useState<any[]>([]);


  useEffect(() => {
    document.title = "Proyectos — Nori";
    if (!user?.id) return;
    loadProjects(true);
    if (user?.role === "admin") {
      loadAdminProjects();
    }
  }, [user?.id, user?.role]);

  const loadProjects = async (showLoadingIndicator = false) => {
    try {
      if (showLoadingIndicator) setIsLoading(true);
      setError(null);

      // Enviamos el ID del usuario autenticado actual en lugar de usar siempre el estático
      const { conversations } = await chatApi.getConversations(user?.id);

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

  const loadAdminProjects = async () => {
    if (!user?.id) return;
    try {
      const data = await chatApi.getAdminUsersProgress();
      setAdminProjects(data.projects);
    } catch (err) {
      console.error("Error cargando proyectos del equipo:", err);
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
        await chatApi.deleteConversation(pid, user?.id);
      }
      exitSelectionMode();
      await loadProjects(false);
    } catch (err: unknown) {
      setBulkActionError(getErrorMessage(err, "No se pudieron eliminar todos los proyectos"));
    } finally {
      setBulkDeleting(false);
    }
  };

  const welcomeHero = (
    <div className="dashboard-hero">
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
    </div>
  );

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <HomeHeader />
        <main className="dashboard-content">
          {welcomeHero}
          <div
            className="dashboard-loading-skeleton"
            aria-busy="true"
            aria-label="Cargando proyectos"
          >
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
        {welcomeHero}

        {/* Panel Analítico Completo de Equipo para Administradores */}
        {user?.role === "admin" && adminProjects.length > 0 && (
          <AdminDashboardCharts adminProjects={adminProjects} />
        )}

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

// Admin Dashboard

interface AdminChartsProps {
  adminProjects: any[];
}

const SECTIONS_METADATA = [
  { no: 0, label: "Info General", desc: "Información de la iniciativa y del solicitante" },
  { no: 1, label: "Objetivos", desc: "Objetivos del proyecto" },
  { no: 2, label: "Alcance", desc: "Alcance y entregables esperados" },
  { no: 3, label: "Arquitectura", desc: "Arquitectura y solución tecnológica" },
  { no: 4, label: "Seguridad", desc: "Seguridad y cumplimiento regulatorio" },
  { no: 5, label: "Infraestructura", desc: "Infraestructura y modelo de despliegue" },
  { no: 6, label: "Plan Trabajo", desc: "Plan de trabajo e hitos" },
  { no: 7, label: "Riesgos", desc: "Riesgos y supuestos" },
  { no: 8, label: "Costos", desc: "Estimación de costos" },
  { no: 9, label: "Soporte", desc: "Modelo de soporte y operación" },
  { no: 10, label: "Firmas", desc: "Conclusiones y firmas" }
];

function AdminDashboardCharts({ adminProjects }: AdminChartsProps) {
  const [isMinimized, setIsMinimized] = useState(() => {
    return localStorage.getItem("nori_admin_dashboard_minimized") === "true";
  });

  const toggleMinimized = () => {
    const nextVal = !isMinimized;
    setIsMinimized(nextVal);
    localStorage.setItem("nori_admin_dashboard_minimized", String(nextVal));
  };

  // 1. Cálculos Métricos a partir de adminProjects
  const totalProjects = adminProjects.length;
  const completedProjects = adminProjects.filter((p) => p.status === "completed").length;
  const inProgressProjects = adminProjects.filter((p) => p.status === "in_progress").length;
  const draftProjects = adminProjects.filter((p) => p.status === "draft").length;

  const averageProgress = totalProjects > 0
    ? Math.round(adminProjects.reduce((sum, p) => sum + (p.progress_pct || 0), 0) / totalProjects)
    : 0;

  const completedPct = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
  const inProgressPct = totalProjects > 0 ? (inProgressProjects / totalProjects) * 100 : 0;
  const draftPct = totalProjects > 0 ? (draftProjects / totalProjects) * 100 : 0;

  // Progreso de las 11 fases (Promedio del equipo por sección)
  const phaseStats = SECTIONS_METADATA.map((sec) => {
    const completedBy = adminProjects.filter((p) => {
      if (sec.no === 0) return true; // Sección 0 siempre completada al crear
      return (p.progress_pct || 0) >= sec.no * 10;
    }).length;

    const percentage = totalProjects > 0 ? Math.round((completedBy / totalProjects) * 100) : 0;
    return {
      ...sec,
      completedBy,
      percentage
    };
  });

  return (
    <section 
      className="admin-team-panel" 
      style={{ 
        marginBottom: isMinimized ? "1.5rem" : "2.5rem", 
        width: "100%",
        background: "#ffffff",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "var(--nori-shadow-card)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {/* Encabezado del Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMinimized ? "0" : "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: "700", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            Dashboard Analítico de tu Equipo
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--dashboard-text-muted)", margin: "2px 0 0 0" }}>
            Vista general del progreso de los consultores a tu cargo
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="badge badge--admin" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", borderRadius: "20px", background: "rgba(236, 0, 41, 0.08)", color: "var(--nori-brand)", fontWeight: "600", border: "1px solid rgba(236, 0, 41, 0.15)" }}>
            {totalProjects} Proyectos Activos
          </span>
          <button
            onClick={toggleMinimized}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
            title={isMinimized ? "Mostrar estadísticas del equipo" : "Ocultar estadísticas del equipo"}
          >
            {isMinimized ? (
              <>
                <ChevronDown size={14} />
                <span>Mostrar Dashboard</span>
              </>
            ) : (
              <>
                <ChevronUp size={14} />
                <span>Minimizar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>

      {/* GRID DE TARJETAS KPI (Sin gráficas ni sparklines, datos limpios en texto) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>

        {/* KPI: Total Proyectos */}
        <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "14px", padding: "1.25rem", boxShadow: "var(--nori-shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "95px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--dashboard-text-muted)" }}>Iniciativas Activas</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(236, 0, 41, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nori-brand)" }}>
                <Users size={16} />
              </div>
            </div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>{totalProjects}</h3>
          </div>
        </div>

        {/* KPI: Avance Promedio */}
        <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "14px", padding: "1.25rem", boxShadow: "var(--nori-shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "95px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--dashboard-text-muted)" }}>Avance Promedio del Equipo</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fff3e7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>{averageProgress}%</h3>
          </div>
        </div>

        {/* KPI: Tasa de Completados */}
        <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "14px", padding: "1.25rem", boxShadow: "var(--nori-shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "95px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--dashboard-text-muted)" }}>Propuestas Listas (100%)</span>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#ecfdf3", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              {completedProjects} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--dashboard-text-muted)" }}>de {totalProjects}</span>
            </h3>
          </div>
        </div>

      </div>

      {/* SECCIÓN PRINCIPAL: 2 COLUMNAS COMPLEMENTARIAS (Text-Only) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", width: "100%" }}>

        {/* Columna Izquierda: Estado de las Propuestas (List) + Avance por Fase (High-density Text Grid) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* ESTADO DE LAS PROPUESTAS (Text-Only Cards) */}
          <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--nori-shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: "1 1 auto" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginTop: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={18} style={{ color: "var(--nori-brand)" }} /> Estado de las Propuestas
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {/* Completados */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "10px", background: "#ecfdf3", border: "1px solid rgba(22, 163, 74, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#16a34a", display: "block" }}>Completados (100%)</span>
                    <span style={{ fontSize: "0.75rem", color: "#475569" }}>Documentos listos para firma o entrega</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#16a34a", display: "block" }}>{completedProjects}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#475569" }}>{Math.round(completedPct)}% del total</span>
                </div>
              </div>

              {/* En Progreso */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "10px", background: "#fff3e7", border: "1px solid rgba(217, 119, 6, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d97706" }} />
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#d97706", display: "block" }}>En Progreso</span>
                    <span style={{ fontSize: "0.75rem", color: "#475569" }}>Documentación en redacción y co-diseño</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#d97706", display: "block" }}>{inProgressProjects}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#475569" }}>{Math.round(inProgressPct)}% del total</span>
                </div>
              </div>

              {/* Borradores */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "10px", background: "#eff3f8", border: "1px solid rgba(100, 116, 139, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#64748b" }} />
                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b", display: "block" }}>Borradores</span>
                    <span style={{ fontSize: "0.75rem", color: "#475569" }}>Proyectos recién inicializados</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#64748b", display: "block" }}>{draftProjects}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#475569" }}>{Math.round(draftPct)}% del total</span>
                </div>
              </div>
            </div>
          </div>

          {/* AVANCE POR FASE / HIGHDENSITY TEXT GRID */}
          <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--nori-shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: "1 1 auto" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginTop: 0, marginBottom: "0.25rem" }}>
                Avance General por Sección
              </h3>
              <p style={{ fontSize: "0.75rem", color: "var(--dashboard-text-muted)", margin: "0 0 1rem 0" }}>
                Porcentaje de completado en el equipo para cada sección del documento (S0 a S10)
              </p>
            </div>

            {/* Rejilla de texto compacta y hermosa */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem", width: "100%" }}>
              {phaseStats.map((phase) => {
                let badgeBg = "#f8fafc";
                let badgeColor = "#64748b";
                let badgeBorder = "1px solid var(--border)";

                if (phase.percentage === 100) {
                  badgeBg = "#ecfdf3";
                  badgeColor = "#16a34a";
                  badgeBorder = "1px solid rgba(22, 163, 74, 0.15)";
                } else if (phase.percentage >= 40) {
                  badgeBg = "#fff3e7";
                  badgeColor = "#d97706";
                  badgeBorder = "1px solid rgba(217, 119, 6, 0.15)";
                } else if (phase.percentage > 0) {
                  badgeBg = "rgba(236, 0, 41, 0.04)";
                  badgeColor = "var(--nori-brand)";
                  badgeBorder = "1px solid rgba(236, 0, 41, 0.1)";
                }

                return (
                  <div
                    key={phase.no}
                    style={{
                      background: badgeBg,
                      border: badgeBorder,
                      borderRadius: "10px",
                      padding: "0.5rem 0.65rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                    title={`${phase.label}: completado por el ${phase.percentage}% del equipo (${phase.completedBy} de ${totalProjects} proyectos)`}
                  >
                    <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#334155", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      S{phase.no} · {phase.label}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: badgeColor, marginTop: "2px", display: "block" }}>
                      {phase.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Estatus Detallado de Consultores (Con badges de texto premium) */}
        <div style={{ background: "#ffffff", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--nori-shadow-card)", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#0f172a", marginTop: 0, marginBottom: "1.25rem" }}>
            Estatus Detallado de Consultores
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", flex: 1, justifyContent: "flex-start" }}>
            {adminProjects.map((p) => {
              const initials = p.developer_name
                ? p.developer_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'U';

              // Text badge color dynamic styling based on progress
              let statusBg = "rgba(236, 0, 41, 0.08)";
              let statusColor = "var(--nori-brand)";
              if (p.progress_pct >= 80) {
                statusBg = "#ecfdf3";
                statusColor = "#16a34a";
              } else if (p.progress_pct >= 40) {
                statusBg = "#fff3e7";
                statusColor = "#d97706";
              }

              return (
                <div
                  key={p.project_id}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.03)", background: "#f8fafc", transition: "all 0.2s ease" }}
                >
                  {/* Avatar con degradado corporativo Banorte */}
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, var(--nori-brand), #c8001f)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.85rem", fontWeight: "700", boxShadow: "0 2px 6px rgba(236, 0, 41, 0.2)" }}>
                    {initials}
                  </div>

                  {/* Nombre y Nombre del Proyecto */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "#0f172a" }}>{p.developer_name}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--dashboard-text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>({p.developer_email})</span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#334155", fontWeight: "500", display: "block", marginTop: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      Proyecto: <strong>{p.name}</strong>
                    </span>
                  </div>

                  {/* Text Badge de Progreso (reemplaza barra gráfica) */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "8px",
                      background: statusBg,
                      color: statusColor,
                      fontWeight: "700",
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      border: `1px solid ${statusColor === "var(--nori-brand)" ? "rgba(236, 0, 41, 0.15)" : statusColor === "#16a34a" ? "rgba(22, 163, 74, 0.15)" : "rgba(217, 119, 6, 0.15)"}`
                    }}>
                      {p.progress_pct}% completado
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      </>
      )}
    </section>
  );
}

export default Proyectos;
