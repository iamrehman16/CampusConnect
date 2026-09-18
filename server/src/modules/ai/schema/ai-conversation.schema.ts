import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ChatMessage } from '../interfaces/conversation.interface';

export type AiConversationDocument = AiConversation & Document;

@Schema({ timestamps: true })
export class AiConversation {
  // String, not ObjectId ref, matching the legacy ConversationSession
  // convention — userId here is CurrentUser.id (a string) as used
  // throughout the ai module, not a populated Mongoose relation.
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: 'New conversation' })
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
