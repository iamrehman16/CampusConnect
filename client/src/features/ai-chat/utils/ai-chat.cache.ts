// utils/ai-chat.cache.ts
// Thin wrappers around queryClient cache ops, keyed per-conversationId
// (BACKLOG.md B7) rather than the single global key this used to be —
// every thread gets its own cache entry.
import type { QueryClient } from '@tanstack/react-query';
import { aiChatKeys } from '../hooks/ai-chat.keys';
import type { ConversationMessage } from '../types/ai-chat.dto';

export function getConversation(
  queryClient: QueryClient,
  conversationId: string,
): ConversationMessage[] {
  return (
    queryClient.getQueryData<ConversationMessage[]>(
      aiChatKeys.conversation(conversationId),
    ) ?? []
  );
}

export function setConversation(
  queryClient: QueryClient,
  conversationId: string,
  updater: (prev: ConversationMessage[]) => ConversationMessage[],
): void {
  queryClient.setQueryData<ConversationMessage[]>(
    aiChatKeys.conversation(conversationId),
    (prev = []) => updater(prev),
  );
}

export function clearConversation(
  queryClient: QueryClient,
  conversationId: string,
): void {
  queryClient.setQueryData<ConversationMessage[]>(
    aiChatKeys.conversation(conversationId),
    [],
  );
}

/**
 * Migrates the in-progress "new thread" cache entry onto the real
 * conversationId the server just returned (BACKLOG.md B7) — the first
 * message of a new chat is sent without a conversationId, so its
 * optimistic bubbles live under NEW_THREAD_KEY until the response
 * resolves. Removes the placeholder entry so it doesn't linger and get
 * reused by the next new-thread compose session.
 */
export function moveConversationCache(
  queryClient: QueryClient,
  fromConversationId: string,
  toConversationId: string,
): void {
  const messages = getConversation(queryClient, fromConversationId);
  queryClient.setQueryData<ConversationMessage[]>(
    aiChatKeys.conversation(toConversationId),
    messages,
  );
  queryClient.removeQueries({
    queryKey: aiChatKeys.conversation(fromConversationId),
    exact: true,
  });
}
