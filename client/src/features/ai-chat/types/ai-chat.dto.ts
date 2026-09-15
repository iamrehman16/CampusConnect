export interface ChatMessageDto {
  message: string;
}

export interface ChatResponseDto {
  answer: string;
  citations: Citation[];
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
  isPending?: boolean;
}
