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
}

export type MentorSort = "score" | "active";

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
