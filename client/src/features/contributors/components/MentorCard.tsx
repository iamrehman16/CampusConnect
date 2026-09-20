import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useNavigate } from "react-router-dom";
import { useChatTrigger } from "@/features/chat/hooks/chat-hooks";
import { TierChip } from "@/features/reputation/components/TierChip";
import { ROUTES } from "@/shared/constants/routes";
import type { MentorSummary } from "../types/mentor.dto";

const MAX_TOPIC_CHIPS = 4;

interface Props {
  mentor: MentorSummary;
}

export function MentorCard({ mentor }: Props) {
  const navigate = useNavigate();
  const { trigger, isPending } = useChatTrigger();

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
          <Avatar src={mentor.avatar || undefined} sx={{ width: 48, height: 48 }}>
            {mentor.name.charAt(0).toUpperCase()}
          </Avatar>
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
          Takes up to {mentor.maxActiveMentees}{" "}
          {mentor.maxActiveMentees === 1 ? "mentee" : "mentees"} · {mentor.contributionScore} rep
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 0.5 }}>
          {/* Until the mentorship request flow (BACKLOG E10) exists, the
              primary action is a direct message; E10 swaps it for
              "Request mentorship". */}
          <Button
            size="small"
            variant="contained"
            startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
            loading={isPending}
            onClick={() => trigger(mentor.id)}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Message
          </Button>
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
