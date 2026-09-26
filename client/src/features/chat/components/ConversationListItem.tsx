import { Box, ListItemButton, Typography } from "@mui/material";
import { formatDistanceToNowStrict } from "date-fns";
import type { Conversation } from "../types/chat-dto";
import { useAuth } from "@/shared/hooks/useAuth";
import UserAvatar from "@/shared/components/UserAvatar";
import { useChatPresenceStore } from "../store/chat-presence.store";

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationListItem({ conversation, isActive, onClick }: Props) {
  const { user } = useAuth();
  const other = conversation.participants.find((p) => p.id !== user?._id);
  const online = useChatPresenceStore((s) => (other?.id ? s.online[other.id] : false));

  const hasUnread = conversation.unreadCount > 0;
  const displayName = other?.name?.trim() || "Unknown user";
  const lastFromMe = conversation.lastMessage?.sender === user?._id;
  const preview = conversation.lastMessage?.content
    ? `${lastFromMe ? "You: " : ""}${conversation.lastMessage.content}`
    : "No messages yet";

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      aria-current={isActive ? "page" : undefined}
      sx={{ px: 1.25, py: 1, gap: 1.5, borderRadius: 1, mb: 0.25 }}
    >
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <UserAvatar name={displayName} avatar={other?.avatar} size={40} />
        {online && (
          <Box
            aria-label="Online"
            sx={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 11,
              height: 11,
              borderRadius: "50%",
              bgcolor: "success.main",
              border: "2px solid",
              borderColor: "background.paper",
            }}
          />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="body2" fontWeight={hasUnread ? 700 : 600} noWrap sx={{ flex: 1 }}>
            {displayName}
          </Typography>
          {conversation.lastMessageAt && (
            <Typography
              variant="caption"
              color={hasUnread ? "primary.main" : "text.tertiary"}
              fontWeight={hasUnread ? 600 : 400}
              flexShrink={0}
            >
              {formatDistanceToNowStrict(new Date(conversation.lastMessageAt))}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
          <Typography
            variant="caption"
            color={hasUnread ? "text.primary" : "text.secondary"}
            fontWeight={hasUnread ? 500 : 400}
            noWrap
            sx={{ flex: 1 }}
          >
            {preview}
          </Typography>
          {hasUnread && (
            <Box
              component="span"
              aria-label={`${conversation.unreadCount} unread messages`}
              sx={{
                minWidth: 18,
                height: 18,
                px: 0.625,
                borderRadius: 9,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: "0.6875rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Box>
          )}
        </Box>
      </Box>
    </ListItemButton>
  );
}
