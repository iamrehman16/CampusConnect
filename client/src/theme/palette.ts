import type { PaletteMode } from "@mui/material";

export const getPalette = (mode: PaletteMode) =>
  mode === "dark"
    ? {
        primary: {
          main: "#6C63FF",
          light: "#938BFF",
          dark: "#4B44B2",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#00D9A6",
          light: "#33E1B8",
          dark: "#009874",
          contrastText: "#000000",
        },
        error: {
          main: "#FF6B6B",
          light: "#FF9B9B",
          dark: "#CC5555",
        },
        warning: {
          main: "#FFB347",
          light: "#FFB347",
          dark: "#CC8F39",
          contrastText: "#0A0A0A",
        },
        success: {
          main: "#4ECB71",
          light: "#7DD99A",
          dark: "#3EA259",
        },
        info: {
          main: "#54A0FF",
          light: "#82BAFF",
          dark: "#4380CC",
        },
        background: {
          default: "#0F1117",
          paper: "#1A1D27",
        },
        text: {
          primary: "#F1F5F9",
          secondary: "#94A3B8",
          disabled: "#475569",
        },
        divider: "rgba(148, 163, 184, 0.18)",
        action: {
          hover: "rgba(108, 99, 255, 0.08)",
          selected: "rgba(108, 99, 255, 0.16)",
          focus: "rgba(108, 99, 255, 0.12)",
        },
      }
    : {
        primary: {
          main: "#6C63FF",
          light: "#938BFF",
          dark: "#4B44B2",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#00B894",
          light: "#00D9A6",
          dark: "#007A65",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#E53935",
          light: "#EF5350",
          dark: "#C62828",
        },
        warning: {
          main: "#F59E0B",
          light: "#FBBF24",
          dark: "#B45309",
          contrastText: "#0A0A0A",
        },
        success: {
          main: "#10B981",
          light: "#34D399",
          dark: "#047857",
        },
        info: {
          main: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        background: {
          default: "#F4F2EF",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#0A0A0A",
          secondary: "#5E6778",
          disabled: "#9BA3AF",
        },
        divider: "rgba(0, 0, 0, 0.14)",
        action: {
          hover: "rgba(108, 99, 255, 0.06)",
          selected: "rgba(108, 99, 255, 0.12)",
          focus: "rgba(108, 99, 255, 0.10)",
        },
      };
