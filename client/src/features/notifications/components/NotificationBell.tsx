import { useState } from "react";
import { Badge, IconButton } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/NotificationsNone";
import { useUnreadNotificationCount } from "../hooks/notification.hooks";
import { NotificationPopover } from "./NotificationPopover";

/** Icon-button bell for top bars (mobile). */
export function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data: unread = 0 } = useUnreadNotificationCount();

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: "text.secondary" }}
      >
        <Badge
          badgeContent={unread}
          color="error"
          max={99}
          sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem" } }}
        >
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
      <NotificationPopover
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      />
    </>
  );
}
