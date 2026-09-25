import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * CampusConnect brand mark (BACKLOG.md D5): a "C" whose two ends are nodes —
 * campus + connection. One mark everywhere: sidebar, top bars, landing,
 * favicon and PWA icons (public/icons/favicon.svg uses the same geometry;
 * the PNG/ICO icons are renders of it).
 */
export const BRAND_MARK_PATH = "M21.66 10.34 A8 8 0 1 0 21.66 21.66";

export function BrandMark({ size = 28, sx }: { size?: number; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      aria-hidden
      sx={[
        { width: size, height: size, flexShrink: 0, display: "block" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box component="rect" width={32} height={32} rx={8} sx={{ fill: (t) => t.palette.primary.main }} />
      <Box
        component="path"
        d={BRAND_MARK_PATH}
        sx={{
          fill: "none",
          stroke: (t) => t.palette.primary.contrastText,
          strokeWidth: 3,
          strokeLinecap: "round",
        }}
      />
      <Box component="circle" cx={21.66} cy={10.34} r={2.4} sx={{ fill: (t) => t.palette.primary.contrastText }} />
      <Box component="circle" cx={21.66} cy={21.66} r={2.4} sx={{ fill: (t) => t.palette.primary.contrastText }} />
    </Box>
  );
}

/** Mark + wordmark, for the sidebar and marketing header. */
export function BrandLockup({ size = 28, sx }: { size?: number; sx?: SxProps<Theme> }) {
  return (
    <Box sx={[{ display: "flex", alignItems: "center", gap: 1.25 }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <BrandMark size={size} />
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize: size * 0.6, letterSpacing: "-0.01em", color: "text.primary" }}
      >
        CampusConnect
      </Typography>
    </Box>
  );
}
