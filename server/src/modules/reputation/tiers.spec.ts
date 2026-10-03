import {
  tierProgress,
  ReputationTier,
  TIER_THRESHOLDS,
  tierForScore,
  tierMongoExpression,
} from './tiers';

describe('tierForScore', () => {
  it.each([
    [0, ReputationTier.NEWCOMER],
    [9, ReputationTier.NEWCOMER],
    [10, ReputationTier.REGULAR],
    [49, ReputationTier.REGULAR],
    [50, ReputationTier.TRUSTED],
    [149, ReputationTier.TRUSTED],
    [150, ReputationTier.STAR],
    [10_000, ReputationTier.STAR],
  ])('score %i -> %s', (score, tier) => {
    expect(tierForScore(score)).toBe(tier);
  });

  it('treats negative and NaN scores as the lowest tier', () => {
    expect(tierForScore(-5)).toBe(ReputationTier.NEWCOMER);
    expect(tierForScore(Number.NaN)).toBe(ReputationTier.NEWCOMER);
  });

  it('thresholds are strictly descending so first-match evaluation is correct', () => {
    const mins = TIER_THRESHOLDS.map((t) => t.minScore);
    expect([...mins].sort((a, b) => b - a)).toEqual(mins);
    expect(new Set(mins).size).toBe(mins.length);
    expect(mins[mins.length - 1]).toBe(0);
  });
});

describe('tierMongoExpression', () => {
  interface SwitchExpr {
    $switch: {
      branches: { case: { $gte: [string, number] }; then: ReputationTier }[];
      default: ReputationTier;
    };
  }

  // Evaluate the generated $switch in JS to prove it agrees with tierForScore
  // for every score — this is what guarantees the stored tier == the function.
  function evaluate(expr: SwitchExpr, score: number): ReputationTier {
    for (const b of expr.$switch.branches) {
      if (score >= b.case.$gte[1]) return b.then;
    }
    return expr.$switch.default;
  }

  it('agrees with tierForScore for every score in range', () => {
    const expr = tierMongoExpression(
      '$contributionScore',
    ) as unknown as SwitchExpr;
    for (let score = 0; score <= 400; score++) {
      expect(evaluate(expr, score)).toBe(tierForScore(score));
    }
  });

  it('references the given score expression', () => {
    const expr = tierMongoExpression(
      '$contributionScore',
    ) as unknown as SwitchExpr;
    expect(
      expr.$switch.branches.every(
        (b) => b.case.$gte[0] === '$contributionScore',
      ),
    ).toBe(true);
  });
});

describe('tierProgress (E15)', () => {
  it('reports progress inside a tier and the points to the next one', () => {
    // regular is 10..49, trusted starts at 50
    const p = tierProgress(30);

    expect(p.tier).toBe(ReputationTier.REGULAR);
    expect(p.next).toEqual({ tier: ReputationTier.TRUSTED, minScore: 50 });
    expect(p.pointsToNext).toBe(20);
    expect(p.fraction).toBeCloseTo(0.5);
  });

  it('is at 0 progress exactly on a tier floor', () => {
    expect(tierProgress(10).fraction).toBe(0);
    expect(tierProgress(50).tier).toBe(ReputationTier.TRUSTED);
  });

  it('starts from newcomer, including zero and bad input', () => {
    for (const bad of [0, -5, Number.NaN]) {
      const p = tierProgress(bad);
      expect(p.tier).toBe(ReputationTier.NEWCOMER);
      expect(p.next?.tier).toBe(ReputationTier.REGULAR);
      expect(p.pointsToNext).toBe(10);
    }
  });

  it('is complete, with no next tier, at the top', () => {
    const p = tierProgress(400);

    expect(p.tier).toBe(ReputationTier.STAR);
    expect(p.next).toBeNull();
    expect(p.fraction).toBe(1);
    expect(p.pointsToNext).toBe(0);
  });
});
