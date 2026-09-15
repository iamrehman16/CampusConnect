import { useMemo, useState } from 'react';
import { createAppTheme } from '@/theme';
import type { PaletteMode } from '@mui/material';

export const useThemeMode = () => {
  const [mode, setMode] = useState<PaletteMode>(
    () => (localStorage.getItem('cc-theme') as PaletteMode) ?? 'light'
  );

  const toggle = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('cc-theme', next);
      return next;
    });
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return { theme, mode, toggle };
};
