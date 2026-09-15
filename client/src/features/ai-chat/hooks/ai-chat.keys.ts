export const aiChatKeys = {
  all: ['ai-chat'] as const,
  conversation: () => [...aiChatKeys.all, 'conversation'] as const,
};