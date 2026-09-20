import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApplicationStatus } from '../enums/application-status.enum';
import { APPLICATION_REASON_MAX } from '../contributor-application.constants';

@Schema({ timestamps: true })
export class ContributorApplication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  applicant: Types.ObjectId;

  @Prop({ required: true, maxlength: APPLICATION_REASON_MAX })
  reason: string;

  /** Optional link to prior work (notes, a repo, a drive folder, ...). */
  @Prop({ type: String })
  sampleUrl?: string;

  @Prop({
    type: String,
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  /** Applicant's reputation score when they applied — context for the reviewer. */
  @Prop({ required: true, default: 0 })
  scoreAtApplication: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;

  @Prop({ type: String })
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ContributorApplicationDocument =
  HydratedDocument<ContributorApplication>;
export const ContributorApplicationSchema = SchemaFactory.createForClass(
  ContributorApplication,
);

// One OPEN application per user, enforced by the database (same approach as
// the conversation pair index — no check-then-insert race). Partial so
// reviewed history is unconstrained and a rejected user can re-apply.
ContributorApplicationSchema.index(
  { applicant: 1 },
  {
    unique: true,
    partialFilterExpression: { status: ApplicationStatus.PENDING },
  },
);
// Admin queue + "my latest application".
ContributorApplicationSchema.index({ status: 1, createdAt: 1 });
ContributorApplicationSchema.index({ applicant: 1, createdAt: -1 });
