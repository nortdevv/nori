export type ProjectStatus = "En progreso" | "Completado" | "Borrador";

export type SortOption = "recent" | "name";

export type Project = {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  lastUpdatedLabel: string;
  lastUpdatedDays: number;
};
