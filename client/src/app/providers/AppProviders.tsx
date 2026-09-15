import type { ReactNode } from "react";
import QueryProvider from "./QueryProvider";
import ThemeProvider from "./ThemeProvider";
import AuthProvider from "./AuthProvider";
import { ChatSocketProvider } from "./ChatSocketProvider";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composes all application-level providers in the correct order.
 *
 * Order matters:
 * 1. QueryProvider — data layer (outermost)
 * 2. ThemeProvider — MUI theming
 * 3. AuthProvider — depends on QueryProvider for cache clearing
 */
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ChatSocketProvider>{children}</ChatSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
