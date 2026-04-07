import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import SubNavbar from "../components/ui/SubNavbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import { chatApi } from "../services/api";

function CrearProyecto() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Proyecto");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Crear Proyecto — Nori";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("El nombre del proyecto es requerido");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { projectId } = await chatApi.createConversation({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
      });

      // Redirect to chat page for new project
      navigate(`/chat/${projectId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      console.error("Error creating project:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: "#f8fafc",
          padding: "3rem 1rem",
        }}
      >
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                color: "#1a1a1a",
                marginBottom: "1.5rem",
              }}
            >
              Crear Nuevo Proyecto
            </h1>

            {error && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "0.375rem",
                }}
              >
                <p style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                  placeholder="Ej: Sistema de Gestión de Inventario"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                  placeholder="Describe brevemente el proyecto..."
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem",
                  }}
                >
                  Tipo de Proyecto
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                  }}
                >
                  <option value="Proyecto">Proyecto</option>
                  <option value="Iniciativa">Iniciativa</option>
                  <option value="Mejora">Mejora</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", paddingTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    flex: 1,
                    backgroundColor: isCreating ? "#9ca3af" : "#ec0029",
                    color: "white",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    fontWeight: "500",
                    border: "none",
                    cursor: isCreating ? "not-allowed" : "pointer",
                  }}
                >
                  {isCreating ? "Creando..." : "Crear Proyecto"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  style={{
                    flex: 1,
                    backgroundColor: "#e5e7eb",
                    color: "#374151",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    fontWeight: "500",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrearProyecto;
