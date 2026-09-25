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
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import {
  useApproveApplication,
  useRejectApplication,
} from "../hooks/application.hooks";
import UserAvatar from "@/shared/components/UserAvatar";
import type { AdminApplication } from "../types/application.dto";

interface Props {
  application: AdminApplication;
}

/** One application in the admin review queue. */
export function ApplicationReviewCard({ application }: Props) {
  const { applicant } = application;
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const isPending = application.status === "Pending";
  const busy = approve.isPending || reject.isPending;

  const submitReject = () => {
    reject.mutate(
      { id: application._id, reason: reason.trim() },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setReason("");
        },
      },
    );
  };

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <UserAvatar name={applicant.name} avatar={applicant.avatar} size={40} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {applicant.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {applicant.email}
              {applicant.department ? ` · ${applicant.department}` : ""}
              {applicant.semester ? ` · Sem ${applicant.semester}` : ""}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} flexShrink={0}>
            <Chip size="small" label={`Score ${applicant.contributionScore}`} />
            {application.eligible && (
              <Chip size="small" color="success" label="Eligible" />
            )}
          </Stack>
        </Box>

        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {application.reason}
        </Typography>

        {application.sampleUrl && (
          <Typography variant="body2">
            Sample:{" "}
            <Link
              href={application.sampleUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {application.sampleUrl}
            </Link>
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Applied{" "}
            {formatDistanceToNow(new Date(application.createdAt), {
              addSuffix: true,
            })}
            {!isPending && ` · ${application.status}`}
            {application.status === "Rejected" && application.rejectionReason
              ? `: ${application.rejectionReason}`
              : ""}
          </Typography>
          {isPending && (
            <>
              <Button
                size="small"
                color="error"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
              <Button
                size="small"
                variant="contained"
                loading={approve.isPending}
                disabled={busy}
                onClick={() => approve.mutate(application._id)}
              >
                Approve
              </Button>
            </>
          )}
        </Box>
      </Stack>

      <Dialog
        open={rejectOpen}
        onClose={reject.isPending ? undefined : () => setRejectOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Reject application</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason (shown to the applicant)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)} disabled={reject.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            loading={reject.isPending}
            disabled={reason.trim().length < 3}
            onClick={submitReject}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
