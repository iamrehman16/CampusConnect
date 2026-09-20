import type { ChipProps } from "@mui/material";
import type { ReputationTier } from "../types/reputation.types";

interface TierDisplay {
  label: string;
  color: ChipProps["color"];
  variant: ChipProps["variant"];
}

// Presentation only. Exhaustive over ReputationTier, so a new tier added to the
// type without a display entry fails to compile here.
export const TIER_DISPLAY: Record<ReputationTier, TierDisplay> = {
  newcomer: { label: "Newcomer", color: "default", variant: "outlined" },
  regular: { label: "Regular", color: "secondary", variant: "outlined" },
  trusted: { label: "Trusted", color: "primary", variant: "outlined" },
  star: { label: "Star", color: "primary", variant: "filled" },
};
