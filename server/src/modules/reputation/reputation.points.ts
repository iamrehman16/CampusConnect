import { ReputationEventType } from './enums/reputation-event-type.enum';

/** Event types with a fixed award; reversals compute their own (negative) value. */
export type AwardableEventType = Exclude<
  ReputationEventType,
  ReputationEventType.RESOURCE_REMOVED
>;

/**
 * Single source of truth for point values. Exhaustive over AwardableEventType,
 * so a new earning event won't compile until it is priced here.
 *
 * AI_CITATION is deliberately small (1) and keyed per (resource, UTC day) by
 * the listener, so repeated questions can't farm it. Planned additions (own
 * PBIs): none planned. Download milestones are deliberately NOT scored: the
 * download endpoint is public/anonymous, so the count is trivially inflatable.
 *
 * Mentorship events (E11) are keyed per mentor/mentee PAIR by the listener, so
 * repeating mentorships between the same two accounts can't farm points.
 * Only 4-5 star ratings earn points — a low rating costs the mentor nothing
 * (reputation is never reduced by feedback).
 */
export const REPUTATION_POINTS: Record<AwardableEventType, number> = {
  [ReputationEventType.RESOURCE_APPROVED]: 10,
  [ReputationEventType.POST_UPVOTE_RECEIVED]: 2,
  [ReputationEventType.AI_CITATION]: 1,
  [ReputationEventType.MENTORSHIP_COMPLETED]: 5,
  [ReputationEventType.MENTORSHIP_RATED_WELL]: 2,
};
