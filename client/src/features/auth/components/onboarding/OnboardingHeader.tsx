import { Box, Typography, useTheme } from "@mui/material";
import { STEPS } from "./onboarding.constants";

interface OnboardingHeaderProps {
  activeStep: number;
}

export function OnboardingHeader({ activeStep }: OnboardingHeaderProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4, textAlign: "center" }}>
      <Typography
        variant="h6"
        fontWeight={800}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 0.5,
        }}
      >
        CampusConnect
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Step {activeStep + 1} of {STEPS.length}
      </Typography>
    </Box>
  );
}
