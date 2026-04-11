import { useState } from "react";
import { X, Download, RefreshCw, GitBranch, AlertTriangle } from "lucide-react";
import "./DiagramModal.css";

interface DiagramModalProps {
  imageUrl: string | null;
  svgUrl?: string | null;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: () => void;
}

function DiagramModal({
  imageUrl,
  isGenerating,
  error,
  onClose,
  onRegenerate,
}: DiagramModalProps) {
  const [imageError, setImageError] = useState(false);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "diagrama-arquitectura.png";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <div className="diagram-modal-overlay" onClick={onClose}>
      <div className="diagram-modal" onClick={(e) => e.stopPropagation()}>
        <div className="diagram-modal__header">
          <span className="diagram-modal__title">
            <GitBranch size={18} color="#ec0029" />
            Diagrama de Arquitectura
          </span>
          <button
            className="diagram-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="diagram-modal__body">
          {isGenerating && (
            <div className="diagram-modal__loading">
              <div className="diagram-modal__spinner" />
              <span className="diagram-modal__loading-text">
                Generando diagrama de arquitectura...
              </span>
              <span className="diagram-modal__loading-subtext">
                Gemini está analizando tus requerimientos
              </span>
            </div>
          )}

          {error && !isGenerating && (
            <div className="diagram-modal__error">
              <div className="diagram-modal__error-icon">
                <AlertTriangle size={24} />
              </div>
              <p className="diagram-modal__error-text">{error}</p>
            </div>
          )}

          {imageUrl && !isGenerating && !error && (
            <div className="diagram-modal__image-wrapper">
              {imageError ? (
                <div className="diagram-modal__error">
                  <div className="diagram-modal__error-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <p className="diagram-modal__error-text">
                    El diagrama no pudo renderizarse. Intenta regenerarlo.
                  </p>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Diagrama de Arquitectura"
                  className="diagram-modal__image"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          )}
        </div>

        <div className="diagram-modal__footer">
          <button
            className="diagram-modal__btn diagram-modal__btn--cancel"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="diagram-modal__btn diagram-modal__btn--regenerate"
            onClick={() => {
              setImageError(false);
              onRegenerate();
            }}
            disabled={isGenerating}
          >
            <RefreshCw size={16} />
            Regenerar
          </button>
          <button
            className="diagram-modal__btn diagram-modal__btn--download"
            onClick={handleDownload}
            disabled={!imageUrl || isGenerating || imageError}
          >
            <Download size={16} />
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiagramModal;
