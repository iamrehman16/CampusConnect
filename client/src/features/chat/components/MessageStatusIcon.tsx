import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import type { Message } from "../types/chat-dto";

interface Props {
  status: Message["_status"];
  clientId: string;
  conversationId: string;
  content: string;
  retryMessage: (clientId: string, dto: { conversationId: string; content: string }) => void;
}

export function MessageStatusIcon({
  status,
  clientId,
  conversationId,
  content,
  retryMessage,
}: Props) {
  if (status === "PENDING") {
    return (
      <CircularProgress
        size={10}
        thickness={5}
        sx={{ color: "text.disabled" }}
      />
    );
  }

  if (status === "FAILED") {
    return (
      <Tooltip title="Failed to send — tap to retry">
        <IconButton
          size="small"
          onClick={() => retryMessage(clientId, { conversationId, content })}
          sx={{ p: 0 }}
        >
          <ErrorOutline sx={{ fontSize: 14, color: "error.main" }} />
        </IconButton>
      </Tooltip>
    );
  }

  // SENT
  return (
    <CheckCircleOutline sx={{ fontSize: 12, color: "text.disabled" }} />
  );
}