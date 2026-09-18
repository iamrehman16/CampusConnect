import { Test, TestingModule } from '@nestjs/testing';
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
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
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

describe('ChatService#onModuleInit — participantsKey backfill', () => {
  it('backfills participantsKey on legacy conversation docs missing it', async () => {
    const a = new Types.ObjectId();
    const b = new Types.ObjectId();
    const legacyDoc = { _id: new Types.ObjectId(), participants: [b, a] };

    const conversationModel: Partial<MockConversationModel> = {
      find: jest.fn().mockReturnValue(chainable([legacyDoc])),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

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
    };

    const chatService = buildChatService(conversationModel);
    await chatService.onModuleInit();

    expect(conversationModel.updateOne).not.toHaveBeenCalled();
  });
});
