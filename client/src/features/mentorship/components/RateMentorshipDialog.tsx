import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  TextField,
  Typography,
} from "@mui/material";
import { useRateMentorship } from "../hooks/mentorship.hooks";
import {
  MENTORSHIP_LIMITS,
  type MentorshipFeedback,
} from "../types/mentorship.dto";

interface Props {
  open: boolean;
  onClose: () => void;
  mentorshipId: string;
  mentorName: string;
  /** Present when editing within the grace window. */
  existing?: MentorshipFeedback;
}

/** The mentee rates a completed mentorship; editable until `editableUntil` (E11). */
export function RateMentorshipDialog({
  open,
  onClose,
  mentorshipId,
  mentorName,
  existing,
}: Props) {
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [review, setReview] = useState(existing?.review ?? "");
  const { mutate, isPending } = useRateMentorship();

  const submit = () => {
    if (!rating) return;
    mutate(
      { id: mentorshipId, rating, review: review.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {existing ? "Change your rating" : `Rate your mentorship with ${mentorName || "your mentor"}`}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {existing
            ? "You can change this until the time shown on the card; after that it's final."
            : "You can change your rating for 24 hours. After that it's final. Your written feedback is only seen by you and your mentor."}
        </Typography>
        <Rating
          value={rating}
          onChange={(_, v) => setRating(v)}
          size="large"
          aria-label="Rating out of 5"
        />
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Feedback (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          slotProps={{ htmlInput: { maxLength: MENTORSHIP_LIMITS.reviewMax } }}
          helperText={`${review.length}/${MENTORSHIP_LIMITS.reviewMax}`}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending} color="inherit">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={!rating || isPending}>
          {isPending ? "Saving…" : existing ? "Save change" : "Submit rating"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
