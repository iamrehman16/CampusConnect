import { useState } from "react";
import { Box, Button, Card, Chip, Stack, TextField, Typography } from "@mui/material";
import { format } from "date-fns";
import UserAvatar from "@/shared/components/UserAvatar";
import { useResolveReport } from "../hooks/moderation.hooks";
import type { AdminReport, ReportResolution, ReportStatus } from "../types/moderation.dto";

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: "Open",
  dismissed: "Dismissed",
  warned: "Warned",
  suspended: "Suspended",
};

const REASON_LABEL: Record<AdminReport["reason"], string> = {
  spam: "Spam",
  harassment: "Harassment",
  inappropriate: "Inappropriate",
  other: "Other",
};

const TARGET_LABEL: Record<AdminReport["targetType"], string> = {
  message: "a message",
  conversation: "a conversation",
  user: "a user",
};

/** Admin review of one report: who, why, the retained evidence, and the action. */
export function ReportReviewCard({ report }: { report: AdminReport }) {
  const [note, setNote] = useState("");
  const { mutate, isPending } = useResolveReport();
  const isOpen = report.status === "open";
  const reportedName = report.reportedUser?.name || "this user";

  const act = (action: ReportResolution) => {
    if (
      action === "suspend" &&
      !window.confirm(`Suspend ${reportedName}? They will be signed out and unable to sign in.`)
    ) {
      return;
    }
    mutate({ id: report.id, action, note: note.trim() || undefined });
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" gap={1.25} flexWrap="wrap">
        <UserAvatar name={report.reportedUser?.name} avatar={report.reportedUser?.avatar} size={36} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600}>
            {reportedName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Reported by {report.reporter?.name || "a member"} for {TARGET_LABEL[report.targetType]} ·{" "}
            {format(new Date(report.createdAt), "d MMM yyyy, HH:mm")}
          </Typography>
        </Box>
        <Chip size="small" label={REASON_LABEL[report.reason]} />
        {!isOpen && <Chip size="small" color="default" variant="outlined" label={STATUS_LABEL[report.status]} />}
      </Stack>

      {report.details && (
        <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
          “{report.details}”
        </Typography>
      )}

      {report.evidence.length > 0 && (
        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, bgcolor: "surface.subtle" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Evidence (copied when reported)
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {report.evidence.map((e) => {
              const fromReported = e.senderId === report.reportedUser?.id;
              return (
                <Typography key={e.messageId} variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  <Box component="span" sx={{ fontWeight: 600, color: fromReported ? "error.main" : "text.secondary" }}>
                    {fromReported ? reportedName : report.reporter?.name || "Reporter"}:
                  </Box>{" "}
                  {e.content}
                  {e.wasDeleted && (
                    <Box component="span" sx={{ color: "text.tertiary", fontStyle: "italic" }}>
                      {" "}
                      (deleted by sender)
                    </Box>
                  )}
                </Typography>
              );
            })}
          </Stack>
        </Box>
      )}

      {isOpen ? (
        <Stack spacing={1.25} sx={{ mt: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            label="Note (shown to the user on a warning)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
          <Stack direction="row" gap={1} justifyContent="flex-end" flexWrap="wrap">
            <Button size="small" onClick={() => act("dismiss")} disabled={isPending} color="inherit">
              Dismiss
            </Button>
            <Button size="small" variant="outlined" onClick={() => act("warn")} disabled={isPending}>
              Warn
            </Button>
            <Button size="small" variant="contained" color="error" onClick={() => act("suspend")} disabled={isPending}>
              Suspend user
            </Button>
          </Stack>
        </Stack>
      ) : (
        report.resolutionNote && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Note: {report.resolutionNote}
          </Typography>
        )
      )}
    </Card>
  );
}
