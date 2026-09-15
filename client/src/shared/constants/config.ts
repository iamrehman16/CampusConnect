/**
 * Environment variables accessor.
 * Centralizes all env var access for easy auditing and defaults.
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3100/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3100',
} as const;
