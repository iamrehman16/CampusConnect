import { ConversationController } from './conversation.controller';
import { ConversationService } from './services/conversation.service';
import { AuthenticatedRequest } from './ai.controller';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';

function buildController(conversationService: Partial<ConversationService>) {
  return new ConversationController(conversationService as ConversationService);
}

function mockRequest(userId = 'user-1'): AuthenticatedRequest {
  return { user: { id: userId } } as AuthenticatedRequest;
}

describe('ConversationController', () => {
  it("create delegates to ConversationService.createConversation with the caller's id", async () => {
    const conversationService: Partial<ConversationService> = {
      createConversation: jest.fn().mockResolvedValue({ title: 'Thread' }),
    };
    const controller = buildController(conversationService);
    const dto: CreateConversationDto = { title: 'Thread' };

    await controller.create(mockRequest(), dto);

    expect(conversationService.createConversation).toHaveBeenCalledWith(
      'user-1',
      'Thread',
    );
  });

  it("list delegates to ConversationService.listConversations with the caller's id", async () => {
    const conversationService: Partial<ConversationService> = {
      listConversations: jest.fn().mockResolvedValue([]),
    };
    const controller = buildController(conversationService);

    await controller.list(mockRequest());

    expect(conversationService.listConversations).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('rename delegates to ConversationService.renameConversation with id, conversationId, and title', async () => {
    const conversationService: Partial<ConversationService> = {
      renameConversation: jest.fn().mockResolvedValue({}),
    };
    const controller = buildController(conversationService);
    const dto: RenameConversationDto = { title: 'New title' };

    await controller.rename(mockRequest(), 'thread-1', dto);

    expect(conversationService.renameConversation).toHaveBeenCalledWith(
      'user-1',
      'thread-1',
      'New title',
    );
  });

  it('remove delegates to ConversationService.deleteConversation and returns a confirmation message', async () => {
    const conversationService: Partial<ConversationService> = {
      deleteConversation: jest.fn().mockResolvedValue(undefined),
    };
    const controller = buildController(conversationService);

    const result = await controller.remove(mockRequest(), 'thread-1');

    expect(conversationService.deleteConversation).toHaveBeenCalledWith(
      'user-1',
      'thread-1',
    );
    expect(result).toEqual({ message: 'Conversation deleted' });
  });
});
