import { Box, Typography } from "@mui/material";
import { STEPS } from "./onboarding.constants";

interface OnboardingStepperProps {
  activeStep: number;
}

/** Segmented progress bar: completed + current segments filled. */
export function OnboardingStepper({ activeStep }: OnboardingStepperProps) {
  return (
    <Box
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-valuenow={activeStep + 1}
      aria-label={`Step ${activeStep + 1} of ${STEPS.length}: ${STEPS[activeStep]}`}
      sx={{ mb: 3 }}
    >
      <Box sx={{ display: "flex", gap: 0.75 }}>
        {STEPS.map((label, i) => (
          <Box
            key={label}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              bgcolor: i <= activeStep ? "primary.main" : "divider",
              transition: "background-color 0.2s",
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 0.75, mt: 1 }}>
        {STEPS.map((label, i) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              flex: 1,
              fontWeight: i === activeStep ? 700 : 500,
              color: i === activeStep ? "text.primary" : "text.secondary",
              display: { xs: i === activeStep ? "block" : "none", sm: "block" },
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
