import { Box, Chip, Stack, Typography } from "@mui/material";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import type { ProfileUserViewModel } from "../types/profile.types";

interface Props {
  user: ProfileUserViewModel;
  justify?: "center" | "flex-start" | { xs: string; sm: string };
}

/**
 * Public "open to mentor" state: status, what they help with, and capacity.
 * Capacity is the mentor's remaining free slots (max minus active mentees).
 */
export function MentorProfileBlock({ user, justify = "flex-start" }: Props) {
  if (!user.isOpenToMentor) return null;

  const slotsLeft = Math.max(0, user.maxActiveMentees - user.activeMenteeCount);

  return (
    <Box sx={{ mt: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
        justifyContent={justify}
      >
        <Chip
          size="small"
          color="success"
          icon={<HandshakeOutlinedIcon />}
          label="Open to mentor"
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          {slotsLeft > 0
            ? `${slotsLeft} of ${user.maxActiveMentees} ${
                user.maxActiveMentees === 1 ? "slot" : "slots"
              } free`
            : "All mentee slots are taken right now"}
        </Typography>
      </Stack>

      {user.mentorBio && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.75,
            textAlign: { xs: "center", sm: "left" },
            whiteSpace: "pre-wrap",
          }}
        >
          {user.mentorBio}
        </Typography>
      )}

      {user.mentorTopics.length > 0 && (
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.75}
          justifyContent={justify}
          sx={{ mt: 0.75 }}
          aria-label="Mentoring topics"
        >
          {user.mentorTopics.map((topic) => (
            <Chip key={topic} label={topic} size="small" variant="outlined" />
          ))}
        </Stack>
      )}
    </Box>
  );
}
