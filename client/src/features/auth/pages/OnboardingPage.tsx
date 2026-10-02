import { useState } from "react";
import { Box, Container } from "@mui/material";
import { useForm } from "react-hook-form";
import { useCompleteOnboarding } from "../hooks/useCompleteOnboarding";
import type { CompleteOnboardingRequest } from "../types/auth.dto";
import { useAuth } from "@/shared/hooks/useAuth";

import {
  OnboardingHeader,
  OnboardingStepper,
  OnboardingCard,
  OnboardingStepContent,
  OnboardingNavigation,
} from "../components/onboarding";

// ── Types ────────────────────────────────────────────────────────────

export type FormValues = CompleteOnboardingRequest & {
  displayName: string;
  bio: string;
};

// Steps with no required fields (Interests & Expertise).
const OPTIONAL_STEPS = new Set([2]);

// ── Main Page ────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user } = useAuth();
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();
  const [activeStep, setActiveStep] = useState(0);

  const { control, handleSubmit, trigger } = useForm<FormValues>({
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

  const handleSkip = () => setActiveStep((s) => s + 1);

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
        bgcolor: "surface.canvas",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <OnboardingHeader activeStep={activeStep} />

        {/* Stepper */}
        <OnboardingStepper activeStep={activeStep} />

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
              onSubmit={handleSubmit(onSubmit)}
              onSkip={OPTIONAL_STEPS.has(activeStep) ? handleSkip : undefined}
              isPending={isPending}
            />
          </form>
        </OnboardingCard>

      </Container>
    </Box>
  );
}
