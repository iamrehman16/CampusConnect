import { Box, CircularProgress, Typography } from "@mui/material";
import { Fragment, useEffect, useRef } from "react";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import type { Message } from "../types/chat-dto";
import { MessageBubble } from "./MessageBubble";

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM");
}

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
      sx={{ height: "100%", overflowY: "auto", px: { xs: 1.5, md: 3 }, py: 2 }}
    >
      <Box sx={{ maxWidth: 760, mx: "auto", display: "flex", flexDirection: "column" }}>
        {isFetchingNextPage && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        {!hasNextPage && (
          <Typography variant="caption" color="text.tertiary" textAlign="center" sx={{ pb: 1 }}>
            Beginning of conversation
          </Typography>
        )}

        {messages.map((message, i) => {
          const prev = messages[i - 1];
          const created = new Date(message.createdAt);
          const newDay = !prev || !isSameDay(new Date(prev.createdAt), created);
          // Consecutive messages from one sender sit tight; a change of
          // speaker (or day) gets breathing room.
          const sameSender = !newDay && prev?.sender === message.sender;
          return (
            <Fragment key={message.clientId || message.id}>
              {newDay && (
                <Typography
                  variant="caption"
                  color="text.tertiary"
                  fontWeight={600}
                  textAlign="center"
                  sx={{ py: 1.5 }}
                >
                  {dayLabel(created)}
                </Typography>
              )}
              <Box sx={{ display: "flex", flexDirection: "column", mt: sameSender ? 0.5 : 1.5 }}>
                <MessageBubble
                  message={message}
                  retryMessage={retryMessage}
                  showSeenAt={
                    (message.id || message.clientId) ===
                    (latestSeenOwnMessageKey?.id || latestSeenOwnMessageKey?.clientId)
                  }
                />
              </Box>
            </Fragment>
          );
        })}

        <div ref={bottomRef} />
      </Box>
    </Box>
  );
}
