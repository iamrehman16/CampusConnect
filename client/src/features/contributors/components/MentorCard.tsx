import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { RequestMentorshipButton } from "@/features/mentorship/components/RequestMentorshipButton";
import { TierChip } from "@/features/reputation/components/TierChip";
import { ROUTES } from "@/shared/constants/routes";
import UserAvatar from "@/shared/components/UserAvatar";
import type { MentorSummary } from "../types/mentor.dto";

const MAX_TOPIC_CHIPS = 4;

interface Props {
  mentor: MentorSummary;
}

export function MentorCard({ mentor }: Props) {
  const navigate = useNavigate();

  // Mentoring topics are what they chose to advertise; fall back to general
  // expertise for mentors who haven't filled topics in.
  const topics = mentor.mentorTopics.length ? mentor.mentorTopics : mentor.expertise;
  const shownTopics = topics.slice(0, MAX_TOPIC_CHIPS);
  const extraTopics = topics.length - shownTopics.length;

  const meta = [
    mentor.department,
    mentor.semester ? `Sem ${mentor.semester}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent
        sx={{ display: "flex", flexDirection: "column", gap: 1.25, height: "100%" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <UserAvatar name={mentor.name} avatar={mentor.avatar} size={48} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {mentor.name || "Unnamed"}
              </Typography>
              <TierChip tier={mentor.tier} />
            </Stack>
            {meta && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {meta}
              </Typography>
            )}
          </Box>
        </Box>

        {mentor.mentorBio && (
          <Typography
            variant="body2"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {mentor.mentorBio}
          </Typography>
        )}

        {shownTopics.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} aria-label="Topics">
            {shownTopics.map((t) => (
              <Chip key={t} label={t} size="small" variant="outlined" />
            ))}
            {extraTopics > 0 && (
              <Chip label={`+${extraTopics}`} size="small" variant="outlined" />
            )}
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary">
          {mentor.slotsLeft > 0
            ? `${mentor.slotsLeft} of ${mentor.maxActiveMentees} slots free`
            : "No free slots"}{" "}
          · {mentor.contributionScore} rep
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 0.5 }}>
          <RequestMentorshipButton
            mentorId={mentor.id}
            mentorName={mentor.name || "this mentor"}
            slotsLeft={mentor.slotsLeft}
            defaultTopic={mentor.mentorTopics[0]}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate(ROUTES.PUBLIC_PROFILE.replace(":userId", mentor.id))}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            View profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
