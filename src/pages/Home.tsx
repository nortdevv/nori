import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import HomeHeader from "../components/ui/HomeHeader";
import ProjectCard from "../components/ui/ProjectCard";
import ProjectsToolbar from "../components/ui/ProjectsToolbar";
import { projects } from "../data/projects";
import type { ProjectStatus, SortOption } from "../types/project";

type FilterValue = "Todos" | ProjectStatus;

function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const visibleProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...projects]
      .filter((project) => {
        const matchesFilter =
          activeFilter === "Todos" || project.status === activeFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          project.title.toLowerCase().includes(normalizedSearch) ||
          project.description.toLowerCase().includes(normalizedSearch);

        return matchesFilter && matchesSearch;
      })
      .sort((first, second) => {
        if (sortBy === "name") {
          return first.title.localeCompare(second.title, "es");
        }
        return first.lastUpdatedDays - second.lastUpdatedDays;
      });
  }, [activeFilter, searchTerm, sortBy]);

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

          <Link to="/proyectos/crear" className="dashboard-create-button">
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
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>

        {visibleProjects.length === 0 && (
          <section className="dashboard-empty-state">
            <h2>No encontramos proyectos</h2>
            <p>Ajusta los filtros o prueba con otra búsqueda para ver más resultados.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default Home;
