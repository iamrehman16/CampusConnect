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
  },
} as const;
