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
          <p className="project-card__description">
            {project.description || 'Sin descripción'}
          </p>
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
