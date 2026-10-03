import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/** `blocker` has blocked `blocked` (BACKLOG.md E16). One row per direction. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class UserBlock {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blocker: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blocked: Types.ObjectId;

  createdAt: Date;
}

export type UserBlockDocument = HydratedDocument<UserBlock>;
export const UserBlockSchema = SchemaFactory.createForClass(UserBlock);

// Idempotency: blocking twice is one row.
UserBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
// "Did anyone block me?" lookups for the reverse direction.
UserBlockSchema.index({ blocked: 1, blocker: 1 });
