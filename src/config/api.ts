// API base URLs from environment variables
export const API_CONFIG = {
  chatService: import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:3001',
  documentService: import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:3004',
} as const;

// Static user ID (no auth for now)
export const STATIC_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
