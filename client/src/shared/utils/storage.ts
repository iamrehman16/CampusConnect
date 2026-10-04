/**
 * LocalStorage / SessionStorage helper utilities.
 * Type-safe wrappers with JSON parse/stringify.
 */

export const storage = {
  get<T = string>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch {
      return localStorage.getItem(key) as T | null;
    }
  },

  set(key: string, value: unknown): void {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
} as const;

/** Token-specific helpers */
export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem('accessToken'),
  getRefreshToken: (): string | null => localStorage.getItem('refreshToken'),

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // The cached profile belongs to the session it came from.
    localStorage.removeItem(USER_CACHE_KEY);
  },
} as const;

const USER_CACHE_KEY = 'cc-user';

/**
 * Last known profile, so a reload while the API is unreachable can still
 * show the app (read-only offline mode, BACKLOG.md J3). Cleared with the
 * tokens, never trusted for authorisation (the server still decides).
 */
export const userCache = {
  get<T>(): T | null {
    try {
      const raw = localStorage.getItem(USER_CACHE_KEY);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(user: unknown): void {
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch {
      // Storage full or blocked: the cache is a convenience, not required.
    }
  },
} as const;
