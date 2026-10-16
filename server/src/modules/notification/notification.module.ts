import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../../common/common.module';
import { UserModule } from '../user/user.module';
import { Notification, NotificationSchema } from './schema/notification.schema';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationListener } from './notification.listener';
import { WebPushService } from './web-push.service';
import webPushConfig from './config/web-push.config';
import {
  PushSubscription,
  PushSubscriptionSchema,
} from './schema/push-subscription.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
    ]),
    ConfigModule.forFeature(webPushConfig),
    CommonModule,
    UserModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationListener,
    WebPushService,
  ],
})
export class NotificationModule {}
