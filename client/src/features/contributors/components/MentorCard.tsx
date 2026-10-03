import { Box, ButtonBase, Card, CardContent, Chip, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { RequestMentorshipButton } from "@/features/mentorship/components/RequestMentorshipButton";
import { MentorRating } from "@/features/mentorship/components/MentorRating";
import { TierChip } from "@/features/reputation/components/TierChip";
import { ROUTES } from "@/shared/constants/routes";
import UserAvatar from "@/shared/components/UserAvatar";
import type { MentorSummary } from "../types/mentor.dto";

const MAX_TOPIC_CHIPS = 4;

interface Props {
  mentor: MentorSummary;
}

/**
 * Directory card (BACKLOG.md D9): who they are, what they help with,
 * capacity, and one action. The name and avatar link to the profile,
 * replacing a second "View profile" button.
 */
export function MentorCard({ mentor }: Props) {
  const profilePath = ROUTES.PUBLIC_PROFILE.replace(":userId", mentor.id);

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
    <Card
      sx={{
        height: "100%",
        transition: (t) => t.transitions.create("border-color"),
        "&:hover": { borderColor: "border.strong" },
      }}
    >
      <CardContent
        sx={{ display: "flex", flexDirection: "column", gap: 1.25, height: "100%" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <ButtonBase component={RouterLink} to={profilePath} aria-label={`${mentor.name} profile`} sx={{ borderRadius: "50%" }} tabIndex={-1}>
            <UserAvatar name={mentor.name} avatar={mentor.avatar} size={48} />
          </ButtonBase>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
              <Link
                component={RouterLink}
                to={profilePath}
                variant="subtitle2"
                fontWeight={700}
                color="text.primary"
                underline="hover"
                noWrap
              >
                {mentor.name || "Unnamed"}
              </Link>
              <TierChip tier={mentor.tier} hideNewcomer />
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

        {mentor.reasons && mentor.reasons.length > 0 && (
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            {mentor.reasons.join(" · ")}
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

        <MentorRating average={mentor.ratingAverage} count={mentor.ratingCount} />

        <Stack direction="row" alignItems="center" gap={0.75}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: mentor.slotsLeft > 0 ? "success.main" : "text.disabled",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {mentor.slotsLeft > 0
              ? `${mentor.slotsLeft} of ${mentor.maxActiveMentees} slots free`
              : "No free slots right now"}
          </Typography>
        </Stack>

        <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 0.5 }}>
          <RequestMentorshipButton
            mentorId={mentor.id}
            mentorName={mentor.name || "this mentor"}
            slotsLeft={mentor.slotsLeft}
            defaultTopic={mentor.mentorTopics[0]}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
