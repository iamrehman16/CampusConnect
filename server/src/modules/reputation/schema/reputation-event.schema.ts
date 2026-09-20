import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReputationEventType } from '../enums/reputation-event-type.enum';

/**
 * Append-only ledger. `User.contributionScore` is a denormalized sum of these
 * rows. Rows are never updated or deleted — corrections are new (negative)
 * rows.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ReputationEvent {
  /** Who earned (or lost) the points. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ReputationEventType, required: true })
  type: ReputationEventType;

  /** Signed; negative for reversals. */
  @Prop({ required: true })
  points: number;

  /**
   * What caused it, unique per `type` (idempotency key): resourceId for
   * approvals/removals, "<postId>:<voterId>" for upvotes.
   */
  @Prop({ required: true })
  sourceId: string;

  createdAt: Date;
}

export type ReputationEventDocument = HydratedDocument<ReputationEvent>;
export const ReputationEventSchema =
  SchemaFactory.createForClass(ReputationEvent);

// Idempotency: the same cause can only ever be recorded once per type.
ReputationEventSchema.index({ type: 1, sourceId: 1 }, { unique: true });
// History + recompute.
ReputationEventSchema.index({ user: 1, createdAt: -1 });
