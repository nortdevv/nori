import { useEffect, useRef } from 'react';
import { X, Download, FileText, AlertTriangle, Mail } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import './DocPreviewModal.css';

interface DocPreviewModalProps {
  isGenerating: boolean;
  docxBlob: Blob | null;
  error: string | null;
  onClose: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onSendEmail?: () => void;
  projectName?: string;
}

function clearNode(node: HTMLElement) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function DocPreviewModal({
  isGenerating,
  docxBlob,
  error,
  onClose,
  onDownload,
  onRegenerate,
  onSendEmail,
  projectName,
}: DocPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Render the DOCX blob into the container div whenever it arrives
  useEffect(() => {
    if (!docxBlob || !containerRef.current) return;

    const container = containerRef.current;
    clearNode(container);

    renderAsync(docxBlob, container, undefined, {
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      useBase64URL: true,
      className: 'docx-render',
    }).catch((err) => {
      console.error('docx-preview render error:', err);
      const msg = document.createElement('p');
      msg.style.cssText = 'padding:24px;color:#6b6b6b;text-align:center';
      msg.textContent = 'No se pudo renderizar la vista previa. Descarga el documento para verlo.';
      clearNode(container);
      container.appendChild(msg);
    });
  }, [docxBlob]);

  return (
    <div className="doc-preview-overlay" onClick={onClose}>
      <div className="doc-preview-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="doc-preview-modal__header">
          <span className="doc-preview-modal__title">
            <FileText size={18} color="#ec0029" style={{ marginRight: 8 }} />
            {isGenerating
              ? 'Generando documento...'
              : projectName
                ? `Vista Previa — ${projectName}`
                : 'Vista Previa del Documento'}
          </span>
          <button className="doc-preview-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="doc-preview-modal__body">

          {/* Loading state */}
          {isGenerating && (
            <div className="doc-preview-modal__loading">
              <div className="doc-preview-modal__spinner" />
              <span className="doc-preview-modal__loading-text">
                Generando documento Word...
              </span>
              <span className="doc-preview-modal__loading-subtext">
                Esto puede tardar unos segundos
              </span>
            </div>
          )}

          {/* Error state */}
          {error && !isGenerating && (
            <div className="doc-preview-modal__error">
              <div className="doc-preview-modal__error-icon">
                <AlertTriangle size={24} />
              </div>
              <p className="doc-preview-modal__error-text">{error}</p>
            </div>
          )}

          {/* DOCX rendered preview — always mounted so ref is available when blob arrives */}
          <div
            className="doc-preview-modal__docx-scroll"
            style={{ display: isGenerating || !!error ? 'none' : undefined }}
          >
            <div ref={containerRef} className="doc-preview-modal__docx-container" />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="doc-preview-modal__footer">
          <button className="doc-preview-modal__cancel-btn" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="doc-preview-modal__cancel-btn"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            Regenerar
          </button>
          {onSendEmail && (
            <button
              className="doc-preview-modal__cancel-btn"
              onClick={onSendEmail}
              disabled={!docxBlob || isGenerating}
              title="Enviar documento por correo"
            >
              <Mail size={15} style={{ marginRight: 6 }} />
              Enviar por Correo
            </button>
          )}
          <button
            className="doc-preview-modal__download-btn"
            onClick={onDownload}
            disabled={!docxBlob || isGenerating}
          >
            <Download size={16} />
            {isGenerating ? 'Generando...' : 'Descargar .docx'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocPreviewModal;
