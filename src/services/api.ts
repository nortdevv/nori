import { API_CONFIG } from '../config/api';
import type {
  DocumentVersion,
  VersionDetail,
  Project,
  Message,
  DocumentSection,
  DocumentSectionUpdated,
  DocumentProjectMeta,
  JsonValue,
  ProjectShare,
  ProjectSharePreview,
  ProjectSummary,
} from '../types/project';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nori_token');
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function joinServiceUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function withAuth(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
  };
}

// Generic fetch wrapper
async function apiFetch<T>(
  serviceUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = joinServiceUrl(serviceUrl, endpoint);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    if (response.status === 204) {
      return undefined as T;
    }
    const raw = await response.text();
    if (!raw) {
      return undefined as T;
    }
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    // Handle network errors (backend unavailable, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Servicio Backend no disponible. Checa tu conexión o inténtalo de nuevo más tarde.');
    }
    throw error;
  }
}

// ============================================================================
// Auth Service API
// ============================================================================

export const authApi = {
  /**
   * Login with email and password. Returns a JWT token and user info.
   */
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: { id: string; email: string; name: string | null; role: 'user' | 'admin' } }>(
      API_CONFIG.authService,
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
};

// ============================================================================
// Chat Service API
// ============================================================================

export const chatApi = {
  /**
   * Get all conversations for the logged-in user (JWT)
   */
  getConversations: (_userId?: string) =>
    apiFetch<{ conversations: Project[] }>(
      API_CONFIG.chatService,
      '/api/chat/conversations',
      withAuth({ method: 'GET' }),
    ),

  getConversation: (projectId: string) =>
    apiFetch<{ conversation: Project }>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Delete a project and related rows. Uses POST (not DELETE) because many
   * proxies and hosted stacks return 404 for DELETE while POST works the same.
   */
  deleteConversation: (projectId: string, _userId?: string) =>
    apiFetch<{ success: boolean; projectId: string }>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}/delete`,
      withAuth({ method: 'POST', body: JSON.stringify({}) }),
    ),

  duplicateConversation: async (
    projectId: string,
    _userId?: string,
  ): Promise<{ projectId: string; userId: string }> => {
    const payload = JSON.stringify({ projectId });

    try {
      return await apiFetch<{ projectId: string; userId: string }>(
        API_CONFIG.chatService,
        `/api/chat/conversations/${encodeURIComponent(projectId)}/duplicate`,
        withAuth({ method: 'POST', body: '{}' }),
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const looksLikeMissingRoute = /\b404\b|Not Found/i.test(msg);
      if (!looksLikeMissingRoute) throw err;

      return apiFetch<{ projectId: string; userId: string }>(
        API_CONFIG.chatService,
        '/api/chat/duplicate-project',
        withAuth({ method: 'POST', body: payload }),
      );
    }
  },

  /**
   * Update project metadata (name, tags, status)
   */
  updateConversation: (
    projectId: string,
    data: { name: string; tags: string[]; status: string },
    _userId?: string
  ) =>
    apiFetch<Project>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}/update`,
      withAuth({
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  /**
   * Create a new conversation/project
   */
  createConversation: (
    data: {
      name: string;
      tags?: string[];
      priority?: string;
      sponsor?: string;
      startDate?: string;
    },
    _userId?: string
  ) =>
    apiFetch<{ projectId: string; userId: string }>(
      API_CONFIG.chatService,
      '/api/chat/conversations',
      withAuth({
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  /**
   * Get conversation history for a project
   */
  getHistory: (projectId: string) =>
    apiFetch<{ projectId: string; messages: Message[] }>(
      API_CONFIG.chatService,
      `/api/chat/history/${projectId}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Send a message in a conversation
   */
  sendMessage: (
    data: { projectId: string; message: string },
    _userId?: string
  ) =>
    apiFetch<{
      projectId: string;
      reply: string;
      messageNo: number;
      documentSectionUpdated: number | null;
    }>(
      API_CONFIG.chatService,
      '/api/chat/send',
      withAuth({
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ),

  /**
   * Get document sections for a project
   */
  getDocumentSections: (projectId: string) =>
    apiFetch<{ projectId: string; sections: DocumentSection[] }>(
      API_CONFIG.chatService,
      `/api/chat/document-sections/${projectId}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Get AI-generated contextual summary for a project
   */
  getProjectSummary: (projectId: string, maxChars = 900) =>
    apiFetch<ProjectSummary>(
      API_CONFIG.chatService,
      `/api/chat/projects/${encodeURIComponent(projectId)}/summary?maxChars=${encodeURIComponent(String(maxChars))}`,
      withAuth({ method: 'GET' })
    ),

  /**
   * Generate an architecture diagram for a project
   */
  generateDiagram: (projectId: string) =>
    apiFetch<{
      projectId: string;
      diagramId: string;
      source: string;
      imageUrl: string;
      svgUrl: string;
    }>(
      API_CONFIG.chatService,
      '/api/chat/generate-diagram',
      withAuth({
        method: 'POST',
        body: JSON.stringify({ projectId }),
      }),
    ),

  /**
   * Get existing architecture diagram for a project
   */
  getDiagram: (projectId: string) =>
    apiFetch<{
      projectId: string;
      diagramId: string;
      source: string;
      imageUrl: string;
      svgUrl: string;
      lastUpdated: string;
    }>(
      API_CONFIG.chatService,
      `/api/chat/diagram/${projectId}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Update an existing diagram's source code
   */
  updateDiagram: (projectId: string, source: string) =>
    apiFetch<{
      projectId: string;
      diagramId: string;
      source: string;
    }>(
      API_CONFIG.chatService,
      `/api/chat/diagram/${projectId}`,
      withAuth({
        method: 'PUT',
        body: JSON.stringify({ source }),
      }),
    ),

  /**
   * Generate a dependency diagram for a project
   */
  generateDependencies: (projectId: string) =>
    apiFetch<{
      projectId: string;
      diagramId: string;
      source: string;
      imageUrl: string;
      svgUrl: string;
    }>(
      API_CONFIG.chatService,
      '/api/chat/generate-dependencies',
      withAuth({
        method: 'POST',
        body: JSON.stringify({ projectId }),
      }),
    ),

  /**
   * Get existing dependency diagram for a project
   */
  getDependencies: (projectId: string) =>
    apiFetch<{
      projectId: string;
      diagramId: string;
      source: string;
      imageUrl: string;
      svgUrl: string;
      lastUpdated: string;
    }>(
      API_CONFIG.chatService,
      `/api/chat/dependencies/${projectId}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Update an existing dependency diagram's source code
   */
  updateDependencies: (projectId: string, source: string) =>
    apiFetch<{
      projectId: string;
      diagramId: string;
      source: string;
    }>(
      API_CONFIG.chatService,
      `/api/chat/dependencies/${projectId}`,
      withAuth({
        method: 'PUT',
        body: JSON.stringify({ source }),
      }),
    ),

  /**
   * Get all projects for all users under a specific admin
   */
  getAdminUsersProgress: (adminId: string) =>
    apiFetch<{
      projects: {
        project_id: string;
        name: string;
        status: string;
        progress_pct: number;
        last_updated: string;
        developer_id: string;
        developer_name: string;
        developer_email: string;
      }[];
    }>(
      API_CONFIG.chatService,
      `/api/chat/admin/users-progress?adminId=${adminId}`,
      withAuth({ method: 'GET' })
    ),
};

// ============================================================================
// Share API (requires JWT)
// ============================================================================

export const shareApi = {
  create: (
    projectId: string,
    options?: { documentVersionId?: string | null; expiresInDays?: number | null },
  ) =>
    apiFetch<{ shareId: string; url: string; expiresAt?: string | null }>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}/shares`,
      withAuth({
        method: 'POST',
        body: JSON.stringify({
          ...(options?.documentVersionId
            ? { documentVersionId: options.documentVersionId }
            : {}),
          ...(options?.expiresInDays != null
            ? { expiresInDays: options.expiresInDays }
            : {}),
        }),
      }),
    ),

  listForProject: (projectId: string) =>
    apiFetch<{ shares: ProjectShare[] }>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}/shares`,
      withAuth({ method: 'GET' }),
    ),

  revoke: (shareId: string) =>
    apiFetch<void>(
      API_CONFIG.chatService,
      `/api/chat/shares/${encodeURIComponent(shareId)}`,
      withAuth({ method: 'DELETE' }),
    ),

  get: (shareId: string) =>
    apiFetch<ProjectSharePreview>(
      API_CONFIG.chatService,
      `/api/share/${encodeURIComponent(shareId)}`,
      withAuth({ method: 'GET' }),
    ),

  copy: (shareId: string) =>
    apiFetch<{ projectId: string; shareId: string }>(
      API_CONFIG.chatService,
      `/api/share/${encodeURIComponent(shareId)}/copy`,
      withAuth({ method: 'POST' }),
    ),
};

// ============================================================================
// Document Service API
// ============================================================================

export const documentApi = {
  /**
   * Generate a Word document for a project
   * Returns a Blob for downloading
   */
  generateDocument: async (projectId: string): Promise<Blob> => {
    try {
      const response = await fetch(
        `${API_CONFIG.documentService}/api/documents/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeaders() as Record<string, string>),
          },
          body: JSON.stringify({
            projectId,
            options: { onlyCompleteSections: false }
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: 'Document generation failed'
        }));
        throw new Error(error.error || 'Document generation failed');
      }

      return response.blob();
    } catch (error: unknown) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Servicio de documentos no disponible. Checa tu conexión o inténtalo de nuevo más tarde.');
      }
      throw error;
    }
  },

  /**
   * Returns the URL for the HTML preview (used as iframe src)
   */
  previewUrl: (projectId: string): string =>
    `${API_CONFIG.documentService}/api/documents/preview/${projectId}`,

  /**
   * Get project metadata from document service
   */
  getProject: (projectId: string) =>
    apiFetch<DocumentProjectMeta>(
      API_CONFIG.documentService,
      `/api/documents/${projectId}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Update a document section content
   */
  patchSection: (projectId: string, sectionNo: number, content: JsonValue) =>
    apiFetch<DocumentSectionUpdated>(
      API_CONFIG.documentService,
      `/api/documents/projects/${projectId}/sections/${sectionNo}`,
      withAuth({
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    ),

  /**
   * List all saved versions for a project
   */
  getVersions: (projectId: string) =>
    apiFetch<DocumentVersion[]>(
      API_CONFIG.documentService,
      `/api/projects/${encodeURIComponent(projectId)}/versions`,
      withAuth({ method: 'GET', cache: 'no-store' }),
    ),

  /**
   * Get a specific version with its Document_Section snapshots
   */
  getVersion: (projectId: string, versionId: string) =>
    apiFetch<VersionDetail>(
      API_CONFIG.documentService,
      `/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`,
      withAuth({ method: 'GET' }),
    ),

  /**
   * Snapshot the current working draft as a new version
   */
  createVersion: (projectId: string) =>
    apiFetch<DocumentVersion>(
      API_CONFIG.documentService,
      `/api/projects/${encodeURIComponent(projectId)}/versions`,
      withAuth({ method: 'POST' }),
    ),

  /**
   * Permanently delete a specific version snapshot
   */
  deleteVersion: (projectId: string, versionId: string) =>
    apiFetch<void>(
      API_CONFIG.documentService,
      `/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`,
      withAuth({ method: 'DELETE' }),
    ),

  /**
   * Restore a version snapshot over the current working draft
   */
  restoreVersion: (projectId: string, versionId: string) =>
    apiFetch<{ message: string }>(
      API_CONFIG.documentService,
      `/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/restore`,
      withAuth({ method: 'POST' }),
    ),

  /**
  * Send the project document via email with Banorte-branded template and DOCX attachment
  */
  sendDocumentEmail: (projectId: string, to: string, customMessage?: string) =>
    apiFetch<{ message: string; to: string; filename: string }>(
      API_CONFIG.documentService,
      `/api/documents/${projectId}/send-email`,
      withAuth({
        method: 'POST',
        body: JSON.stringify({ to, customMessage }),
      }),
    ),
};
