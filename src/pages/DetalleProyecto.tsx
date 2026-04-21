import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/ui/Navbar";
import SubNavbar from "../components/ui/SubNavbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import { chatApi, documentApi } from "../services/api";
import type { ProjectDisplay } from "../types/project";
import { toProjectDisplay } from "../types/project";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Copy,
  Trash2,
  Plus,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import "./DetalleProyecto.css";
import { calculateDocumentProgress } from "../utils/documentProgress";

function getStatusStyle(status: string) {
  if (status === "completed")
    return { background: "#ecfdf3", color: "#16a34a" };
  if (status === "draft") return { background: "#eff3f8", color: "#64748b" };
  return { background: "#fff3e7", color: "#d97706" };
}

function getProgressColor(progress: number) {
  if (progress === 100) return "#16a34a";
  return "#ec0029";
}

function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realProgress, setRealProgress] = useState<number | null>(null);
  const [siblingNewerId, setSiblingNewerId] = useState<string | null>(null);
  const [siblingOlderId, setSiblingOlderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    loadProject();
  }, [id]);

  useEffect(() => {
    document.title = project
      ? `${project.name} — Nori`
      : "Proyecto no encontrado — Nori";
  }, [project]);

  const loadProject = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      setActionError(null);

      const { conversations } = await chatApi.getConversations();
      const found = conversations.find((p) => p.project_id === id);

      if (!found) {
        setError("Proyecto no encontrado");
        return;
      }

      const listIdx = conversations.findIndex((p) => p.project_id === id);
      setSiblingNewerId(listIdx > 0 ? conversations[listIdx - 1].project_id : null);
      setSiblingOlderId(
        listIdx >= 0 && listIdx < conversations.length - 1
          ? conversations[listIdx + 1].project_id
          : null,
      );

      setProject(toProjectDisplay(found));

      // Fetch real progress from document sections (same logic as Chat page)
      try {
        const { sections } = await chatApi.getDocumentSections(id);
        setRealProgress(
          calculateDocumentProgress(
            sections.map((s: { section_no: number; is_complete: boolean }) => ({
              sectionNo: s.section_no,
              isComplete: s.is_complete,
            })),
          ),
        );
      } catch {
        // If sections fail, fall back to the stored value
        setRealProgress(found.progress_pct ?? 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project");
      console.error("Error loading project:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!id || !project) return;

    setIsGenerating(true);

    try {
      const blob = await documentApi.generateDocument(id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to generate document");
      console.error("Error generating document:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !project || isDeleting) return;
    if (
      !window.confirm(
        `¿Eliminar el proyecto “${project.name}”? Se borrará la conversación, el documento y los archivos asociados. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setActionError(null);
    try {
      await chatApi.deleteConversation(id);
      navigate("/", { replace: true });
    } catch (err: any) {
      setActionError(err.message || "No se pudo eliminar el proyecto");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div style={{ flexShrink: 0 }}>
          <Navbar />
          <SubNavbar />
          <BreadcrumbProjects />
        </div>
        <main className="dashboard-content">
          <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
            <p style={{ fontSize: "1.125rem" }}>Cargando proyecto...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="dashboard-page">
        <div style={{ flexShrink: 0 }}>
          <Navbar />
          <SubNavbar />
          <BreadcrumbProjects />
        </div>
        <main className="dashboard-content">
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "#dc2626", fontSize: "1.125rem", marginBottom: "1rem" }}>
              {error || "Proyecto no encontrado"}
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
              }}
            >
              Volver al Inicio
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div style={{ flexShrink: 0 }}>
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>
      <main className="dashboard-content detalle-proyecto-main">
        <nav className="detalle-sibling-rail" aria-label="Proyecto más reciente en la lista">
          {siblingNewerId ? (
            <Link
              to={`/${siblingNewerId}`}
              className="detalle-sibling-btn"
              title="Proyecto más reciente (anterior en la lista)"
              aria-label="Ir al proyecto más reciente en la lista"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </Link>
          ) : (
            <span
              className="detalle-sibling-btn detalle-sibling-btn--disabled"
              title="No hay un proyecto más reciente"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </span>
          )}
        </nav>

        <div className="detalle-proyecto-inner">
          {actionError && (
            <div className="detalle-action-error" role="alert">
              {actionError}
            </div>
          )}
          <div className="detalle-toolbar">
            <Link to="/" className="detalle-back-link">
              <ChevronLeft size={18} strokeWidth={2.2} />
              Volver a proyectos
            </Link>

            <div className="detalle-actions">
              <Link
                to={`/chat/${project.project_id}`}
                className="detalle-btn detalle-btn--chat"
              >
                <Plus size={16} strokeWidth={2.5} />
                Continuar chat
              </Link>
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
              <button
                type="button"
                className="detalle-btn detalle-btn--delete"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={16} strokeWidth={2.2} />
                {isDeleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>

        <div className="detalle-cards">
          <div className="detalle-main-card">
            <h1 className="detalle-main-card__title">{project.name}</h1>
            <p className="detalle-main-card__subtitle">
              Creado el {new Date(project.date_created).toLocaleDateString('es-ES')}
            </p>

            <div className="detalle-badges">
              <span
                className="detalle-badge"
                style={getStatusStyle(project.status)}
              >
                {project.statusLabel}
              </span>
              {project.tags && project.tags.map((tag) => (
                <span
                  key={tag}
                  className="detalle-badge detalle-badge--category"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="detalle-info-row">
              <div>
                <p className="detalle-section-label detalle-section-label--info">
                  Mensajes
                </p>
                <span className="detalle-department-value">
                  {project.message_count || 0}
                </span>
              </div>

              <div>
                <p className="detalle-section-label detalle-section-label--info">
                  ID del Proyecto
                </p>
                <span className="detalle-department-value" style={{ fontSize: '0.75rem' }}>
                  {project.project_id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          <div className="detalle-side-card">
            <p className="detalle-side-label">Estado del proyecto</p>
            <span
              className="detalle-side-status-badge"
              style={getStatusStyle(project.status)}
            >
              {project.statusLabel}
            </span>

            <hr className="detalle-side-separator" />

            <p className="detalle-side-label detalle-side-label--activity">
              Ultima actividad
            </p>
            <p className="detalle-side-value">{project.lastUpdatedLabel}</p>

            <p className="detalle-side-label detalle-side-label--activity">
              Fecha de creacion
            </p>
            <p className="detalle-side-value">
              {new Date(project.date_created).toLocaleDateString('es-ES')}
            </p>

            <hr className="detalle-side-separator detalle-side-separator--progress" />

            <div className="detalle-progress-header">
              <p className="detalle-progress-label">Progreso</p>
              <span
                className="detalle-progress-percent"
                style={{ color: getProgressColor(realProgress ?? project.progress_pct) }}
              >
                {realProgress ?? project.progress_pct}%
              </span>
            </div>
            <div className="detalle-progress-track">
              <div
                className="detalle-progress-bar"
                style={{
                  width: `${realProgress ?? project.progress_pct}%`,
                  backgroundColor: getProgressColor(realProgress ?? project.progress_pct),
                }}
              />
            </div>
          </div>
        </div>

        <div className="detalle-docs-card">
          <div className="detalle-docs-header">
            <h2 className="detalle-docs-title">Documentos</h2>
          </div>

          <div className="detalle-doc-item">
            <div className="detalle-doc-item__left-border" />
            <div className="detalle-doc-item__content">
              <div className="detalle-doc-item__header">
                <div className="detalle-doc-item__info">
                  <FileText size={20} color="#ec0029" strokeWidth={2} />
                  <div>
                    <p className="detalle-doc-item__name">
                      Documento de requerimientos
                    </p>
                    <p className="detalle-doc-item__meta">
                      Proyecto: {project.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="detalle-doc-item__actions">
                <button
                  type="button"
                  className="detalle-doc-btn detalle-doc-btn--download"
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                >
                  <Download size={15} strokeWidth={2.2} />
                  {isGenerating ? 'Generando...' : 'Descargar .docx'}
                </button>
                <Link
                  to={`/chat/${project.project_id}`}
                  className="detalle-doc-btn detalle-doc-btn--regenerate"
                >
                  <RefreshCw size={15} strokeWidth={2.2} />
                  Actualizar contenido
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>

        <nav className="detalle-sibling-rail detalle-sibling-rail--right" aria-label="Proyecto más antiguo en la lista">
          {siblingOlderId ? (
            <Link
              to={`/${siblingOlderId}`}
              className="detalle-sibling-btn"
              title="Proyecto más antiguo (siguiente en la lista)"
              aria-label="Ir al siguiente proyecto en la lista"
            >
              <ChevronRight size={22} strokeWidth={2.2} />
            </Link>
          ) : (
            <span
              className="detalle-sibling-btn detalle-sibling-btn--disabled"
              title="No hay un proyecto más antiguo"
            >
              <ChevronRight size={22} strokeWidth={2.2} />
            </span>
          )}
        </nav>
      </main>
    </div>
  );
}

export default DetalleProyecto;
