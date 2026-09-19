/**
 * Distinguishes why no citations were returned, so the caller isn't left
 * treating "no documents matched at all" and "matches existed but were too
 * weak to trust" as the same silent empty array.
 */
export type RetrievalStatus = 'ok' | 'no-matches' | 'below-threshold';

export interface RetrievalResult {
  context: RetrievedContext[];
  status: RetrievalStatus;
  memories: MemoryRecall[];
}

/**
 * A recalled fact from a past conversation (BACKLOG.md B6) — distinct
 * from a document Citation. Never surfaced to the client as a citation;
 * it's context injected into buildMessages, not a source the user can
 * click through to.
 */
export interface MemoryRecall {
  text: string;
  conversationId: string;
  score: number;
  createdAt: Date;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  retrievalStatus: RetrievalStatus;
  conversationId: string;
}

export interface Citation {
  title: string;
  pageNumber: number;
  semester: number;
  course: string;
  resourceId: string;
}

export interface RetrievedContext {
  text: string;
  pageNumber: number;
  title: string;
  resourceId: string;
  semester: number;
  course: string;
  score: number;
}
