import { Model, Types } from 'mongoose';
import { ReputationService } from './reputation.service';
import { ReputationEventDocument } from './schema/reputation-event.schema';
import { ReputationEventType } from './enums/reputation-event-type.enum';
import { ResourceDocument } from '../resource/schemas/resource.schema';
import { PostDocument } from '../post/schemas/post.schema';
import { UserService } from '../user/user.service';
import { PaginationService } from '../../common/services/pagination.service';

const userId = new Types.ObjectId().toString();

function dupError() {
  return Object.assign(new Error('E11000'), { code: 11000 });
}

function aggregateResult(rows: unknown[]) {
  return { exec: jest.fn().mockResolvedValue(rows) };
}

function leanChain(rows: unknown[]) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(rows),
  };
  return chain;
}

function build(
  overrides: {
    event?: Record<string, unknown>;
    resource?: Record<string, unknown>;
    post?: Record<string, unknown>;
  } = {},
) {
  const userService = {
    adjustContributionScore: jest.fn().mockResolvedValue(undefined),
    setContributionScore: jest.fn().mockResolvedValue(undefined),
    zeroContributionScoresExcept: jest.fn().mockResolvedValue(undefined),
  };
  const eventModel = {
    create: jest.fn().mockResolvedValue({}),
    aggregate: jest.fn(),
    ...overrides.event,
  };
  const service = new ReputationService(
    eventModel as unknown as Model<ReputationEventDocument>,
    (overrides.resource ?? {}) as unknown as Model<ResourceDocument>,
    (overrides.post ?? {}) as unknown as Model<PostDocument>,
    userService as unknown as UserService,
    {} as PaginationService,
  );
  return { service, eventModel, userService };
}

describe('ReputationService#award', () => {
  it('writes a ledger row with the configured points and bumps the denormalized score', async () => {
    const { service, eventModel, userService } = build();

    const ok = await service.award(
      userId,
      ReputationEventType.RESOURCE_APPROVED,
      'res-1',
    );

    expect(ok).toBe(true);
    expect(eventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReputationEventType.RESOURCE_APPROVED,
        points: 10,
        sourceId: 'res-1',
      }),
    );
    expect(userService.adjustContributionScore).toHaveBeenCalledWith(
      userId,
      10,
    );
  });

  it('is idempotent: a duplicate (type, sourceId) is a no-op and never touches the score', async () => {
    const { service, userService } = build({
      event: { create: jest.fn().mockRejectedValue(dupError()) },
    });

    const ok = await service.award(
      userId,
      ReputationEventType.RESOURCE_APPROVED,
      'res-1',
    );

    expect(ok).toBe(false);
    expect(userService.adjustContributionScore).not.toHaveBeenCalled();
  });

  it('rethrows non-duplicate ledger errors instead of swallowing them', async () => {
    const { service } = build({
      event: { create: jest.fn().mockRejectedValue(new Error('mongo down')) },
    });

    await expect(
      service.award(userId, ReputationEventType.POST_UPVOTE_RECEIVED, 'p:v'),
    ).rejects.toThrow('mongo down');
  });

  it('surfaces a failed score update after the ledger write (drift is logged and repairable)', async () => {
    const { service, userService } = build();
    userService.adjustContributionScore.mockRejectedValue(new Error('boom'));

    await expect(
      service.award(userId, ReputationEventType.RESOURCE_APPROVED, 'res-1'),
    ).rejects.toThrow('boom');
  });
});

describe('ReputationService#reverseResource', () => {
  it('writes one negative row equal to what the resource earned', async () => {
    const { service, eventModel, userService } = build({
      event: {
        create: jest.fn().mockResolvedValue({}),
        aggregate: jest.fn().mockReturnValue(aggregateResult([{ total: 10 }])),
      },
    });

    const ok = await service.reverseResource(userId, 'res-1');

    expect(ok).toBe(true);
    expect(eventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReputationEventType.RESOURCE_REMOVED,
        points: -10,
        sourceId: 'res-1',
      }),
    );
    expect(userService.adjustContributionScore).toHaveBeenCalledWith(
      userId,
      -10,
    );
  });

  it('does nothing when the resource never earned points', async () => {
    const { service, eventModel } = build({
      event: {
        create: jest.fn(),
        aggregate: jest.fn().mockReturnValue(aggregateResult([])),
      },
    });

    expect(await service.reverseResource(userId, 'res-1')).toBe(false);
    expect(eventModel.create).not.toHaveBeenCalled();
  });

  it('is idempotent: a second reversal collides on the unique key and is ignored', async () => {
    const { service, userService } = build({
      event: {
        create: jest.fn().mockRejectedValue(dupError()),
        aggregate: jest.fn().mockReturnValue(aggregateResult([{ total: 10 }])),
      },
    });

    expect(await service.reverseResource(userId, 'res-1')).toBe(false);
    expect(userService.adjustContributionScore).not.toHaveBeenCalled();
  });
});

describe('ReputationService#backfill', () => {
  it('awards approved resources and unique non-self upvotes, then recomputes from the ledger', async () => {
    const author = new Types.ObjectId();
    const voter = new Types.ObjectId();
    const postId = new Types.ObjectId();
    const resId = new Types.ObjectId();

    const { service, eventModel, userService } = build({
      event: {
        create: jest.fn().mockResolvedValue({}),
        aggregate: jest
          .fn()
          .mockReturnValue(aggregateResult([{ _id: author, total: 12 }])),
      },
      resource: {
        find: jest
          .fn()
          .mockReturnValue(leanChain([{ _id: resId, uploadedBy: author }])),
      },
      post: {
        find: jest
          .fn()
          .mockReturnValue(
            leanChain([{ _id: postId, author, upvotes: [author, voter] }]),
          ),
      },
    });

    const result = await service.backfill();

    // 1 approval + 1 upvote (the author's self-upvote is skipped)
    expect(eventModel.create).toHaveBeenCalledTimes(2);
    expect(eventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReputationEventType.POST_UPVOTE_RECEIVED,
        sourceId: `${postId.toString()}:${voter.toString()}`,
      }),
    );
    expect(result).toEqual({ awarded: 2, usersRecomputed: 1 });
    expect(userService.setContributionScore).toHaveBeenCalledWith(
      author.toString(),
      12,
    );
    expect(userService.zeroContributionScoresExcept).toHaveBeenCalledWith([
      author.toString(),
    ]);
  });
});
