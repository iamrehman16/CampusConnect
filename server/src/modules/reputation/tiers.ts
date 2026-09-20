/**
 * Reputation tiers — the single source of truth for "which tier is this
 * score". `tierForScore` (pure, in-process) and `tierMongoExpression`
 * (aggregation-pipeline update) are BOTH generated from TIER_THRESHOLDS, so
 * the stored `User.tier` can never disagree with the function the tests and
 * the API describe. Clients only ever display the stored key.
 *
 * Score reference (E5): approved resource +10, unique post upvote +2.
 */
export enum ReputationTier {
  NEWCOMER = 'newcomer',
  REGULAR = 'regular',
  TRUSTED = 'trusted',
  STAR = 'star',
}

interface TierThreshold {
  tier: ReputationTier;
  minScore: number;
}

/** Highest first — evaluation order matters. */
export const TIER_THRESHOLDS: readonly TierThreshold[] = [
  { tier: ReputationTier.STAR, minScore: 150 },
  { tier: ReputationTier.TRUSTED, minScore: 50 },
  { tier: ReputationTier.REGULAR, minScore: 10 },
  { tier: ReputationTier.NEWCOMER, minScore: 0 },
];

export function tierForScore(score: number): ReputationTier {
  const match = TIER_THRESHOLDS.find((t) => score >= t.minScore);
  // Negative/NaN scores fall through to the lowest tier.
  return match?.tier ?? ReputationTier.NEWCOMER;
}

/**
 * `$switch` computing the tier from a score expression (e.g. '$contributionScore')
 * for use inside an aggregation-pipeline update.
 */
export function tierMongoExpression(
  scoreExpr: string,
): Record<string, unknown> {
  return {
    $switch: {
      branches: TIER_THRESHOLDS.filter((t) => t.minScore > 0).map((t) => ({
        case: { $gte: [scoreExpr, t.minScore] },
        then: t.tier,
      })),
      default: ReputationTier.NEWCOMER,
    },
  };
}
