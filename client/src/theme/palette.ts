import type { PaletteMode, PaletteOptions } from "@mui/material";

// BACKLOG.md D4 — "warm neutral". Replaces the D1 cream "paper & ink" mood,
// whose canvas, sidebar and cards were near-identical beiges, so nothing
// separated layers. Now: terracotta is the one brand accent, used sparingly
// (primary actions, active nav, focus); everything else is warm-grey
// neutrals with a clear surface stack:
//
//   canvas (background.default) < card (background.paper) ; subtle = hover/
//   inset fill ; overlay = menus/dialogs (the only layer with a shadow).
//
// Borders carry the structure (flat UI), in three strengths. Error is a
// crimson, deliberately far from the terracotta brand hue so a destructive
// state never reads as "brand".
//
// Contrast (WCAG relative luminance, computed, not eyeballed) — light:
// text 17.5:1, secondary 7.6:1, tertiary 5.3:1 on card / 4.8:1 on canvas,
// accent 5.0:1 on card and white-on-accent 5.0:1, semantic colours >= 4.9:1.
// Dark: text 14.6:1, secondary 7.8:1, tertiary 4.8:1, accent 6.8:1,
// dark-on-accent 7.4:1, semantic colours >= 6.4:1.

export const getPalette = (mode: PaletteMode): PaletteOptions =>
  mode === "dark"
    ? {
        primary: {
          main: "#E38D5D",
          light: "#EDA67D",
          dark: "#C9713F",
          contrastText: "#1A0F08",
          subtle: "rgba(227, 141, 93, 0.14)",
        },
        secondary: {
          main: "#B3AEA7",
          light: "#CFCBC5",
          dark: "#8C8781",
          contrastText: "#141312",
          subtle: "rgba(179, 174, 167, 0.12)",
        },
        error: {
          main: "#F07A85",
          light: "#F5A0A8",
          dark: "#D9505E",
          contrastText: "#1A0A0C",
          subtle: "rgba(240, 122, 133, 0.14)",
        },
        warning: {
          main: "#E0A948",
          light: "#EAC27A",
          dark: "#C38B2A",
          contrastText: "#1A1206",
          subtle: "rgba(224, 169, 72, 0.14)",
        },
        success: {
          main: "#5BBF8A",
          light: "#86D2A9",
          dark: "#3F9E6C",
          contrastText: "#07170E",
          subtle: "rgba(91, 191, 138, 0.14)",
        },
        info: {
          main: "#79A8E8",
          light: "#A1C1EF",
          dark: "#5285CC",
          contrastText: "#07111F",
          subtle: "rgba(121, 168, 232, 0.14)",
        },
        background: {
          default: "#141312",
          paper: "#1C1B19",
        },
        surface: {
          canvas: "#141312",
          card: "#1C1B19",
          subtle: "#242220",
          overlay: "#232120",
        },
        text: {
          primary: "#EEECE8",
          secondary: "#B3AEA7",
          tertiary: "#8C8781",
          disabled: "#5E5A55",
        },
        border: {
          subtle: "#262422",
          default: "#34312E",
          strong: "#48443F",
        },
        divider: "#2C2A27",
        action: {
          hover: "rgba(238, 236, 232, 0.06)",
          selected: "rgba(227, 141, 93, 0.14)",
          focus: "rgba(227, 141, 93, 0.24)",
        },
      }
    : {
        primary: {
          main: "#B4531F",
          light: "#CC7447",
          dark: "#9A4418",
          contrastText: "#FFFFFF",
          subtle: "#FBEFE7",
        },
        // Secondary is a neutral, not a second brand colour: the old
        // forest-teal competed with the accent on every screen.
        secondary: {
          main: "#57534E",
          light: "#78716C",
          dark: "#3F3B37",
          contrastText: "#FFFFFF",
          subtle: "#F0EEEA",
        },
        error: {
          main: "#C0303F",
          light: "#D65A67",
          dark: "#9C2331",
          contrastText: "#FFFFFF",
          subtle: "#FCECEE",
        },
        warning: {
          main: "#9A6512",
          light: "#C28A2E",
          dark: "#7A4F0C",
          contrastText: "#FFFFFF",
          subtle: "#FBF3E4",
        },
        success: {
          main: "#2F7D57",
          light: "#4E9A74",
          dark: "#236243",
          contrastText: "#FFFFFF",
          subtle: "#E9F5EE",
        },
        info: {
          main: "#2F63A8",
          light: "#5584C2",
          dark: "#234C83",
          contrastText: "#FFFFFF",
          subtle: "#EAF1FA",
        },
        background: {
          default: "#F5F4F1",
          paper: "#FFFFFF",
        },
        surface: {
          canvas: "#F5F4F1",
          card: "#FFFFFF",
          subtle: "#F0EEEA",
          overlay: "#FFFFFF",
        },
        text: {
          primary: "#1C1917",
          secondary: "#57534E",
          tertiary: "#716A64",
          disabled: "#A8A29E",
        },
        border: {
          subtle: "#EEECE8",
          default: "#E2DFDA",
          strong: "#CFCAC3",
        },
        divider: "#E8E5E0",
        action: {
          hover: "rgba(28, 25, 23, 0.04)",
          selected: "rgba(180, 83, 31, 0.08)",
          focus: "rgba(180, 83, 31, 0.16)",
        },
      };
