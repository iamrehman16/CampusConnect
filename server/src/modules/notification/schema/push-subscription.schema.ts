import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

/** One browser/device a user has allowed OS-level notifications on. */
@Schema({ timestamps: true })
export class PushSubscription {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  /** Push-service URL; unique per browser profile, so it is the identity. */
  @Prop({ required: true, unique: true })
  endpoint: string;

  @Prop({ required: true })
  p256dh: string;

  @Prop({ required: true })
  auth: string;
}

export type PushSubscriptionDocument = HydratedDocument<PushSubscription>;
export const PushSubscriptionSchema =
  SchemaFactory.createForClass(PushSubscription);
