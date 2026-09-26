// hooks/ai-chat.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "../services/ai-chat.service";
import { aiChatKeys, NEW_THREAD_KEY } from "./ai-chat.keys";
import { getConversation, setMessageFeedback } from "../utils/ai-chat.cache";
import type {
  AiConversationThread,
  ConversationMessage,
  MessageFeedback,
} from "../types/ai-chat.dto";

// ---------------------------------------------------------------------------
// useConversation
// The React Query cache is a thread's message store, keyed by
// conversationId (BACKLOG.md B7). For an existing thread whose cache entry
// is empty — a fresh browser/device with nothing persisted locally yet —
// this fetches full history from the server as the source of truth
// (BACKLOG.md B8). If the entry already has messages (an active session's
// optimistic writes, or a thread already synced this session), it's left
// alone: refetching unconditionally on every mount would race the server's
// own async persistence for a thread just created in this session
// (AiChatService only awaits appendMessages after the SSE stream's "done"
// event is already flushed to the client — see ai-chat.service.ts on the
// server), which could clobber correct optimistic messages with an
// incomplete read moments later.
//
// Exception: history that ends on a user message means the reply was never
// committed locally — the page was reloaded (or closed) mid-answer. The
// cache is persisted to IndexedDB with staleTime Infinity, so without a
// refetch that thread stayed missing its reply forever, even though the
// server had saved it. Such an entry is refetched once on mount.
// ---------------------------------------------------------------------------
export function useConversation(conversationId: string) {
  const queryClient = useQueryClient();
  const isNewThread = conversationId === NEW_THREAD_KEY;

  const cached = getConversation(queryClient, conversationId);
  const replyMissing = cached[cached.length - 1]?.role === "user";

  return useQuery<ConversationMessage[]>({
    queryKey: aiChatKeys.conversation(conversationId),
    queryFn: () => aiChatService.getMessages(conversationId),
    enabled: !isNewThread && (cached.length === 0 || replyMissing),
    // Only on mount: a send in flight also ends on a user message, but the
    // page streaming it is already mounted, so it never triggers this.
    refetchOnMount: (query) => {
      const data = query.state.data;
      return data?.[data.length - 1]?.role === "user" ? "always" : false;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: isNewThread ? [] : undefined,
  });
}

// ---------------------------------------------------------------------------
// Thread CRUD (BACKLOG.md B7) — wired to B2's ai/conversations endpoints.
// ---------------------------------------------------------------------------
// Mirrors the server's DEFAULT_CONVERSATION_TITLE (ai-conversation.schema.ts).
const DEFAULT_THREAD_TITLE = "New conversation";
const TITLE_POLL_WINDOW_MS = 30_000;

/**
 * The server names a new thread fire-and-forget, after the stream has
 * already closed (BACKLOG.md B4), so the refetch on thread resolution
 * still sees "New conversation". While a recently active thread carries
 * the default title, poll briefly until the generated one lands.
 */
function awaitingTitle(threads: AiConversationThread[] | undefined): boolean {
  const cutoff = Date.now() - TITLE_POLL_WINDOW_MS;
  return (threads ?? []).some(
    (t) => t.title === DEFAULT_THREAD_TITLE && new Date(t.updatedAt).getTime() > cutoff,
  );
}

export function useThreadsQuery() {
  return useQuery({
    queryKey: aiChatKeys.threads(),
    queryFn: () => aiChatService.getThreads(),
    staleTime: 1000 * 30,
    refetchInterval: (query) => (awaitingTitle(query.state.data) ? 2000 : false),
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => aiChatService.createThread(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.threads() });
    },
  });
}

export function useRenameThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      aiChatService.renameThread(conversationId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.threads() });
    },
  });
}

// ---------------------------------------------------------------------------
// useSetMessageFeedback (BACKLOG.md C1) — optimistic like/dislike toggle.
// Applies to the cache immediately (the toolbar needs to feel instant) and
// rolls back on failure, mirroring the pattern the streaming hooks already
// use for cache-as-local-state.
// ---------------------------------------------------------------------------
export function useSetMessageFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
      feedback,
    }: {
      conversationId: string;
      messageId: string;
      feedback: MessageFeedback | null;
    }) => aiChatService.setMessageFeedback(conversationId, messageId, feedback),
    onMutate: ({ conversationId, messageId, feedback }) => {
      const previous = getConversation(queryClient, conversationId);
      setMessageFeedback(queryClient, conversationId, messageId, feedback);
      return { previous, conversationId };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(
        aiChatKeys.conversation(context.conversationId),
        context.previous,
      );
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      aiChatService.deleteThread(conversationId),
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.threads() });
      queryClient.removeQueries({
        queryKey: aiChatKeys.conversation(conversationId),
        exact: true,
      });
    },
  });
}
