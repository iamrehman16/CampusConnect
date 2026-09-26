import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@/shared/icons";
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
        sx={{ color: "inherit", opacity: 0.8 }}
      />
    );
  }

  if (status === "FAILED") {
    return (
      <Tooltip title="Failed to send — tap to retry">
        <IconButton
          size="small"
          onClick={() => retryMessage(clientId, { conversationId, content })}
          aria-label="Retry sending"
          sx={{ p: 0, color: "inherit" }}
        >
          <ErrorOutline sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    );
  }

  // SENT
  return (
    <CheckCircleOutline sx={{ fontSize: 12, opacity: 0.8 }} />
  );
}