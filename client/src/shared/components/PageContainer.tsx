import { Box, type Theme, type SxProps } from "@mui/material";
import { type ReactNode } from "react";

/** Content widths (BACKLOG.md D5): text-heavy pages read best narrow. */
const WIDTHS = {
  narrow: 760,
  default: 1120,
  wide: 1360,
} as const;

/**
 * Scroll container for a page. With `width`, also centres the content at a
 * standard max width with standard padding — the shared page frame that
 * pairs with PageHeader. Without it, the page manages its own layout (the
 * pre-D5 behaviour, still used by full-bleed pages like chat).
 */
export function PageContainer({
  children,
  sx,
  width,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
  width?: keyof typeof WIDTHS;
}) {
  return (
    <Box
      sx={[
        { height: "100%", overflowY: "auto" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {width ? (
        <Box
          sx={{
            maxWidth: WIDTHS[width],
            mx: "auto",
            px: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 2, md: 4 },
            pb: { xs: 4, md: 6 },
          }}
        >
          {children}
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}
