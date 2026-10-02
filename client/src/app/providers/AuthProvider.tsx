import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/shared/api/axios.instance";
import { tokenStorage } from "@/shared/utils/storage";
import type { User, AuthTokens } from "@/shared/types/auth.types";
import { AuthContext } from "./AuthContext";

// ── Provider ─────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // Whether we're loading is knowable synchronously at first render: if
  // there's no stored token there's nothing to fetch, so start non-loading
  // instead of flashing true->false once the effect below fires.
  const [isLoading, setIsLoading] = useState(
    () => !!tokenStorage.getAccessToken(),
  );
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  /**
   * Fetches the current user's profile from /api/users/profile.
   * Called on mount (if tokens exist) and after login.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/users/profile");
      setUser(data);
    } catch (error) {
      // Token might be expired/invalid — clear everything
      console.error("Failed to fetch profile; clearing session:", error);
      tokenStorage.clearTokens();
      setUser(null);
      throw error;
    }
  }, []);

  /** Non-throwing variant for background refreshes (failure already logged). */
  const refreshUser = useCallback(async () => {
    try {
      await fetchProfile();
    } catch {
      // fetchProfile already logged and cleared the session.
    }
  }, [fetchProfile]);

  const setOnboarded = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, isOnboarded: true } : prev));
  }, []);

  /**
   * Called after a successful login API response.
   * Stores tokens and fetches the user profile. Resolves only once the
   * profile is loaded (so callers can navigate safely); rejects if it fails.
   */
  const login = useCallback(
    async (tokens: AuthTokens) => {
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      setIsLoading(true);
      try {
        await fetchProfile();
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfile],
  );

  /**
   * Clears auth state and redirects to login.
   */
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/signout");
    } catch {
      // Silent fail — we're logging out anyway
    }
    tokenStorage.clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // ── Bootstrap: check stored tokens on mount ──────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();

      if (!accessToken) {
        // isLoading is already false — computed in the initializer above.
        return;
      }

      try {
        await fetchProfile();
      } catch {
        // fetchProfile already logged and cleared the session.
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setOnboarded,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
