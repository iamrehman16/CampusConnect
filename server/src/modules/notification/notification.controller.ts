import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';
import { WebPushService } from './web-push.service';
import {
  PushEndpointDto,
  PushSubscriptionDto,
} from './dto/push-subscription.dto';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly webPush: WebPushService,
  ) {}

  @Get()
  list(
    @Req() req: { user: CurrentUser },
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.list(req.user.id, query);
  }

  @Get('unread-count')
  unreadCount(@Req() req: { user: CurrentUser }) {
    return this.notificationService.unreadCount(req.user.id);
  }

  @Get('push/public-key')
  pushPublicKey() {
    return this.webPush.publicKey();
  }

  @Post('push/subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  subscribePush(
    @Req() req: { user: CurrentUser },
    @Body() dto: PushSubscriptionDto,
  ) {
    return this.webPush.subscribe(req.user.id, dto);
  }

  @Delete('push/subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  unsubscribePush(
    @Req() req: { user: CurrentUser },
    @Body() dto: PushEndpointDto,
  ) {
    return this.webPush.unsubscribe(req.user.id, dto.endpoint);
  }

  // Declared before ':id/read' so 'read-all' is never parsed as an id.
  @Patch('read-all')
  markAllRead(@Req() req: { user: CurrentUser }) {
    return this.notificationService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.notificationService.markRead(req.user.id, id);
  }
}
