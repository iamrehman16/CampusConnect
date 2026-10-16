import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { usePushNotifications } from "../hooks/usePushNotifications";

const DISMISS_KEY = "cc-push-prompt-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false; // storage blocked: just show the prompt again
  }
}

/**
 * Soft prompt inside the bell popover. Browsers only allow the permission
 * dialog from a click (Safari strictly; Chrome demotes unprompted asks to a
 * quiet icon), so we never request it on load: this button is the gesture.
 * Shown only while the browser has not been asked yet; Settings keeps the
 * full on/off switch.
 */
export function PushPromptBanner() {
  const { status, busy, setEnabled } = usePushNotifications();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (status !== "off" || Notification.permission !== "default" || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (err) {
      console.warn("[Push] could not remember the dismissed prompt:", err);
    }
  };

  return (
    <Box sx={{ px: 2, py: 1.5, bgcolor: "action.hover" }}>
      <Typography variant="body2" fontWeight={600}>
        Get notified when CampusConnect is closed
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Messages, mentorship requests and new notes for your semester, as notifications on this device.
      </Typography>
      <Stack direction="row" gap={1}>
        <Button size="small" variant="contained" disabled={busy} onClick={() => void setEnabled(true)}>
          Turn on
        </Button>
        <Button size="small" onClick={dismiss}>
          Not now
        </Button>
      </Stack>
    </Box>
  );
}
