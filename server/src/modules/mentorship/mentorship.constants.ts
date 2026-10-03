export const INTRO_MIN = 20;
export const INTRO_MAX = 500;
export const TOPIC_MIN = 2;
export const TOPIC_MAX = 80;
export const DECLINE_REASON_MAX = 300;

/** Spam guard: how many requests one student may have waiting at once. */
export const MAX_PENDING_REQUESTS_PER_MENTEE = 5;

export const REVIEW_MAX = 500;

/** How long after rating a mentee may still change it; immutable after. */
export const RATING_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
