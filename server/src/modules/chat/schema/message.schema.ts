import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageKind } from '../enums/message-kind.enum';

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

  @Prop({ type: String, enum: MessageKind, default: MessageKind.TEXT })
  kind: MessageKind;

  /** Resource/post this message is about; null for plain text. */
  @Prop({ type: Types.ObjectId, default: null })
  contextId: Types.ObjectId | null;

  /**
   * Server-built snapshot of the referenced item, so the card renders
   * without a join and survives the item later being deleted. Never taken
   * from the client.
   */
  @Prop({
    type: { title: String, subtitle: String },
    default: null,
    _id: false,
  })
  context: { title: string; subtitle?: string } | null;

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
