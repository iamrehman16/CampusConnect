import type { UserRole } from "@/shared/types/enums";
import type { ReputationTier } from "@/features/reputation/types/reputation.types";

/** Public mentor directory entry (server MentorSummaryDto — no email). */
export interface MentorSummary {
  id: string;
  name: string;
  avatar?: string;
  department?: string;
  semester?: number;
  role: UserRole;
  tier: ReputationTier;
  contributionScore: number;
  expertise: string[];
  mentorBio?: string;
  mentorTopics: string[];
  maxActiveMentees: number;
  /** Free mentee slots right now. */
  slotsLeft: number;
  /** Mean of 1-5 ratings from completed mentorships; null until rated (E11). */
  ratingAverage: number | null;
  ratingCount: number;
  /** Why this mentor was recommended (only on recommended lists, BACKLOG.md E12). */
  reasons?: string[];
}

export type MentorSort = "score" | "active" | "recommended";

/** Server response of GET mentorships/recommended-mentors. */
export interface RecommendedMentors {
  mentors: MentorSummary[];
  /** False on a cold start: these are top contributors, not matches. */
  personalized: boolean;
}

export interface MentorFilters {
  search?: string;
  department?: string;
  topic?: string;
  semesterMin?: number;
  semesterMax?: number;
  /** Only mentors with a free slot. */
  hasCapacity?: boolean;
  sort: MentorSort;
}
