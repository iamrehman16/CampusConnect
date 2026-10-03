import { ReputationTier } from '../../reputation/tiers';
import { ScorePoint } from '../../reputation/impact-series';

/** "My impact" for a contributor (BACKLOG.md E15). */
export interface MyImpactDto {
  score: number;
  tier: ReputationTier;
  /** Progress toward the next tier; `next` is null at the top tier. */
  nextTier: {
    tier: ReputationTier;
    minScore: number;
    pointsToGo: number;
  } | null;
  /** 0..1 progress between the current tier's floor and the next one's. */
  tierFraction: number;
  /** Running score for each of the last 30 days, oldest first. */
  history: ScorePoint[];
  pointsThisMonth: number;
  resources: number;
  downloads: number;
  /** Distinct (resource, day) AI citations credited to this user, all time. */
  aiCitations: number;
  mentees: { active: number; completed: number };
  rating: { average: number | null; count: number };
}
