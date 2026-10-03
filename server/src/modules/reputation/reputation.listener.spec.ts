import { ReputationListener } from './reputation.listener';
import { ReputationService } from './reputation.service';
import { ReputationEventType } from './enums/reputation-event-type.enum';

function build(awardImpl?: jest.Mock) {
  const reputation = {
    award: awardImpl ?? jest.fn().mockResolvedValue(true),
    reverseResource: jest.fn().mockResolvedValue(true),
  };
  return {
    listener: new ReputationListener(
      reputation as unknown as ReputationService,
    ),
    reputation,
  };
}

describe('ReputationListener', () => {
  it('awards the uploader when a resource is approved', async () => {
    const { listener, reputation } = build();

    await listener.onResourceApproved({
      resourceId: 'r1',
      title: 'Notes',
      uploaderId: 'u1',
    });

    expect(reputation.award).toHaveBeenCalledWith(
      'u1',
      ReputationEventType.RESOURCE_APPROVED,
      'r1',
    );
  });

  it('reverses the resource when it is removed', async () => {
    const { listener, reputation } = build();

    await listener.onResourceRemoved({ resourceId: 'r1', uploaderId: 'u1' });

    expect(reputation.reverseResource).toHaveBeenCalledWith('u1', 'r1');
  });

  it('keys upvote awards by post AND voter so each voter counts once', async () => {
    const { listener, reputation } = build();

    await listener.onPostUpvoted({
      postId: 'p1',
      authorId: 'author',
      voterId: 'voter',
    });

    expect(reputation.award).toHaveBeenCalledWith(
      'author',
      ReputationEventType.POST_UPVOTE_RECEIVED,
      'p1:voter',
    );
  });

  it('ignores self-upvotes', async () => {
    const { listener, reputation } = build();

    await listener.onPostUpvoted({
      postId: 'p1',
      authorId: 'same',
      voterId: 'same',
    });

    expect(reputation.award).not.toHaveBeenCalled();
  });

  it('logs and swallows failures so the originating request is unaffected', async () => {
    const { listener } = build(jest.fn().mockRejectedValue(new Error('db')));

    await expect(
      listener.onResourceApproved({
        resourceId: 'r1',
        title: 'Notes',
        uploaderId: 'u1',
      }),
    ).resolves.toBeUndefined();
  });

  describe('AI citations (E14)', () => {
    afterEach(() => jest.useRealTimers());

    it('awards the uploader keyed by resource and UTC day', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-03T23:59:00Z'));
      const { listener, reputation } = build();

      await listener.onResourceCited({
        resourceId: 'r1',
        uploaderId: 'u1',
        citedForUserId: 'asker',
      });

      expect(reputation.award).toHaveBeenCalledWith(
        'u1',
        ReputationEventType.AI_CITATION,
        'r1:2026-10-03',
      );
    });

    it('uses a different key the next day so it can award again', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-04T00:01:00Z'));
      const { listener, reputation } = build();

      await listener.onResourceCited({
        resourceId: 'r1',
        uploaderId: 'u1',
        citedForUserId: 'asker',
      });

      expect(reputation.award).toHaveBeenCalledWith(
        'u1',
        ReputationEventType.AI_CITATION,
        'r1:2026-10-04',
      );
    });

    it("doesn't award when you are cited on your own resource", async () => {
      const { listener, reputation } = build();

      await listener.onResourceCited({
        resourceId: 'r1',
        uploaderId: 'u1',
        citedForUserId: 'u1',
      });

      expect(reputation.award).not.toHaveBeenCalled();
    });
  });

  describe('mentorship events (E11)', () => {
    it('awards the MENTOR for a completed mentorship, keyed by the mentor/mentee pair', async () => {
      const { listener, reputation } = build();

      await listener.onMentorshipCompleted({
        mentorshipId: 'm1',
        mentorId: 'mentor',
        menteeId: 'mentee',
        completedBy: 'mentee',
      });

      expect(reputation.award).toHaveBeenCalledWith(
        'mentor',
        ReputationEventType.MENTORSHIP_COMPLETED,
        'mentor:mentee',
      );
    });

    it.each([4, 5])('awards for a %i-star rating', async (rating) => {
      const { listener, reputation } = build();

      await listener.onMentorshipRated({
        mentorshipId: 'm1',
        mentorId: 'mentor',
        menteeId: 'mentee',
        rating,
      });

      expect(reputation.award).toHaveBeenCalledWith(
        'mentor',
        ReputationEventType.MENTORSHIP_RATED_WELL,
        'mentor:mentee',
      );
    });

    it.each([1, 2, 3])(
      'a %i-star rating earns nothing and never reduces reputation',
      async (rating) => {
        const { listener, reputation } = build();

        await listener.onMentorshipRated({
          mentorshipId: 'm1',
          mentorId: 'mentor',
          menteeId: 'mentee',
          rating,
        });

        expect(reputation.award).not.toHaveBeenCalled();
      },
    );
  });
});
