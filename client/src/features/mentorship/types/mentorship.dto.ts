import type { ReputationTier } from "@/features/reputation/types/reputation.types";

/** Mirrors server MentorshipStatus (mentorship.state.ts). */
export type MentorshipStatus =
  | "pending"
  | "active"
  | "declined"
  | "cancelled"
  | "completed";

/** Which side of the mentorship the current user is looking from. */
export type MentorshipView = "mentor" | "mentee";

/** A participant — public-safe fields only (no email). */
export interface MentorshipParty {
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
  department?: string;
  semester?: number;
}

export interface Mentorship {
  id: string;
  status: MentorshipStatus;
  topic: string;
  introMessage: string;
  declineReason?: string;
  /** Set once accepted — the DM thread the mentorship happens in. */
  conversationId: string | null;
  mentor: MentorshipParty;
  mentee: MentorshipParty;
  respondedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorshipDto {
  mentorId: string;
  topic: string;
  introMessage: string;
}

/** Mirror server limits (mentorship.constants.ts) for instant form feedback. */
export const MENTORSHIP_LIMITS = {
  topicMin: 2,
  topicMax: 80,
  introMin: 20,
  introMax: 500,
  declineReasonMax: 300,
} as const;

export const OPEN_STATUSES: readonly MentorshipStatus[] = ["pending", "active"];
export const PAST_STATUSES: readonly MentorshipStatus[] = [
  "declined",
  "cancelled",
  "completed",
];
