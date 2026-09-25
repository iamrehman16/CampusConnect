import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Right-aligned actions (one primary button at most). */
  actions?: ReactNode;
  /** Rendered under the title row, e.g. section tabs. */
  children?: ReactNode;
}

/**
 * Standard page header (BACKLOG.md D5): title + optional subtitle on the
 * left, actions on the right, optional tabs underneath. Use inside
 * PageContainer so every page shares spacing and type scale.
 */
export function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <Box component="header" sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h5" component="h1" fontWeight={700} sx={{ letterSpacing: "-0.01em" }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>{actions}</Box>}
      </Box>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
}
