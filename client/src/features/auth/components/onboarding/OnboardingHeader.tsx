import { Box, LinearProgress, Typography } from "@mui/material";
import { STEPS } from "./onboarding.constants";
import { BrandLockup } from "@/shared/components/BrandMark";

interface OnboardingHeaderProps {
  activeStep: number;
}

export function OnboardingHeader({ activeStep }: OnboardingHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <BrandLockup size={30} sx={{ justifyContent: "center", mb: 3 }} />
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="body2" fontWeight={600}>
          {STEPS[activeStep]}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Step {activeStep + 1} of {STEPS.length}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={((activeStep + 1) / STEPS.length) * 100}
        aria-label="Onboarding progress"
      />
    </Box>
  );
}
