export enum ReputationEventType {
  RESOURCE_APPROVED = 'resource_approved',
  /** Negative: reverses everything earned from one resource when it is removed. */
  RESOURCE_REMOVED = 'resource_removed',
  POST_UPVOTE_RECEIVED = 'post_upvote_received',
  /** A resource backed an AI answer (BACKLOG.md E14); once per resource per day. */
  AI_CITATION = 'ai_citation',
}
