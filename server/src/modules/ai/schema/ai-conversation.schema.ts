import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ChatMessage } from '../interfaces/conversation.interface';

export type AiConversationDocument = AiConversation & Document;

// Exported so ConversationService can detect "still has its default
// title" (BACKLOG.md B4's auto-title trigger, and its guard against
// overwriting a title the user already set via rename) without the
// string literal drifting out of sync with the schema default.
export const DEFAULT_CONVERSATION_TITLE = 'New conversation';

@Schema({ timestamps: true })
export class AiConversation {
  // String, not ObjectId ref, matching the legacy ConversationSession
  // convention — userId here is CurrentUser.id (a string) as used
  // throughout the ai module, not a populated Mongoose relation.
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: DEFAULT_CONVERSATION_TITLE })
  title: string;

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

  createdAt: Date;
  updatedAt: Date;
}

export const AiConversationSchema =
  SchemaFactory.createForClass(AiConversation);

// Supports listing a user's threads sorted by recency (B2) and the
// ownership-scoped lookups in ConversationService.
AiConversationSchema.index({ userId: 1, updatedAt: -1 });
