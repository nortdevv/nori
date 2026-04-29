import { API_CONFIG, STATIC_USER_ID } from '../config/api';

function joinServiceUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
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
  } catch (error: any) {
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
    apiFetch<{ token: string; user: { id: string; email: string; name: string; role: 'user' | 'admin' } }>(
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
   * Get all conversations for the static user
   */
  getConversations: () =>
    apiFetch<{ conversations: any[] }>(
      API_CONFIG.chatService,
      `/api/chat/conversations?userId=${STATIC_USER_ID}`,
      { method: 'GET' }
    ),

  /**
   * Delete a project and related rows. Uses POST (not DELETE) because many
   * proxies and hosted stacks return 404 for DELETE while POST works the same.
   */
  deleteConversation: (projectId: string) =>
    apiFetch<{ success: boolean; projectId: string }>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}/delete`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: STATIC_USER_ID }),
      }
    ),

  /**
   * Update project metadata (name, tags, status)
   */
  updateConversation: (
    projectId: string,
    data: { name: string; tags: string[]; status: string }
  ) =>
    apiFetch<{
      project_id: string;
      name: string;
      tags: string[];
      status: string;
      progress_pct: number;
      date_created: string;
      last_updated: string;
      message_count?: number;
    }>(
      API_CONFIG.chatService,
      `/api/chat/conversations/${encodeURIComponent(projectId)}/update`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, userId: STATIC_USER_ID }),
      }
    ),

  /**
   * Create a new conversation/project
   */
  createConversation: (data: {
    name: string;
    tags?: string[];
    priority?: string;
    sponsor?: string;
    startDate?: string;
  }) =>
    apiFetch<{ projectId: string; userId: string }>(
      API_CONFIG.chatService,
      '/api/chat/conversations',
      {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          userId: STATIC_USER_ID,
        }),
      }
    ),

  /**
   * Get conversation history for a project
   */
  getHistory: (projectId: string) =>
    apiFetch<{ projectId: string; messages: any[] }>(
      API_CONFIG.chatService,
      `/api/chat/history/${projectId}`,
      { method: 'GET' }
    ),

  /**
   * Send a message in a conversation
   */
  sendMessage: (data: { projectId: string; message: string }) =>
    apiFetch<{
      projectId: string;
      reply: string;
      messageNo: number;
      documentSectionUpdated: number | null;
    }>(
      API_CONFIG.chatService,
      '/api/chat/send',
      {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          userId: STATIC_USER_ID,
        }),
      }
    ),

  /**
   * Get document sections for a project
   */
  getDocumentSections: (projectId: string) =>
    apiFetch<{ projectId: string; sections: any[] }>(
      API_CONFIG.chatService,
      `/api/chat/document-sections/${projectId}`,
      { method: 'GET' }
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
      {
        method: 'POST',
        body: JSON.stringify({ projectId }),
      }
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
      { method: 'GET' }
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
      {
        method: 'PUT',
        body: JSON.stringify({ source }),
      }
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
    } catch (error: any) {
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
    apiFetch<any>(
      API_CONFIG.documentService,
      `/api/documents/${projectId}`,
      { method: 'GET' }
    ),

  /**
   * Update a document section content
   */
  patchSection: (projectId: string, sectionNo: number, content: any) =>
    apiFetch<any>(
      API_CONFIG.documentService,
      `/api/documents/projects/${projectId}/sections/${sectionNo}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }
    ),

  /**
   * Send the project document via email with Banorte-branded template and DOCX attachment
   */
  sendDocumentEmail: (projectId: string, to: string, customMessage?: string) =>
    apiFetch<{ message: string; to: string; filename: string }>(
      API_CONFIG.documentService,
      `/api/documents/${projectId}/send-email`,
      {
        method: 'POST',
        body: JSON.stringify({ to, customMessage }),
      }
    ),
};
