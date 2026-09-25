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
    // BACKLOG.md D4 — `sx={{ borderRadius: n }}` multiplies this base. It
    // was 12, which turned the common `borderRadius: 3` into 36px pills;
    // at 6 the existing 1/2/3 values land on the sm/md/lg scale below.
    shape: {
      borderRadius: 6,
    },
    radius: { sm: 6, md: 10, lg: 14, full: 9999 },
    components: componentOverrides,
  });

  theme = responsiveFontSizes(theme, { factor: 2.5 });
  return theme;
};
