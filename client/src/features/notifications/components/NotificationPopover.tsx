import {
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  Popover,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks/notification.hooks";
import type { Notification } from "../types/notification.dto";

interface Props {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  anchorOrigin?: React.ComponentProps<typeof Popover>["anchorOrigin"];
  transformOrigin?: React.ComponentProps<typeof Popover>["transformOrigin"];
}

export function NotificationPopover({
  anchorEl,
  onClose,
  anchorOrigin = { vertical: "bottom", horizontal: "right" },
  transformOrigin = { vertical: "top", horizontal: "right" },
}: Props) {
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNotifications(open);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    onClose();
    navigate(n.link);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{ paper: { sx: { width: 360, maxWidth: "calc(100vw - 32px)" } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1.25 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1 }}>
          Notifications
        </Typography>
        <Button
          size="small"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      </Box>
      <Divider />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={22} />
        </Box>
      )}

      {isError && (
        <Typography variant="body2" color="error" sx={{ p: 2 }}>
          Couldn't load notifications.
        </Typography>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ p: 3, textAlign: "center" }}
        >
          You're all caught up.
        </Typography>
      )}

      <List disablePadding sx={{ maxHeight: 420, overflowY: "auto" }}>
        {items.map((n) => (
          <ListItemButton
            key={n.id}
            onClick={() => handleClick(n)}
            sx={{
              alignItems: "flex-start",
              gap: 1.5,
              px: 2,
              py: 1.25,
              bgcolor: n.isRead ? "transparent" : "action.hover",
            }}
          >
            <Box
              aria-hidden
              sx={{
                mt: 0.9,
                width: 8,
                height: 8,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: n.isRead ? "transparent" : "primary.main",
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                fontWeight={n.isRead ? 500 : 700}
                noWrap
              >
                {n.title}
                {n.count > 1 ? ` (${n.count})` : ""}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {n.body}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}
              </Typography>
            </Box>
          </ListItemButton>
        ))}
      </List>

      {hasNextPage && (
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Button
            size="small"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            Load more
          </Button>
        </Box>
      )}
    </Popover>
  );
}
