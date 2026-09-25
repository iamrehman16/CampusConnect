import { Box, Typography } from "@mui/material";
import { STEPS } from "./onboarding.constants";
import { BrandLockup } from "@/shared/components/BrandMark";

interface OnboardingHeaderProps {
  activeStep: number;
}

export function OnboardingHeader({ activeStep }: OnboardingHeaderProps) {

  return (
    <Box sx={{ mb: 4, textAlign: "center" }}>
      <BrandLockup size={30} sx={{ justifyContent: "center", mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Step {activeStep + 1} of {STEPS.length}
      </Typography>
    </Box>
  );
}
