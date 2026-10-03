import type { ReputationTier } from "@/features/reputation/types/reputation.types";

/** GET /dashboard/me/impact (BACKLOG.md E15). */
export interface MyImpact {
  score: number;
  tier: ReputationTier;
  /** Null at the top tier. */
  nextTier: { tier: ReputationTier; minScore: number; pointsToGo: number } | null;
  /** 0..1 progress between the current tier's floor and the next one's. */
  tierFraction: number;
  /** Running score for each of the last 30 days, oldest first. */
  history: { date: string; score: number }[];
  pointsThisMonth: number;
  resources: number;
  downloads: number;
  aiCitations: number;
  mentees: { active: number; completed: number };
  rating: { average: number | null; count: number };
}
