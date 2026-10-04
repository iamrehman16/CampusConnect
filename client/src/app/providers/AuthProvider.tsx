import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/shared/api/axios.instance";
import axios from "axios";
import { tokenStorage, userCache } from "@/shared/utils/storage";
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

  // Keep the cached profile current (login, profile edits, onboarding).
  useEffect(() => {
    if (user) userCache.set(user);
  }, [user]);

  /**
   * Fetches the current user's profile from /api/users/profile.
   * Called on mount (if tokens exist) and after login.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/users/profile");
      setUser(data);
    } catch (error) {
      const rejected =
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403);
      if (rejected) {
        // The server said the session is no good — clear everything.
        console.error("Session rejected; clearing it:", error);
        tokenStorage.clearTokens();
        setUser(null);
        throw error;
      }
      // Network down, server cold-starting or a 5xx: we couldn't ask, which
      // doesn't mean the session is invalid. Keep the tokens and, if we have
      // one, run on the last known profile (read-only offline, BACKLOG.md J3).
      const cached = userCache.get<User>();
      if (cached) {
        console.warn("Profile unavailable; using the cached one:", error);
        setUser(cached);
        return;
      }
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

  // Back online after running on the cached profile: fetch the real one.
  useEffect(() => {
    const handleOnline = () => {
      if (tokenStorage.getAccessToken()) void refreshUser();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refreshUser]);

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
