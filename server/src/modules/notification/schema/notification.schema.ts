import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';

// Notifications are disposable: pruned by TTL this long after last update.
export const NOTIFICATION_TTL_SECONDS = 60 * 60 * 24 * 60;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: true })
  link: string;

  /** How many events were grouped into this row (see dedupeKey). */
  @Prop({ default: 1 })
  count: number;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date | null;

  @Prop({ type: String })
  dedupeKey?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);

// List + unread-count queries.
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// At most one UNREAD notification per (user, dedupeKey): backs the grouping
// upsert in NotificationService and makes concurrent upserts safe. Partial so
// read history and non-grouped notifications are unconstrained.
NotificationSchema.index(
  { user: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isRead: false, dedupeKey: { $type: 'string' } },
  },
);

// Retention.
NotificationSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: NOTIFICATION_TTL_SECONDS },
);
