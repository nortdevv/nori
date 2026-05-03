import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import { chatApi } from "../services/api";
import { getErrorMessage } from "../lib/utils";

const PREDEFINED_TAGS = [
  "Cumplimiento Regulatorio",
  "Retención de Clientes",
  "Incremento de Ingresos",
  "Eficiencia Operativa",
  "Transformación Digital",
  "Seguridad",
];

const PRIORITY_OPTIONS = ["Alta", "Media", "Baja"] as const;

function CrearProyecto() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [sponsor, setSponsor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Crear Proyecto — Nori";
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setCustomTagInput("");
  };

  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

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
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        priority: priority || undefined,
        sponsor: sponsor.trim() || undefined,
        startDate: startDate || undefined,
      });

      navigate(`/chat/${projectId}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create project"));
      console.error("Error creating project:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div className="dashboard-shell-header">
        <Navbar />
        <BreadcrumbProjects />
      </div>
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fafafa", padding: "3rem 1rem" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              border: "1px solid var(--line-border)",
              boxShadow: "var(--nori-shadow-card)",
              padding: "2rem",
            }}
          >
            <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#1a1a1a", marginBottom: "1.5rem" }}>
              Crear Nuevo Proyecto
            </h1>

            {error && (
              <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "0.375rem" }}>
                <p style={{ color: "#dc2626" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Project Name */}
              <div>
                <label style={labelStyle}>Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  placeholder="Ej: Sistema de Gestión de Inventario"
                  required
                />
              </div>

              {/* Category Tags */}
              <div>
                <label style={labelStyle}>Categorías</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {PREDEFINED_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: "0.375rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.8125rem",
                          fontWeight: "500",
                          border: isSelected
                            ? "1.5px solid var(--nori-brand)"
                            : "1.5px solid var(--line-border-muted)",
                          backgroundColor: isSelected ? "#fef2f2" : "white",
                          color: isSelected ? "var(--nori-brand)" : "#4b5563",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isSelected ? "✓ " : ""}{tag}
                      </button>
                    );
                  })}
                </div>
                {/* Custom tag input */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Agregar categoría personalizada..."
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={!customTagInput.trim()}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: customTagInput.trim()
                        ? "var(--nori-brand)"
                        : "#e5e7eb",
                      color: customTagInput.trim() ? "white" : "#9ca3af",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: customTagInput.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    Agregar
                  </button>
                </div>
                {/* Selected custom tags (not in predefined) */}
                {selectedTags.filter((t) => !PREDEFINED_TAGS.includes(t)).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.5rem" }}>
                    {selectedTags
                      .filter((t) => !PREDEFINED_TAGS.includes(t))
                      .map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "9999px",
                            fontSize: "0.8125rem",
                            fontWeight: "500",
                            backgroundColor: "#fef2f2",
                            color: "var(--nori-brand)",
                            border: "1.5px solid var(--nori-brand)",
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--nori-brand)",
                              cursor: "pointer",
                              padding: "0",
                              fontSize: "1rem",
                              lineHeight: "1",
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Priority + Sponsor row */}
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Prioridad</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {PRIORITY_OPTIONS.map((opt) => {
                      const isSelected = priority === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPriority(isSelected ? "" : opt)}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            border: isSelected
                              ? "1.5px solid var(--nori-brand)"
                              : "1.5px solid var(--line-border-muted)",
                            backgroundColor: isSelected ? "#fef2f2" : "white",
                            color: isSelected ? "var(--nori-brand)" : "#4b5563",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Sponsor</label>
                  <input
                    type="text"
                    value={sponsor}
                    onChange={(e) => setSponsor(e.target.value)}
                    style={inputStyle}
                    placeholder="Nombre del sponsor"
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label style={labelStyle}>Fecha de inicio estimada</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "1rem", paddingTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    flex: 1,
                    backgroundColor: isCreating ? "#9ca3af" : "var(--nori-brand)",
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: "#374151",
  marginBottom: "0.5rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 1rem",
  border: "1px solid var(--line-border-muted)",
  borderRadius: "0.375rem",
  fontSize: "1rem",
  boxSizing: "border-box",
};

export default CrearProyecto;
