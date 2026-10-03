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

export interface TierProgress {
  tier: ReputationTier;
  /** The next tier up, or null at the top. */
  next: { tier: ReputationTier; minScore: number } | null;
  pointsToNext: number;
  /** 0..1 progress between this tier's floor and the next tier's floor; 1 at the top. */
  fraction: number;
}

/** Where a score sits between its tier and the next (BACKLOG.md E15). */
export function tierProgress(score: number): TierProgress {
  const safe = Number.isFinite(score) && score > 0 ? score : 0;
  const tier = tierForScore(safe);
  const current = TIER_THRESHOLDS.find((t) => t.tier === tier)!;
  // Thresholds are highest-first, so the next tier up is the closest one above.
  const next =
    [...TIER_THRESHOLDS].reverse().find((t) => t.minScore > current.minScore) ??
    null;

  if (!next) return { tier, next: null, pointsToNext: 0, fraction: 1 };

  return {
    tier,
    next: { tier: next.tier, minScore: next.minScore },
    pointsToNext: next.minScore - safe,
    fraction: (safe - current.minScore) / (next.minScore - current.minScore),
  };
}
