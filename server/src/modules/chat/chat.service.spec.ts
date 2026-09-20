import { Model, Types } from 'mongoose';
import { ChatService } from './chat.service';
import { ConversationDocument } from './schema/conversation.schema';
import { MessageDocument } from './schema/message.schema';
import { PaginationService } from '../../common/services/pagination.service';

type MockQuery = {
  populate: jest.Mock;
  select: jest.Mock;
  lean: jest.Mock;
  exec: jest.Mock;
};

function chainable(result: unknown): MockQuery {
  const query = {} as MockQuery;
  query.populate = jest.fn().mockReturnValue(query);
  query.select = jest.fn().mockReturnValue(query);
  query.lean = jest.fn().mockReturnValue(query);
  query.exec = jest.fn().mockResolvedValue(result);
  return query;
}

function duplicateKeyError(field: string): Error & {
  code: number;
  keyPattern: Record<string, number>;
} {
  return Object.assign(new Error('E11000 duplicate key error'), {
    code: 11000,
    keyPattern: { [field]: 1 },
  });
}

describe('ChatService', () => {
  it('should be defined', () => {
    const service = buildChatService({});

    expect(service).toBeDefined();
  });
});

type MockConversationModel = {
  findOne: jest.Mock;
  create: jest.Mock;
  findById: jest.Mock;
  find: jest.Mock;
  updateOne: jest.Mock;
};

function buildChatService(conversationModel: Partial<MockConversationModel>) {
  return new ChatService(
    conversationModel as unknown as Model<ConversationDocument>,
    {} as unknown as Model<MessageDocument>,
    {} as unknown as PaginationService,
  );
}

describe('ChatService#findOrCreateConversation', () => {
  it('returns the winner instead of throwing when two concurrent creates race on the unique participants index', async () => {
    const currentUserId = new Types.ObjectId().toString();
    const participantId = new Types.ObjectId().toString();
    const winningConversation = { _id: new Types.ObjectId(), participants: [] };

    const conversationModel: MockConversationModel = {
      findOne: jest
        .fn()
        // both concurrent calls miss the existing-conversation check
        .mockReturnValueOnce(chainable(null))
        .mockReturnValueOnce(chainable(null))
        // the loser re-queries after catching E11000 and gets the winner
        .mockReturnValueOnce(chainable(winningConversation)),
      create: jest
        .fn()
        .mockResolvedValueOnce({ _id: winningConversation._id })
        .mockRejectedValueOnce(duplicateKeyError('participantsKey')),
      findById: jest.fn().mockReturnValue(chainable(winningConversation)),
      find: jest.fn(),
      updateOne: jest.fn(),
    };

    const chatService = buildChatService(conversationModel);

    const dto = { participantId } as Parameters<
      typeof chatService.findOrCreateConversation
    >[1];

    const [first, second] = await Promise.all([
      chatService.findOrCreateConversation(currentUserId, dto),
      chatService.findOrCreateConversation(currentUserId, dto),
    ]);

    expect(first).toEqual(winningConversation);
    expect(second).toEqual(winningConversation);
  });
});

function fakeCollection(
  indexes: { name: string; key: Record<string, number>; unique?: boolean }[],
) {
  return {
    indexes: jest.fn().mockResolvedValue(indexes),
    dropIndex: jest.fn().mockResolvedValue(undefined),
    createIndex: jest.fn().mockResolvedValue('ok'),
  };
}

describe('ChatService#onModuleInit — legacy unique participants index (BACKLOG A9)', () => {
  function run(
    collection: ReturnType<typeof fakeCollection> | { indexes: jest.Mock },
  ) {
    const conversationModel = {
      find: jest.fn().mockReturnValue(chainable([])),
      collection,
    };
    return buildChatService(
      conversationModel as unknown as Partial<MockConversationModel>,
    ).onModuleInit();
  }

  it('drops the legacy unique participants index and recreates it non-unique', async () => {
    const collection = fakeCollection([
      { name: '_id_', key: { _id: 1 } },
      { name: 'participants_1', key: { participants: 1 }, unique: true },
      { name: 'participantsKey_1', key: { participantsKey: 1 }, unique: true },
    ]);

    await run(collection);

    expect(collection.dropIndex).toHaveBeenCalledTimes(1);
    expect(collection.dropIndex).toHaveBeenCalledWith('participants_1');
    expect(collection.createIndex).toHaveBeenCalledWith({ participants: 1 });
  });

  it('is a no-op once the participants index is already non-unique (idempotent)', async () => {
    const collection = fakeCollection([
      { name: 'participants_1', key: { participants: 1 } },
      { name: 'participantsKey_1', key: { participantsKey: 1 }, unique: true },
    ]);

    await run(collection);

    expect(collection.dropIndex).not.toHaveBeenCalled();
    expect(collection.createIndex).not.toHaveBeenCalled();
  });

  it('never touches the intended unique participantsKey index', async () => {
    const collection = fakeCollection([
      { name: 'participantsKey_1', key: { participantsKey: 1 }, unique: true },
    ]);

    await run(collection);

    expect(collection.dropIndex).not.toHaveBeenCalled();
  });

  it('tolerates a fresh database where the collection does not exist yet', async () => {
    const collection = {
      indexes: jest
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('ns does not exist'), { code: 26 }),
        ),
    };

    await expect(run(collection)).resolves.toBeUndefined();
  });

  it('rethrows unexpected index errors instead of swallowing them', async () => {
    const collection = {
      indexes: jest.fn().mockRejectedValue(new Error('auth failed')),
    };

    await expect(run(collection)).rejects.toThrow('auth failed');
  });
});

describe('ChatService#onModuleInit — participantsKey backfill', () => {
  it('backfills participantsKey on legacy conversation docs missing it', async () => {
    const a = new Types.ObjectId();
    const b = new Types.ObjectId();
    const legacyDoc = { _id: new Types.ObjectId(), participants: [b, a] };

    const conversationModel: Partial<MockConversationModel> = {
      find: jest.fn().mockReturnValue(chainable([legacyDoc])),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      collection: fakeCollection([]),
    } as unknown as Partial<MockConversationModel>;

    const chatService = buildChatService(conversationModel);
    await chatService.onModuleInit();

    expect(conversationModel.find).toHaveBeenCalledWith({
      participantsKey: { $exists: false },
    });
    const sortedKey = [a, b]
      .sort()
      .map((id) => id.toString())
      .join('_');
    expect(conversationModel.updateOne).toHaveBeenCalledWith(
      { _id: legacyDoc._id },
      { participantsKey: sortedKey },
    );
  });

  it('does nothing when no legacy docs are missing participantsKey', async () => {
    const conversationModel: Partial<MockConversationModel> = {
      find: jest.fn().mockReturnValue(chainable([])),
      updateOne: jest.fn(),
      collection: fakeCollection([]),
    } as unknown as Partial<MockConversationModel>;

    const chatService = buildChatService(conversationModel);
    await chatService.onModuleInit();

    expect(conversationModel.updateOne).not.toHaveBeenCalled();
  });
});

describe('ChatService#getUserConversations — unreadCount', () => {
  it('attaches per-conversation unread counts from one grouped query, defaulting to 0', async () => {
    const userId = new Types.ObjectId().toString();
    const convWithUnread = new Types.ObjectId();
    const convAllRead = new Types.ObjectId();

    const query = chainable([{ _id: convWithUnread }, { _id: convAllRead }]);
    (query as MockQuery & { sort: jest.Mock }).sort = jest
      .fn()
      .mockReturnValue(query);
    const conversationModel = { find: jest.fn().mockReturnValue(query) };
    const aggregate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ _id: convWithUnread, count: 3 }]),
    });

    const chatService = new ChatService(
      conversationModel as unknown as Model<ConversationDocument>,
      { aggregate } as unknown as Model<MessageDocument>,
      {} as unknown as PaginationService,
    );

    const result = await chatService.getUserConversations(userId);

    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(result.map((c) => c.unreadCount)).toEqual([3, 0]);
  });
});
