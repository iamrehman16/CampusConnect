import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useCreateReport } from "../hooks/moderation.hooks";
import {
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from "../types/moderation.dto";

const DETAILS_MAX = 500;

interface Props {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  /** What's being reported, e.g. "this message" or "Ayesha Siddiqui". */
  subject: string;
}

/** Report a message, conversation or person (BACKLOG.md E16). */
export function ReportDialog({ open, onClose, targetType, targetId, subject }: Props) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const { mutate, isPending } = useCreateReport();

  const close = () => {
    setReason("");
    setDetails("");
    onClose();
  };

  const submit = () => {
    if (!reason) return;
    mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      { onSuccess: close },
    );
  };

  return (
    <Dialog open={open} onClose={isPending ? undefined : close} fullWidth maxWidth="xs">
      <DialogTitle>Report {subject}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Moderators review reports. The person you report isn't told who reported them.
        </Typography>
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
          {REPORT_REASONS.map((r) => (
            <FormControlLabel
              key={r.value}
              value={r.value}
              control={<Radio size="small" />}
              label={
                <>
                  <Typography variant="body2" fontWeight={600}>
                    {r.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.hint}
                  </Typography>
                </>
              }
              sx={{ alignItems: "flex-start", mb: 0.5 }}
            />
          ))}
        </RadioGroup>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Details (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          slotProps={{ htmlInput: { maxLength: DETAILS_MAX } }}
          helperText={`${details.length}/${DETAILS_MAX}`}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={isPending} color="inherit">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={!reason || isPending}>
          {isPending ? "Sending…" : "Send report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
