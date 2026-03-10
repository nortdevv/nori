import { ChevronDown, Search } from "lucide-react";
import type { SortOption } from "../../types/project";

type FilterValue = "Todos" | "in_progress" | "completed" | "draft";

type Props = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
};

const filters: Array<{ label: string; value: FilterValue }> = [
  { label: "Todos", value: "Todos" },
  { label: "En Progreso", value: "in_progress" },
  { label: "Completados", value: "completed" },
  { label: "Borradores", value: "draft" },
];

function ProjectsToolbar({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
}: Props) {
  return (
    <section className="dashboard-toolbar" aria-label="Filtros de proyectos">
      <label className="dashboard-search" aria-label="Buscar proyectos">
        <Search size={17} strokeWidth={2.2} />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar proyectos..."
        />
      </label>

      <div className="dashboard-toolbar__controls">
        <div className="dashboard-filters" role="tablist" aria-label="Estados">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`dashboard-filter-pill${activeFilter === filter.value ? " is-active" : ""}`}
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="dashboard-select-wrapper">
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="dashboard-select"
            aria-label="Ordenar proyectos"
          >
            <option value="recent">Última modificación</option>
            <option value="name">Nombre A-Z</option>
          </select>
          <ChevronDown size={16} strokeWidth={2.2} />
        </div>
      </div>
    </section>
  );
}

export default ProjectsToolbar;
