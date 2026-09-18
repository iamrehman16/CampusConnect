export interface ChatMessageDto {
  message: string;
}

export type RetrievalStatus = "ok" | "no-matches" | "below-threshold";

export interface ChatResponseDto {
  answer: string;
  citations: Citation[];
  retrievalStatus: RetrievalStatus;
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
