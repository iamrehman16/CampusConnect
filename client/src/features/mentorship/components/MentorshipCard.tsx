import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { TierChip } from "@/features/reputation/components/TierChip";
import {
  useAcceptMentorship,
  useCancelMentorship,
  useCompleteMentorship,
  useDeclineMentorship,
} from "../hooks/mentorship.hooks";
import {
  MENTORSHIP_LIMITS,
  type Mentorship,
  type MentorshipStatus,
  type MentorshipView,
} from "../types/mentorship.dto";
import UserAvatar from "@/shared/components/UserAvatar";

const STATUS_CHIP: Record<
  MentorshipStatus,
  { label: string; color: "default" | "warning" | "success" | "error" | "info" }
> = {
  pending: { label: "Pending", color: "warning" },
  active: { label: "Active", color: "success" },
  declined: { label: "Declined", color: "error" },
  cancelled: { label: "Cancelled", color: "default" },
  completed: { label: "Completed", color: "info" },
};

interface Props {
  mentorship: Mentorship;
  /** Whose side we're rendering: the counterpart is the other party. */
  view: MentorshipView;
}

export function MentorshipCard({ mentorship, view }: Props) {
  const navigate = useNavigate();
  const other = view === "mentor" ? mentorship.mentee : mentorship.mentor;
  const accept = useAcceptMentorship();
  const decline = useDeclineMentorship();
  const cancel = useCancelMentorship();
  const complete = useCompleteMentorship();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");

  const busy =
    accept.isPending || decline.isPending || cancel.isPending || complete.isPending;
  const chip = STATUS_CHIP[mentorship.status];
  const { status } = mentorship;

  const meta = [
    other.department,
    other.semester ? `Sem ${other.semester}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const openChat = () => {
    if (mentorship.conversationId) {
      navigate(`${ROUTES.CHAT}/${mentorship.conversationId}`);
    }
  };

  const submitDecline = () => {
    decline.mutate(
      { id: mentorship.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setDeclineOpen(false);
          setReason("");
        },
      },
    );
  };

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="button"
            onClick={() =>
              navigate(ROUTES.PUBLIC_PROFILE.replace(":userId", other.id))
            }
            sx={{ p: 0, border: 0, bgcolor: "transparent", cursor: "pointer", borderRadius: "50%" }}
            aria-label={`View ${other.name}'s profile`}
          >
            <UserAvatar name={other.name} avatar={other.avatar} size={40} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {other.name || "Unnamed"}
              </Typography>
              <TierChip tier={other.tier} />
            </Stack>
            {meta && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {meta}
              </Typography>
            )}
          </Box>
          <Chip size="small" color={chip.color} label={chip.label} />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Topic
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {mentorship.topic}
          </Typography>
        </Box>

        {(status === "pending" || view === "mentor") && (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {mentorship.introMessage}
          </Typography>
        )}

        {status === "declined" && mentorship.declineReason && (
          <Typography variant="body2" color="text.secondary">
            Reason: {mentorship.declineReason}
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {formatDistanceToNow(new Date(mentorship.createdAt), { addSuffix: true })}
          </Typography>

          {status === "pending" && view === "mentor" && (
            <>
              <Button
                size="small"
                color="error"
                disabled={busy}
                onClick={() => setDeclineOpen(true)}
              >
                Decline
              </Button>
              <Button
                size="small"
                variant="contained"
                loading={accept.isPending}
                disabled={busy}
                onClick={() => accept.mutate(mentorship.id)}
              >
                Accept
              </Button>
            </>
          )}

          {status === "pending" && view === "mentee" && (
            <Button
              size="small"
              color="inherit"
              disabled={busy}
              loading={cancel.isPending}
              onClick={() => cancel.mutate(mentorship.id)}
            >
              Cancel request
            </Button>
          )}

          {status === "active" && (
            <>
              <Button
                size="small"
                color="inherit"
                disabled={busy}
                loading={complete.isPending}
                onClick={() => {
                  if (window.confirm("Mark this mentorship as complete?")) {
                    complete.mutate(mentorship.id);
                  }
                }}
              >
                Mark complete
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={busy || !mentorship.conversationId}
                onClick={openChat}
              >
                Open chat
              </Button>
            </>
          )}
        </Box>
      </Stack>

      <Dialog
        open={declineOpen}
        onClose={decline.isPending ? undefined : () => setDeclineOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Decline request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason (optional, shown to them)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            slotProps={{ htmlInput: { maxLength: MENTORSHIP_LIMITS.declineReasonMax } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineOpen(false)} disabled={decline.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={decline.isPending}
            onClick={submitDecline}
          >
            Decline
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
