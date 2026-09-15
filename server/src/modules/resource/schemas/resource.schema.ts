import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ResourceType } from '../enums/resource-types.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { FileType } from '../enums/file-type.enum';

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true, maxlength: 200 })
  title: string;

  @Prop({ maxlength: 2000 })
  description: string;

  // Academic classification
  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  course: string;

  @Prop({ required: true, min: 1, max: 8 })
  semester: number;

  @Prop({ required: true, enum: ResourceType })
  resourceType: ResourceType;

  // File metadata
  @Prop({ required: true, enum: FileType })
  fileType: FileType;

  @Prop({ required: true })
  fileFormat: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  cloudinaryPublicId: string;

  // Ownership
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  // Moderation
  @Prop({ default: ApprovalStatus.PENDING, enum: ApprovalStatus })
  approvalStatus: ApprovalStatus;

  @Prop()
  rejectionReason?: string;

  @Prop({ default: 0 })
  downloads: number;

  @Prop({ required: true, enum: ['image', 'video', 'raw'] })
  cloudinaryResourceType: string;

  // Search
  @Prop({ type: [String], default: [] })
  tags: string[];

  // Soft delete
  @Prop({ default: false })
  isDeleted: boolean;
}

export type ResourceDocument = HydratedDocument<Resource>;
export const ResourceSchema = SchemaFactory.createForClass(Resource);

ResourceSchema.index({ subject: 1, course: 1 });
ResourceSchema.index({ uploadedBy: 1 });
ResourceSchema.index({ approvalStatus: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index(
  {
    title: 'text',
    description: 'text',
    subject: 'text',
    course: 'text',
    tags: 'text',
  },
  { weights: { title: 10, subject: 5, course: 5, tags: 5, description: 1 } },
);
