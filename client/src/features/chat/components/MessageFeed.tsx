import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import type { Message } from "../types/chat-dto";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: Message[];
  retryMessage: (clientId: string, dto: { conversationId: string; content: string }) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  currentUserId?: string;
}

export function MessageFeed({
  messages,
  retryMessage,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  currentUserId,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestSeenOwnMessageKey = [...messages]
    .reverse()
    .find((message) => message.sender === currentUserId && message.seenAt);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load older messages on scroll to top
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <Box
      ref={containerRef}
      sx={{
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 1,
        gap: 0.5,
        bgcolor: "background.default",
      }}
    >
      {isFetchingNextPage && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!hasNextPage && (
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          py={1}
        >
          Beginning of conversation
        </Typography>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.clientId || message.id}
          message={message}
          retryMessage={retryMessage}
          showSeenAt={
            (message.id || message.clientId) ===
            (latestSeenOwnMessageKey?.id || latestSeenOwnMessageKey?.clientId)
          }
        />
      ))}

      <div ref={bottomRef} />
    </Box>
  );
}
