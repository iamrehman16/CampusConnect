import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    required: true,
    validate: (v: Types.ObjectId[]) => v.length === 2,
  })
  participants: Types.ObjectId[];

  /**
   * Deterministic key derived from the sorted participant ids
   * ("<id1>_<id2>"), used to enforce "one conversation per pair" — see
   * chat.service.ts#buildParticipantsKey. A unique index directly on
   * `participants` (an array) is a MongoDB multikey index: uniqueness is
   * enforced per array *element*, not per array, so it would block any
   * user from ever being in more than one conversation at all, not just
   * duplicate pairs. Confirmed empirically against a real MongoDB
   * instance while investigating BACKLOG.md A9.
   */
  @Prop({ type: String, required: true })
  participantsKey: string;

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  lastMessage: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  lastMessageAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Partial: only applies where participantsKey exists, so pre-migration
// documents missing the field (see chat.service.ts's backfillParticipantsKeys,
// run on startup) can't collide with each other on a shared `null` value
// before the backfill has had a chance to run.
ConversationSchema.index(
  { participantsKey: 1 },
  {
    unique: true,
    partialFilterExpression: { participantsKey: { $exists: true } },
  },
);
// Non-unique — supports getUserConversations' `find({ participants: userId })`.
ConversationSchema.index({ participants: 1 });
