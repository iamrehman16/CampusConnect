import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '../enums/report.enums';

/**
 * A message copied at report time. Reports keep their own copy so the
 * evidence survives the sender soft-deleting (or later removing) the message.
 */
@Schema({ _id: false })
export class ReportEvidence {
  @Prop({ type: Types.ObjectId, required: true })
  messageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: String, required: true, maxlength: 2000 })
  content: string;

  @Prop({ type: Date, required: true })
  sentAt: Date;

  /** The sender had already deleted it when it was reported. */
  @Prop({ type: Boolean, default: false })
  wasDeleted: boolean;
}

export const ReportEvidenceSchema =
  SchemaFactory.createForClass(ReportEvidence);

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  /** The person the report is about (message sender / other participant / user). */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reportedUser: Types.ObjectId;

  @Prop({ type: String, enum: ReportTargetType, required: true })
  targetType: ReportTargetType;

  /** `<targetType>:<id>` — the dedupe key for "already reported this". */
  @Prop({ type: String, required: true })
  targetKey: string;

  @Prop({ type: Types.ObjectId })
  messageId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  conversationId?: Types.ObjectId;

  @Prop({ type: String, enum: ReportReason, required: true })
  reason: ReportReason;

  @Prop({ type: String, maxlength: 500, trim: true })
  details?: string;

  @Prop({ type: [ReportEvidenceSchema], default: [] })
  evidence: ReportEvidence[];

  @Prop({
    type: String,
    enum: ReportStatus,
    default: ReportStatus.OPEN,
    index: true,
  })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: String, maxlength: 500, trim: true })
  resolutionNote?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ReportDocument = HydratedDocument<Report>;
export const ReportSchema = SchemaFactory.createForClass(Report);

// One OPEN report per (reporter, target); once resolved they may report again.
ReportSchema.index(
  { reporter: 1, targetKey: 1 },
  { unique: true, partialFilterExpression: { status: ReportStatus.OPEN } },
);
ReportSchema.index({ status: 1, createdAt: -1 });
