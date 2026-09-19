export interface ChatMessageDto {
  message: string;
  // Omitted on the first message of a new thread — the server creates one
  // and returns its id on ChatResponseDto/the SSE citations event (B7).
  conversationId?: string;
}

export type RetrievalStatus = "ok" | "no-matches" | "below-threshold";

export interface ChatResponseDto {
  answer: string;
  citations: Citation[];
  retrievalStatus: RetrievalStatus;
  conversationId: string;
}

// A thread in the sidebar (BACKLOG.md B7) — server's AiConversation without
// summaryBuffer/recentMessages, which the sidebar has no use for.
export interface AiConversationThread {
  id: string;
  title: string;
  updatedAt: string;
}

export interface Citation {
  title: string;
  pageNumber: number;
  semester: number;
  course: string;
  resourceId: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  retrievalStatus?: RetrievalStatus;
  isPending?: boolean;
}
