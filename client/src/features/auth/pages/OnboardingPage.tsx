import { useState } from "react";
import { Box, Container, useTheme } from "@mui/material";
import { useForm } from "react-hook-form";
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding";
import type { CompleteOnboardingRequest } from "../types/auth.dto";
import { useAuth } from "@/shared/hooks/useAuth";

import {
  OnboardingHeader,
  OnboardingCard,
  OnboardingStepContent,
  OnboardingNavigation,
  OPTIONAL_STEPS,
  STEPS,
} from "../components/onboarding";

// ── Types ────────────────────────────────────────────────────────────

export type FormValues = CompleteOnboardingRequest & {
  displayName: string;
  bio: string;
};

// ── Main Page ────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();
  const [activeStep, setActiveStep] = useState(0);

  const { control, handleSubmit, trigger, resetField } = useForm<FormValues>({
    defaultValues: {
      displayName: user?.name ?? "",
      bio: "",
      department: "",
      semester: undefined,
      interests: [],
      expertise: [],
      avatar: "",
      isOpenToMentor: false,
    },
  });

  // Fields to validate per step before advancing
  const STEP_FIELDS: (keyof FormValues)[][] = [
    ["displayName"],
    ["department", "semester"],
    [], // interests/expertise optional
    ["avatar"],
  ];

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[activeStep]);
    if (valid) setActiveStep((s) => s + 1);
  };

  // Skipping discards anything half-entered on an optional step.
  const handleSkip = () => {
    if (!OPTIONAL_STEPS.has(activeStep)) return;
    if (activeStep === 2) {
      resetField("interests", { defaultValue: [] });
      resetField("expertise", { defaultValue: [] });
      resetField("isOpenToMentor", { defaultValue: false });
    }
    if (activeStep === 3) resetField("avatar", { defaultValue: "" });
    if (activeStep === STEPS.length - 1) void handleSubmit(onSubmit)();
    else setActiveStep((s) => s + 1);
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const onSubmit = (values: FormValues) => {
    const { displayName, bio, ...rest } = values;
    completeOnboarding({
      ...rest,
      name: displayName,
      academicInfo: bio,
    } as CompleteOnboardingRequest);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.palette.background.default,
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <OnboardingHeader activeStep={activeStep} />

        {/* Card */}
        <OnboardingCard>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Step content */}
            <OnboardingStepContent
              activeStep={activeStep}
              control={control}
              userName={user?.name ?? "there"}
            />

            {/* Navigation */}
            <OnboardingNavigation
              activeStep={activeStep}
              onBack={handleBack}
              onNext={handleNext}
              onSkip={handleSkip}
              onSubmit={handleSubmit(onSubmit)}
              isPending={isPending}
            />
          </form>
        </OnboardingCard>

      </Container>
    </Box>
  );
}
