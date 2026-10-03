import { Box, Chip, Stack, Typography } from "@mui/material";
import { HandshakeOutlined as HandshakeOutlinedIcon } from "@/shared/icons";
import { EndorsementTags } from "@/features/mentorship/components/EndorsementTags";
import { MentorRating } from "@/features/mentorship/components/MentorRating";
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

      <Box sx={{ mt: 0.75 }}>
        <MentorRating average={user.ratingAverage} count={user.ratingCount} showEmpty={false} />
      </Box>

      {user.mentorBio && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.75,
            whiteSpace: "pre-wrap",
          }}
        >
          {user.mentorBio}
        </Typography>
      )}

      <EndorsementTags
        mentorId={user.id}
        fallbackTopics={user.mentorTopics}
        justify={justify}
      />
    </Box>
  );
}
