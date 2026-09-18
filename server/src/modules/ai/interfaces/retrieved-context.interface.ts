/**
 * Distinguishes why no citations were returned, so the caller isn't left
 * treating "no documents matched at all" and "matches existed but were too
 * weak to trust" as the same silent empty array.
 */
export type RetrievalStatus = 'ok' | 'no-matches' | 'below-threshold';

export interface RetrievalResult {
  context: RetrievedContext[];
  status: RetrievalStatus;
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
