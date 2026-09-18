import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageRole } from '../interfaces/conversation.interface';

export type AiMessageDocument = AiMessage & Document;

/**
 * Full, unsummarized message history per thread. Not read or written yet —
 * wiring every message into this collection alongside the sliding-window
 * summary in AiConversation is BACKLOG.md B3. The schema is defined now
 * because B1 fixes the thread data model as a whole, and B3 depends on it
 * existing.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AiMessage {
  @Prop({
    type: Types.ObjectId,
    ref: 'AiConversation',
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({ type: String, enum: ['user', 'assistant'], required: true })
  role: MessageRole;

  @Prop({ required: true })
  content: string;

  createdAt: Date;
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);

AiMessageSchema.index({ conversationId: 1, createdAt: 1 });
