import { Step, StepLabel, Stepper } from "@mui/material";
import { STEPS } from "./onboarding.constants";

interface OnboardingStepperProps {
  activeStep: number;
}

export function OnboardingStepper({ activeStep }: OnboardingStepperProps) {
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
      {STEPS.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
