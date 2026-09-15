import { Box, useTheme } from "@mui/material";
import { type ReactNode } from "react";

interface OnboardingCardProps {
  children: ReactNode;
}

export function OnboardingCard({ children }: OnboardingCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: theme.palette.background.paper,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        p: { xs: 3, sm: 4 },
      }}
    >
      {children}
    </Box>
  );
}
