import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProjectDisplay } from "../../types/project";

type Props = {
  project: ProjectDisplay;
};

function ProjectCard({ project }: Props) {
  return (
    <Link
      to={`/${project.project_id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        height: "100%",
      }}
    >
      <article className="project-card">
        <div className="project-card__body">
          <h2 className="project-card__title">{project.name}</h2>
          {project.tags && project.tags.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.5rem" }}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "0.125rem 0.5rem",
                    borderRadius: "9999px",
                    fontSize: "0.6875rem",
                    fontWeight: "500",
                    backgroundColor: "#fef2f2",
                    color: "#ec0029",
                    border: "1px solid #fecaca",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="project-card__description">Sin categorías</p>
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
    </Link>
  );
}

function getStatusClassName(status: string) {
  if (status === "completed") return "project-status-badge--completed";
  if (status === "draft") return "project-status-badge--draft";
  return "project-status-badge--progress";
}

export default ProjectCard;
