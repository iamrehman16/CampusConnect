import { Box,type Theme,type SxProps } from "@mui/material";
import { type ReactNode } from "react";

export function PageContainer({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      sx={[
        { height: "100%", overflowY: "auto" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}