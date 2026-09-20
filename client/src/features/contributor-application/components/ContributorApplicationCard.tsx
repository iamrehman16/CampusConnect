import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { useMyApplication } from "../hooks/application.hooks";
import { ApplyDialog } from "./ApplyDialog";

/**
 * Student-facing entry point on their own profile: shows application status,
 * the reputation eligibility hint, and the apply action. Renders nothing for
 * users who can't apply (already contributors/admins) or while loading.
 */
export function ContributorApplicationCard() {
  const { data } = useMyApplication();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!data || !data.canApply) return null;

  const { application, score, threshold, eligible } = data;
  const isPending = application?.status === "Pending";
  const wasRejected = application?.status === "Rejected";
  const progress = Math.min(100, Math.round((score / threshold) * 100));

  return (
    <>
      <Card variant="outlined" sx={{ mx: { xs: 2, sm: 0 }, mt: 2, p: 2 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Become a contributor
            </Typography>
            {isPending && <Chip size="small" color="warning" label="Under review" />}
            {!isPending && eligible && (
              <Chip size="small" color="success" label="Eligible" />
            )}
          </Box>

          {isPending ? (
            <Typography variant="body2" color="text.secondary">
              Submitted{" "}
              {formatDistanceToNow(new Date(application.createdAt), {
                addSuffix: true,
              })}
              . An admin will review it and you'll get a notification.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Contributors upload notes and resources that get reviewed and
                power the AI assistant for everyone.
              </Typography>

              {wasRejected && (
                <Alert severity="info" sx={{ alignItems: "center" }}>
                  Your last application was declined
                  {application.rejectionReason
                    ? `: ${application.rejectionReason}`
                    : "."}
                </Alert>
              )}

              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Reputation
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {score} / {threshold}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  aria-label="Reputation progress toward eligibility"
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {eligible
                    ? "You meet the reputation guideline."
                    : "Earn reputation through upvotes on your community posts. It's a guideline, not a requirement — you can apply anytime."}
                </Typography>
              </Box>

              <Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setDialogOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {wasRejected ? "Apply again" : "Apply"}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </Card>
      <ApplyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
