import { Chip, type ChipProps } from "@mui/material";
import { StarRounded as StarRoundedIcon } from "@/shared/icons";
import { TIER_DISPLAY } from "../utils/tier-display";
import type { ReputationTier } from "../types/reputation.types";

interface Props {
  tier?: ReputationTier;
  /** Hide the lowest tier where a "Newcomer" chip would just be noise (bylines). */
  hideNewcomer?: boolean;
  sx?: ChipProps["sx"];
}

export function TierChip({ tier, hideNewcomer = false, sx }: Props) {
  if (!tier) return null;
  if (hideNewcomer && tier === "newcomer") return null;

  const { label, color, variant } = TIER_DISPLAY[tier];
  return (
    <Chip
      label={label}
      size="small"
      color={color}
      variant={variant}
      icon={tier === "star" ? <StarRoundedIcon /> : undefined}
      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, ...sx }}
    />
  );
}
