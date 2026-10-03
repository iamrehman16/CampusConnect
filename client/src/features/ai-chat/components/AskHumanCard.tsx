import { Box, Card, Stack, Typography } from "@mui/material";
import UserAvatar from "@/shared/components/UserAvatar";
import { TierChip } from "@/features/reputation/components/TierChip";
import { RequestMentorshipButton } from "@/features/mentorship/components/RequestMentorshipButton";
import { useMentorSuggestions } from "../hooks/ai-chat.hooks";
import type { ConversationMessage } from "../types/ai-chat.dto";

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * The AI had little to go on (nothing retrieved, or matches below the
 * retrieval threshold) or the user thumbed the answer down (BACKLOG.md E14).
 */
function needsHumanHelp(message: ConversationMessage): boolean {
  return (
    message.feedback === "down" ||
    message.retrievalStatus === "no-matches" ||
    message.retrievalStatus === "below-threshold"
  );
}

interface Props {
  message: ConversationMessage;
  conversationId: string;
}

/** Up to 3 mentors matched to the answer's subject, one click to request. */
export function AskHumanCard({ message, conversationId }: Props) {
  const show =
    !message.isPending && needsHumanHelp(message) && OBJECT_ID.test(message.id);
  const { data: mentors } = useMentorSuggestions(conversationId, message.id, show);

  if (!show || !mentors || mentors.length === 0) return null;

  return (
    <Card sx={{ mt: 1.5, p: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        Want a person to look at this?
      </Typography>
      <Typography variant="caption" color="text.secondary">
        These mentors help with what you asked about.
      </Typography>
      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
        {mentors.map((m) => (
          <Stack key={m.id} direction="row" alignItems="center" gap={1.25}>
            <UserAvatar name={m.name} avatar={m.avatar} size={32} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={0.75}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {m.name}
                </Typography>
                <TierChip tier={m.tier} hideNewcomer />
              </Stack>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                Helps with {m.matchedOn.join(", ")}
              </Typography>
            </Box>
            <RequestMentorshipButton
              mentorId={m.id}
              mentorName={m.name}
              slotsLeft={m.slotsLeft}
              defaultTopic={m.suggestedTopic}
            />
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
