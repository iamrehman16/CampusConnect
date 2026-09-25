import { alpha, type Components, type Theme } from '@mui/material/styles';

/**
 * Global MUI component overrides — BACKLOG.md D4 "warm neutral", flat.
 *
 * Rules applied everywhere:
 * - Structure comes from 1px borders (`palette.border.*`), not shadows.
 *   Only floating layers (menus, popovers, dialogs, snackbars) get a shadow.
 * - No gradients.
 * - Radii come from `theme.radius` (sm 6 / md 10 / lg 14 / full).
 * - The accent (primary) marks the one primary action per view, active nav
 *   and focus; everything else is neutral.
 */
const overlayShadow = (theme: Theme) =>
  theme.palette.mode === 'dark'
    ? '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)'
    : '0 8px 24px rgba(28, 25, 23, 0.10), 0 2px 6px rgba(28, 25, 23, 0.05)';

const focusRing = (theme: Theme) => ({
  outline: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
  outlineOffset: 2,
});

export const componentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      body: { backgroundColor: theme.palette.surface.canvas },
      '::selection': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
    }),
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  MuiButtonBase: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: ({ theme }) => ({ '&.Mui-focusVisible': focusRing(theme) }),
    },
  },

  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: 'none',
        borderRadius: theme.radius.sm,
        fontWeight: 600,
        letterSpacing: 0,
        transition: theme.transitions.create(
          ['background-color', 'border-color', 'color'],
          { duration: theme.transitions.duration.shortest },
        ),
      }),
      sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem', minHeight: 32 },
      sizeMedium: { padding: '7px 16px', minHeight: 38 },
      sizeLarge: { padding: '10px 22px', fontSize: '0.9375rem', minHeight: 46 },
      contained: ({ theme }) => ({
        '&:hover': { backgroundColor: theme.palette.primary.dark },
      }),
      containedError: ({ theme }) => ({
        '&:hover': { backgroundColor: theme.palette.error.dark },
      }),
      // Secondary button: neutral outline, not accent-coloured.
      outlined: ({ theme }) => ({
        borderColor: theme.palette.border.default,
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.surface.card,
        '&:hover': {
          borderColor: theme.palette.border.strong,
          backgroundColor: theme.palette.surface.subtle,
        },
      }),
      outlinedError: ({ theme }) => ({
        color: theme.palette.error.main,
        '&:hover': { backgroundColor: theme.palette.error.subtle },
      }),
      text: ({ theme }) => ({
        '&:hover': { backgroundColor: theme.palette.action.hover },
      }),
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.sm,
        padding: 8,
        color: theme.palette.text.secondary,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,
        },
        '@media (pointer: coarse)': { padding: 10 },
      }),
      sizeSmall: { padding: 6 },
    },
  },

  MuiFab: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: ({ theme }) => ({ boxShadow: overlayShadow(theme) }),
    },
  },

  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: 'none',
        fontWeight: 600,
        borderColor: theme.palette.border.default,
        color: theme.palette.text.secondary,
        '&.Mui-selected': {
          backgroundColor: theme.palette.surface.subtle,
          color: theme.palette.text.primary,
          '&:hover': { backgroundColor: theme.palette.surface.subtle },
        },
      }),
    },
  },

  // ── Surfaces ─────────────────────────────────────────────────────────────
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: { backgroundImage: 'none' },
      outlined: ({ theme }) => ({ borderColor: theme.palette.border.default }),
    },
  },

  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.md,
        backgroundImage: 'none',
        backgroundColor: theme.palette.surface.card,
        border: `1px solid ${theme.palette.border.default}`,
        boxShadow: 'none',
      }),
    },
  },

  MuiCardActionArea: {
    styleOverrides: {
      focusHighlight: { display: 'none' },
    },
  },

  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'inherit' },
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.surface.card,
        borderBottom: `1px solid ${theme.palette.border.default}`,
      }),
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.surface.card,
        borderRight: `1px solid ${theme.palette.border.default}`,
        backgroundImage: 'none',
      }),
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.radius.lg,
        backgroundImage: 'none',
        backgroundColor: theme.palette.surface.overlay,
        boxShadow: overlayShadow(theme),
      }),
    },
  },

  MuiDialogTitle: {
    styleOverrides: { root: { fontSize: '1.0625rem', fontWeight: 600 } },
  },

  MuiPopover: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.radius.md,
        backgroundImage: 'none',
        backgroundColor: theme.palette.surface.overlay,
        border: `1px solid ${theme.palette.border.default}`,
        boxShadow: overlayShadow(theme),
      }),
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: theme.radius.md,
        backgroundImage: 'none',
        border: `1px solid ${theme.palette.border.default}`,
        boxShadow: overlayShadow(theme),
      }),
      list: { padding: 4 },
    },
  },

  MuiMenuItem: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.sm,
        fontSize: '0.875rem',
        minHeight: 36,
      }),
    },
  },

  MuiTooltip: {
    defaultProps: { arrow: false, enterDelay: 400 },
    styleOverrides: {
      tooltip: ({ theme }) => ({
        borderRadius: theme.radius.sm,
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: theme.palette.mode === 'dark' ? '#EEECE8' : '#1C1917',
        color: theme.palette.mode === 'dark' ? '#1C1917' : '#FFFFFF',
      }),
    },
  },

  MuiSnackbarContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.md,
        boxShadow: overlayShadow(theme),
      }),
    },
  },

  // ── Inputs ───────────────────────────────────────────────────────────────
  MuiTextField: {
    defaultProps: { variant: 'outlined', size: 'small' },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.sm,
        backgroundColor: theme.palette.surface.card,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.border.default,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.border.strong,
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }),
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({ color: theme.palette.text.secondary }),
    },
  },

  MuiSelect: {
    defaultProps: { size: 'small' },
  },

  MuiSwitch: {
    styleOverrides: {
      track: ({ theme }) => ({
        backgroundColor: theme.palette.border.strong,
        opacity: 1,
      }),
    },
  },

  // ── Data display ─────────────────────────────────────────────────────────
  // Two chip styles: default = quiet neutral tag; color="primary" etc. =
  // tinted `subtle` background with the colour as text. No outlined borders
  // in bright colours, no filled saturated chips.
  MuiChip: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.sm,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
      }),
      filled: ({ theme }) => ({
        backgroundColor: theme.palette.surface.subtle,
        color: theme.palette.text.secondary,
      }),
      outlined: ({ theme }) => ({
        borderColor: theme.palette.border.default,
        color: theme.palette.text.secondary,
      }),
      colorPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.subtle,
        color: theme.palette.primary.dark,
        borderColor: 'transparent',
      }),
      colorSuccess: ({ theme }) => ({
        backgroundColor: theme.palette.success.subtle,
        color: theme.palette.success.main,
        borderColor: 'transparent',
      }),
      colorWarning: ({ theme }) => ({
        backgroundColor: theme.palette.warning.subtle,
        color: theme.palette.warning.main,
        borderColor: 'transparent',
      }),
      colorError: ({ theme }) => ({
        backgroundColor: theme.palette.error.subtle,
        color: theme.palette.error.main,
        borderColor: 'transparent',
      }),
      colorInfo: ({ theme }) => ({
        backgroundColor: theme.palette.info.subtle,
        color: theme.palette.info.main,
        borderColor: 'transparent',
      }),
      label: { paddingLeft: 8, paddingRight: 8 },
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 600,
        fontSize: '0.875rem',
        backgroundColor: theme.palette.surface.subtle,
        color: theme.palette.text.secondary,
      }),
    },
  },

  MuiBadge: {
    styleOverrides: {
      badge: { fontWeight: 600, fontSize: '0.6875rem', minWidth: 18, height: 18 },
    },
  },

  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({ borderColor: theme.palette.divider }),
    },
  },

  MuiAlert: {
    styleOverrides: {
      root: ({ theme }) => ({ borderRadius: theme.radius.md }),
    },
  },

  MuiSkeleton: {
    styleOverrides: {
      root: ({ theme }) => ({ backgroundColor: theme.palette.surface.subtle }),
      rounded: ({ theme }) => ({ borderRadius: theme.radius.sm }),
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.full,
        backgroundColor: theme.palette.surface.subtle,
      }),
      bar: ({ theme }) => ({ borderRadius: theme.radius.full }),
    },
  },

  // ── Navigation ───────────────────────────────────────────────────────────
  MuiTabs: {
    styleOverrides: {
      root: ({ theme }) => ({
        minHeight: 40,
        borderBottom: `1px solid ${theme.palette.border.default}`,
      }),
      indicator: { height: 2 },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: ({ theme }) => ({
        textTransform: 'none',
        fontWeight: 600,
        minHeight: 40,
        padding: '8px 12px',
        minWidth: 0,
        color: theme.palette.text.secondary,
        '&.Mui-selected': { color: theme.palette.text.primary },
      }),
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: theme.radius.sm,
        '&.Mui-selected': {
          backgroundColor: theme.palette.primary.subtle,
          '&:hover': { backgroundColor: theme.palette.primary.subtle },
        },
      }),
    },
  },

  MuiBottomNavigation: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.surface.card,
        borderTop: `1px solid ${theme.palette.border.default}`,
      }),
    },
  },

  MuiBottomNavigationAction: {
    styleOverrides: {
      root: ({ theme }) => ({
        minWidth: 48,
        padding: '6px 0',
        color: theme.palette.text.tertiary,
        '&.Mui-selected': { color: theme.palette.primary.main },
        '@media (pointer: coarse)': { padding: '8px 0' },
      }),
      label: { fontSize: '0.6875rem', '&.Mui-selected': { fontSize: '0.6875rem' } },
    },
  },
};
