import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Box, CircularProgress, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useConversation, useThreadsQuery } from "../hooks/ai-chat.hooks";
import { useStreamMessage } from "../hooks/useStreamMessage";
import { useChatScroll } from "../hooks/useChatScroll";
import { useChatPageInit } from "../hooks/useChatPageInit";
import { moveConversationCache } from "../utils/ai-chat.cache";
import { aiChatKeys, NEW_THREAD_KEY } from "../hooks/ai-chat.keys";
import { AiChatHeader } from "../components/AiChatHeader";
import { AiChatMessageList } from "../components/AiChatMessageList";
import { ChatInput } from "../components/ChatInput";
import { ThreadSidebar } from "../components/ThreadSidebar";
import { ROUTES } from "@/shared/constants/routes";

export default function AiChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [threadsDrawerOpen, setThreadsDrawerOpen] = useState(false);

  // No :conversationId → composing a brand new thread. The server assigns
  // a real id on the first response (BACKLOG.md B7); until then messages
  // live under the NEW_THREAD_KEY cache entry.
  const { conversationId: routeConversationId } = useParams();
  const conversationId = routeConversationId ?? NEW_THREAD_KEY;

  const { data: threads } = useThreadsQuery();
  const activeTitle = useMemo(
    () => threads?.find((t) => t.id === routeConversationId)?.title,
    [threads, routeConversationId],
  );

  // BACKLOG.md B8 — for an existing thread with nothing cached locally yet
  // (fresh browser/device), useConversation fetches full history from the
  // server; `data` is undefined until that resolves.
  const { data: messages, isLoading: isHistoryLoading } =
    useConversation(conversationId);

  const onThreadResolved = useCallback(
    (newConversationId: string) => {
      moveConversationCache(queryClient, NEW_THREAD_KEY, newConversationId);
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.threads() });
      navigate(`${ROUTES.AI_CHAT}/${newConversationId}`, { replace: true });
    },
    [queryClient, navigate],
  );

  const { sendMessage, stop, isStreaming, isFetching, streamingBubble } =
    useStreamMessage({ conversationId, onThreadResolved });

  const { scrollContainerRef, bottomRef, showScrollBtn, scrollToBottom } =
    useChatScroll({
      messages: messages ?? [],
      streamingContent: streamingBubble?.content,
      isStreaming,
    });

  useChatPageInit({ sendMessage });

  const handleSend = (message: string) => {
    sendMessage({ message, conversationId: routeConversationId });
  };

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
        title={activeTitle}
        onBack={() => navigate("/", { replace: true })}
        onOpenThreads={isDesktop ? undefined : () => setThreadsDrawerOpen(true)}
      />

      {isHistoryLoading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : (
        <AiChatMessageList
          messages={messages ?? []}
          streamingBubble={streamingBubble}
          showScrollBtn={showScrollBtn}
          onSuggestionClick={(text) => setPrefill(text)}
          onScrollToBottom={scrollToBottom}
          scrollContainerRef={scrollContainerRef}
          bottomRef={bottomRef}
        />
      )}

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
          onSend={handleSend}
          disabled={isStreaming} // input disabled for full duration
          isStreaming={isFetching} // stop button visible only while fetch is live
          onStop={stop}
          prefillValue={prefill}
          onPrefillConsumed={() => setPrefill(undefined)}
        />
      </Box>

      {!isDesktop && (
        <Drawer
          anchor="left"
          open={threadsDrawerOpen}
          onClose={() => setThreadsDrawerOpen(false)}
          PaperProps={{ sx: { width: 280 } }}
        >
          <ThreadSidebar onNavigate={() => setThreadsDrawerOpen(false)} />
        </Drawer>
      )}
    </Box>
  );
}
