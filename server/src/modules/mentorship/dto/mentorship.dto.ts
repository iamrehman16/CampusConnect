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
  createdAt: Date;
  updatedAt: Date;
}
