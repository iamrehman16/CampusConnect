import { Rating, Stack, Typography } from "@mui/material";

interface Props {
  average: number | null;
  count: number;
  /** Show "No ratings yet" when unrated (cards) instead of nothing. */
  showEmpty?: boolean;
}

/** Average + count, e.g. "4.5 (12)" — an unrated mentor shows no number (BACKLOG.md E11). */
export function MentorRating({ average, count, showEmpty = true }: Props) {
  if (average === null || count === 0) {
    return showEmpty ? (
      <Typography variant="caption" color="text.secondary">
        No ratings yet
      </Typography>
    ) : null;
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.5}
      aria-label={`Rated ${average} out of 5 from ${count} ${count === 1 ? "rating" : "ratings"}`}
    >
      <Rating value={average} precision={0.1} readOnly size="small" max={5} />
      <Typography variant="caption" color="text.secondary">
        {average.toFixed(1)} ({count})
      </Typography>
    </Stack>
  );
}
