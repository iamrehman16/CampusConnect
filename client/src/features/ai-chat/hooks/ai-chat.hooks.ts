// hooks/ai-chat.hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "../services/ai-chat.service";
import { aiChatKeys } from "./ai-chat.keys";
import type { ConversationMessage } from "../types/ai-chat.dto";

// ---------------------------------------------------------------------------
// useConversation
// Treats the React Query cache as local state storage for one thread's
// messages, keyed by conversationId (BACKLOG.md B7) — queryFn returns []
// so it never hits the network; staleTime:Infinity keeps it frozen for the
// lifetime of the session (server-side history sync is BACKLOG.md B8).
// ---------------------------------------------------------------------------
export function useConversation(conversationId: string) {
  return useQuery<ConversationMessage[]>({
    queryKey: aiChatKeys.conversation(conversationId),
    queryFn: () => [],
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: [],
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
