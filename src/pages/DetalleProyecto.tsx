import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/ui/Navbar";
import SubNavbar from "../components/ui/SubNavbar";
import BreadcrumbProjects from "../components/ui/BreadcrumbProjects";
import { projects } from "../data/projects";
import { ChevronLeft, Pencil, Copy, Trash2, CalendarDays } from "lucide-react";
import type { ProjectStatus, ProjectPriority } from "../types/project";

function getStatusStyle(status: ProjectStatus) {
  if (status === "Completado")
    return { background: "#ecfdf3", color: "#16a34a" };
  if (status === "Borrador") return { background: "#eff3f8", color: "#64748b" };
  return { background: "#fff3e7", color: "#d97706" };
}

function getPriorityStyle(priority: ProjectPriority) {
  if (priority === "Alta prioridad")
    return { background: "#fee2e2", color: "#dc2626" };
  if (priority === "Baja prioridad")
    return { background: "#e0f2fe", color: "#0284c7" };
  return {
    background: "#fff7ed",
    color: "#ea580c",
    border: "1.5px solid #ea580c",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function DetalleProyecto() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find((p) => p.id === Number(id));

  useEffect(() => {
    document.title = project
      ? `${project.title} — Nori`
      : "Proyecto no encontrado — Nori";
  }, [project]);

  return (
    <div className="dashboard-page">
      <div style={{ flexShrink: 0 }}>
        <Navbar />
        <SubNavbar />
        <BreadcrumbProjects />
      </div>
      <main className="dashboard-content">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              color: "#334155",
              fontSize: "0.95rem",
              fontWeight: 500,
              backgroundColor: "#ffffff",
              border: "1.5px solid #323e48",
              borderRadius: "10px",
              padding: "10px 18px",
              transition: "background-color 0.15s ease",
            }}
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
            Volver a proyectos
          </Link>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#ec0029",
                backgroundColor: "#ffffff",
                border: "1.5px solid #ec0029",
                borderRadius: "10px",
                padding: "10px 18px",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
            >
              <Pencil size={16} strokeWidth={2.2} />
              Editar
            </button>

            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#334155",
                backgroundColor: "#ffffff",
                border: "1.5px solid #d6dce5",
                borderRadius: "10px",
                padding: "10px 18px",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
            >
              <Copy size={16} strokeWidth={2.2} />
              Duplicar
            </button>

            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#ec0029",
                backgroundColor: "#ffffff",
                border: "1.5px solid #d6dce5",
                borderRadius: "10px",
                padding: "10px 18px",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
            >
              <Trash2 size={16} strokeWidth={2.2} />
              Eliminar
            </button>
          </div>
        </div>

        {project ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "36px 40px",
            }}
          >
            {/* Título y fecha */}
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "#0f172a",
                margin: "0 0 4px",
              }}
            >
              {project.title}
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#94a3b8",
                margin: "0 0 20px",
              }}
            >
              Proyecto · Creado el {project.createdDate}
            </p>

            {/* Badges */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <span
                style={{
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "5px 14px",
                  ...getStatusStyle(project.status),
                }}
              >
                {project.status}
              </span>
              <span
                style={{
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "5px 14px",
                  ...getPriorityStyle(project.priority),
                }}
              >
                {project.priority}
              </span>
              <span
                style={{
                  borderRadius: "999px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "5px 14px",
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                }}
              >
                {project.category}
              </span>
            </div>

            {/* Separador */}
            <hr
              style={{
                border: "none",
                borderTop: "1px solid #e2e8f0",
                margin: "0 0 24px",
              }}
            />

            {/* Objetivo */}
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Objetivo
            </p>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#334155",
                lineHeight: 1.7,
                margin: "0 0 28px",
              }}
            >
              {project.objective}
            </p>

            {/* Responsable y Departamento */}
            <div style={{ display: "flex", gap: "80px", marginBottom: "28px" }}>
              <div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    margin: "0 0 10px",
                  }}
                >
                  Responsable
                </p>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#ec0029",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(project.responsible)}
                  </div>
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {project.responsible}
                  </span>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    margin: "0 0 10px",
                  }}
                >
                  Departamento
                </p>
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "#0f172a",
                  }}
                >
                  {project.department}
                </span>
              </div>
            </div>

            {/* Fecha límite */}
            <p
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Fecha límite
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CalendarDays size={18} color="#64748b" strokeWidth={2} />
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "#0f172a",
                }}
              >
                {project.deadline}
              </span>
            </div>
          </div>
        ) : (
          <h1>Proyecto no encontrado</h1>
        )}
      </main>
    </div>
  );
}

export default DetalleProyecto;
