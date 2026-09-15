import type { TypographyVariantsOptions } from '@mui/material/styles';

export const getTypography = (): TypographyVariantsOptions => ({
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.25rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.875rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  h3: {
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
