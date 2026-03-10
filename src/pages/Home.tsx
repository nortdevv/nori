import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import HomeHeader from "../components/ui/HomeHeader";
import ProjectCard from "../components/ui/ProjectCard";
import ProjectsToolbar from "../components/ui/ProjectsToolbar";
import { chatApi } from "../services/api";
import type { ProjectDisplay, SortOption } from "../types/project";
import { toProjectDisplay } from "../types/project";

type FilterValue = "Todos" | "in_progress" | "completed" | "draft";

function Proyectos() {
  const [projects, setProjects] = useState<ProjectDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  useEffect(() => {
    document.title = "Proyectos — Nori";
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { conversations } = await chatApi.getConversations();
      const displayProjects = conversations.map(toProjectDisplay);
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
          (project.description && project.description.toLowerCase().includes(normalizedSearch));

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
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <p style={{ fontSize: '1.125rem' }}>Cargando proyectos...</p>
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
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ color: '#dc2626', fontSize: '1.125rem', marginBottom: '1rem' }}>
              Error: {error}
            </p>
            <button
              onClick={loadProjects}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
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
            <h1 className="dashboard-title">Workspace de NortDev</h1>
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
        />

        <section className="dashboard-grid" aria-label="Lista de proyectos">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.project_id} project={project} />
          ))}
        </section>

        {visibleProjects.length === 0 && (
          <section className="dashboard-empty-state">
            <h2>No encontramos proyectos</h2>
            <p>
              Ajusta los filtros o prueba con otra búsqueda para ver más
              resultados.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default Proyectos;
