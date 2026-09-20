import { useState } from "react";
import { Button, type ButtonProps } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useAuth } from "@/shared/hooks/useAuth";
import { useMyOpenMentorships } from "../hooks/mentorship.hooks";
import { RequestMentorshipDialog } from "./RequestMentorshipDialog";

interface Props {
  mentorId: string;
  mentorName: string;
  /** Free slots the mentor has right now. */
  slotsLeft: number;
  defaultTopic?: string;
  size?: ButtonProps["size"];
}

/**
 * The one entry point for asking someone to mentor you. Reflects state so the
 * button is never a dead end: already requested -> "Request sent"; already
 * mentoring you -> "Open chat"; mentor full -> disabled "No free slots".
 * Renders nothing on your own card.
 */
export function RequestMentorshipButton({
  mentorId,
  mentorName,
  slotsLeft,
  defaultTopic,
  size = "small",
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: openMentorships } = useMyOpenMentorships();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (user?._id === mentorId) return null;

  const existing = openMentorships?.get(mentorId);
  const common = {
    size,
    sx: { textTransform: "none", fontWeight: 600 },
  } as const;

  if (existing?.status === "active" && existing.conversationId) {
    return (
      <Button
        {...common}
        variant="contained"
        onClick={() => navigate(`${ROUTES.CHAT}/${existing.conversationId}`)}
      >
        Open chat
      </Button>
    );
  }

  if (existing?.status === "pending") {
    return (
      <Button {...common} variant="outlined" disabled>
        Request sent
      </Button>
    );
  }

  if (slotsLeft <= 0) {
    return (
      <Button {...common} variant="outlined" disabled>
        No free slots
      </Button>
    );
  }

  return (
    <>
      <Button {...common} variant="contained" onClick={() => setDialogOpen(true)}>
        Request mentorship
      </Button>
      <RequestMentorshipDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        mentorId={mentorId}
        mentorName={mentorName}
        defaultTopic={defaultTopic}
      />
    </>
  );
}
