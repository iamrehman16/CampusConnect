import "@mui/material/styles";

// BACKLOG.md D4 — typed design tokens on the MUI theme, so feature code reads
// `theme.palette.border.default` / `palette.surface.subtle` /
// `text.tertiary` / `primary.subtle` instead of hardcoding hex or alpha().

declare module "@mui/material/styles" {
  interface SurfaceTokens {
    /** Page background behind everything (same as background.default). */
    canvas: string;
    /** Cards, sidebar, top bar (same as background.paper). */
    card: string;
    /** Inset fills: hovered rows, input backgrounds, code blocks. */
    subtle: string;
    /** Menus, popovers, dialogs — the only layer that casts a shadow. */
    overlay: string;
  }

  interface BorderTokens {
    subtle: string;
    default: string;
    strong: string;
  }

  interface Palette {
    surface: SurfaceTokens;
    border: BorderTokens;
  }

  interface PaletteOptions {
    surface?: SurfaceTokens;
    border?: BorderTokens;
  }

  interface TypeText {
    /** Metadata, timestamps, helper text. Still AA on card and canvas. */
    tertiary: string;
  }

  interface PaletteColor {
    /** Tinted background for chips, badges, selected states. */
    subtle: string;
  }

  interface SimplePaletteColorOptions {
    subtle?: string;
  }

  interface Theme {
    radius: RadiusTokens;
  }

  interface ThemeOptions {
    radius?: RadiusTokens;
  }

  /** Pixel radii. `shape.borderRadius` (6) is the sx multiplier base. */
  interface RadiusTokens {
    sm: number;
    md: number;
    lg: number;
    full: number;
  }
}
