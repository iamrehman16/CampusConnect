import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Roles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { HydratedDocument } from 'mongoose';
import { ReputationTier } from '../../reputation/tiers';

@Schema({
  timestamps: true,
  toJSON: {
    transform(doc, ret: Record<string, unknown>) {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: '' })
  name?: string;

  @Prop({ default: null, select: false })
  hashedRefreshToken?: string;

  @Prop({ default: Roles.STUDENT, type: String, enum: Roles })
  role: Roles;

  @Prop({ required: false }) //bio
  academicInfo?: string;

  @Prop({ default: 0 })
  contributionScore: number;

  /**
   * Derived from contributionScore via tierForScore(); written only together
   * with the score (see UserService) so it is always consistent.
   */
  @Prop({
    type: String,
    enum: ReputationTier,
    default: ReputationTier.NEWCOMER,
  })
  tier: ReputationTier;

  @Prop({ default: UserStatus.ACTIVE, enum: UserStatus, type: String })
  accountStatus: UserStatus;

  @Prop({ required: false, min: 1, max: 8 })
  semester?: number;

  @Prop({ required: false })
  department?: string;

  @Prop({ required: false, default: false })
  isOpenToMentor?: boolean;

  // ── Mentor profile (BACKLOG.md E8) ─────────────────────────────────────
  /** What this person helps with, in their own words. */
  @Prop({ required: false, maxlength: 500 })
  mentorBio?: string;

  /** Subjects/courses they will mentor on (drives E9 directory filters). */
  @Prop({ type: [String], default: [] })
  mentorTopics?: string[];

  /** Cap on simultaneous mentees; enforced when accepting requests (E10). */
  @Prop({ required: false, default: 3, min: 1, max: 10 })
  maxActiveMentees?: number;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ type: [String], default: [] })
  interests?: string[];

  @Prop({ type: [String], default: [] })
  expertise?: string[];

  @Prop({ required: false, default: false })
  isOnboarded?: boolean;

  // Set when a user's last chat socket disconnects (see PresenceService).
  @Prop({ type: Date, default: null })
  lastSeenAt?: Date | null;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ name: 'text', email: 'text' });
// Mentor directory (E9): open mentors, best-reputation first.
UserSchema.index({ isOpenToMentor: 1, contributionScore: -1 });
