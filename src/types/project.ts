export type ProjectStatus = "En progreso" | "Completado" | "Borrador";

export type ProjectPriority = "Alta prioridad" | "Media prioridad" | "Baja prioridad";

export type SortOption = "recent" | "name";

export type Project = {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  category: string;
  objective: string;
  responsible: string;
  department: string;
  createdDate: string;
  deadline: string;
  lastUpdatedLabel: string;
  lastUpdatedDays: number;
  progress: number;
};
