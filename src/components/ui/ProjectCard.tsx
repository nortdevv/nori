import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectDisplay } from "../../types/project";

type Props = {
  project: ProjectDisplay;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
};

function ProjectCard({
  project,
  selectionMode = false,
  selected = false,
  onToggleSelected,
}: Props) {
  const to = `/${project.project_id}`;

  const cardBody = (
    <article className={`project-card${selected ? " project-card--selected" : ""}`}>
      <div className="project-card__body">
        <div className="project-card__headline">
          <h2 className="project-card__title">{project.name}</h2>
          {selectionMode ? (
            <div className="project-card__select">
              <input
                type="checkbox"
                className="project-select-checkbox project-select-checkbox--circle"
                checked={selected}
                onChange={() => onToggleSelected?.()}
                aria-label={`Seleccionar proyecto ${project.name}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : null}
        </div>
        {project.tags && project.tags.length > 0 ? (
          <div className="project-card__tags">
            {project.tags.map((tag) => (
              <span key={tag} className="project-card__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="project-card__meta-empty">Sin categorías</p>
        )}
      </div>

      <div className="project-card__footer">
        <span
          className={`project-status-badge ${getStatusClassName(
            project.status
          )}`}
        >
          {project.statusLabel}
        </span>

        <span className="project-card__timestamp">
          <Clock3 size={14} strokeWidth={2.2} />
          {project.lastUpdatedLabel}
        </span>
      </div>
    </article>
  );

  if (selectionMode) {
    return (
      <div
        className="project-card-wrap project-card-wrap--selectable"
        tabIndex={0}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('input[type="checkbox"]'))
            return;
          onToggleSelected?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if ((e.target as HTMLElement).closest('input[type="checkbox"]'))
              return;
            onToggleSelected?.();
          }
        }}
        aria-label={`Proyecto ${project.name}: pulsa para seleccionar o anular`}
      >
        {cardBody}
      </div>
    );
  }

  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        height: "100%",
      }}
    >
      {cardBody}
    </Link>
  );
}

function getStatusClassName(status: string) {
  if (status === "completed") return "project-status-badge--completed";
  if (status === "draft") return "project-status-badge--draft";
  return "project-status-badge--progress";
}

export default ProjectCard;
