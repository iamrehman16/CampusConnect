import { ReputationTier } from '../../reputation/tiers';
import { MentorshipStatus } from '../mentorship.state';

/** A participant, public-safe fields only (no email). */
export interface MentorshipPartyDto {
  id: string;
  name: string;
  avatar?: string;
  tier: ReputationTier;
  department?: string;
  semester?: number;
}

/** The mentee's rating of a completed mentorship (E11); visible to both parties. */
export interface MentorshipFeedbackDto {
  rating: number;
  review?: string;
  ratedAt: Date;
  /** Until when the mentee may still change it. */
  editableUntil: Date;
}

export interface MentorshipDto {
  id: string;
  status: MentorshipStatus;
  topic: string;
  introMessage: string;
  declineReason?: string;
  conversationId: string | null;
  mentor: MentorshipPartyDto;
  mentee: MentorshipPartyDto;
  respondedAt: Date | null;
  completedAt: Date | null;
  feedback?: MentorshipFeedbackDto;
  createdAt: Date;
  updatedAt: Date;
}
