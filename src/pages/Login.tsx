import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, MessageSquare, FileText, FolderOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/utils";
import "./Login.css";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Already logged in — skip straight to the app
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Iniciar sesión — Nori";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Credenciales incorrectas. Intenta de nuevo."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>

      {/* ── LEFT BRAND PANEL ── */}
      <div
        id="login-brand-panel"
        style={{
          width: "42%",
          minWidth: "340px",
          background: "linear-gradient(160deg, #E5192D 0%, #b5121f 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "3rem 3.5rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "320px", height: "320px",
          borderRadius: "50%", background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", bottom: "-120px", left: "-60px",
          width: "400px", height: "400px",
          borderRadius: "50%", background: "rgba(255,255,255,0.04)",
        }} />

        {/* Nori logo */}
        <div style={{ marginBottom: "0.75rem" }}>
          <img
            src="/images/nori_logo.png"
            alt="Nori"
            style={{ height: "100px", objectFit: "contain" }}
          />
        </div>

        <h1 style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "2.2rem",
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: "1rem",
          letterSpacing: "-0.5px",
        }}>
          Asistente de<br />Requerimientos
        </h1>

        <p style={{
          fontSize: "1rem",
          opacity: 0.85,
          marginBottom: "3rem",
          lineHeight: 1.65,
          maxWidth: "340px",
        }}>
          Levanta requerimientos de software con inteligencia artificial
        </p>

        {/* Feature list */}
        {[
          { icon: <MessageSquare size={18} />, title: "Conversaciones inteligentes", desc: "Captura necesidades con lenguaje natural" },
          { icon: <FileText size={18} />, title: "Documentación automatizada", desc: "Genera documentos profesionales al instante" },
          { icon: <FolderOpen size={18} />, title: "Gestión centralizada", desc: "Todos tus proyectos en un solo lugar" },
        ].map((f) => (
          <div key={f.title} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "flex-start" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: "2px",
            }}>
              {f.icon}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "2px" }}>{f.title}</p>
              <p style={{ fontSize: "0.8rem", opacity: 0.75 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div
        id="login-form-panel"
        style={{
          flex: 1,
          background: "#F5F5F7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "1.5rem 2.5rem 2.75rem",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 6px 29px rgba(0,0,0,0.11)",
        }}>
          {/* Banorte logo */}
          <div style={{ marginBottom: "0.25rem", display: "flex", justifyContent: "center" }}>
            <img
              src="/images/banorte_logo.png"
              alt="Banorte"
              style={{ height: "72px", objectFit: "contain" }}
            />
          </div>

          <h2 style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#111",
            marginBottom: "0.4rem",
          }}>
            Iniciar sesión
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1.75rem" }}>
            Accede a tu espacio de trabajo
          </p>

          <form id="login-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.45rem" }}>
                Correo electrónico
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#9ca3af" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@banorte.com"
                  style={{
                    width: "100%",
                    padding: "0.7rem 1rem 0.7rem 2.5rem",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    color: "#111",
                    outline: "none",
                    background: "#fafafa",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#E5192D"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.45rem" }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#9ca3af" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "0.7rem 2.75rem 0.7rem 2.5rem",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "0.9rem",
                    color: "#111",
                    outline: "none",
                    background: "#fafafa",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#E5192D"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
                <button
                  id="toggle-password"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px",
                    display: "flex", alignItems: "center",
                  }}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #fecaca",
                borderRadius: "8px", padding: "0.65rem 1rem",
                fontSize: "0.83rem", color: "#dc2626",
              }}>
                {error}
              </div>
            )}

            {/* Remember me + forgot */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="remember-me" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#374151" }}>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: "15px", height: "15px", accentColor: "#E5192D", cursor: "pointer" }}
                />
                Recordarme
              </label>
              <button
                id="forgot-password"
                type="button"
                style={{ background: "none", border: "none", color: "#E5192D", fontSize: "0.83rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "0.8rem",
                background: isSubmitting ? "#f87171" : "#E5192D",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                transition: "background 0.2s, transform 0.1s",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.background = "#c0121f"; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.background = "#E5192D"; }}
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#6b7280" }}>
            ¿No tienes cuenta?{" "}
            <button
              id="request-access"
              type="button"
              style={{ background: "none", border: "none", color: "#E5192D", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: "0.85rem" }}
            >
              Solicita acceso
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
