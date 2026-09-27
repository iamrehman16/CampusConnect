import { Box } from "@mui/material";

interface ProductShotProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Above-the-fold images load eagerly. */
  eager?: boolean;
}

/** A real product screenshot in a light window frame. */
export function ProductShot({ src, alt, width, height, eager }: ProductShotProps) {
  return (
    <Box
      sx={(t) => ({
        borderRadius: `${t.radius.lg}px`,
        border: "1px solid",
        borderColor: "border.default",
        bgcolor: "surface.card",
        overflow: "hidden",
        boxShadow: t.palette.mode === "dark" ? "none" : "0 12px 32px -12px rgba(28, 25, 23, 0.18)",
      })}
    >
      <Box sx={{ display: "flex", gap: 0.75, px: 1.5, py: 1, borderBottom: "1px solid", borderColor: "border.subtle" }} aria-hidden>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "border.default" }} />
        ))}
      </Box>
      <Box
        component="img"
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        sx={{ display: "block", width: "100%", height: "auto" }}
      />
    </Box>
  );
}
