import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ConversationService } from './conversation.service';
import { AiConversationDocument } from '../schema/ai-conversation.schema';
import { ConversationSessionDocument } from '../schema/conversation-session.schema';

type MockQuery<T> = { sort: jest.Mock; lean: jest.Mock } & Promise<T>;

function chainableQuery<T>(result: T): MockQuery<T> {
  const query = Promise.resolve(result) as MockQuery<T>;
  query.sort = jest.fn().mockReturnValue(Promise.resolve(result));
  query.lean = jest.fn().mockResolvedValue(result);
  return query;
}

type MockConversationModel = {
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
  create: jest.Mock;
};

type MockLegacySessionModel = {
  find: jest.Mock;
  updateOne: jest.Mock;
};

function buildConversationService(
  conversationModel: Partial<MockConversationModel>,
  legacySessionModel: Partial<MockLegacySessionModel> = {
    find: jest.fn().mockReturnValue(chainableQuery([])),
    updateOne: jest.fn(),
  },
) {
  return new ConversationService(
    conversationModel as unknown as Model<AiConversationDocument>,
    legacySessionModel as unknown as Model<ConversationSessionDocument>,
  );
}

describe('ConversationService#getOrCreateConversation', () => {
  it('returns the thread when conversationId is owned by userId', async () => {
    const owned = { _id: new Types.ObjectId(), userId: 'user-1' };
    const conversationModel: Partial<MockConversationModel> = {
      findOne: jest.fn().mockResolvedValue(owned),
    };
    const service = buildConversationService(conversationModel);

    const result = await service.getOrCreateConversation(
      'user-1',
      owned._id.toString(),
    );

    expect(result).toBe(owned);
    expect(conversationModel.findOne).toHaveBeenCalledWith({
      _id: owned._id.toString(),
      userId: 'user-1',
    });
  });

  it('throws NotFoundException when conversationId is not owned by userId', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = buildConversationService(conversationModel);

    await expect(
      service.getOrCreateConversation('user-1', 'someone-elses-thread'),
    ).rejects.toThrow(NotFoundException);
  });

  it('falls back to the most recently updated thread when no conversationId is given', async () => {
    const mostRecent = { _id: new Types.ObjectId(), userId: 'user-1' };
    const conversationModel: Partial<MockConversationModel> = {
      findOne: jest.fn().mockReturnValue(chainableQuery(mostRecent)),
    };
    const service = buildConversationService(conversationModel);

    const result = await service.getOrCreateConversation('user-1');

    expect(result).toBe(mostRecent);
  });

  it('creates a new thread when the user has none yet', async () => {
    const created = { _id: new Types.ObjectId(), userId: 'user-1' };
    const conversationModel: Partial<MockConversationModel> = {
      findOne: jest.fn().mockReturnValue(chainableQuery(null)),
      create: jest.fn().mockResolvedValue(created),
    };
    const service = buildConversationService(conversationModel);

    const result = await service.getOrCreateConversation('user-1');

    expect(result).toBe(created);
    expect(conversationModel.create).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});

describe('ConversationService#clearConversation', () => {
  it('throws NotFoundException instead of silently no-oping on a thread the user does not own', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    };
    const service = buildConversationService(conversationModel);

    await expect(
      service.clearConversation('user-1', 'not-mine'),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ConversationService — legacy session migration', () => {
  it('migrates each unmigrated ConversationSession into an AiConversation and marks it migrated', async () => {
    const legacySession = {
      _id: new Types.ObjectId(),
      userId: 'user-1',
      summaryBuffer: 'old summary',
      recentMessages: [{ role: 'user', content: 'hi', timestamp: new Date() }],
    };
    const conversationModel: Partial<MockConversationModel> = {
      create: jest.fn().mockResolvedValue({}),
    };
    const legacySessionModel: Partial<MockLegacySessionModel> = {
      find: jest.fn().mockReturnValue(chainableQuery([legacySession])),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(
      conversationModel,
      legacySessionModel,
    );

    await service.onModuleInit();

    expect(legacySessionModel.find).toHaveBeenCalledWith({
      migratedAt: { $exists: false },
    });
    expect(conversationModel.create).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'Migrated conversation',
      summaryBuffer: 'old summary',
      recentMessages: legacySession.recentMessages,
    });
    const updateOneMock = legacySessionModel.updateOne as jest.Mock;
    expect(updateOneMock).toHaveBeenCalledTimes(1);
    const [filterArg, updateArg] = updateOneMock.mock.calls[0] as [
      { _id: Types.ObjectId },
      { migratedAt: Date },
    ];
    expect(filterArg).toEqual({ _id: legacySession._id });
    expect(updateArg.migratedAt).toBeInstanceOf(Date);
  });

  it('does nothing when every legacy session is already migrated', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      create: jest.fn(),
    };
    const legacySessionModel: Partial<MockLegacySessionModel> = {
      find: jest.fn().mockReturnValue(chainableQuery([])),
      updateOne: jest.fn(),
    };
    const service = buildConversationService(
      conversationModel,
      legacySessionModel,
    );

    await service.onModuleInit();

    expect(conversationModel.create).not.toHaveBeenCalled();
  });
});
