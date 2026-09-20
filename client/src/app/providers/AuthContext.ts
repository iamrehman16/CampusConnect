import { createContext } from "react";
import type { AuthTokens, AuthState } from "@/shared/types/auth.types";

interface AuthContextValue extends AuthState {
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setOnboarded: () => void;
  /** Re-fetch the profile (e.g. after a role change made by an admin). */
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
