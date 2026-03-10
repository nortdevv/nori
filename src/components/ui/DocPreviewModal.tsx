import { useEffect, useRef } from "react";
import { X, Download } from "lucide-react";
import { renderAsync } from "docx-preview";
import "./DocPreviewModal.css";

interface DocPreviewModalProps {
  docxBlob: Blob | null;
  onCancel: () => void;
  onDownload: () => void;
}

function DocPreviewModal({ docxBlob, onCancel, onDownload }: DocPreviewModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !docxBlob) return;
    containerRef.current.innerHTML = "";
    renderAsync(docxBlob, containerRef.current, undefined, {
      className: "docx-render",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      useBase64URL: true,
    }).catch(console.error);
  }, [docxBlob]);

  return (
    <div className="doc-preview-overlay" onClick={onCancel}>
      <div className="doc-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="doc-preview-modal__header">
          <span className="doc-preview-modal__title">Vista Previa del Documento</span>
          <button className="doc-preview-modal__close" onClick={onCancel} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="doc-preview-modal__body">
          {docxBlob ? (
            <div ref={containerRef} className="doc-preview-modal__content" />
          ) : (
            <div className="doc-preview-modal__skeleton-page">
              <div className="doc-preview-modal__skeleton-line doc-preview-modal__skeleton-line--title" />
              <div className="doc-preview-modal__skeleton-line" />
              <div className="doc-preview-modal__skeleton-line" />
              <div className="doc-preview-modal__skeleton-line doc-preview-modal__skeleton-line--short" />
              <div className="doc-preview-modal__skeleton-gap" />
              <div className="doc-preview-modal__skeleton-line doc-preview-modal__skeleton-line--heading" />
              <div className="doc-preview-modal__skeleton-line" />
              <div className="doc-preview-modal__skeleton-line" />
              <div className="doc-preview-modal__skeleton-line doc-preview-modal__skeleton-line--short" />
              <div className="doc-preview-modal__skeleton-gap" />
              <div className="doc-preview-modal__skeleton-line doc-preview-modal__skeleton-line--heading" />
              <div className="doc-preview-modal__skeleton-line" />
              <div className="doc-preview-modal__skeleton-line doc-preview-modal__skeleton-line--medium" />
              <div className="doc-preview-modal__skeleton-spinner-row">
                <div className="doc-preview-modal__skeleton-spinner" />
                <span>Generando documento...</span>
              </div>
            </div>
          )}
        </div>

        <div className="doc-preview-modal__footer">
          <button className="doc-preview-modal__cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="doc-preview-modal__download-btn"
            onClick={onDownload}
            disabled={!docxBlob}
          >
            <Download size={16} />
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocPreviewModal;
