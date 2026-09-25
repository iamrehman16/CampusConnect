import { Box, IconButton } from "@mui/material";
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@/shared/icons";
import { MessageBubble } from "./MessageBubble";
import { ChatEmptyState } from "./ChatEmptyState";
import type { ConversationMessage } from "../types/ai-chat.dto";

interface AiChatMessageListProps {
  messages: ConversationMessage[];
  streamingBubble: ConversationMessage | null;
  showScrollBtn: boolean;
  onSuggestionClick: (text: string) => void;
  onScrollToBottom: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  // BACKLOG.md C1 — MessageBubble needs this to address the feedback
  // endpoint. Always the real thread id by the time a bubble can show a
  // toolbar (isPending is false), even for a just-resolved new thread —
  // see useStreamMessage's onThreadResolved/navigate ordering.
  conversationId: string;
}

export function AiChatMessageList({
  messages,
  streamingBubble,
  showScrollBtn,
  onSuggestionClick,
  onScrollToBottom,
  scrollContainerRef,
  bottomRef,
  conversationId,
}: AiChatMessageListProps) {
  return (
    // Shell: takes the flex-1 slot, clips the absolute button correctly
    <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>
      {/* Scroll container — no longer owns the button */}
      <Box
        ref={scrollContainerRef}
        sx={{
          height: "100%",
          overflowY: "auto",
          px: { xs: 1.75, sm: 3 },
          py: 3,
          display: "flex",
          flexDirection: "column",
          bgcolor: "surface.card",
          "&::-webkit-scrollbar": { width: 3 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 4 },
        }}
      >
        {/* Centred reading column (~760px), like the composer below. */}
        <Box sx={{ width: "100%", maxWidth: 760, mx: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {messages.length === 0 && !streamingBubble ? (
          <ChatEmptyState onSuggestionClick={onSuggestionClick} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                conversationId={conversationId}
              />
            ))}
            {streamingBubble && (
              <MessageBubble
                key={streamingBubble.id}
                message={streamingBubble}
                conversationId={conversationId}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
        </Box>
      </Box>

      {/* Button lives outside the scroll container, anchored to the shell */}
      {showScrollBtn && (
        <IconButton
          onClick={onScrollToBottom}
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            bgcolor: "surface.overlay",
            border: "1px solid",
            borderColor: "border.default",
            boxShadow: (t) => t.shadows[2],
            zIndex: 2,
            "&:hover": { bgcolor: "surface.subtle" },
          }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )}
    </Box>
  );
}
