import type { PaletteMode } from "@mui/material";

// BACKLOG.md D1 — light and dark used to be the same primary (#6C63FF) at
// two lightness values, which reads as an auto-inverted default rather than
// a considered brand. Two distinct moods instead, each with its own hue
// pairing (not just the other's colors darkened/lightened):
//
// Light ("paper & ink") — warm clay/terracotta primary on a warm cream
// paper, cooled by a deep forest-teal secondary. Reads academic: ink on a
// page, a highlighter accent, not a SaaS-purple template.
//
// Dark ("midnight desk") — cool indigo primary on a near-black blue-slate,
// warmed by an amber "desk lamp" secondary. The primary hue itself changes
// between modes (clay -> indigo), not just its lightness.
export const getPalette = (mode: PaletteMode) =>
  mode === "dark"
    ? {
        primary: {
          main: "#5266D6",
          light: "#8C98F0",
          dark: "#3C4AAD",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#F0A857",
          light: "#F5C388",
          dark: "#C2823D",
          contrastText: "#1A1206",
        },
        error: {
          main: "#FF6B6B",
          light: "#FF9B9B",
          dark: "#CC5555",
        },
        warning: {
          main: "#D6A62A",
          light: "#E8C468",
          dark: "#A87F1E",
          contrastText: "#1A1206",
        },
        success: {
          main: "#4ECB8E",
          light: "#7DD9AC",
          dark: "#3EA271",
        },
        info: {
          main: "#54A0FF",
          light: "#82BAFF",
          dark: "#4380CC",
        },
        background: {
          default: "#12141C",
          paper: "#1B1E29",
        },
        text: {
          primary: "#F2F0EA",
          secondary: "#A6ADBB",
          disabled: "#5B6272",
        },
        divider: "rgba(166, 173, 187, 0.16)",
        action: {
          hover: "rgba(82, 102, 214, 0.08)",
          selected: "rgba(82, 102, 214, 0.16)",
          focus: "rgba(82, 102, 214, 0.12)",
        },
      }
    : {
        primary: {
          main: "#B5541F",
          light: "#D98A5C",
          dark: "#8A3E15",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#2F6F62",
          light: "#5C9C8D",
          dark: "#1D4A40",
          contrastText: "#FFFFFF",
        },
        error: {
          main: "#B33951",
          light: "#CC6B82",
          dark: "#832639",
        },
        warning: {
          main: "#C98A1F",
          light: "#DFAE5C",
          dark: "#8F6314",
          contrastText: "#2A2420",
        },
        success: {
          main: "#3F7D5C",
          light: "#6FA688",
          dark: "#2B5940",
        },
        info: {
          main: "#3B7A9E",
          light: "#69A2C2",
          dark: "#295A78",
        },
        background: {
          default: "#F6F1E9",
          paper: "#FFFCF7",
        },
        text: {
          primary: "#2A2420",
          secondary: "#6B6259",
          disabled: "#9C9284",
        },
        divider: "rgba(42, 36, 32, 0.13)",
        action: {
          hover: "rgba(181, 84, 31, 0.06)",
          selected: "rgba(181, 84, 31, 0.12)",
          focus: "rgba(181, 84, 31, 0.10)",
        },
      };
