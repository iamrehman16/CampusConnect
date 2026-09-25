import { Box, Typography } from "@mui/material";
import { STEPS } from "./onboarding.constants";

interface OnboardingHeaderProps {
  activeStep: number;
}

export function OnboardingHeader({ activeStep }: OnboardingHeaderProps) {

  return (
    <Box sx={{ mb: 4, textAlign: "center" }}>
      <Typography
        variant="h6"
        fontWeight={800}
        color="primary.main"
        sx={{ mb: 0.5 }}
      >
        CampusConnect
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Step {activeStep + 1} of {STEPS.length}
      </Typography>
    </Box>
  );
}
