import { Box, Button, useTheme } from "@mui/material";
import { STEPS } from "./onboarding.constants";

interface OnboardingNavigationProps {
  activeStep: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function OnboardingNavigation({
  activeStep,
  onBack,
  onNext,
  onSubmit,
  isPending,
}: OnboardingNavigationProps) {
  const theme = useTheme();
  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mt: 4,
        pt: 3,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Button
        onClick={onBack}
        disabled={activeStep === 0}
        variant="text"
        color="inherit"
      >
        Back
      </Button>

      {!isLastStep ? (
        <Button onClick={onNext} variant="contained">
          Continue
        </Button>
      ) : (
        <Button onClick={onSubmit} variant="contained" disabled={isPending}>
          {isPending ? "Setting up..." : "Get Started"}
        </Button>
      )}
    </Box>
  );
}
