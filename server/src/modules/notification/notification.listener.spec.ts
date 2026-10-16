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
    recordMany: jest.fn((ids: string[]) =>
      Promise.resolve(ids.map((userId) => ({ userId, notification: dto }))),
    ),
  };
  const gateway = { push: jest.fn(), pushUnreadCount: jest.fn() };
  const userService = {
    findOne: jest.fn().mockResolvedValue({ name: opts.senderName ?? 'Sara' }),
    findActiveIdsInSemester: jest.fn().mockResolvedValue(['u2', 'u3']),
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
      subject: 'DS',
      semester: 3,
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

  it('reports a failed realtime push as a push failure, not a failed notification', async () => {
    const { listener, notifications, gateway } = build();
    gateway.push.mockImplementation(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'to')");
    });
    const logger = (
      listener as unknown as { logger: { error: jest.Mock; warn: jest.Mock } }
    ).logger;
    const error = jest
      .spyOn(logger, 'error')
      .mockImplementation(() => undefined);
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    await expect(
      listener.onResourceApproved({
        resourceId: 'r1',
        title: 'Notes',
        uploaderId: 'u1',
        subject: 'DS',
        semester: 3,
      }),
    ).resolves.toBeUndefined();

    expect(notifications.record).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('realtime push failed'),
    );
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

  describe('mentorship', () => {
    it('tells the mentor about a new request, naming the student and topic', async () => {
      const { listener, notifications } = build({ senderName: 'Sara' });

      await listener.onMentorshipRequested({
        mentorshipId: 'm1',
        mentorId: 'mentor',
        menteeId: 'mentee',
        topic: 'DP',
      });

      expect(notifications.record).toHaveBeenCalledWith(
        'mentor',
        NotificationType.MENTORSHIP_REQUESTED,
        { menteeName: 'Sara', topic: 'DP' },
      );
    });

    it('tells the mentee it was accepted, linking to the new conversation', async () => {
      const { listener, notifications } = build({ senderName: 'Omar' });

      await listener.onMentorshipAccepted({
        mentorshipId: 'm1',
        mentorId: 'mentor',
        menteeId: 'mentee',
        conversationId: 'c1',
      });

      expect(notifications.record).toHaveBeenCalledWith(
        'mentee',
        NotificationType.MENTORSHIP_ACCEPTED,
        { mentorName: 'Omar', conversationId: 'c1' },
      );
    });

    it('tells the mentee about a decline with the reason', async () => {
      const { listener, notifications } = build({ senderName: 'Omar' });

      await listener.onMentorshipDeclined({
        mentorshipId: 'm1',
        mentorId: 'mentor',
        menteeId: 'mentee',
        reason: 'Busy this term',
      });

      expect(notifications.record).toHaveBeenCalledWith(
        'mentee',
        NotificationType.MENTORSHIP_DECLINED,
        { mentorName: 'Omar', reason: 'Busy this term' },
      );
    });

    it.each([
      ['mentor', 'mentee'],
      ['mentee', 'mentor'],
    ])(
      'on completion by the %s, notifies the %s (not the person who ended it)',
      async (endedBy, recipientRole) => {
        const { listener, notifications } = build({ senderName: 'Sara' });
        const ids = { mentor: 'mentor-id', mentee: 'mentee-id' };

        await listener.onMentorshipCompleted({
          mentorshipId: 'm1',
          mentorId: ids.mentor,
          menteeId: ids.mentee,
          completedBy: ids[endedBy as 'mentor' | 'mentee'],
        });

        expect(notifications.record).toHaveBeenCalledWith(
          ids[recipientRole as 'mentor' | 'mentee'],
          NotificationType.MENTORSHIP_COMPLETED,
          { otherName: 'Sara', recipientRole },
        );
      },
    );
  });

  describe('community and reputation feedback', () => {
    it('notifies a post author of a reply, with the commenter name', async () => {
      const { listener, notifications } = build({ senderName: 'Ali' });

      await listener.onPostCommented({
        postId: 'p1',
        authorId: 'u1',
        commenterId: 'u2',
        preview: 'Great notes',
      });

      expect(notifications.record).toHaveBeenCalledWith(
        'u1',
        NotificationType.POST_COMMENTED,
        { postId: 'p1', commenterName: 'Ali', preview: 'Great notes' },
      );
    });

    it('does not notify authors about their own comments or upvotes', async () => {
      const { listener, notifications } = build();

      await listener.onPostCommented({
        postId: 'p1',
        authorId: 'u1',
        commenterId: 'u1',
        preview: 'bump',
      });
      await listener.onPostUpvoted({
        postId: 'p1',
        authorId: 'u1',
        voterId: 'u1',
      });

      expect(notifications.record).not.toHaveBeenCalled();
    });

    it('notifies an upvoted author with the voter name', async () => {
      const { listener, notifications } = build({ senderName: 'Hina' });

      await listener.onPostUpvoted({
        postId: 'p1',
        authorId: 'u1',
        voterId: 'u2',
      });

      expect(notifications.record).toHaveBeenCalledWith(
        'u1',
        NotificationType.POST_UPVOTED,
        { postId: 'p1', voterName: 'Hina' },
      );
    });

    it('skips citations produced by the uploader asking about their own resource', async () => {
      const { listener, notifications } = build();

      await listener.onResourceCited({
        resourceId: 'r1',
        uploaderId: 'u1',
        citedForUserId: 'u1',
      });
      expect(notifications.record).not.toHaveBeenCalled();

      await listener.onResourceCited({
        resourceId: 'r1',
        uploaderId: 'u1',
        citedForUserId: 'u2',
      });
      expect(notifications.record).toHaveBeenCalledWith(
        'u1',
        NotificationType.RESOURCE_CITED,
        { resourceId: 'r1' },
      );
    });

    it('tells the mentor their rating', async () => {
      const { listener, notifications } = build({ senderName: 'Zara' });

      await listener.onMentorshipRated({
        mentorshipId: 'm1',
        mentorId: 'u1',
        menteeId: 'u2',
        rating: 5,
      });

      expect(notifications.record).toHaveBeenCalledWith(
        'u1',
        NotificationType.MENTORSHIP_RATED,
        { menteeName: 'Zara', rating: 5 },
      );
    });
  });

  describe('new resource in your semester', () => {
    const event = {
      resourceId: 'r1',
      title: 'OS Notes',
      uploaderId: 'u1',
      subject: 'Operating Systems',
      semester: 5,
    };

    it('fans out to active members of the semester, excluding the uploader', async () => {
      const { listener, notifications, gateway, userService, dto } = build();

      await listener.onResourceApprovedForSemester(event);

      expect(userService.findActiveIdsInSemester).toHaveBeenCalledWith(
        5,
        'u1',
        expect.any(Number),
      );
      expect(notifications.recordMany).toHaveBeenCalledWith(
        ['u2', 'u3'],
        NotificationType.NEW_SEMESTER_RESOURCE,
        {
          resourceId: 'r1',
          title: 'OS Notes',
          subject: 'Operating Systems',
          semester: 5,
        },
      );
      expect(gateway.push).toHaveBeenCalledWith('u2', dto);
      expect(gateway.push).toHaveBeenCalledWith('u3', dto);
    });

    it('logs and swallows a lookup failure without pushing', async () => {
      const { listener, gateway, userService } = build();
      userService.findActiveIdsInSemester.mockRejectedValue(
        new Error('db down'),
      );

      await expect(
        listener.onResourceApprovedForSemester(event),
      ).resolves.toBeUndefined();
      expect(gateway.push).not.toHaveBeenCalled();
    });
  });
});
