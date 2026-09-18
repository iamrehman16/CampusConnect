import { createContext } from "react";
import type { AuthTokens, AuthState } from "@/shared/types/auth.types";

interface AuthContextValue extends AuthState {
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setOnboarded: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
