import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MentorshipStatus, OPEN_STATUSES } from '../mentorship.state';
import {
  DECLINE_REASON_MAX,
  INTRO_MAX,
  TOPIC_MAX,
} from '../mentorship.constants';

@Schema({ timestamps: true })
export class Mentorship {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  mentor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  mentee: Types.ObjectId;

  @Prop({
    type: String,
    enum: MentorshipStatus,
    default: MentorshipStatus.PENDING,
  })
  status: MentorshipStatus;

  @Prop({ required: true, maxlength: TOPIC_MAX })
  topic: string;

  @Prop({ required: true, maxlength: INTRO_MAX })
  introMessage: string;

  @Prop({ type: String, maxlength: DECLINE_REASON_MAX })
  declineReason?: string;

  /** Set when accepted — the DM thread this mentorship happens in. */
  @Prop({ type: Types.ObjectId, ref: 'Conversation', default: null })
  conversationId: Types.ObjectId | null;

  /** When the mentor accepted/declined (or the mentee cancelled). */
  @Prop({ type: Date, default: null })
  respondedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  completedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export type MentorshipDocument = HydratedDocument<Mentorship>;
export const MentorshipSchema = SchemaFactory.createForClass(Mentorship);

// At most ONE open (pending or active) mentorship per mentor->mentee pair,
// enforced by the database — no check-then-insert race. Partial so finished
// ones (declined/cancelled/completed) never block a fresh request.
MentorshipSchema.index(
  { mentor: 1, mentee: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [...OPEN_STATUSES] } },
  },
);
// Mentor inbox / mentee list.
MentorshipSchema.index({ mentor: 1, status: 1, createdAt: -1 });
MentorshipSchema.index({ mentee: 1, status: 1, createdAt: -1 });
