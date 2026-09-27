import type { ReactNode } from "react";
import { Box, Card, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { BrandLockup } from "@/shared/components/BrandMark";
import { ROUTES } from "@/shared/constants/routes";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Line under the card, e.g. "New here? Create an account". */
  footer: ReactNode;
}

/**
 * Focused sign-in / sign-up frame (BACKLOG.md D10): logo, one card, one
 * way out. Sign-in providers (F3's Google button) go at the top of
 * `children`, above the email form.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "surface.canvas",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        py: { xs: 4, sm: 8 },
      }}
    >
      <Link component={RouterLink} to={ROUTES.AUTH} underline="none" aria-label="CampusConnect home" sx={{ mb: 4 }}>
        <BrandLockup size={32} />
      </Link>
      <Card sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Typography variant="h5" component="h1" fontWeight={700} sx={{ fontFamily: "inherit", letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {subtitle}
        </Typography>
        {children}
      </Card>
      <Stack sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {footer}
        </Typography>
      </Stack>
    </Box>
  );
}
