import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ChatMessage } from '../interfaces/conversation.interface';

export type ConversationSessionDocument = ConversationSession & Document;

/**
 * Legacy singleton (one document per user, ever) — superseded by
 * AiConversation (BACKLOG.md B1), which supports many threads per user.
 * Kept read-only as the source for ConversationService's one-time startup
 * migration (see onModuleInit); nothing writes to this collection anymore.
 * Not deleted so the migration is auditable/re-runnable rather than
 * destructive — see `migratedAt`.
 */
@Schema({ timestamps: true })
export class ConversationSession {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: '' })
  summaryBuffer: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  recentMessages: ChatMessage[];

  // Set once this doc's state has been copied into an AiConversation.
  // Absence (not just falsy) is the "needs migration" signal, matching the
  // `{ $exists: false }` backfill pattern already used for
  // participantsKey in chat.service.ts.
  @Prop({ type: Date, default: null })
  migratedAt: Date | null;
}

export const ConversationSessionSchema =
  SchemaFactory.createForClass(ConversationSession);
