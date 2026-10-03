import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/** `endorser` vouches for one of `mentor`'s skills (BACKLOG.md E11). */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Endorsement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  mentor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  endorser: Types.ObjectId;

  /** The mentor's own label, as they wrote it (not what the endorser typed). */
  @Prop({ type: String, required: true, maxlength: 60 })
  tag: string;

  createdAt: Date;
}

export type EndorsementDocument = HydratedDocument<Endorsement>;
export const EndorsementSchema = SchemaFactory.createForClass(Endorsement);

// One endorsement per (mentor, endorser, tag): idempotent, can't be stacked.
EndorsementSchema.index({ mentor: 1, endorser: 1, tag: 1 }, { unique: true });
