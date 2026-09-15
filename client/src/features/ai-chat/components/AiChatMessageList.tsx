import { Box, IconButton } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
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
}

export function AiChatMessageList({
  messages,
  streamingBubble,
  showScrollBtn,
  onSuggestionClick,
  onScrollToBottom,
  scrollContainerRef,
  bottomRef,
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
          px: 1.75,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          bgcolor: "background.default",
          "&::-webkit-scrollbar": { width: 3 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 4 },
        }}
      >
        {messages.length === 0 && !streamingBubble ? (
          <ChatEmptyState onSuggestionClick={onSuggestionClick} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streamingBubble && (
              <MessageBubble
                key={streamingBubble.id}
                message={streamingBubble}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Button lives outside the scroll container, anchored to the shell */}
      {showScrollBtn && (
        <IconButton
          onClick={onScrollToBottom}
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 3,
            zIndex: 2,
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )}
    </Box>
  );
}
