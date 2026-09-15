export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ConversationSession {
  userId: string;
  summaryBuffer: string;
  recentMessages: ChatMessage[];
  updatedAt: Date;
}
