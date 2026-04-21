import { Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProjectDisplay } from "../../types/project";

type Props = {
  project: ProjectDisplay;
};

function ProjectListRow({ project }: Props) {
  const navigate = useNavigate();
  const to = `/${project.project_id}`;

  const go = () => navigate(to);

  return (
    <tr
      className="project-list-row"
      tabIndex={0}
      onClick={go}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          go();
        }
      }}
      aria-label={`Abrir proyecto ${project.name}`}
    >
      <td className="project-list-row__cell project-list-row__cell--title">
        <span className="project-list-row__title">{project.name}</span>
      </td>
      <td className="project-list-row__cell project-list-row__cell--tags">
        {project.tags && project.tags.length > 0 ? (
          <div className="project-list-row__tags">
            {project.tags.map((tag) => (
              <span key={tag} className="project-card__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="project-list-row__empty">Sin categorías</span>
        )}
      </td>
      <td className="project-list-row__cell project-list-row__cell--progress">
        <div className="project-list-row__progress">
          <div className="project-list-row__progress-head">
            <span className="project-list-row__progress-value">
              {project.progressLabel}
            </span>
            <span
              className={`project-status-badge project-list-row__status ${getStatusClassName(
                project.status
              )}`}
            >
              {project.statusLabel}
            </span>
          </div>
          <div
            className="project-list-row__progress-track"
            role="progressbar"
            aria-valuenow={project.progress_pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso del documento ${project.progressLabel}`}
          >
            <div
              className="project-list-row__progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, project.progress_pct))}%` }}
            />
          </div>
        </div>
      </td>
      <td className="project-list-row__cell project-list-row__cell--date">
        <span className="project-card__timestamp">
          <Clock3 size={12} strokeWidth={2.2} aria-hidden />
          {project.lastUpdatedLabel}
        </span>
      </td>
    </tr>
  );
}

function getStatusClassName(status: string) {
  if (status === "completed") return "project-status-badge--completed";
  if (status === "draft") return "project-status-badge--draft";
  return "project-status-badge--progress";
}

export default ProjectListRow;
