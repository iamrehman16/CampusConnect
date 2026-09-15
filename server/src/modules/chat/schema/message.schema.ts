import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 2000 })
  content: string;

  @Prop({ type: Boolean, default: false })
  seen: boolean;

  @Prop({ type: Date, default: null })
  seenAt: Date | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: String, required: true, unique: true })
  clientId: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// the most common query: give me all messages for this conversation, newest first
MessageSchema.index({ conversationId: 1, createdAt: -1 });
