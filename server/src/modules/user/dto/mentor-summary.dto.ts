import { Roles } from '../enums/user-role.enum';
import { ReputationTier } from '../../reputation/tiers';

/**
 * Public mentor directory entry — an explicit whitelist. Deliberately no
 * email, account status, last-seen time or any other private field.
 */
export interface MentorSummaryDto {
  id: string;
  name: string;
  avatar?: string;
  department?: string;
  semester?: number;
  role: Roles;
  tier: ReputationTier;
  contributionScore: number;
  expertise: string[];
  mentorBio?: string;
  mentorTopics: string[];
  maxActiveMentees: number;
  /** Free mentee slots right now (max minus active mentorships). */
  slotsLeft: number;
  /** Mean of 1-5 ratings from completed mentorships; null until rated (E11). */
  ratingAverage: number | null;
  ratingCount: number;
}
