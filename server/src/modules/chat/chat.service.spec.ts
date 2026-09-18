import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ChatService } from './chat.service';

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

describe('ChatService#findOrCreateConversation', () => {
  function chainable(result: unknown) {
    const query: any = {};
    query.populate = jest.fn().mockReturnValue(query);
    query.lean = jest.fn().mockReturnValue(query);
    query.exec = jest.fn().mockResolvedValue(result);
    return query;
  }

  function duplicateParticipantsError() {
    const err: any = new Error('E11000 duplicate key error');
    err.code = 11000;
    err.keyPattern = { participantsKey: 1 };
    return err;
  }

  it('returns the winner instead of throwing when two concurrent creates race on the unique participants index', async () => {
    const currentUserId = new Types.ObjectId().toString();
    const participantId = new Types.ObjectId().toString();
    const winningConversation = { _id: new Types.ObjectId(), participants: [] };

    const conversationModel: any = {
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
        .mockRejectedValueOnce(duplicateParticipantsError()),
      findById: jest.fn().mockReturnValue(chainable(winningConversation)),
    };

    const chatService = new ChatService(
      conversationModel,
      {} as any,
      {} as any,
    );

    const dto = { participantId } as any;

    const [first, second] = await Promise.all([
      chatService.findOrCreateConversation(currentUserId, dto),
      chatService.findOrCreateConversation(currentUserId, dto),
    ]);

    expect(first).toEqual(winningConversation);
    expect(second).toEqual(winningConversation);
  });
});

describe('ChatService#onModuleInit — participantsKey backfill', () => {
  function chainable(result: unknown) {
    const query: any = {};
    query.select = jest.fn().mockReturnValue(query);
    query.lean = jest.fn().mockReturnValue(query);
    query.exec = jest.fn().mockResolvedValue(result);
    return query;
  }

  it('backfills participantsKey on legacy conversation docs missing it', async () => {
    const a = new Types.ObjectId();
    const b = new Types.ObjectId();
    const legacyDoc = { _id: new Types.ObjectId(), participants: [b, a] };

    const conversationModel: any = {
      find: jest.fn().mockReturnValue(chainable([legacyDoc])),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const chatService = new ChatService(
      conversationModel,
      {} as any,
      {} as any,
    );
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
    const conversationModel: any = {
      find: jest.fn().mockReturnValue(chainable([])),
      updateOne: jest.fn(),
    };

    const chatService = new ChatService(
      conversationModel,
      {} as any,
      {} as any,
    );
    await chatService.onModuleInit();

    expect(conversationModel.updateOne).not.toHaveBeenCalled();
  });
});
