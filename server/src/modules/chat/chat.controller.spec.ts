import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  it('should be defined', () => {
    const chatService: Partial<ChatService> = {};
    const controller = new ChatController(chatService as ChatService);

    expect(controller).toBeDefined();
  });
});
