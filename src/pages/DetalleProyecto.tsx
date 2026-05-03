import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/ui/Navbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import { chatApi, documentApi } from "../services/api";
import type {
  ProjectDisplay,
  ProjectStatus,
  DocumentVersion,
  Project,
  DocumentSection,
} from "../types/project";
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
  Check,
  X,
  Eye,
} from "lucide-react";
import "./DetalleProyecto.css";
import { calculateDocumentProgress } from "../utils/documentProgress";
import { getErrorMessage } from "../lib/utils";

function getStatusStyle(status: string) {
  if (status === "completed")
    return { background: "#ecfdf3", color: "#16a34a" };
  if (status === "draft") return { background: "#eff3f8", color: "#64748b" };
  return { background: "#fff3e7", color: "#d97706" };
}

function getProgressColor(progress: number) {
  if (progress === 100) return "#16a34a";
  return "var(--nori-brand)";
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Borrador" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed", label: "Completado" },
];

function parseTagsFromInput(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function tagsAreSame(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((t, i) => t === b[i]);
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
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftTagsInput, setDraftTagsInput] = useState("");
  const [draftStatus, setDraftStatus] = useState<ProjectStatus>("in_progress");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isDeletingVersionId, setIsDeletingVersionId] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    setIsEditingDetails(false);
    loadProject();
    loadVersions();
  }, [id]);

  const loadVersions = async () => {
    if (!id) return;
    setIsLoadingVersions(true);
    setVersionError(null);
    try {
      const result = await documentApi.getVersions(id);
      setVersions(Array.isArray(result) ? result : []);
    } catch (err: unknown) {
      setVersionError(getErrorMessage(err, "No se pudieron cargar las versiones"));
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!id || isDeletingVersionId) return;
    const target = versions.find((v) => v.version_id === versionId);
    if (!target) return;
    if (
      !window.confirm(
        `¿Eliminar la versión ${target.version_number}? Esta acción no se puede deshacer.`
      )
    )
      return;
    setIsDeletingVersionId(versionId);
    setVersionError(null);
    try {
      await documentApi.deleteVersion(id, versionId);
      setVersions((prev) => prev.filter((v) => v.version_id !== versionId));
    } catch (err: unknown) {
      setVersionError(getErrorMessage(err, "No se pudo eliminar la versión"));
    } finally {
      setIsDeletingVersionId(null);
    }
  };

  const handleCreateVersion = async () => {
    if (!id || isCreatingVersion) return;
    setIsCreatingVersion(true);
    setVersionError(null);
    try {
      await documentApi.createVersion(id);
      await loadVersions();
    } catch (err: unknown) {
      setVersionError(getErrorMessage(err, "No se pudo crear la nueva versión"));
    } finally {
      setIsCreatingVersion(false);
    }
  };

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
      const seen = new Set<string>();
      const unique = conversations.filter((p: Project) => {
        if (seen.has(p.project_id)) return false;
        seen.add(p.project_id);
        return true;
      });
      const found = unique.find((p) => p.project_id === id);

      if (!found) {
        setError("Proyecto no encontrado");
        return;
      }

      const listIdx = unique.findIndex((p) => p.project_id === id);
      setSiblingNewerId(listIdx > 0 ? unique[listIdx - 1].project_id : null);
      setSiblingOlderId(
        listIdx >= 0 && listIdx < unique.length - 1
          ? unique[listIdx + 1].project_id
          : null,
      );

      setProject(toProjectDisplay(found));

      // Fetch real progress from document sections (same logic as Chat page)
      try {
        const { sections } = await chatApi.getDocumentSections(id);
        setRealProgress(
          calculateDocumentProgress(
            sections.map((s: DocumentSection) => ({
              sectionNo: s.section_no,
              isComplete: s.is_complete,
            })),
          ),
        );
      } catch {
        // If sections fail, fall back to the stored value
        setRealProgress(found.progress_pct ?? 0);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load project"));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to generate document"));
      console.error("Error generating document:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const detailsDirty =
    !!project &&
    isEditingDetails &&
    (draftName.trim() !== project.name ||
      !tagsAreSame(parseTagsFromInput(draftTagsInput), project.tags || []) ||
      draftStatus !== (project.status as ProjectStatus));

  const startEditingDetails = () => {
    if (!project) return;
    setActionError(null);
    setDraftName(project.name);
    setDraftTagsInput((project.tags || []).join(", "));
    setDraftStatus(
      STATUS_OPTIONS.some((o) => o.value === project.status)
        ? (project.status as ProjectStatus)
        : "in_progress"
    );
    setIsEditingDetails(true);
  };

  const cancelEditingDetails = () => {
    if (detailsDirty) {
      if (!window.confirm("¿Descartar los cambios sin guardar?")) return;
    }
    setIsEditingDetails(false);
    setActionError(null);
  };

  const saveEditingDetails = async () => {
    if (!id || !project || !detailsDirty || isSavingDetails) return;
    const name = draftName.trim();
    if (!name) {
      setActionError("El nombre no puede estar vacío");
      return;
    }
    const tags = parseTagsFromInput(draftTagsInput);
    setIsSavingDetails(true);
    setActionError(null);
    try {
      const updated = await chatApi.updateConversation(id, {
        name,
        tags,
        status: draftStatus,
      });
      setProject(toProjectDisplay(updated));
      setIsEditingDetails(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar el proyecto";
      setActionError(message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id || !project || isDuplicating) return;
    setIsDuplicating(true);
    setActionError(null);
    try {
      const { projectId: newProjectId } = await chatApi.duplicateConversation(id);
      navigate(`/${newProjectId}`);
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "No se pudo duplicar el proyecto"));
    } finally {
      setIsDuplicating(false);
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
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "No se pudo eliminar el proyecto"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell-header">
          <Navbar />
          <BreadcrumbProjects />
        </div>
        <main className="dashboard-content">
          <div
            className="dashboard-loading-skeleton"
            aria-busy="true"
            aria-label="Cargando proyecto"
          >
            <div className="dashboard-loading-skeleton__hero" />
            <div className="dashboard-loading-skeleton__toolbar" />
            <div className="dashboard-loading-skeleton__grid">
              <div className="dashboard-loading-skeleton__card" />
              <div className="dashboard-loading-skeleton__card" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell-header">
          <Navbar />
          <BreadcrumbProjects />
        </div>
        <main className="dashboard-content">
          <div className="dashboard-error-panel" role="alert">
            <p className="dashboard-error-panel__message">
              {error || "Proyecto no encontrado"}
            </p>
            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => navigate("/")}
            >
              Volver al inicio
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell-header">
        <Navbar />
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
              {!isEditingDetails ? (
                <button
                  type="button"
                  className="detalle-btn detalle-btn--edit"
                  onClick={startEditingDetails}
                >
                  <Pencil size={16} strokeWidth={2.2} />
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="detalle-btn detalle-btn--edit-cancel"
                    onClick={cancelEditingDetails}
                    disabled={isSavingDetails}
                  >
                    <X size={16} strokeWidth={2.2} />
                    Cancelar
                  </button>
                  {detailsDirty && (
                    <button
                      type="button"
                      className="detalle-btn detalle-btn--edit-save"
                      onClick={saveEditingDetails}
                      disabled={isSavingDetails}
                    >
                      <Check size={16} strokeWidth={2.2} />
                      {isSavingDetails ? "Guardando…" : "Confirmar"}
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                className="detalle-btn detalle-btn--duplicate"
                onClick={handleDuplicate}
                disabled={isDuplicating || isDeleting || isSavingDetails || isGenerating}
              >
                <Copy size={16} strokeWidth={2.2} />
                {isDuplicating ? "Duplicando…" : "Duplicar"}
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
          <div className={`detalle-main-card ${isEditingDetails ? "detalle-main-card--editing" : ""}`}>
            {isEditingDetails ? (
              <label className="detalle-edit-field">
                <span className="detalle-edit-field__label">Nombre</span>
                <input
                  type="text"
                  className="detalle-edit-field__input detalle-edit-field__input--title"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  autoComplete="off"
                  disabled={isSavingDetails}
                  aria-label="Nombre del proyecto"
                />
              </label>
            ) : (
              <h1 className="detalle-main-card__title">{project.name}</h1>
            )}
            <p className="detalle-main-card__subtitle">
              Creado el {new Date(project.date_created).toLocaleDateString('es-ES')}
            </p>

            <div className="detalle-badges">
              {isEditingDetails ? (
                <label className="detalle-edit-field detalle-edit-field--inline">
                  <span className="detalle-edit-field__label">Estado</span>
                  <select
                    className="detalle-edit-field__select"
                    value={draftStatus}
                    onChange={(e) =>
                      setDraftStatus(e.target.value as ProjectStatus)
                    }
                    disabled={isSavingDetails}
                    aria-label="Estado del proyecto"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span
                  className="detalle-badge"
                  style={getStatusStyle(project.status)}
                >
                  {project.statusLabel}
                </span>
              )}
              {isEditingDetails ? (
                <label className="detalle-edit-field detalle-edit-field--block">
                  <span className="detalle-edit-field__label">Tags</span>
                  <input
                    type="text"
                    className="detalle-edit-field__input"
                    value={draftTagsInput}
                    onChange={(e) => setDraftTagsInput(e.target.value)}
                    placeholder="Ej: interno, cloud, prioridad"
                    autoComplete="off"
                    disabled={isSavingDetails}
                    aria-label="Tags separados por comas"
                  />
                  <span className="detalle-edit-field__hint">
                    Separados por comas
                  </span>
                </label>
              ) : (
                project.tags &&
                project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="detalle-badge detalle-badge--category"
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>

            <div className="detalle-info-row detalle-info-row--meta">
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
                  Última actividad
                </p>
                <span className="detalle-department-value">
                  {project.lastUpdatedLabel}
                </span>
              </div>
            </div>

            <div className="detalle-progress-section">
              <div className="detalle-progress-header">
                <p className="detalle-progress-label">Progreso</p>
                <span
                  className="detalle-progress-percent"
                  style={{
                    color: getProgressColor(realProgress ?? project.progress_pct),
                  }}
                >
                  {realProgress ?? project.progress_pct}%
                </span>
              </div>
              <div className="detalle-progress-track">
                <div
                  className="detalle-progress-bar"
                  style={{
                    width: `${realProgress ?? project.progress_pct}%`,
                    backgroundColor: getProgressColor(
                      realProgress ?? project.progress_pct,
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="detalle-docs-card">
          <div className="detalle-docs-header">
            <h2 className="detalle-docs-title">Documentos</h2>
          </div>

          {versionError && (
            <div className="detalle-action-error" role="alert">
              {versionError}
            </div>
          )}

          {isLoadingVersions ? (
            <p className="detalle-versions-loading">Cargando documentos…</p>
          ) : (versions ?? []).length === 0 ? (
            <p className="detalle-versions-empty">
              Aún no hay versiones guardadas. Ve al chat y usa "Generar Documento" para crear la primera versión.
            </p>
          ) : (
            <div className="detalle-versions-list">
              {versions.map((version) => (
                <div key={version.version_id} className="detalle-doc-item">
                  <div className="detalle-doc-item__left-border" />
                  <div className="detalle-doc-item__content">
                    <div className="detalle-doc-item__header">
                      <div className="detalle-doc-item__info">
                        <FileText
                          size={20}
                          strokeWidth={2}
                          className="detalle-doc-item__file-icon"
                          aria-hidden
                        />
                        <div>
                          <p className="detalle-doc-item__name">
                            Documento de requerimientos
                          </p>
                          <p className="detalle-doc-item__meta">
                            Proyecto: {project.name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="detalle-doc-delete-btn"
                        onClick={() => handleDeleteVersion(version.version_id)}
                        disabled={isDeletingVersionId === version.version_id}
                        title={`Eliminar versión ${version.version_number}`}
                        aria-label={`Eliminar versión ${version.version_number}`}
                      >
                        <Trash2 size={15} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="detalle-doc-item__actions">
                      <button
                        type="button"
                        className="detalle-doc-btn detalle-doc-btn--download"
                        onClick={handleGenerateDocument}
                        disabled={isGenerating}
                      >
                        <Download size={15} strokeWidth={2.2} />
                        {isGenerating ? "Generando…" : "Descargar .docx"}
                      </button>
                      <Link
                        to={`/doc/${project.project_id}/${version.version_id}`}
                        className="detalle-doc-btn detalle-doc-btn--view"
                      >
                        <Eye size={15} strokeWidth={2.2} />
                        Ver contenido
                      </Link>
                      {version.is_current && (
                        <button
                          type="button"
                          className="detalle-doc-btn detalle-doc-btn--regenerate"
                          onClick={handleCreateVersion}
                          disabled={isCreatingVersion}
                        >
                          <RefreshCw size={15} strokeWidth={2.2} />
                          {isCreatingVersion ? "Actualizando…" : "Actualizar contenido"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
