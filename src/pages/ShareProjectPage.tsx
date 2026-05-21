import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Copy, ChevronLeft, FileText, MessageSquare, User, GitBranch } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import { shareApi } from '../services/api';
import type { ProjectSharePreview } from '../types/project';
import { getErrorMessage } from '../lib/utils';
import './ShareProjectPage.css';

function ShareProjectPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<ProjectSharePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (!shareId) {
      navigate('/');
      return;
    }
    loadPreview();
  }, [shareId]);

  useEffect(() => {
    document.title = preview
      ? `Compartido: ${preview.name} — Nori`
      : 'Proyecto compartido — Nori';
  }, [preview]);

  const loadPreview = async () => {
    if (!shareId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await shareApi.get(shareId);
      setPreview(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo cargar el proyecto compartido.'));
    } finally {
      setIsLoading(false);
    }
  };

  const runCopy = async () => {
    if (!shareId || isCopying) return;
    setIsCopying(true);
    setError(null);
    try {
      const { projectId } = await shareApi.copy(shareId);
      navigate(`/${projectId}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo copiar el proyecto.'));
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopy = async () => {
    if (!preview || !shareId) return;

    if (preview.isOwnShare) {
      const ok = window.confirm(
        'Este enlace es de un proyecto que ya tienes en tu biblioteca. ¿Quieres crear una copia independiente igualmente?',
      );
      if (!ok) return;
    }

    if (preview.existingCopyProjectId) {
      const goExisting = window.confirm(
        `Ya copiaste este enlace antes (${preview.existingCopyProjectName ?? 'proyecto existente'}). ¿Abrir esa copia en lugar de crear otra?`,
      );
      if (goExisting) {
        navigate(`/${preview.existingCopyProjectId}`);
        return;
      }
      const createAnother = window.confirm(
        '¿Crear otra copia adicional de este proyecto compartido?',
      );
      if (!createAnother) return;
    }

    await runCopy();
  };

  const formatExpiry = (iso: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString('es-MX');
  };

  return (
    <div className="share-page">
      <header className="share-page__header">
        <Navbar />
      </header>
      <main className="share-page__main">
        <Link to="/" className="share-page__back">
          <ChevronLeft size={18} />
          Volver a proyectos
        </Link>

        {isLoading ? (
          <p className="share-page__status">Cargando proyecto compartido…</p>
        ) : error && !preview ? (
          <div className="share-page__error" role="alert">
            {error}
          </div>
        ) : preview ? (
          <div className="share-page__card">
            <div className="share-page__badge">
              <Copy size={16} />
              Proyecto compartido
            </div>
            <h1 className="share-page__title">{preview.name}</h1>
            {preview.description && (
              <p className="share-page__description">{preview.description}</p>
            )}

            {preview.isOwnShare && (
              <p className="share-page__notice" role="status">
                Este enlace apunta a tu propio proyecto. Puedes copiarlo para obtener una copia
                independiente en tu biblioteca.
              </p>
            )}

            <div className="share-page__meta-grid">
              <div className="share-page__meta-item">
                <User size={16} />
                <div>
                  <p className="share-page__meta-label">Compartido por</p>
                  <p className="share-page__meta-value">{preview.sharedByName}</p>
                </div>
              </div>
              <div className="share-page__meta-item">
                <FileText size={16} />
                <div>
                  <p className="share-page__meta-label">Documento</p>
                  <p className="share-page__meta-value">{preview.documentVersionLabel}</p>
                </div>
              </div>
              <div className="share-page__meta-item">
                <MessageSquare size={16} />
                <div>
                  <p className="share-page__meta-label">Chat incluido</p>
                  <p className="share-page__meta-value">{preview.messageCount} mensajes</p>
                </div>
              </div>
            </div>

            {preview.expiresAt && (
              <p className="share-page__expiry">
                Enlace válido hasta: {formatExpiry(preview.expiresAt)}
              </p>
            )}

            {preview.previewSections.length > 0 && (
              <section className="share-page__preview" aria-label="Vista previa del documento">
                <h2 className="share-page__preview-title">Vista previa del documento</h2>
                <ul className="share-page__section-list">
                  {preview.previewSections.map((s) => (
                    <li key={s.sectionNo} className="share-page__section-item">
                      <span className="share-page__section-name">{s.name}</span>
                      <span
                        className={
                          s.isComplete
                            ? 'share-page__section-badge share-page__section-badge--done'
                            : 'share-page__section-badge'
                        }
                      >
                        {s.isComplete ? 'Completa' : s.hasContent ? 'En progreso' : 'Vacía'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {preview.previewMessages.length > 0 && (
              <section className="share-page__preview" aria-label="Vista previa del chat">
                <h2 className="share-page__preview-title">Vista previa del chat</h2>
                <ul className="share-page__message-list">
                  {preview.previewMessages.map((m) => (
                    <li
                      key={m.messageNo}
                      className={
                        m.role === 'user'
                          ? 'share-page__message share-page__message--user'
                          : 'share-page__message share-page__message--model'
                      }
                    >
                      <span className="share-page__message-role">
                        {m.role === 'user' ? 'Tú (origen)' : 'Nori'}
                      </span>
                      <p className="share-page__message-text">{m.content}</p>
                    </li>
                  ))}
                </ul>
                {preview.messageCount > preview.previewMessages.length && (
                  <p className="share-page__preview-more">
                    + {preview.messageCount - preview.previewMessages.length} mensajes más en la
                    copia
                  </p>
                )}
              </section>
            )}

            {preview.diagramCount > 0 && (
              <p className="share-page__diagram-note">
                <GitBranch size={14} />
                Incluye {preview.diagramCount} diagrama
                {preview.diagramCount === 1 ? '' : 's'} de arquitectura
              </p>
            )}

            {error && (
              <div className="share-page__error share-page__error--inline" role="alert">
                {error}
              </div>
            )}

            <button
              type="button"
              className="share-page__copy-btn"
              onClick={handleCopy}
              disabled={isCopying}
            >
              <Copy size={16} />
              {isCopying ? 'Copiando…' : 'Copiar a mi biblioteca'}
            </button>

            <p className="share-page__hint">
              Se copiará el chat, el documento de la versión indicada y los diagramas incluidos en
              este enlace. No se copian otras versiones del documento.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default ShareProjectPage;
