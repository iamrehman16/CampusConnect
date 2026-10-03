import { ReputationTier } from '../../reputation/tiers';

/** A mentor suggested under a weak or thumbs-downed AI answer (E14). */
export interface MentorSuggestionDto {
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
  /** Their own topic/expertise labels that matched this answer. */
  matchedOn: string[];
  slotsLeft: number;
  /** Pre-fill for the mentorship request's `topic`. */
  suggestedTopic: string;
}
