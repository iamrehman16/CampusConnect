import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ChatConversationReadEvent,
  ChatMessageReceivedEvent,
  DomainEvents,
  ResourceApprovedEvent,
  ResourceRejectedEvent,
} from '../../common/events/domain-events';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './enums/notification-type.enum';
import {
  NotificationPayloads,
  newMessageDedupeKey,
} from './notification.registry';
import { UserService } from '../user/user.service';

/**
 * Thin domain-event -> notification adapter. Producers never call the
 * notification module directly; a failure here is logged with context and
 * must never break the originating request (approval, message send).
 */
@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly gateway: NotificationGateway,
    private readonly userService: UserService,
  ) {}

  @OnEvent(DomainEvents.RESOURCE_APPROVED, { async: true })
  onResourceApproved(event: ResourceApprovedEvent) {
    return this.notify(event.uploaderId, NotificationType.RESOURCE_APPROVED, {
      resourceId: event.resourceId,
      title: event.title,
    });
  }

  @OnEvent(DomainEvents.RESOURCE_REJECTED, { async: true })
  onResourceRejected(event: ResourceRejectedEvent) {
    return this.notify(event.uploaderId, NotificationType.RESOURCE_REJECTED, {
      resourceId: event.resourceId,
      title: event.title,
      reason: event.reason,
    });
  }

  @OnEvent(DomainEvents.CHAT_MESSAGE_RECEIVED, { async: true })
  async onChatMessageReceived(event: ChatMessageReceivedEvent) {
    let senderName = 'Someone';
    try {
      const sender = await this.userService.findOne(event.senderId);
      senderName = sender.name?.trim() || senderName;
    } catch (err) {
      this.logger.warn(
        `Sender ${event.senderId} not resolvable for message notification: ${String(err)}`,
      );
    }

    return this.notify(event.receiverId, NotificationType.NEW_MESSAGE, {
      conversationId: event.conversationId,
      senderName,
      preview: event.preview,
    });
  }

  /** Reading a conversation clears its grouped message notification. */
  @OnEvent(DomainEvents.CHAT_CONVERSATION_READ, { async: true })
  async onConversationRead({
    userId,
    conversationId,
  }: ChatConversationReadEvent): Promise<void> {
    try {
      const cleared = await this.notifications.markReadByDedupeKey(
        userId,
        newMessageDedupeKey(conversationId),
      );
      if (cleared === 0) return;

      const { count } = await this.notifications.unreadCount(userId);
      this.gateway.pushUnreadCount(userId, count);
    } catch (err) {
      this.logger.error(
        `Failed to clear message notification for user ${userId}, conversation ${conversationId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async notify<T extends NotificationType>(
    userId: string,
    type: T,
    payload: NotificationPayloads[T],
  ): Promise<void> {
    try {
      const notification = await this.notifications.record(
        userId,
        type,
        payload,
      );
      this.gateway.push(userId, notification);
    } catch (err) {
      this.logger.error(
        `Failed to create ${type} notification for user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
