import { Box } from "@mui/material";
import type { Control } from "react-hook-form";
import { StepProfile } from "./StepProfile";
import { StepAcademic } from "./StepAcademic";
import { StepInterests } from "./StepInterests";
import { StepAvatar } from "./StepAvatar";

interface OnboardingStepContentProps {
  activeStep: number;
  control: Control<any>;
  userName: string;
}

export function OnboardingStepContent({
  activeStep,
  control,
  userName,
}: OnboardingStepContentProps) {
  return (
    <Box sx={{ minHeight: 320 }}>
      {activeStep === 0 && (
        <StepProfile control={control} userName={userName} />
      )}
      {activeStep === 1 && <StepAcademic control={control} />}
      {activeStep === 2 && <StepInterests control={control} />}
      {activeStep === 3 && <StepAvatar control={control} />}
    </Box>
  );
}
