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
});
