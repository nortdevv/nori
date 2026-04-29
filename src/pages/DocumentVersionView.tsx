import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/ui/Navbar";
import { documentApi } from "../services/api";
import SectionContent from "../components/ui/SectionContent";
import type { DocumentVersion, VersionDetail } from "../types/project";
import {
  FileText,
  Download,
  Printer,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import "./DocumentVersionView.css";

const SECTION_TITLES: Record<number, string> = {
  0: "Información General del Solicitante",
  1: "Descripción General y Justificación",
  2: "Objetivos de la Iniciativa",
  3: "Áreas Impactadas",
  4: "Requerimientos de Negocio",
  5: "Beneficios",
  6: "Participación de Otras Áreas",
  7: "Riesgos",
  8: "Exclusiones",
  9: "Supuestos",
  10: "Restricciones",
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DocumentVersionView() {
  const { projectId, versionId } = useParams<{
    projectId: string;
    versionId: string;
  }>();
  const navigate = useNavigate();

  const [version, setVersion] = useState<VersionDetail | null>(null);
  const [allVersions, setAllVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeletingVersionId, setIsDeletingVersionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (!projectId || !versionId) {
      navigate("/");
      return;
    }
    load();
  }, [projectId, versionId]);

  useEffect(() => {
    if (version) {
      document.title = `Documento v${version.version_number} — Nori`;
      // Expand all sections by default
      setExpandedSections(
        new Set(version.sections.map((s) => s.section_no))
      );
    }
  }, [version]);

  const load = async () => {
    if (!projectId || !versionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [detail, versionsResult] = await Promise.all([
        documentApi.getVersion(projectId, versionId),
        documentApi.getVersions(projectId),
      ]);
      setVersion(detail);
      setAllVersions(Array.isArray(versionsResult) ? versionsResult : []);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!projectId || !version) return;
    setIsDownloading(true);
    try {
      const blob = await documentApi.generateDocument(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `documento-requerimientos-v${version.version_number}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Error al descargar:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteVersion = async (targetVersionId: string) => {
    if (!projectId || isDeletingVersionId) return;
    const target = allVersions.find((v) => v.version_id === targetVersionId);
    if (!target) return;
    if (
      !window.confirm(
        `¿Eliminar la versión ${target.version_number}? Esta acción no se puede deshacer.`
      )
    )
      return;
    setIsDeletingVersionId(targetVersionId);
    try {
      await documentApi.deleteVersion(projectId, targetVersionId);
      const remaining = allVersions.filter((v) => v.version_id !== targetVersionId);
      setAllVersions(remaining);
      if (targetVersionId === versionId) {
        // Navigate to newest remaining version or back to project
        if (remaining.length > 0) {
          navigate(`/doc/${projectId}/${remaining[0].version_id}`, { replace: true });
        } else {
          navigate(`/${projectId}`, { replace: true });
        }
      }
    } catch (err: any) {
      window.alert(err.message || "No se pudo eliminar la versión");
    } finally {
      setIsDeletingVersionId(null);
    }
  };

  const toggleSection = (sectionNo: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionNo)) {
        next.delete(sectionNo);
      } else {
        next.add(sectionNo);
      }
      return next;
    });
  };

  const contentSections = version?.sections.filter((s) => s.section_no > 0) ?? [];

  if (isLoading) {
    return (
      <div className="docview-page">
        <Navbar />
        <div className="docview-loading" aria-busy="true">
          <div className="docview-loading__spinner" />
          <p>Cargando documento…</p>
        </div>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="docview-page">
        <Navbar />
        <div className="docview-error">
          <p>{error || "Documento no encontrado"}</p>
          <button
            type="button"
            className="docview-back-btn"
            onClick={() => navigate(`/${projectId}`)}
          >
            Volver al proyecto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="docview-page">
      <Navbar />

      {/* Top bar */}
      <div className="docview-topbar">
        <Link to={`/${projectId}`} className="docview-back-link">
          <ChevronLeft size={16} strokeWidth={2.2} />
          Volver al proyecto
        </Link>
        <div className="docview-topbar-actions">
          <button
            type="button"
            className="docview-action-btn"
            onClick={() => window.print()}
          >
            <Printer size={15} strokeWidth={2} />
            Imprimir
          </button>
          <button
            type="button"
            className="docview-action-btn docview-action-btn--primary"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download size={15} strokeWidth={2} />
            {isDownloading ? "Descargando…" : "Descargar .docx"}
          </button>
        </div>
      </div>

      {/* Body: content + sidebar */}
      <div className="docview-body">
        {/* Main document content */}
        <main className="docview-content">
          {/* Document header */}
          <div className="docview-doc-header">
            <div className="docview-doc-title-row">
              <FileText
                size={32}
                strokeWidth={1.8}
                className="docview-doc-icon"
              />
              <h1 className="docview-doc-title">
                {version.label}
              </h1>
              <span className="docview-version-badge">
                v{version.version_number}
              </span>
            </div>
            <div className="docview-doc-meta">
              <span className="docview-doc-meta__item">
                Generado: {formatDate(version.generated_at)}
              </span>
              <span className="docview-doc-meta__sep">·</span>
              <span className="docview-doc-meta__item">Autor: Nori (IA)</span>
              {version.project_name && (
                <>
                  <span className="docview-doc-meta__sep">·</span>
                  <span className="docview-doc-meta__item">
                    Proyecto: {version.project_name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="docview-sections">
            {contentSections.length === 0 ? (
              <p className="docview-sections-empty">
                Esta versión no tiene secciones de contenido.
              </p>
            ) : (
              contentSections.map((section) => {
                const isExpanded = expandedSections.has(section.section_no);
                const title =
                  SECTION_TITLES[section.section_no] ??
                  `Sección ${section.section_no}`;
                return (
                  <div
                    key={section.section_no}
                    id={`section-${section.section_no}`}
                    className="docview-section"
                  >
                    <div
                      className="docview-section-header"
                      onClick={() => toggleSection(section.section_no)}
                      role="button"
                      aria-expanded={isExpanded}
                    >
                      <span className="docview-section-title">
                        {section.section_no}. {title}
                      </span>
                      <div className="docview-section-header-right">
                        {isExpanded ? (
                          <ChevronUp size={16} color="#6b6b6b" />
                        ) : (
                          <ChevronDown size={16} color="#6b6b6b" />
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="docview-section-body">
                        {section.content ? (
                          <SectionContent content={section.content} />
                        ) : (
                          <p className="docview-section-empty">
                            Sin contenido registrado.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="docview-sidebar">
          {/* Document info */}
          <div className="docview-sidebar-card">
            <h3 className="docview-sidebar-heading">INFORMACION DEL DOCUMENTO</h3>
            <div className="docview-sidebar-info-row">
              <span className="docview-sidebar-label">Version</span>
              <span className="docview-sidebar-value">
                v{version.version_number}
              </span>
            </div>
            <div className="docview-sidebar-info-row">
              <span className="docview-sidebar-label">Generado</span>
              <span className="docview-sidebar-value">
                {formatDate(version.generated_at)}
              </span>
            </div>
            <div className="docview-sidebar-info-row">
              <span className="docview-sidebar-label">Autor</span>
              <span className="docview-sidebar-value">Nori (IA)</span>
            </div>
            <div className="docview-sidebar-info-row">
              <span className="docview-sidebar-label">Secciones</span>
              <span className="docview-sidebar-value">
                {contentSections.length}
              </span>
            </div>
          </div>

          {/* Table of contents */}
          {contentSections.length > 0 && (
            <div className="docview-sidebar-card">
              <h3 className="docview-sidebar-heading">TABLA DE CONTENIDO</h3>
              <nav className="docview-toc">
                {contentSections.map((s) => (
                  <a
                    key={s.section_no}
                    href={`#section-${s.section_no}`}
                    className="docview-toc-link"
                  >
                    {s.section_no}. {SECTION_TITLES[s.section_no] ?? `Sección ${s.section_no}`}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Version history */}
          {allVersions.length > 0 && (
            <div className="docview-sidebar-card">
              <h3 className="docview-sidebar-heading">HISTORIAL DE VERSIONES</h3>
              <div className="docview-version-list">
                {allVersions.map((v) => (
                  <div key={v.version_id} className="docview-version-row">
                    <Link
                      to={`/doc/${projectId}/${v.version_id}`}
                      className={`docview-version-item ${
                        v.version_id === versionId
                          ? "docview-version-item--selected"
                          : ""
                      }`}
                    >
                      {v.is_current
                        ? `Version ${v.version_number} (actual)`
                        : `Version ${v.version_number}`}
                      {v.version_id === versionId && (
                        <span className="docview-version-item__dot" />
                      )}
                    </Link>
                    <button
                      type="button"
                      className="docview-version-delete-btn"
                      onClick={() => handleDeleteVersion(v.version_id)}
                      disabled={isDeletingVersionId === v.version_id}
                      title={`Eliminar versión ${v.version_number}`}
                      aria-label={`Eliminar versión ${v.version_number}`}
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default DocumentVersionView;
