import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/ui/Navbar";
import SubNavbar from "../components/ui/SubNavbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import { projects } from "../data/projects";
import {
  ChevronLeft,
  Pencil,
  Copy,
  Trash2,
  CalendarDays,
  Plus,
  FileText,
  Eye,
  Download,
  Check,
  RefreshCw,
} from "lucide-react";
import type { ProjectStatus, ProjectPriority } from "../types/project";
import "./DetalleProyecto.css";

function getStatusStyle(status: ProjectStatus) {
  if (status === "Completado")
    return { background: "#ecfdf3", color: "#16a34a" };
  if (status === "Borrador") return { background: "#eff3f8", color: "#64748b" };
  return { background: "#fff3e7", color: "#d97706" };
}

function getPriorityStyle(priority: ProjectPriority) {
  if (priority === "Alta prioridad")
    return { background: "#fee2e2", color: "#dc2626" };
  if (priority === "Baja prioridad")
    return { background: "#e0f2fe", color: "#0284c7" };
  return {
    background: "#fff7ed",
    color: "#ea580c",
    border: "1.5px solid #ea580c",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPriorityLabel(priority: ProjectPriority) {
  return priority.replace(" prioridad", "");
}

function getPriorityBadgeStyle(priority: ProjectPriority) {
  if (priority === "Alta prioridad")
    return { background: "#dc2626", color: "#ffffff" };
  if (priority === "Baja prioridad")
    return { background: "#0284c7", color: "#ffffff" };
  return { background: "#d97706", color: "#ffffff" };
}

function getProgressColor(progress: number) {
  if (progress === 100) return "#16a34a";
  if (progress >= 50) return "#ec0029";
  return "#ec0029";
}

function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find((p) => p.id === Number(id));

  useEffect(() => {
    document.title = project
      ? `${project.title} — Nori`
      : "Proyecto no encontrado — Nori";
  }, [project]);

  return (
    <div className="dashboard-page">
      <div style={{ flexShrink: 0 }}>
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>
      <main className="dashboard-content">
        <div className="detalle-toolbar">
          <Link to="/" className="detalle-back-link">
            <ChevronLeft size={18} strokeWidth={2.2} />
            Volver a proyectos
          </Link>

          <div className="detalle-actions">
            <button type="button" className="detalle-btn detalle-btn--edit">
              <Pencil size={16} strokeWidth={2.2} />
              Editar
            </button>
            <button
              type="button"
              className="detalle-btn detalle-btn--duplicate"
            >
              <Copy size={16} strokeWidth={2.2} />
              Duplicar
            </button>
            <button type="button" className="detalle-btn detalle-btn--delete">
              <Trash2 size={16} strokeWidth={2.2} />
              Eliminar
            </button>
          </div>
        </div>

        {project ? (
          <>
            <div className="detalle-cards">
              <div className="detalle-main-card">
                <h1 className="detalle-main-card__title">{project.title}</h1>
                <p className="detalle-main-card__subtitle">
                  Proyecto · Creado el {project.createdDate}
                </p>

                <div className="detalle-badges">
                  <span
                    className="detalle-badge"
                    style={getStatusStyle(project.status)}
                  >
                    {project.status}
                  </span>
                  <span
                    className="detalle-badge"
                    style={getPriorityStyle(project.priority)}
                  >
                    {project.priority}
                  </span>
                  <span className="detalle-badge detalle-badge--category">
                    {project.category}
                  </span>
                </div>

                <hr className="detalle-separator" />

                <p className="detalle-section-label">Objetivo</p>
                <p className="detalle-objective-text">{project.objective}</p>

                <div className="detalle-info-row">
                  <div>
                    <p className="detalle-section-label detalle-section-label--info">
                      Responsable
                    </p>
                    <div className="detalle-responsible">
                      <div className="detalle-avatar">
                        {getInitials(project.responsible)}
                      </div>
                      <span className="detalle-responsible__name">
                        {project.responsible}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="detalle-section-label detalle-section-label--info">
                      Departamento
                    </p>
                    <span className="detalle-department-value">
                      {project.department}
                    </span>
                  </div>
                </div>

                <p className="detalle-section-label">Fecha límite</p>
                <div className="detalle-deadline">
                  <CalendarDays size={18} color="#64748b" strokeWidth={2} />
                  <span className="detalle-deadline__date">
                    {project.deadline}
                  </span>
                </div>
              </div>

              <div className="detalle-side-card">
                <p className="detalle-side-label">Estado del proyecto</p>
                <span
                  className="detalle-side-status-badge"
                  style={getStatusStyle(project.status)}
                >
                  {project.status}
                </span>

                <hr className="detalle-side-separator" />

                <p className="detalle-side-label detalle-side-label--activity">
                  Ultima actividad
                </p>
                <p className="detalle-side-value">
                  {project.lastUpdatedLabel === "hace 1 día"
                    ? "Ayer"
                    : project.lastUpdatedDays === 0
                    ? "Hoy 14:30"
                    : project.lastUpdatedLabel}
                </p>

                <p className="detalle-side-label detalle-side-label--activity">
                  Fecha de creacion
                </p>
                <p className="detalle-side-value">{project.createdDate}</p>

                <p className="detalle-side-label detalle-side-label--priority">
                  Prioridad
                </p>
                <span
                  className="detalle-side-priority-badge"
                  style={getPriorityBadgeStyle(project.priority)}
                >
                  {getPriorityLabel(project.priority)}
                </span>

                <hr className="detalle-side-separator detalle-side-separator--progress" />

                <div className="detalle-progress-header">
                  <p className="detalle-progress-label">Progreso</p>
                  <span
                    className="detalle-progress-percent"
                    style={{ color: getProgressColor(project.progress) }}
                  >
                    {project.progress}%
                  </span>
                </div>
                <div className="detalle-progress-track">
                  <div
                    className="detalle-progress-bar"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: getProgressColor(project.progress),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="detalle-docs-card">
              <div className="detalle-docs-header">
                <h2 className="detalle-docs-title">Documentos generados</h2>
                <button type="button" className="detalle-docs-generate-btn">
                  <Plus size={16} strokeWidth={2.5} />
                  Generar nuevo documento
                </button>
              </div>

              <div className="detalle-doc-item">
                <div className="detalle-doc-item__left-border" />
                <div className="detalle-doc-item__content">
                  <div className="detalle-doc-item__header">
                    <div className="detalle-doc-item__info">
                      <FileText size={20} color="#ec0029" strokeWidth={2} />
                      <div>
                        <p className="detalle-doc-item__name">
                          Documento de requerimientos v2
                        </p>
                        <p className="detalle-doc-item__meta">
                          Generado: 14:30 hoy · {project.priority}
                        </p>
                      </div>
                    </div>
                    <span className="detalle-doc-item__version-badge">
                      Ultima version
                    </span>
                  </div>
                  <div className="detalle-doc-item__actions">
                    <button
                      type="button"
                      className="detalle-doc-btn detalle-doc-btn--view"
                    >
                      <Eye size={15} strokeWidth={2.2} />
                      Ver documento
                    </button>
                    <button
                      type="button"
                      className="detalle-doc-btn detalle-doc-btn--download"
                    >
                      <Download size={15} strokeWidth={2.2} />
                      Descargar .docx
                    </button>
                    <button
                      type="button"
                      className="detalle-doc-btn detalle-doc-btn--approve"
                    >
                      <Check size={15} strokeWidth={2.5} />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="detalle-doc-btn detalle-doc-btn--regenerate"
                    >
                      <RefreshCw size={15} strokeWidth={2.2} />
                      Generar nueva version
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <h1>Proyecto no encontrado</h1>
        )}
      </main>
    </div>
  );
}

export default DetalleProyecto;
