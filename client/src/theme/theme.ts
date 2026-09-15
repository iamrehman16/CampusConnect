import { createTheme } from '@mui/material/styles';
import { getPalette } from './palette';
import { componentOverrides } from './components';

const palette = getPalette('dark');

/**
 * Application MUI theme.
 * Dark-mode-first with Inter font, custom palette, and component overrides.
 */
const theme = createTheme({
  palette: {
    mode: 'dark',
    ...palette,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: palette.text.secondary },
    button: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: componentOverrides,
});

export default theme;
