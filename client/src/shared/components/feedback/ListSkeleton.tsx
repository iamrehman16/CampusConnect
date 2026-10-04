import { Box, Skeleton, Stack } from "@mui/material";

interface ListSkeletonProps {
  /** Number of placeholder rows. */
  count?: number;
  /** Show a round avatar placeholder at the start of each row. */
  avatar?: boolean;
  /** Tighter rows for popovers and side panes. */
  compact?: boolean;
}

/**
 * Placeholder rows shown while a list loads (BACKLOG.md J1), shaped like the
 * final rows so nothing jumps when data arrives. Use instead of a centered
 * spinner for any list or table.
 */
export function ListSkeleton({ count = 5, avatar = true, compact }: ListSkeletonProps) {
  const avatarSize = compact ? 32 : 40;
  return (
    <Stack spacing={compact ? 1.25 : 2} aria-busy="true" aria-label="Loading" sx={{ py: compact ? 1 : 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {avatar && <Skeleton variant="circular" width={avatarSize} height={avatarSize} sx={{ flexShrink: 0 }} />}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width={`${55 + ((i * 17) % 30)}%`} />
            <Skeleton variant="text" width={`${30 + ((i * 13) % 25)}%`} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

/** Alternating message bubbles for a conversation that is still loading. */
export function MessagesSkeleton() {
  const rows: Array<{ mine: boolean; width: string; height: number }> = [
    { mine: true, width: "45%", height: 40 },
    { mine: false, width: "75%", height: 96 },
    { mine: true, width: "35%", height: 40 },
    { mine: false, width: "65%", height: 72 },
  ];
  return (
    <Stack
      spacing={2.5}
      aria-busy="true"
      aria-label="Loading messages"
      sx={{ width: "100%", maxWidth: 760, mx: "auto", px: { xs: 1.75, sm: 3 }, py: 3 }}
    >
      {rows.map((r, i) => (
        <Box key={i} sx={{ display: "flex", justifyContent: r.mine ? "flex-end" : "flex-start" }}>
          <Skeleton variant="rounded" width={r.width} height={r.height} />
        </Box>
      ))}
    </Stack>
  );
}
