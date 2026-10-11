import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { darken, lighten, type SxProps, type Theme } from "@mui/material/styles";

/**
 * CampusConnect brand mark (BACKLOG.md D5, redrawn for the open-house demo):
 * a "C" drawn as a small graph — five people on the rim, linked to a shared
 * hub (the knowledge base). One mark everywhere: sidebar, top bars, landing,
 * favicon and PWA icons (public/icons/favicon.svg uses the same geometry;
 * the PNG/ICO icons are renders of it).
 */
const RIM_NODES = [
  { cx: 22, cy: 10, r: 2.4 },
  { cx: 13.1, cy: 8, r: 2 },
  { cx: 7.5, cy: 16, r: 2 },
  { cx: 13.1, cy: 24, r: 2 },
  { cx: 22, cy: 22, r: 2.4 },
] as const;
const HUB = { cx: 17, cy: 16, r: 2.7 } as const;
/** Rim nodes linked straight to the hub (the C's two ends stay open). */
const SPOKES = [RIM_NODES[1], RIM_NODES[2], RIM_NODES[3]] as const;
const RIM_POINTS = RIM_NODES.map((n) => `${n.cx},${n.cy}`).join(" ");
/**
 * Spokes and hub: an opaque tint between the tile and the foreground. Opaque,
 * not the foreground at reduced opacity, because translucent spokes stacked
 * over a translucent hub show visible overlap seams.
 */
const secondaryFill = (t: Theme) =>
  t.palette.mode === "dark" ? darken(t.palette.primary.main, 0.6) : lighten(t.palette.primary.main, 0.7);

export function BrandMark({ size = 28, sx }: { size?: number; sx?: SxProps<Theme> }) {
  const fg = (t: Theme) => t.palette.primary.contrastText;
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
        component="polyline"
        points={RIM_POINTS}
        sx={{ fill: "none", stroke: fg, strokeWidth: 1.6, strokeLinejoin: "round" }}
      />
      {SPOKES.map((n) => (
        <Box
          key={`${n.cx}-${n.cy}`}
          component="line"
          x1={HUB.cx}
          y1={HUB.cy}
          x2={n.cx}
          y2={n.cy}
          sx={{ stroke: secondaryFill, strokeWidth: 1.2 }}
        />
      ))}
      {RIM_NODES.map((n) => (
        <Box key={`${n.cx}-${n.cy}`} component="circle" cx={n.cx} cy={n.cy} r={n.r} sx={{ fill: fg }} />
      ))}
      <Box component="circle" cx={HUB.cx} cy={HUB.cy} r={HUB.r} sx={{ fill: secondaryFill }} />
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
