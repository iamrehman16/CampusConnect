import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageContext, MessageKind } from '../types/message-context';

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

  @Prop({
    type: String,
    enum: Object.values(MessageKind),
    default: MessageKind.TEXT,
  })
  kind: MessageKind;

  // Present only when kind !== 'text'. Snapshot resolved server-side (E13).
  @Prop({
    type: {
      _id: false,
      refId: { type: Types.ObjectId, required: true },
      title: { type: String, required: true },
      subtitle: { type: String },
    },
    default: undefined,
  })
  context?: MessageContext;

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
