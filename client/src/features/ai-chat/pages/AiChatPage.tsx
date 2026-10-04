import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Box, CircularProgress, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useConversation, useThreadsQuery } from "../hooks/ai-chat.hooks";
import { useStreamMessage } from "../hooks/useStreamMessage";
import { useChatScroll } from "../hooks/useChatScroll";
import { useChatPageInit } from "../hooks/useChatPageInit";
import { moveConversationCache, setConversation } from "../utils/ai-chat.cache";
import { aiChatKeys, NEW_THREAD_KEY } from "../hooks/ai-chat.keys";
import { AiChatHeader } from "../components/AiChatHeader";
import { AiChatMessageList } from "../components/AiChatMessageList";
import { ChatInput } from "../components/ChatInput";
import { ThreadSidebar } from "../components/ThreadSidebar";
import { ROUTES } from "@/shared/constants/routes";
import InlineError from "@/shared/components/feedback/InlineError";

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
  const {
    data: messages,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useConversation(conversationId);

  const onThreadResolved = useCallback(
    (newConversationId: string) => {
      moveConversationCache(queryClient, NEW_THREAD_KEY, newConversationId);
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.threads() });
      navigate(`${ROUTES.AI_CHAT}/${newConversationId}`, { replace: true });
    },
    [queryClient, navigate],
  );

  const {
    sendMessage,
    stop,
    retry,
    isStreaming,
    isFetching,
    streamingBubble,
    streamError,
  } = useStreamMessage({ conversationId, onThreadResolved });

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

  // BACKLOG.md D12: the tail of the saved history says whether a reply is
  // still being produced (possibly by a stream this page didn't start) or
  // failed on the server.
  const tail = messages?.[messages.length - 1];
  const replyGenerating = tail?.status === "generating";
  const failedReply = tail?.role === "assistant" && tail.status === "failed";

  const handleRetryFailed = () => {
    if (!failedReply || !tail) return;
    const question = messages?.[messages.length - 2];
    if (question?.role !== "user") return;
    // Drop both from the cache; the server replaces them on retry and the
    // send below re-adds the question.
    setConversation(queryClient, conversationId, (prev) =>
      prev.filter((m) => m.id !== tail.id && m.id !== question.id),
    );
    void sendMessage(
      { message: question.content, conversationId: routeConversationId },
      { retryOfMessageId: tail.id },
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // Fill the shell's content area (was 100svh, which overflowed the
        // desktop layout by the top bar's height).
        height: "100%",
        bgcolor: "surface.card",
        overflow: "hidden",
      }}
    >
      <AiChatHeader
        isStreaming={isStreaming}
        title={activeTitle}
        onBack={isDesktop ? undefined : () => navigate("/", { replace: true })}
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
      ) : isHistoryError && !messages?.length ? (
        // A failed load must not fall through to the "new chat" empty state.
        <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 3 }}>
          <InlineError message="Couldn't load this conversation." onRetry={refetchHistory} />
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
          conversationId={conversationId}
        />
      )}

      <Box
        sx={{
          px: { xs: 1.5, sm: 3 },
          pt: 1,
          pb: { xs: 1.5, sm: 2.5 },
          bgcolor: "surface.card",
          flexShrink: 0,
        }}
      >
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
        {failedReply && !streamError && !isStreaming && (
          <Box sx={{ mb: 1 }}>
            <InlineError
              message="This answer couldn't be completed."
              onRetry={handleRetryFailed}
            />
          </Box>
        )}
        {streamError && (
          <Box sx={{ mb: 1 }}>
            <InlineError message={streamError} onRetry={retry} />
          </Box>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming || replyGenerating} // input disabled for full duration
          isStreaming={isFetching} // stop button visible only while fetch is live
          onStop={stop}
          prefillValue={prefill}
          onPrefillConsumed={() => setPrefill(undefined)}
        />
        </Box>
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
