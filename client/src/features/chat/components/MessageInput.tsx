import { Box, Chip, IconButton, TextField } from "@mui/material";
import { Send } from "@/shared/icons";
import { useState, useCallback } from "react";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import type { ChatAttachment, MessageContext, SendMessageDto } from "../types/chat-dto";

interface Props {
  conversationId: string;
  sendMessage: (
    dto: SendMessageDto,
    preview?: Pick<MessageContext, "title" | "subtitle">,
  ) => string;
  /** Item to attach to the next message (E13); cleared after sending. */
  attachment?: ChatAttachment | null;
  onClearAttachment?: () => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export function MessageInput({
  conversationId,
  sendMessage,
  attachment,
  onClearAttachment,
  onTyping,
  onStopTyping,
}: Props) {
  const [content, setContent] = useState("");
  // Sending needs the connection; offline the draft is kept but not sendable (BACKLOG.md J3).
  const { isOnline } = useNetworkStatus();

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || !isOnline) return;
    if (attachment) {
      sendMessage(
        {
          conversationId,
          content: trimmed,
          kind: attachment.kind,
          contextId: attachment.contextId,
        },
        { title: attachment.title, subtitle: attachment.subtitle },
      );
      onClearAttachment?.();
    } else {
      sendMessage({ conversationId, content: trimmed });
    }
    setContent("");
    onStopTyping?.();
  }, [content, isOnline, conversationId, sendMessage, attachment, onClearAttachment, onStopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = content.trim().length > 0 && isOnline;

  // Same single composer surface as Ask AI's ChatInput (BACKLOG.md D8).
  return (
    <>
    {attachment && (
      <Chip
        label={`About: ${attachment.title}`}
        onDelete={onClearAttachment}
        size="small"
        sx={{ mb: 1, maxWidth: "100%" }}
      />
    )}
    <Box
      sx={(t) => ({
        display: "flex",
        alignItems: "flex-end",
        gap: 1,
        pl: 2,
        pr: 1,
        py: 0.75,
        borderRadius: `${t.radius.lg}px`,
        border: "1px solid",
        borderColor: "border.default",
        bgcolor: "surface.card",
        transition: t.transitions.create(["border-color", "box-shadow"]),
        "&:focus-within": {
          borderColor: "primary.main",
          boxShadow: `0 0 0 3px ${t.palette.primary.subtle}`,
        },
      })}
    >
      <TextField
        fullWidth
        multiline
        maxRows={5}
        placeholder={
          !isOnline
            ? "You're offline"
            : attachment
              ? "Ask your question…"
              : "Write a message…"
        }
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (e.target.value) onTyping?.();
        }}
        onKeyDown={handleKeyDown}
        variant="standard"
        slotProps={{
          input: { disableUnderline: true },
          htmlInput: { "aria-label": "Write a message" },
        }}
        sx={{ py: 0.75, "& .MuiInputBase-root": { fontSize: "0.9375rem", lineHeight: 1.5 } }}
      />
      <IconButton
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": { bgcolor: "primary.dark", color: "primary.contrastText" },
          "&.Mui-disabled": { bgcolor: "surface.subtle", color: "text.disabled" },
        }}
      >
        <Send sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
    </>
  );
}
