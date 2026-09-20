import { Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
