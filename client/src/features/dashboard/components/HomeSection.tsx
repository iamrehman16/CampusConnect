import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

interface HomeSectionProps {
  title: string;
  /** "See all"-style link in the header. */
  action?: { label: string; to: string };
  children: ReactNode;
  /** Remove body padding for edge-to-edge lists. */
  flush?: boolean;
}

/** A titled card on Home — every widget shares this frame. */
export function HomeSection({ title, action, children, flush }: HomeSectionProps) {
  return (
    <Card component="section" aria-label={title}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: 1.75,
          pb: flush ? 0.75 : 1,
        }}
      >
        <Typography variant="subtitle2" component="h2" fontWeight={600}>
          {title}
        </Typography>
        {action && (
          <Link
            component={RouterLink}
            to={action.to}
            underline="hover"
            variant="caption"
            fontWeight={600}
            color="text.secondary"
          >
            {action.label}
          </Link>
        )}
      </Box>
      <Box sx={flush ? { px: 0.5, pb: 1 } : { px: 2, pb: 2 }}>{children}</Box>
    </Card>
  );
}

/** Quiet one-line empty state inside a HomeSection. */
export function HomeEmpty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Box sx={{ px: 1.5, py: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
      {action && <Box sx={{ mt: 1.25 }}>{action}</Box>}
    </Box>
  );
}
