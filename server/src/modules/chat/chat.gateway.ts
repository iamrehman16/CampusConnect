import {
  Logger,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket, Server } from 'socket.io';
import { WsJwtGuard } from './guards/websocket.jwt.guard';
import { WsExceptionFilter } from './filters/websocket-exception.filter';
import { CreateMessageDto } from './dto/create-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { MarkSeenDto } from './dto/mark-seen.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  },
  namespace: '/chat',
})
@UseFilters(WsExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly wsJwtGuard: WsJwtGuard,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const user = await this.wsJwtGuard.validateSocket(socket);

      socket.data.userId = user.id;

      // user identity room (key change)
      socket.join(user.id);

      console.log(`User ${user.id} connected`);
    } catch (e) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;

    if (userId) {
      console.log(`User ${userId} disconnected socket ${socket.id}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() conversationId: string,
  ) {
    socket.join(conversationId);

    return { event: 'joined', data: conversationId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: CreateMessageDto,
  ) {
    const senderId = socket.data.userId;
    try {
      const message = await this.chatService.createMessageIdempotent(
        dto,
        senderId,
      );
      socket.to(dto.conversationId).emit('new_message', message);
      return message;
    } catch (err) {
      this.logger.error(
        `Error in handleSendMessage for user ${senderId}:`,
        err,
      );
      socket.emit('chat_error', {
        message: 'Failed to send message',
        clientId: dto.clientId,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_seen')
  async handleMarkSeen(
    @ConnectedSocket() socket: Socket,
    @MessageBody() conversationId: string,
  ) {
    const userId = socket.data.userId;
    try {
      await this.chatService.markSeen(conversationId, userId);
      const dto: MarkSeenDto = { conversationId, seenBy: userId };
      this.server.to(conversationId).emit('messages_seen', dto);
    } catch (err) {
      this.logger.error(`Error in handleMarkSeen for user ${userId}:`, err);
      socket.emit('chat_error', { message: 'Failed to update message status' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const userId = socket.data.userId;
    try {
      await this.chatService.deleteMessage(
        dto.messageId,
        dto.conversationId,
        userId,
      );
      const deleteDto: DeleteMessageDto = {
        messageId: dto.messageId,
        conversationId: dto.conversationId,
      };
      this.server.to(dto.conversationId).emit('message_deleted', deleteDto);
    } catch (err) {
      this.logger.error(
        `Error in handleDeleteMessage for user ${userId}:`,
        err,
      );
      socket.emit('chat_error', { message: 'Failed to delete message' });
    }
  }

  //private helpers
  private addUserSocket(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeUserSocket(userId: string, socketId: string) {
    const sockets = this.connectedUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.connectedUsers.delete(userId);
    }
  }
}
