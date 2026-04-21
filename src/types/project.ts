// ============================================================================
// Backend Database Schema Types
// ============================================================================

/**
 * Project from backend (matches listConversations response)
 */
export interface Project {
  project_id: string;           // UUID
  name: string;                 // Project name
  tags: string[];               // Categories from section 0 iniciativa.tipo
  status: string;               // e.g., "in_progress", "completed"
  progress_pct: number;         // 0-100
  date_created: string;         // ISO timestamp
  last_updated: string;         // ISO timestamp
  message_count?: number;       // From JOIN query (optional)
}

/**
 * Message from backend (matches 04-message.sql schema)
 */
export interface Message {
  message_no: number;
  role: 'user' | 'model';
  content: string;
  created_at: string;           // ISO timestamp
}

/**
 * Document section from backend (matches 05-document_section.sql schema)
 */
export interface DocumentSection {
  section_no: number;           // 0-10
  content: any;                 // JSONB data (varies by section)
  is_complete: boolean;
  last_updated: string;         // ISO timestamp
}

// ============================================================================
// Frontend Display Types
// ============================================================================

/**
 * Project status for display
 */
export type ProjectStatus = 'in_progress' | 'completed' | 'draft';

/**
 * Project with computed display fields
 */
export interface ProjectDisplay extends Project {
  statusLabel: string;          // Human-readable status
  lastUpdatedLabel: string;     // e.g., "hace 2 días"
  progressLabel: string;        // e.g., "45%"
}

export type SortOption = "recent" | "name";

/** How projects are shown on the home / library page */
export type LibraryViewMode = "grid" | "list";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert backend project to display format
 */
export function toProjectDisplay(project: Project): ProjectDisplay {
  return {
    ...project,
    tags: project.tags || [],
    statusLabel: getStatusLabel(project.status),
    lastUpdatedLabel: getRelativeTime(project.last_updated),
    progressLabel: `${project.progress_pct}%`,
  };
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'in_progress': 'En progreso',
    'completed': 'Completado',
    'draft': 'Borrador',
  };
  return labels[status] || status;
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return `Hace ${Math.floor(diffDays / 30)} meses`;
}
