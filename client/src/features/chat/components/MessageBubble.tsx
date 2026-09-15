import { Box, Typography } from "@mui/material";
import { useAuth } from "@/shared/hooks/useAuth";
import type { Message } from "../types/chat-dto";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { format } from "date-fns";

interface Props {
  message: Message;
  retryMessage: (clientId: string, dto: { conversationId: string; content: string }) => void;
  showSeenAt?: boolean;
}

export function MessageBubble({
  message,
  retryMessage,
  showSeenAt = false,
}: Props) {
  const { user } = useAuth();
  const isOwn = message.sender === user?._id;
  const timestampColor = isOwn ? "rgba(255,255,255,0.78)" : "text.disabled";
  const seenAt = message.seenAt ? format(new Date(message.seenAt), "HH:mm") : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        maxWidth: "70%",
        alignSelf: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          bgcolor: isOwn ? "primary.main" : "background.paper",
          color: isOwn ? "primary.contrastText" : "text.primary",
          border: isOwn ? "none" : "1px solid",
          borderColor: isOwn ? "transparent" : "divider",
          opacity: message._status === "PENDING" ? 0.7 : 1,
        }}
      >
        {message.isDeleted ? (
          <Typography
            variant="body2"
            fontStyle="italic"
            color={isOwn ? "primary.contrastText" : "text.disabled"}
          >
            This message was deleted
          </Typography>
        ) : (
          <Typography variant="body2">{message.content}</Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.5,
            mt: 0.5,
            minHeight: 14,
          }}
        >
          {message.createdAt && (
            <Typography variant="caption" sx={{ color: timestampColor, lineHeight: 1 }}>
              {format(new Date(message.createdAt), "HH:mm")}
            </Typography>
          )}
          {isOwn && (
            <MessageStatusIcon
              status={message._status}
              clientId={message.clientId}
              conversationId={message.conversationId}
              content={message.content}
              retryMessage={retryMessage}
            />
          )}
        </Box>
      </Box>

      {isOwn && showSeenAt && seenAt && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, px: 0.5 }}>
          Seen at {seenAt}
        </Typography>
      )}
    </Box>
  );
}
