import { Chip, Stack, Typography } from "@mui/material";
import { useEndorsements, useToggleEndorsement } from "../hooks/mentorship.hooks";

interface Props {
  mentorId: string;
  /** Shown while loading or if endorsements can't be loaded. */
  fallbackTopics: string[];
  justify?: "center" | "flex-start" | { xs: string; sm: string };
}

/**
 * A mentor's skills with endorsement counts (BACKLOG.md E11). If you completed
 * a mentorship with them each skill becomes a toggle; otherwise it's read-only.
 * Falls back to the plain topic chips while loading / on error.
 */
export function EndorsementTags({ mentorId, fallbackTopics, justify = "flex-start" }: Props) {
  const { data } = useEndorsements(mentorId);
  const { mutate, isPending } = useToggleEndorsement(mentorId);

  if (!data) {
    return fallbackTopics.length > 0 ? (
      <Stack direction="row" flexWrap="wrap" gap={0.75} justifyContent={justify} sx={{ mt: 0.75 }} aria-label="Mentoring topics">
        {fallbackTopics.map((t) => (
          <Chip key={t} label={t} size="small" variant="outlined" />
        ))}
      </Stack>
    ) : null;
  }
  if (data.tags.length === 0) return null;

  return (
    <>
      <Stack direction="row" flexWrap="wrap" gap={0.75} justifyContent={justify} sx={{ mt: 0.75 }} aria-label="Skills">
        {data.tags.map((t) => {
          const label = t.count > 0 ? `${t.tag} · ${t.count}` : t.tag;
          return data.canEndorse ? (
            <Chip
              key={t.tag}
              label={label}
              size="small"
              clickable
              disabled={isPending}
              color={t.endorsedByMe ? "primary" : "default"}
              variant={t.endorsedByMe ? "filled" : "outlined"}
              onClick={() => mutate({ tag: t.tag, endorsed: t.endorsedByMe })}
              aria-pressed={t.endorsedByMe}
              aria-label={`${t.endorsedByMe ? "Remove your endorsement of" : "Endorse"} ${t.tag}`}
            />
          ) : (
            <Chip
              key={t.tag}
              label={label}
              size="small"
              variant="outlined"
              color={t.count > 0 ? "primary" : "default"}
            />
          );
        })}
      </Stack>
      {data.canEndorse && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          You worked with them — tap a skill to endorse it.
        </Typography>
      )}
    </>
  );
}
