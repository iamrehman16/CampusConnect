import { Box, IconButton, TextField } from "@mui/material";
import { Send } from "@mui/icons-material";
import { useState, useCallback } from "react";
import type { CreateMessageDto } from "../types/chat-dto";

interface Props {
  conversationId: string;
  sendMessage: (dto: Omit<CreateMessageDto, "clientId">) => string;
}

export function MessageInput({ conversationId, sendMessage }: Props) {
  const [content, setContent] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMessage({ conversationId, content: trimmed });
    setContent("");
  }, [content, conversationId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-end",
        gap: 1,
        px: 2,
        py: 1.5,
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Write a message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="outlined"
        size="small"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "24px",
            bgcolor: "background.paper",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.light",
              borderWidth: "1.5px",
            },
          },
        }}
      />
      <IconButton
        size="small"
        onClick={handleSend}
        disabled={!content.trim()}
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          mb: 0.25,
          bgcolor: content.trim() ? "primary.main" : "action.disabledBackground",
          color: content.trim() ? "primary.contrastText" : "text.disabled",
          borderRadius: "50%",
          "&:hover": {
            bgcolor: content.trim() ? "primary.dark" : "action.disabledBackground",
          },
          "&.Mui-disabled": {
            bgcolor: "action.disabledBackground",
            color: "text.disabled",
          },
        }}
      >
        <Send sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}