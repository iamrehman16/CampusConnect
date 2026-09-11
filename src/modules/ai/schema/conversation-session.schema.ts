import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ChatMessage, MessageRole } from '../interfaces/conversation.interface';

export type ConversationSessionDocument = ConversationSession & Document;

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
}

export const ConversationSessionSchema =
  SchemaFactory.createForClass(ConversationSession);
