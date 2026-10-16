import { Card, CircularProgress, Stack, Switch, Typography } from "@mui/material";
import { usePwaInstall } from "@/shared/hooks/usePwaInstall";
import { usePushNotifications } from "../hooks/usePushNotifications";

/**
 * Settings: opt this device into OS-level notifications (Web Push). The bell
 * keeps working either way; this adds banners while the app is closed.
 */
export function PushNotificationsCard() {
  const { status, busy, setEnabled } = usePushNotifications();
  const { needsIosGuidance } = usePwaInstall();

  // Push not configured on the server, or nothing useful to show.
  if (status === "unavailable" || (status === "unsupported" && !needsIosGuidance)) {
    return null;
  }

  const hint =
    status === "unsupported"
      ? "On iPhone and iPad, add CampusConnect to your Home Screen first, then turn this on from the installed app."
      : status === "denied"
        ? "Notifications are blocked for this site. Allow them in your browser's site settings, then come back."
        : "Get a banner for new messages, replies, mentorship updates and new notes for your semester, even when CampusConnect is closed.";

  return (
    <Card sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" alignItems="center" gap={2}>
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications on this device
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hint}
          </Typography>
        </Stack>
        {status === "loading" ? (
          <CircularProgress size={20} />
        ) : status === "on" || status === "off" ? (
          <Switch
            checked={status === "on"}
            disabled={busy}
            onChange={(_, checked) => void setEnabled(checked)}
            slotProps={{ input: { "aria-label": "Notifications on this device" } }}
          />
        ) : null}
      </Stack>
    </Card>
  );
}
