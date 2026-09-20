import { Avatar, Badge, Box, ListItemButton, Typography } from "@mui/material";
import type { Conversation } from "../types/chat-dto";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/shared/hooks/useAuth";

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: Props) {
  const { user } = useAuth();
  const otherParticipant = conversation?.participants.find(
    (p) => p.id !== user?._id,
  );

  const hasUnread = conversation.unreadCount > 0;
  const displayName = otherParticipant?.name?.trim() || "Unknown user";

  return (
    <ListItemButton
      onClick={onClick}
      selected={isActive}
      sx={{
        px: 2,
        py: 1.5,
        gap: 1.5,
        alignItems: "flex-start",
        minHeight: 64,
        "&.Mui-selected": {
          bgcolor: "action.selected",
        },
      }}
    >
      <Avatar
        src={otherParticipant?.avatar || undefined}
        sx={{ width: 40, height: 40, flexShrink: 0, mt: 0.25, bgcolor: "primary.main" }}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}
        >
          <Typography
            variant="body2"
            fontWeight={hasUnread ? 700 : 600}
            noWrap
          >
            {displayName}
          </Typography>
          {conversation.lastMessageAt && (
            <Typography
              variant="caption"
              color="text.secondary"
              flexShrink={0}
              ml={1}
            >
              {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                addSuffix: true,
              })}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          display="block"
          mt={0.25}
        >
          {conversation.lastMessage?.content ?? "No messages yet"}
        </Typography>
      </Box>
      {hasUnread && (
        <Badge
          badgeContent={conversation.unreadCount}
          color="primary"
          max={99}
          sx={{ alignSelf: "center", mr: 1.5 }}
          aria-label={`${conversation.unreadCount} unread messages`}
        />
      )}
    </ListItemButton>
  );
}
