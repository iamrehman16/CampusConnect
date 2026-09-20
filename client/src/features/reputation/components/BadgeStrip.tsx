import { Chip, Stack, Tooltip } from "@mui/material";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { useUserBadges } from "../hooks/reputation.hooks";

interface Props {
  userId: string | undefined;
  justify?: "center" | "flex-start" | { xs: string; sm: string };
}

/** Earned badges (server-computed). Renders nothing while loading or when none earned. */
export function BadgeStrip({ userId, justify = "flex-start" }: Props) {
  const { data: badges } = useUserBadges(userId);
  if (!badges?.length) return null;

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={0.75}
      justifyContent={justify}
      aria-label="Badges"
    >
      {badges.map((badge) => (
        <Tooltip key={badge.key} title={badge.description} arrow>
          <Chip
            size="small"
            variant="outlined"
            icon={<EmojiEventsOutlinedIcon />}
            label={badge.label}
            sx={{ fontSize: "0.7rem" }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
}
