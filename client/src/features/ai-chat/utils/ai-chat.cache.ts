// utils/ai-chat.cache.ts
// Thin wrappers around queryClient cache ops for the conversation key.
// Extracted so any future hook (e.g. useEditMessage) can reuse without
// re-implementing the get/set pattern.
import type { QueryClient } from '@tanstack/react-query';
import { aiChatKeys } from '../hooks/ai-chat.keys';
import type { ConversationMessage } from '../types/ai-chat.dto';

const getConversationKey = () => aiChatKeys.conversation();

export function getConversation(queryClient: QueryClient): ConversationMessage[] {
  return queryClient.getQueryData<ConversationMessage[]>(getConversationKey()) ?? [];
}

export function setConversation(
  queryClient: QueryClient,
  updater: (prev: ConversationMessage[]) => ConversationMessage[],
): void {
  queryClient.setQueryData<ConversationMessage[]>(
    getConversationKey(),
    (prev = []) => updater(prev),
  );
}

export function clearConversation(queryClient: QueryClient): void {
  queryClient.setQueryData<ConversationMessage[]>(getConversationKey(), []);
}