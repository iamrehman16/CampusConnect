import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ChatConversationReadEvent,
  ContributorApplicationReviewedEvent,
  MentorshipAcceptedEvent,
  MentorshipCompletedEvent,
  MentorshipDeclinedEvent,
  MentorshipRatedEvent,
  MentorshipRequestedEvent,
  PostCommentedEvent,
  PostUpvotedEvent,
  ResourceCitedEvent,
  ChatMessageReceivedEvent,
  DomainEvents,
  ResourceApprovedEvent,
  ResourceRejectedEvent,
  UserWarnedEvent,
} from '../../common/events/domain-events';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './enums/notification-type.enum';
import {
  NotificationPayloads,
  newMessageDedupeKey,
} from './notification.registry';
import { UserService } from '../user/user.service';
import { NotificationDto } from './dto/notification.dto';
import { WebPushService } from './web-push.service';

/** Upper bound on one approval's "new in your semester" fan-out. */
const SEMESTER_FANOUT_LIMIT = 2000;

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
    private readonly webPush: WebPushService,
  ) {}

  @OnEvent(DomainEvents.RESOURCE_APPROVED, { async: true })
  onResourceApproved(event: ResourceApprovedEvent) {
    return this.notify(event.uploaderId, NotificationType.RESOURCE_APPROVED, {
      resourceId: event.resourceId,
      title: event.title,
    });
  }

  /**
   * "New notes for your semester": the only targeting signal both sides
   * share (users have no subject list; departments don't map to subjects).
   */
  @OnEvent(DomainEvents.RESOURCE_APPROVED, { async: true })
  async onResourceApprovedForSemester(
    event: ResourceApprovedEvent,
  ): Promise<void> {
    const type = NotificationType.NEW_SEMESTER_RESOURCE;
    let recorded: Awaited<ReturnType<NotificationService['recordMany']>>;
    try {
      const recipients = await this.userService.findActiveIdsInSemester(
        event.semester,
        event.uploaderId,
        SEMESTER_FANOUT_LIMIT,
      );
      if (recipients.length === SEMESTER_FANOUT_LIMIT) {
        this.logger.warn(
          `Semester ${event.semester} fan-out for resource ${event.resourceId} hit the ${SEMESTER_FANOUT_LIMIT}-recipient cap; the rest were not notified`,
        );
      }
      recorded = await this.notifications.recordMany(recipients, type, {
        resourceId: event.resourceId,
        title: event.title,
        subject: event.subject,
        semester: event.semester,
      });
    } catch (err) {
      this.logger.error(
        `Failed to fan out ${type} for resource ${event.resourceId} (semester ${event.semester})`,
        err instanceof Error ? err.stack : String(err),
      );
      return;
    }

    for (const { userId, notification } of recorded) {
      this.pushSafely(userId, notification);
    }
    await this.webPush.send(recorded);
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

  @OnEvent(DomainEvents.CONTRIBUTOR_APPLICATION_APPROVED, { async: true })
  onContributorApplicationApproved(event: ContributorApplicationReviewedEvent) {
    return this.notify(
      event.applicantId,
      NotificationType.CONTRIBUTOR_APPLICATION_APPROVED,
      {},
    );
  }

  @OnEvent(DomainEvents.CONTRIBUTOR_APPLICATION_REJECTED, { async: true })
  onContributorApplicationRejected(event: ContributorApplicationReviewedEvent) {
    return this.notify(
      event.applicantId,
      NotificationType.CONTRIBUTOR_APPLICATION_REJECTED,
      { reason: event.reason ?? 'No reason given' },
    );
  }

  @OnEvent(DomainEvents.MENTORSHIP_REQUESTED, { async: true })
  async onMentorshipRequested(event: MentorshipRequestedEvent) {
    return this.notify(event.mentorId, NotificationType.MENTORSHIP_REQUESTED, {
      menteeName: await this.nameOf(event.menteeId),
      topic: event.topic,
    });
  }

  @OnEvent(DomainEvents.MENTORSHIP_ACCEPTED, { async: true })
  async onMentorshipAccepted(event: MentorshipAcceptedEvent) {
    return this.notify(event.menteeId, NotificationType.MENTORSHIP_ACCEPTED, {
      mentorName: await this.nameOf(event.mentorId),
      conversationId: event.conversationId,
    });
  }

  @OnEvent(DomainEvents.MENTORSHIP_DECLINED, { async: true })
  async onMentorshipDeclined(event: MentorshipDeclinedEvent) {
    return this.notify(event.menteeId, NotificationType.MENTORSHIP_DECLINED, {
      mentorName: await this.nameOf(event.mentorId),
      reason: event.reason,
    });
  }

  /** Tell the party who did NOT end it. */
  @OnEvent(DomainEvents.MENTORSHIP_COMPLETED, { async: true })
  async onMentorshipCompleted(event: MentorshipCompletedEvent) {
    const endedByMentor = event.completedBy === event.mentorId;
    const recipient = endedByMentor ? event.menteeId : event.mentorId;
    const other = endedByMentor ? event.mentorId : event.menteeId;
    return this.notify(recipient, NotificationType.MENTORSHIP_COMPLETED, {
      otherName: await this.nameOf(other),
      recipientRole: endedByMentor ? 'mentee' : 'mentor',
    });
  }

  @OnEvent(DomainEvents.USER_WARNED, { async: true })
  onUserWarned(event: UserWarnedEvent) {
    return this.notify(event.userId, NotificationType.ACCOUNT_WARNING, {
      note: event.note,
    });
  }

  @OnEvent(DomainEvents.POST_COMMENTED, { async: true })
  async onPostCommented(event: PostCommentedEvent) {
    if (event.commenterId === event.authorId) return;
    return this.notify(event.authorId, NotificationType.POST_COMMENTED, {
      postId: event.postId,
      commenterName: await this.nameOf(event.commenterId),
      preview: event.preview,
    });
  }

  @OnEvent(DomainEvents.POST_UPVOTED, { async: true })
  async onPostUpvoted(event: PostUpvotedEvent) {
    if (event.voterId === event.authorId) return;
    return this.notify(event.authorId, NotificationType.POST_UPVOTED, {
      postId: event.postId,
      voterName: await this.nameOf(event.voterId),
    });
  }

  /** Not for citations in the uploader's own questions. */
  @OnEvent(DomainEvents.RESOURCE_CITED, { async: true })
  onResourceCited(event: ResourceCitedEvent) {
    if (event.citedForUserId === event.uploaderId) return;
    return this.notify(event.uploaderId, NotificationType.RESOURCE_CITED, {
      resourceId: event.resourceId,
    });
  }

  @OnEvent(DomainEvents.MENTORSHIP_RATED, { async: true })
  async onMentorshipRated(event: MentorshipRatedEvent) {
    return this.notify(event.mentorId, NotificationType.MENTORSHIP_RATED, {
      menteeName: await this.nameOf(event.menteeId),
      rating: event.rating,
    });
  }

  private async nameOf(userId: string): Promise<string> {
    try {
      const user = await this.userService.findOne(userId);
      return user.name?.trim() || 'Someone';
    } catch (err) {
      this.logger.warn(
        `User ${userId} not resolvable for notification: ${String(err)}`,
      );
      return 'Someone';
    }
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
    let notification: Awaited<ReturnType<NotificationService['record']>>;
    try {
      notification = await this.notifications.record(userId, type, payload);
    } catch (err) {
      this.logger.error(
        `Failed to create ${type} notification for user ${userId}`,
        err instanceof Error ? err.stack : String(err),
      );
      return;
    }

    this.pushSafely(userId, notification);
    await this.webPush.send([{ userId, notification }]);
  }

  /**
   * Separate from the write: the notification is already stored and will
   * show on the next fetch, so a failed realtime push must not be reported
   * as a failed notification.
   */
  private pushSafely(userId: string, notification: NotificationDto): void {
    try {
      this.gateway.push(userId, notification);
    } catch (err) {
      this.logger.warn(
        `Stored ${notification.type} notification for user ${userId} but realtime push failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
