import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { ConversationService } from './conversation.service';
import {
  AiConversationDocument,
  DEFAULT_CONVERSATION_TITLE,
} from '../schema/ai-conversation.schema';
import { AiMessageDocument } from '../schema/ai-message.schema';
import { ConversationSessionDocument } from '../schema/conversation-session.schema';
import { PaginationService } from '../../../common/services/pagination.service';

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
  findOneAndDelete: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  updateOne: jest.Mock;
};

type MockMessageModel = {
  deleteMany: jest.Mock;
  insertMany: jest.Mock;
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
  messageModel: Partial<MockMessageModel> = {
    deleteMany: jest.fn().mockResolvedValue({ acknowledged: true }),
    insertMany: jest.fn().mockResolvedValue([]),
  },
  paginationService: Partial<PaginationService> = {
    paginate: jest.fn(),
  },
) {
  return new ConversationService(
    conversationModel as unknown as Model<AiConversationDocument>,
    messageModel as unknown as Model<AiMessageDocument>,
    legacySessionModel as unknown as Model<ConversationSessionDocument>,
    paginationService as PaginationService,
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

describe('ConversationService#maybeGenerateTitle', () => {
  function buildConversation(title: string) {
    return {
      _id: new Types.ObjectId(),
      title,
    } as unknown as AiConversationDocument;
  }

  it('sets the generated title when the thread still has the default title', async () => {
    const conversation = buildConversation(DEFAULT_CONVERSATION_TITLE);
    const conversationModel: Partial<MockConversationModel> = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(conversationModel);
    const titleFn = jest.fn().mockResolvedValue('Wifi Setup Help');

    await service.maybeGenerateTitle(conversation, 'how do I connect', titleFn);

    expect(conversationModel.updateOne).toHaveBeenCalledWith(
      { _id: conversation._id, title: DEFAULT_CONVERSATION_TITLE },
      { title: 'Wifi Setup Help' },
    );
  });

  it('does nothing when the thread already has a non-default title (user renamed it)', async () => {
    const conversation = buildConversation('My custom title');
    const conversationModel: Partial<MockConversationModel> = {
      updateOne: jest.fn(),
    };
    const service = buildConversationService(conversationModel);
    const titleFn = jest.fn();

    await service.maybeGenerateTitle(conversation, 'irrelevant', titleFn);

    expect(titleFn).not.toHaveBeenCalled();
    expect(conversationModel.updateOne).not.toHaveBeenCalled();
  });

  it('falls back to the first few words of the message when titleFn rejects, without throwing', async () => {
    const conversation = buildConversation(DEFAULT_CONVERSATION_TITLE);
    const conversationModel: Partial<MockConversationModel> = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(conversationModel);
    const titleFn = jest.fn().mockRejectedValue(new Error('groq down'));

    await expect(
      service.maybeGenerateTitle(
        conversation,
        'how do I reset my campus wifi password today',
        titleFn,
      ),
    ).resolves.toBeUndefined();

    expect(conversationModel.updateOne).toHaveBeenCalledWith(
      { _id: conversation._id, title: DEFAULT_CONVERSATION_TITLE },
      { title: 'how do I reset my campus' },
    );
  });

  it('falls back to the default title when titleFn resolves empty and the message is blank', async () => {
    const conversation = buildConversation(DEFAULT_CONVERSATION_TITLE);
    const conversationModel: Partial<MockConversationModel> = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(conversationModel);
    const titleFn = jest.fn().mockResolvedValue('');

    await service.maybeGenerateTitle(conversation, '   ', titleFn);

    expect(conversationModel.updateOne).toHaveBeenCalledWith(
      { _id: conversation._id, title: DEFAULT_CONVERSATION_TITLE },
      { title: DEFAULT_CONVERSATION_TITLE },
    );
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

describe('ConversationService#listConversations', () => {
  it("lists the user's threads sorted by updatedAt descending", async () => {
    const threads = [{ _id: new Types.ObjectId() }];
    const conversationModel: Partial<MockConversationModel> = {
      find: jest.fn().mockReturnValue(chainableQuery(threads)),
    };
    const service = buildConversationService(conversationModel);

    const result = await service.listConversations('user-1');

    expect(result).toBe(threads);
    expect(conversationModel.find).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});

describe('ConversationService#createConversation', () => {
  it('creates a thread with a custom title when given one', async () => {
    const created = { _id: new Types.ObjectId() };
    const conversationModel: Partial<MockConversationModel> = {
      create: jest.fn().mockResolvedValue(created),
    };
    const service = buildConversationService(conversationModel);

    const result = await service.createConversation('user-1', 'My thread');

    expect(result).toBe(created);
    expect(conversationModel.create).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'My thread',
    });
  });

  it('creates a thread with the schema default title when none is given', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      create: jest.fn().mockResolvedValue({}),
    };
    const service = buildConversationService(conversationModel);

    await service.createConversation('user-1');

    expect(conversationModel.create).toHaveBeenCalledWith({ userId: 'user-1' });
  });
});

describe('ConversationService#renameConversation', () => {
  it('throws NotFoundException on a thread the user does not own', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
    };
    const service = buildConversationService(conversationModel);

    await expect(
      service.renameConversation('user-1', 'not-mine', 'New title'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates the title on an owned thread', async () => {
    const updated = { _id: new Types.ObjectId(), title: 'New title' };
    const conversationModel: Partial<MockConversationModel> = {
      findOneAndUpdate: jest.fn().mockResolvedValue(updated),
    };
    const service = buildConversationService(conversationModel);

    const result = await service.renameConversation(
      'user-1',
      updated._id.toString(),
      'New title',
    );

    expect(result).toBe(updated);
    expect(conversationModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: updated._id.toString(), userId: 'user-1' },
      { title: 'New title' },
      { new: true },
    );
  });
});

describe('ConversationService#deleteConversation', () => {
  it('throws NotFoundException on a thread the user does not own, without touching messages', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      findOneAndDelete: jest.fn().mockResolvedValue(null),
    };
    const messageModel: Partial<MockMessageModel> = {
      deleteMany: jest.fn(),
    };
    const service = buildConversationService(
      conversationModel,
      undefined,
      messageModel,
    );

    await expect(
      service.deleteConversation('user-1', 'not-mine'),
    ).rejects.toThrow(NotFoundException);
    expect(messageModel.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes an owned thread and its messages, leaving no orphaned AiMessage docs', async () => {
    const deleted = { _id: new Types.ObjectId() };
    const conversationModel: Partial<MockConversationModel> = {
      findOneAndDelete: jest.fn().mockResolvedValue(deleted),
    };
    const messageModel: Partial<MockMessageModel> = {
      deleteMany: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(
      conversationModel,
      undefined,
      messageModel,
    );

    await service.deleteConversation('user-1', deleted._id.toString());

    expect(conversationModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: deleted._id.toString(),
      userId: 'user-1',
    });
    expect(messageModel.deleteMany).toHaveBeenCalledWith({
      conversationId: deleted._id,
    });
  });
});

describe('ConversationService — legacy session migration', () => {
  it('migrates each unmigrated ConversationSession into an AiConversation, seeds AiMessage from its surviving recentMessages, and marks it migrated', async () => {
    const newConversationId = new Types.ObjectId();
    const legacySession = {
      _id: new Types.ObjectId(),
      userId: 'user-1',
      summaryBuffer: 'old summary',
      recentMessages: [
        { role: 'user', content: 'hi', timestamp: new Date() },
        { role: 'assistant', content: 'hello', timestamp: new Date() },
      ],
    };
    const conversationModel: Partial<MockConversationModel> = {
      create: jest.fn().mockResolvedValue({ _id: newConversationId }),
    };
    const messageModel: Partial<MockMessageModel> = {
      insertMany: jest.fn().mockResolvedValue([]),
    };
    const legacySessionModel: Partial<MockLegacySessionModel> = {
      find: jest.fn().mockReturnValue(chainableQuery([legacySession])),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(
      conversationModel,
      legacySessionModel,
      messageModel,
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
    expect(messageModel.insertMany).toHaveBeenCalledWith([
      { conversationId: newConversationId, role: 'user', content: 'hi' },
      {
        conversationId: newConversationId,
        role: 'assistant',
        content: 'hello',
      },
    ]);
    const updateOneMock = legacySessionModel.updateOne as jest.Mock;
    expect(updateOneMock).toHaveBeenCalledTimes(1);
    const [filterArg, updateArg] = updateOneMock.mock.calls[0] as [
      { _id: Types.ObjectId },
      { migratedAt: Date },
    ];
    expect(filterArg).toEqual({ _id: legacySession._id });
    expect(updateArg.migratedAt).toBeInstanceOf(Date);
  });

  it('skips AiMessage seeding when the legacy session has no recentMessages left', async () => {
    const legacySession = {
      _id: new Types.ObjectId(),
      userId: 'user-1',
      summaryBuffer: 'everything already summarized',
      recentMessages: [],
    };
    const conversationModel: Partial<MockConversationModel> = {
      create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const messageModel: Partial<MockMessageModel> = {
      insertMany: jest.fn(),
    };
    const legacySessionModel: Partial<MockLegacySessionModel> = {
      find: jest.fn().mockReturnValue(chainableQuery([legacySession])),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const service = buildConversationService(
      conversationModel,
      legacySessionModel,
      messageModel,
    );

    await service.onModuleInit();

    expect(messageModel.insertMany).not.toHaveBeenCalled();
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

describe('ConversationService#appendMessages', () => {
  it('persists both messages to AiMessage in full, independent of the sliding-window summary', async () => {
    const conversationId = new Types.ObjectId();
    const conversation = {
      _id: conversationId,
      summaryBuffer: '',
      recentMessages: [],
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as AiConversationDocument;
    const messageModel: Partial<MockMessageModel> = {
      insertMany: jest.fn().mockResolvedValue([]),
    };
    const service = buildConversationService({}, undefined, messageModel);

    await service.appendMessages(
      conversation,
      'user question',
      'assistant answer',
      jest.fn(),
    );

    expect(messageModel.insertMany).toHaveBeenCalledWith([
      { conversationId, role: 'user', content: 'user question' },
      { conversationId, role: 'assistant', content: 'assistant answer' },
    ]);
  });
});

describe('ConversationService#getMessages', () => {
  it('throws NotFoundException on a thread the user does not own', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = buildConversationService(conversationModel);

    await expect(
      service.getMessages('user-1', 'not-mine', { page: 1, limit: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it("paginates an owned thread's messages, newest first", async () => {
    const conversationId = new Types.ObjectId();
    const conversationModel: Partial<MockConversationModel> = {
      findOne: jest
        .fn()
        .mockResolvedValue({ _id: conversationId, userId: 'user-1' }),
    };
    const paginatedResult = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPage: 0,
    };
    const paginationService: Partial<PaginationService> = {
      paginate: jest.fn().mockResolvedValue(paginatedResult),
    };
    const service = buildConversationService(
      conversationModel,
      undefined,
      undefined,
      paginationService,
    );

    const result = await service.getMessages(
      'user-1',
      conversationId.toString(),
      {
        page: 1,
        limit: 10,
      },
    );

    expect(result).toBe(paginatedResult);
    const paginateMock = paginationService.paginate as jest.Mock;
    expect(paginateMock).toHaveBeenCalledTimes(1);
    const [, , queryBuilder, sortBuilder] = paginateMock.mock.calls[0] as [
      unknown,
      unknown,
      { build: () => { conversationId: Types.ObjectId } },
      { build: () => { createdAt: number } },
    ];
    expect(queryBuilder.build()).toEqual({ conversationId });
    expect(sortBuilder.build()).toEqual({ createdAt: -1 });
  });
});
