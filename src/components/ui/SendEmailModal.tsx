import { useState } from 'react';
import { X, Mail, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import './SendEmailModal.css';

interface SendEmailModalProps {
  projectName: string;
  onClose: () => void;
  onSend: (to: string, customMessage: string) => Promise<void>;
}

function SendEmailModal({ projectName, onClose, onSend }: SendEmailModalProps) {
  const [to, setTo] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = to.trim();
    if (!trimmed) {
      setError('Ingresa al menos un correo destinatario.');
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      await onSend(trimmed, customMessage.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el correo. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="send-email-overlay" onClick={onClose}>
      <div className="send-email-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="send-email-modal__header">
          <span className="send-email-modal__title">
            <Mail size={17} color="#ec0029" style={{ marginRight: 8 }} />
            Enviar Documento por Correo
          </span>
          <button className="send-email-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="send-email-modal__body">

          {success ? (
            <div className="send-email-modal__success">
              <div className="send-email-modal__success-icon">
                <CheckCircle size={32} />
              </div>
              <p className="send-email-modal__success-title">¡Correo enviado!</p>
              <p className="send-email-modal__success-sub">
                El documento <strong>{projectName}</strong> fue enviado a <strong>{to}</strong>.
              </p>
              <button className="send-email-modal__primary-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              <p className="send-email-modal__desc">
                Se enviará el documento <strong>{projectName}</strong> en formato .docx junto con
                el resumen del proyecto y los últimos comentarios del chat.
              </p>

              <div className="send-email-modal__field">
                <label className="send-email-modal__label" htmlFor="email-to">
                  Destinatario(s) <span className="send-email-modal__required">*</span>
                </label>
                <input
                  id="email-to"
                  className="send-email-modal__input"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={to}
                  onChange={(e) => { setTo(e.target.value); setError(null); }}
                  disabled={isSending}
                  autoFocus
                />
                <span className="send-email-modal__hint">
                  Para múltiples destinatarios separa los correos con coma.
                </span>
              </div>

              <div className="send-email-modal__field">
                <label className="send-email-modal__label" htmlFor="email-msg">
                  Mensaje personalizado <span className="send-email-modal__optional">(opcional)</span>
                </label>
                <textarea
                  id="email-msg"
                  className="send-email-modal__textarea"
                  placeholder="Añade un mensaje para el destinatario..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  disabled={isSending}
                  rows={3}
                />
              </div>

              {error && (
                <div className="send-email-modal__error">
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="send-email-modal__footer">
            <button
              className="send-email-modal__cancel-btn"
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </button>
            <button
              className="send-email-modal__primary-btn"
              onClick={handleSend}
              disabled={isSending || !to.trim()}
            >
              {isSending ? (
                <>
                  <span className="send-email-modal__spinner" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Enviar
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default SendEmailModal;
