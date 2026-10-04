import type { ReputationTier } from "@/features/reputation/types/reputation.types";
export interface ChatMessageDto {
  message: string;
  // Omitted on the first message of a new thread — the server creates one
  // and returns its id on ChatResponseDto/the SSE citations event (B7).
  conversationId?: string;
  // A failed reply being retried: the server replaces it (and the question
  // it answered) instead of duplicating the question (BACKLOG.md D12).
  retryOfMessageId?: string;
}

export type RetrievalStatus = "ok" | "no-matches" | "below-threshold";

export interface ChatResponseDto {
  answer: string;
  citations: Citation[];
  retrievalStatus: RetrievalStatus;
  conversationId: string;
  messageId: string;
}

export type MessageFeedback = "up" | "down";

// A thread in the sidebar (BACKLOG.md B7) — server's AiConversation without
// summaryBuffer/recentMessages, which the sidebar has no use for.
export interface AiConversationThread {
  id: string;
  title: string;
  updatedAt: string;
}

/** Uploader of a cited resource (BACKLOG.md E14). */
export interface CitationContributor {
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
}

export interface Citation {
  title: string;
  pageNumber: number;
  semester: number;
  course: string;
  resourceId: string;
  contributor?: CitationContributor;
}

/** A mentor suggested under a weak or thumbs-downed answer (BACKLOG.md E14). */
export interface MentorSuggestion {
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
  /** The mentor's own topic labels that matched this answer. */
  matchedOn: string[];
  slotsLeft: number;
  /** Pre-fill for the mentorship request topic. */
  suggestedTopic: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  retrievalStatus?: RetrievalStatus;
  isPending?: boolean;
  // Server-side state of an assistant reply (BACKLOG.md D12). Locally
  // committed bubbles leave it unset, meaning complete.
  status?: MessageStatus;
  feedback?: MessageFeedback | null;
}

export type MessageStatus = "generating" | "complete" | "failed";
