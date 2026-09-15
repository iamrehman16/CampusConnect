import type { Components, Theme } from '@mui/material/styles';

/**
 * Global MUI component style overrides.
 * Provides a consistent, premium feel across all components.
 */
export const componentOverrides: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 8,
        fontWeight: 600,
      },
      sizeSmall: {
        padding: '5px 14px',
        fontSize: '0.8125rem',
      },
      sizeMedium: {
        padding: '8px 20px',
      },
      sizeLarge: {
        padding: '12px 28px',
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #6C63FF 0%, #938BFF 100%)',
        boxShadow: '0 2px 8px rgba(108, 99, 255, 0.25)',
        '&:hover': {
          background: 'linear-gradient(135deg, #6C63FF 0%, #938BFF 100%)',
          boxShadow: '0 4px 12px rgba(108, 99, 255, 0.30)',
          opacity: 0.92,
        },
        '&:active': {
          boxShadow: '0 1px 4px rgba(108, 99, 255, 0.20)',
          opacity: 1,
        },
      },
      outlinedPrimary: {
        borderColor: 'rgba(108, 99, 255, 0.5)',
        '&:hover': {
          borderColor: '#6C63FF',
          backgroundColor: 'rgba(108, 99, 255, 0.06)',
        },
      },
      text: {
        '&:hover': {
          backgroundColor: 'rgba(148, 163, 184, 0.06)',
        },
      },
    },
  },

  MuiCard: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 12,
        backgroundImage: 'none',
        border: `1px solid ${theme.palette.divider}`,
      }),
    },
  },

  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'medium',
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
  },

  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
      },
    },
  },

  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },

  MuiBottomNavigation: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderTop: `1px solid ${theme.palette.divider}`,
      }),
    },
  },

  MuiBottomNavigationAction: {
    styleOverrides: {
      root: {
        minWidth: 48,
        padding: '6px 0',
        '@media (pointer: coarse)': {
          padding: '8px 0',
        },
      },
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRight: `1px solid ${theme.palette.divider}`,
      }),
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: {
        padding: 8,
        '@media (pointer: coarse)': {
          padding: 10,
        },
      },
    },
  },

  MuiTab: {
    styleOverrides: {
      root: { textTransform: 'none', fontWeight: 600 },
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        backgroundImage: 'none',
      },
    },
  },

  MuiPopover: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
    },
  },

  MuiMenu: {
    styleOverrides: {
      paper: ({ theme }) => ({
        borderRadius: 12,
        backgroundImage: 'none',
        border: '1px solid',
        borderColor: theme.palette.divider,
      }),
    },
  },

  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 4,
        fontSize: '0.75rem',
      },
    },
  },

  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        fontSize: '0.875rem',
      },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
};
