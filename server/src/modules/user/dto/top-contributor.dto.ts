import { ReputationTier } from '../../reputation/tiers';

/** A row in Community's "Top contributors" rail — public fields only. */
export interface TopContributorDto {
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
  contributionScore: number;
}
