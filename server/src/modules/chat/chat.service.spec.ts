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
    err.keyPattern = { participants: 1 };
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
