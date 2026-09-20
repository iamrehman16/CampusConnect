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
 * Planned additions (own PBIs): AI citation (E14), mentorship completed /
 * rated (E11). Download milestones are deliberately NOT scored: the download
 * endpoint is public/anonymous, so the count is trivially inflatable.
 */
export const REPUTATION_POINTS: Record<AwardableEventType, number> = {
  [ReputationEventType.RESOURCE_APPROVED]: 10,
  [ReputationEventType.POST_UPVOTE_RECEIVED]: 2,
};
