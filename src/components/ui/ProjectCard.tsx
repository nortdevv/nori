import { Clock3 } from "lucide-react";
import type { Project, ProjectStatus } from "../../types/project";

type Props = {
  project: Project;
};

function ProjectCard({ project }: Props) {
  return (
    <article className="project-card">
      <div className="project-card__body">
        <h2 className="project-card__title">{project.title}</h2>
        <p className="project-card__description">{project.description}</p>
      </div>

      <div className="project-card__footer">
        <span className={`project-status-badge ${getStatusClassName(project.status)}`}>
          {project.status}
        </span>

        <span className="project-card__timestamp">
          <Clock3 size={14} strokeWidth={2.2} />
          {project.lastUpdatedLabel}
        </span>
      </div>
    </article>
  );
}

function getStatusClassName(status: ProjectStatus) {
  if (status === "Completado") return "project-status-badge--completed";
  if (status === "Borrador") return "project-status-badge--draft";
  return "project-status-badge--progress";
}

export default ProjectCard;
