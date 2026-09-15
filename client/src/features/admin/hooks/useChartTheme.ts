// features/admin/hooks/useChartTheme.ts
import { useTheme } from '@mui/material/styles';

export const useChartTheme = () => {
  const { palette } = useTheme();
  return {
    primary: palette.primary.main,       // #6C63FF
    secondary: palette.secondary.main,   // #00D9A6
    warning: palette.warning.main,
    error: palette.error.main,
    info: palette.info.main,
    gridColor: palette.divider,
    textSecondary: palette.text.secondary,
    tooltipBg: palette.background.paper,
    tooltipBorder: palette.divider,
    // fixed palette for multi-series / donut segments
    palette: [
      palette.primary.main,
      palette.secondary.main,
      palette.warning.main,
      palette.info.main,
      palette.error.main,
      '#A78BFA',
      '#34D399',
    ],
  };
};