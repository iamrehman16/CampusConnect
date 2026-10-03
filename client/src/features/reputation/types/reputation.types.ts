/** Mirrors server `ReputationTier` (reputation/tiers.ts). The server decides the tier; the client only displays it. */
export type ReputationTier = "newcomer" | "regular" | "trusted" | "star";

export interface Badge {
  key: string;
  label: string;
  description: string;
}

export type LeaderboardPeriod = "month" | "all";

/** GET /reputation/leaderboard (BACKLOG.md E15). */
export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
  /** This month's earned points, or lifetime reputation, per the period. */
  points: number;
}
