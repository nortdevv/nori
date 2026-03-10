// API base URLs from environment variables
export const API_CONFIG = {
  chatService: import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:3001',
  documentService: import.meta.env.VITE_DOCUMENT_SERVICE_URL || 'http://localhost:3004',
} as const;

// Static user ID (no auth for now)
export const STATIC_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// Check if backend is likely configured (not localhost and not placeholder)
export function isBackendConfigured(): boolean {
  const chatUrl = API_CONFIG.chatService;
  const isLocalhost = chatUrl.includes('localhost') || chatUrl.includes('127.0.0.1');
  const isPlaceholder = chatUrl.includes('-xyz.run.app') || chatUrl.includes('your-actual');

  // In production (not localhost), check if it's not a placeholder
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return !isLocalhost && !isPlaceholder;
  }

  return true; // In local dev, assume it's ok
}
