import { API_CONFIG, STATIC_USER_ID } from '../config/api';

// Generic fetch wrapper
async function apiFetch<T>(
  serviceUrl: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${serviceUrl}${endpoint}`;

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

    return response.json();
  } catch (error: any) {
    // Handle network errors (backend unavailable, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Backend service unavailable. Please check your connection or try again later.');
    }
    throw error;
  }
}

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
   * Create a new conversation/project
   */
  createConversation: (data: { name: string; description?: string; type?: string }) =>
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
        throw new Error('Document service unavailable. Please check your connection or try again later.');
      }
      throw error;
    }
  },

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
};
