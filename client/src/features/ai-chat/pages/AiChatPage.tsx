import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useConversation, useClearSession } from "../hooks/ai-chat.hooks";
import { useStreamMessage } from "../hooks/useStreamMessage";
import { useChatScroll } from "../hooks/useChatScroll";
import { useChatPageInit } from "../hooks/useChatPageInit";
import { AiChatHeader } from "../components/AiChatHeader";
import { AiChatMessageList } from "../components/AiChatMessageList";
import { ChatInput } from "../components/ChatInput";

export default function AiChatPage() {
  const navigate = useNavigate();
  const [prefill, setPrefill] = useState<string | undefined>(undefined);

  const { data: messages } = useConversation();
  const { sendMessage, stop, isStreaming, isFetching, streamingBubble } =
    useStreamMessage();
  const { mutate: clearSession } = useClearSession();

  const { scrollContainerRef, bottomRef, showScrollBtn, scrollToBottom } =
    useChatScroll({
      messages,
      streamingContent: streamingBubble?.content,
      isStreaming,
    });

  useChatPageInit({ sendMessage });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100svh",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <AiChatHeader
        isStreaming={isStreaming}
        showClear={messages.length > 0 && !isStreaming}
        onBack={() => navigate("/", { replace: true })}
        onClear={() => clearSession()}
      />

      <AiChatMessageList
        messages={messages}
        streamingBubble={streamingBubble}
        showScrollBtn={showScrollBtn}
        onSuggestionClick={(text) => setPrefill(text)}
        onScrollToBottom={scrollToBottom}
        scrollContainerRef={scrollContainerRef}
        bottomRef={bottomRef}
      />

      <Box
        sx={{
          px: 1.5,
          pt: 1,
          pb: 1.5,
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <ChatInput
          onSend={(message) => sendMessage({ message })}
          disabled={isStreaming} // input disabled for full duration
          isStreaming={isFetching} // stop button visible only while fetch is live
          onStop={stop}
          prefillValue={prefill}
          onPrefillConsumed={() => setPrefill(undefined)}
        />
      </Box>
    </Box>
  );
}
