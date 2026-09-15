import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/shared/api/axios.instance";
import { tokenStorage } from "@/shared/utils/storage";
import type { User, AuthTokens, AuthState } from "@/shared/types/auth.types";

// ── Context Shape ────────────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setOnboarded: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    } catch {
      // Token might be expired/invalid — clear everything
      tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  const setOnboarded = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, isOnboarded: true } : prev));
  }, []);

  /**
   * Called after a successful login API response.
   * Stores tokens and fetches the user profile.
   */
  const login = useCallback(
    (tokens: AuthTokens) => {
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      fetchProfile();
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
        setIsLoading(false);
        return;
      }

      try {
        await fetchProfile();
      } catch (error) {
        console.error("Auth initialization failed:", error);
        tokenStorage.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout, setOnboarded }}
    >
      {children}
    </AuthContext.Provider>
  );
}
