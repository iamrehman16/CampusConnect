import type { TypographyVariantsOptions } from '@mui/material/styles';

// BACKLOG.md D1 — a serif display face on h1-h3 (page-level headings only)
// gives the brand a distinct voice instead of an all-Inter default, without
// touching the dense, high-frequency UI text (h4-h6, body, chips, buttons)
// where a serif would hurt legibility/density. Pairs with the new "paper &
// ink" / "midnight desk" palette in palette.ts.
const displayFontFamily = '"Lora", "Georgia", "Times New Roman", serif';

export const getTypography = (): TypographyVariantsOptions => ({
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontFamily: displayFontFamily,
    fontSize: '2.25rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h2: {
    fontFamily: displayFontFamily,
    fontSize: '1.875rem',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontFamily: displayFontFamily,
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: '0.9375rem',
    fontWeight: 500,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  body1: {
    fontSize: '0.9375rem',
  },
  body2: {
    fontSize: '0.875rem',
  },
  caption: {
    fontSize: '0.75rem',
  },
  button: {
    fontWeight: 600,
  },
});
