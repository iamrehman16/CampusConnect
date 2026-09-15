import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { getPalette } from './palette';
import { getTypography } from './typography';
import { componentOverrides } from './components';

export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme({
    palette: {
      mode,
      ...getPalette(mode),
    },
    typography: getTypography(),
    shape: {
      borderRadius: 12,
    },
    components: componentOverrides,
  });

  theme = responsiveFontSizes(theme, { factor: 2.5 });
  return theme;
};
