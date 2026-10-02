import { Card } from "@mui/material";
import { type ReactNode } from "react";

interface OnboardingCardProps {
  children: ReactNode;
}

export function OnboardingCard({ children }: OnboardingCardProps) {
  return <Card sx={{ p: { xs: 3, sm: 4 } }}>{children}</Card>;
}
