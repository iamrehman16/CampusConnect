import { NotificationListener } from './notification.listener';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { UserService } from '../user/user.service';
import { NotificationType } from './enums/notification-type.enum';

function build(opts: { recordError?: Error; senderName?: string } = {}) {
  const dto = { id: 'n1' };
  const notifications = {
    markReadByDedupeKey: jest.fn().mockResolvedValue(1),
    unreadCount: jest.fn().mockResolvedValue({ count: 4 }),
    record: opts.recordError
      ? jest.fn().mockRejectedValue(opts.recordError)
      : jest.fn().mockResolvedValue(dto),
  };
  const gateway = { push: jest.fn(), pushUnreadCount: jest.fn() };
  const userService = {
    findOne: jest.fn().mockResolvedValue({ name: opts.senderName ?? 'Sara' }),
  };
  const listener = new NotificationListener(
    notifications as unknown as NotificationService,
    gateway as unknown as NotificationGateway,
    userService as unknown as UserService,
  );
  return { listener, notifications, gateway, userService, dto };
}

describe('NotificationListener', () => {
  it('records then pushes a notification when a resource is approved', async () => {
    const { listener, notifications, gateway, dto } = build();

    await listener.onResourceApproved({
      resourceId: 'r1',
      title: 'Notes',
      uploaderId: 'u1',
    });

    expect(notifications.record).toHaveBeenCalledWith(
      'u1',
      NotificationType.RESOURCE_APPROVED,
      { resourceId: 'r1', title: 'Notes' },
    );
    expect(gateway.push).toHaveBeenCalledWith('u1', dto);
  });

  it('resolves the sender name for message notifications', async () => {
    const { listener, notifications } = build({ senderName: 'Sara' });

    await listener.onChatMessageReceived({
      conversationId: 'c1',
      senderId: 's1',
      receiverId: 'u1',
      preview: 'hey',
    });

    expect(notifications.record).toHaveBeenCalledWith(
      'u1',
      NotificationType.NEW_MESSAGE,
      { conversationId: 'c1', senderName: 'Sara', preview: 'hey' },
    );
  });

  it('logs and swallows a persistence failure so the originating request is unaffected', async () => {
    const { listener, gateway } = build({ recordError: new Error('db down') });

    await expect(
      listener.onResourceRejected({
        resourceId: 'r1',
        title: 'Notes',
        uploaderId: 'u1',
        reason: 'blurry',
      }),
    ).resolves.toBeUndefined();
    expect(gateway.push).not.toHaveBeenCalled();
  });

  it('clears the grouped message notification and pushes the new unread total when a conversation is read', async () => {
    const { listener, notifications, gateway } = build();

    await listener.onConversationRead({ userId: 'u1', conversationId: 'c1' });

    expect(notifications.markReadByDedupeKey).toHaveBeenCalledWith(
      'u1',
      'new_message:c1',
    );
    expect(gateway.pushUnreadCount).toHaveBeenCalledWith('u1', 4);
  });

  it('pushes nothing when there was no unread message notification to clear', async () => {
    const { listener, notifications, gateway } = build();
    notifications.markReadByDedupeKey.mockResolvedValue(0);

    await listener.onConversationRead({ userId: 'u1', conversationId: 'c1' });

    expect(gateway.pushUnreadCount).not.toHaveBeenCalled();
  });

  it('notifies an approved applicant', async () => {
    const { listener, notifications, gateway, dto } = build();

    await listener.onContributorApplicationApproved({
      applicantId: 'u1',
      applicationId: 'a1',
    });

    expect(notifications.record).toHaveBeenCalledWith(
      'u1',
      NotificationType.CONTRIBUTOR_APPLICATION_APPROVED,
      {},
    );
    expect(gateway.push).toHaveBeenCalledWith('u1', dto);
  });

  it('notifies a rejected applicant with the reviewer reason', async () => {
    const { listener, notifications } = build();

    await listener.onContributorApplicationRejected({
      applicantId: 'u1',
      applicationId: 'a1',
      reason: 'Not enough work',
    });

    expect(notifications.record).toHaveBeenCalledWith(
      'u1',
      NotificationType.CONTRIBUTOR_APPLICATION_REJECTED,
      { reason: 'Not enough work' },
    );
  });
});
