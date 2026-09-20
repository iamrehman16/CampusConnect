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
}

export type MentorSort = "score" | "active";

export interface MentorFilters {
  search?: string;
  department?: string;
  topic?: string;
  semesterMin?: number;
  semesterMax?: number;
  sort: MentorSort;
}
