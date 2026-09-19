// hooks/ai-chat.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "../services/ai-chat.service";
import { aiChatKeys, NEW_THREAD_KEY } from "./ai-chat.keys";
import { getConversation } from "../utils/ai-chat.cache";
import type { ConversationMessage } from "../types/ai-chat.dto";

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
// ---------------------------------------------------------------------------
export function useConversation(conversationId: string) {
  const queryClient = useQueryClient();
  const isNewThread = conversationId === NEW_THREAD_KEY;

  return useQuery<ConversationMessage[]>({
    queryKey: aiChatKeys.conversation(conversationId),
    queryFn: () => aiChatService.getMessages(conversationId),
    enabled:
      !isNewThread &&
      getConversation(queryClient, conversationId).length === 0,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: isNewThread ? [] : undefined,
  });
}

// ---------------------------------------------------------------------------
// Thread CRUD (BACKLOG.md B7) — wired to B2's ai/conversations endpoints.
// ---------------------------------------------------------------------------
export function useThreadsQuery() {
  return useQuery({
    queryKey: aiChatKeys.threads(),
    queryFn: () => aiChatService.getThreads(),
    staleTime: 1000 * 30,
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
