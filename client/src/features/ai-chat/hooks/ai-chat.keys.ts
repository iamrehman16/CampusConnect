// Placeholder cache key for a thread that hasn't been created on the
// server yet — used while composing the first message of a new chat,
// before the server hands back a real conversationId (BACKLOG.md B7).
export const NEW_THREAD_KEY = 'new';

export const aiChatKeys = {
  all: ['ai-chat'] as const,
  threads: () => [...aiChatKeys.all, 'threads'] as const,
  conversation: (conversationId: string) =>
    [...aiChatKeys.all, 'conversation', conversationId] as const,
};
