import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MessageRole } from '../interfaces/conversation.interface';
import {
  Citation,
  RetrievalStatus,
} from '../interfaces/retrieved-context.interface';

export type MessageStatus = 'generating' | 'complete' | 'failed';

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

  // Empty while an assistant reply is still being generated (see status).
  @Prop({ type: String, default: '' })
  content: string;

  // BACKLOG.md D12 — the assistant placeholder is inserted before generation
  // starts, so a client that left (or refreshed) mid-answer can see the reply
  // is in progress, and pick up the finished text. Absent on legacy docs,
  // which are all complete.
  @Prop({
    type: String,
    enum: ['generating', 'complete', 'failed'],
    default: 'complete',
  })
  status: MessageStatus;

  // BACKLOG.md C1 — user rating on an assistant reply. Absent means no
  // feedback given yet; not modeled as a default so "no opinion" and "not
  // asked" both look like a missing field rather than a stored 'none'.
  @Prop({ type: String, enum: ['up', 'down'] })
  feedback?: 'up' | 'down';

  // Assistant replies only. Persisted so a thread reopened from history
  // (B8 syncs from the server) still shows its sources; they used to exist
  // only in the live SSE/response payload and vanished on reload.
  @Prop({
    type: [
      {
        _id: false,
        title: String,
        pageNumber: Number,
        semester: Number,
        course: String,
        resourceId: String,
        contributor: {
          type: {
            _id: false,
            id: String,
            name: String,
            avatar: String,
            tier: String,
          },
          default: undefined,
        },
      },
    ],
    default: undefined,
  })
  citations?: Citation[];

  @Prop({ type: String, enum: ['ok', 'no-matches', 'below-threshold'] })
  retrievalStatus?: RetrievalStatus;

  createdAt: Date;
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);

AiMessageSchema.index({ conversationId: 1, createdAt: 1 });
