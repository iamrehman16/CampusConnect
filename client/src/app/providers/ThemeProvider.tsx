// theme/ThemeProvider.tsx
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { useThemeMode } from '@/shared/hooks/useThemeMode';
import { ThemeModeContext } from '@/shared/hooks/useThemeModeContext';
import type { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, mode, toggle } = useThemeMode();

  return (
    <ThemeModeContext.Provider value={{ mode, toggle }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${theme.shape.borderRadius}px`,
              fontFamily: theme.typography.fontFamily,
              fontSize: '0.875rem',
            },
            error: {
              iconTheme: {
                primary: theme.palette.error.main,
                secondary: theme.palette.background.paper,
            },
          },
          success: {
            iconTheme: {
              primary: theme.palette.success.main,
              secondary: theme.palette.background.paper,
            },
          },
        }}
        />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
