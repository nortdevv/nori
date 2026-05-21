import { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Trash2 } from 'lucide-react';
import { shareApi } from '../../services/api';
import type { DocumentVersion, ProjectShare } from '../../types/project';
import { getErrorMessage } from '../../lib/utils';
import './ShareProjectModal.css';

interface ShareProjectModalProps {
  projectId: string;
  projectName: string;
  versions: DocumentVersion[];
  onClose: () => void;
  onSharesChanged?: () => void;
}

function ShareProjectModal({
  projectId,
  projectName,
  versions,
  onClose,
  onSharesChanged,
}: ShareProjectModalProps) {
  const [documentVersionId, setDocumentVersionId] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    shareApi
      .listForProject(projectId)
      .then(({ shares: list }) => setShares(list))
      .catch(() => {})
      .finally(() => setIsLoadingShares(false));
  }, [projectId]);

  const loadShares = async () => {
    setIsLoadingShares(true);
    try {
      const { shares: list } = await shareApi.listForProject(projectId);
      setShares(list);
    } catch {
      /* ignore */
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);
    try {
      const { shareId } = await shareApi.create(projectId, {
        documentVersionId: documentVersionId || null,
        expiresInDays:
          expiresInDays === '' ? null : Number(expiresInDays),
      });
      const link = `${window.location.origin}/share/${shareId}`;
      setCreatedLink(link);
      await loadShares();
      onSharesChanged?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo crear el enlace de compartir.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar el enlace.');
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!window.confirm('¿Revocar este enlace? Ya no podrá usarse para copiar el proyecto.')) {
      return;
    }
    setRevokingId(shareId);
    setError(null);
    try {
      await shareApi.revoke(shareId);
      await loadShares();
      onSharesChanged?.();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo revocar el enlace.'));
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="share-project-overlay" onClick={onClose}>
      <div className="share-project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-project-modal__header">
          <span className="share-project-modal__title">
            <Link2 size={17} color="#ec0029" style={{ marginRight: 8 }} />
            Compartir proyecto
          </span>
          <button className="share-project-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>

        <div className="share-project-modal__body">
          <p className="share-project-modal__desc">
            Crea un enlace para que otros usuarios con cuenta copien{' '}
            <strong>{projectName}</strong>. El enlace incluye el chat actual y la versión del
            documento que elijas.
          </p>

          {error && (
            <div className="share-project-modal__error" role="alert">
              {error}
            </div>
          )}

          {!createdLink ? (
            <>
              <div className="share-project-modal__field">
                <label className="share-project-modal__label" htmlFor="share-doc-version">
                  Versión del documento
                </label>
                <select
                  id="share-doc-version"
                  className="share-project-modal__select"
                  value={documentVersionId}
                  onChange={(e) => setDocumentVersionId(e.target.value)}
                  disabled={isCreating}
                >
                  <option value="">Borrador actual</option>
                  {versions.map((v) => (
                    <option key={v.version_id} value={v.version_id}>
                      {v.label || `v${v.version_number}`}
                      {v.is_current ? ' (actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="share-project-modal__field">
                <label className="share-project-modal__label" htmlFor="share-expiry">
                  Validez del enlace
                </label>
                <select
                  id="share-expiry"
                  className="share-project-modal__select"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  disabled={isCreating}
                >
                  <option value="">Sin caducidad</option>
                  <option value="7">7 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                </select>
              </div>

              <button
                type="button"
                className="share-project-modal__primary-btn"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? 'Creando enlace…' : 'Generar enlace'}
              </button>
            </>
          ) : (
            <div className="share-project-modal__link-box">
              <p className="share-project-modal__link-label">Enlace creado</p>
              <div className="share-project-modal__link-row">
                <input
                  type="text"
                  readOnly
                  value={createdLink}
                  className="share-project-modal__link-input"
                  aria-label="Enlace de compartir"
                />
                <button
                  type="button"
                  className="share-project-modal__copy-btn"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <button
                type="button"
                className="share-project-modal__secondary-btn"
                onClick={() => setCreatedLink(null)}
              >
                Crear otro enlace
              </button>
            </div>
          )}

          <div className="share-project-modal__shares-list">
            <h3 className="share-project-modal__shares-title">Enlaces activos</h3>
            {isLoadingShares ? (
              <p className="share-project-modal__shares-empty">Cargando…</p>
            ) : shares.filter((s) => s.is_active).length === 0 ? (
              <p className="share-project-modal__shares-empty">No hay enlaces activos.</p>
            ) : (
              <ul className="share-project-modal__shares-items">
                {shares
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <li key={s.share_id} className="share-project-modal__share-item">
                      <div>
                        <p className="share-project-modal__share-meta">
                          {s.version_label || 'Borrador actual'} · {s.message_count} mensajes ·{' '}
                          {s.copy_count} copias
                          {(s.diagram_count ?? 0) > 0
                            ? ` · ${s.diagram_count} diagrama(s)`
                            : ''}
                        </p>
                        {s.expires_at && (
                          <p className="share-project-modal__share-expiry">
                            Caduca: {new Date(s.expires_at).toLocaleString('es-MX')}
                          </p>
                        )}
                        <p className="share-project-modal__share-date">
                          {new Date(s.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="share-project-modal__revoke-btn"
                        onClick={() => handleRevoke(s.share_id)}
                        disabled={revokingId === s.share_id}
                        title="Revocar enlace"
                        aria-label="Revocar enlace"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareProjectModal;
