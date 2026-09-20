import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/websocket.jwt.guard';
import { AppSocket, ChatSocketData } from './types/app-socket';

type MockSocket = {
  data: ChatSocketData;
  join: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
  handshake: {
    auth: Record<string, unknown>;
    headers: Record<string, unknown>;
  };
};

function mockSocket(): MockSocket {
  return {
    data: {},
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: {}, headers: {} },
  };
}

describe('ChatGateway', () => {
  it('handleConnection disconnects the socket instead of throwing when socket.join() rejects', async () => {
    const wsJwtGuard: Partial<WsJwtGuard> = {
      validateSocket: jest.fn().mockReturnValue({ id: 'user-1' }),
    };
    const gateway = new ChatGateway(
      {} as ChatService,
      wsJwtGuard as WsJwtGuard,
    );
    const socket = mockSocket();
    socket.join.mockRejectedValue(new Error('cluster adapter join failed'));

    await expect(
      gateway.handleConnection(socket as unknown as AppSocket),
    ).resolves.toBeUndefined();

    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('handleJoinConversation returns the joined event once socket.join() resolves', async () => {
    const gateway = new ChatGateway({} as ChatService, {} as WsJwtGuard);
    const socket = mockSocket();
    socket.join.mockResolvedValue(undefined);

    const result = await gateway.handleJoinConversation(
      socket as unknown as AppSocket,
      'conversation-1',
    );

    expect(socket.join).toHaveBeenCalledWith('conversation-1');
    expect(result).toEqual({ event: 'joined', data: 'conversation-1' });
  });

  it('handleJoinConversation emits chat_error instead of throwing when socket.join() rejects', async () => {
    const gateway = new ChatGateway({} as ChatService, {} as WsJwtGuard);
    const socket = mockSocket();
    socket.join.mockRejectedValue(new Error('cluster adapter join failed'));

    await expect(
      gateway.handleJoinConversation(
        socket as unknown as AppSocket,
        'conversation-1',
      ),
    ).resolves.toBeUndefined();

    expect(socket.emit).toHaveBeenCalledWith(
      'chat_error',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- jest's expect.any() matcher is untyped, not a real `any` value
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('handleSendMessage delivers new_message to the conversation room and the receiver personal room', async () => {
    const message = { id: 'm1' };
    const chatService = {
      createMessageIdempotent: jest.fn().mockResolvedValue(message),
      getReceiverIdFromConversation: jest.fn().mockResolvedValue('user-2'),
    };
    const gateway = new ChatGateway(
      chatService as unknown as ChatService,
      {} as WsJwtGuard,
    );
    const emit = jest.fn();
    const secondTo = jest.fn().mockReturnValue({ emit });
    const firstTo = jest.fn().mockReturnValue({ to: secondTo });
    const socket = { ...mockSocket(), to: firstTo };
    socket.data.userId = 'user-1';

    await gateway.handleSendMessage(socket as unknown as AppSocket, {
      conversationId: 'conv-1',
      content: 'hi',
      clientId: 'c1',
    });

    expect(firstTo).toHaveBeenCalledWith('conv-1');
    expect(secondTo).toHaveBeenCalledWith('user-2');
    expect(emit).toHaveBeenCalledWith('new_message', message);
  });
});
