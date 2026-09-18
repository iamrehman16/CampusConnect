import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/websocket.jwt.guard';

function mockSocket() {
  return {
    data: {} as Record<string, unknown>,
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: {}, headers: {} },
  } as any;
}

describe('ChatGateway', () => {
  it('handleConnection disconnects the socket instead of throwing when socket.join() rejects', async () => {
    const wsJwtGuard: Partial<WsJwtGuard> = {
      validateSocket: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };
    const gateway = new ChatGateway(
      {} as ChatService,
      wsJwtGuard as WsJwtGuard,
    );
    const socket = mockSocket();
    socket.join.mockRejectedValue(new Error('cluster adapter join failed'));

    await expect(gateway.handleConnection(socket)).resolves.toBeUndefined();

    expect(socket.disconnect).toHaveBeenCalled();
  });

  it('handleJoinConversation returns the joined event once socket.join() resolves', async () => {
    const gateway = new ChatGateway({} as ChatService, {} as WsJwtGuard);
    const socket = mockSocket();
    socket.join.mockResolvedValue(undefined);

    const result = await gateway.handleJoinConversation(
      socket,
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
      gateway.handleJoinConversation(socket, 'conversation-1'),
    ).resolves.toBeUndefined();

    expect(socket.emit).toHaveBeenCalledWith(
      'chat_error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});
