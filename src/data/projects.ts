import type { Project } from "../types/project";

export const projects: Project[] = [
  {
    id: 1,
    title: "Sistema de Captura de Datos",
    description:
      "Plataforma web para la recopilación automatizada de información de campo con validación en tiempo real y sincronización offline.",
    status: "En progreso",
    lastUpdatedLabel: "hace 2 días",
    lastUpdatedDays: 2,
  },
  {
    id: 2,
    title: "Portal de Autoservicio Clientes",
    description:
      "Aplicación web que permite a los clientes gestionar sus cuentas, consultar historial de transacciones y solicitar servicios adicionales.",
    status: "Completado",
    lastUpdatedLabel: "hace 5 días",
    lastUpdatedDays: 5,
  },
  {
    id: 3,
    title: "Dashboard Ejecutivo de Métricas",
    description:
      "Sistema de visualización de KPIs en tiempo real con capacidades de drill-down y generación de reportes personalizados.",
    status: "En progreso",
    lastUpdatedLabel: "hace 1 día",
    lastUpdatedDays: 1,
  },
  {
    id: 4,
    title: "App Móvil de Gestión de Inventarios",
    description:
      "Aplicación móvil multiplataforma para escaneo de códigos de barras, tracking de productos y alertas de stock bajo.",
    status: "Borrador",
    lastUpdatedLabel: "hace 1 semana",
    lastUpdatedDays: 7,
  },
  {
    id: 5,
    title: "Plataforma de Capacitación Online",
    description:
      "Sistema LMS para gestión de cursos, evaluaciones y certificaciones con soporte para video streaming y gamificación.",
    status: "Completado",
    lastUpdatedLabel: "hace 3 semanas",
    lastUpdatedDays: 21,
  },
  {
    id: 6,
    title: "Sistema de Gestión Documental",
    description:
      "Repositorio centralizado de documentos con control de versiones, firma electrónica y flujos de aprobación configurables.",
    status: "Borrador",
    lastUpdatedLabel: "hace 2 días",
    lastUpdatedDays: 2,
  },
];
