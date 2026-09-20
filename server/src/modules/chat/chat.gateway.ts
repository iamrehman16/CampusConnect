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
  WsException,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server } from 'socket.io';
import { WsJwtGuard } from './guards/websocket.jwt.guard';
import { WsExceptionFilter } from './filters/websocket-exception.filter';
import { CreateMessageDto } from './dto/create-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { MarkSeenDto } from './dto/mark-seen.dto';
import { AppSocket } from './types/app-socket';

// @UseGuards(WsJwtGuard) already rejects sockets with no userId at
// runtime before these handlers run; this narrows `string | undefined`
// to `string` at compile time and stays defense-in-depth otherwise.
function requireUserId(socket: AppSocket): string {
  if (!socket.data.userId) {
    throw new WsException('Unauthorized');
  }
  return socket.data.userId;
}

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

  async handleConnection(socket: AppSocket) {
    try {
      const user = this.wsJwtGuard.validateSocket(socket);

      socket.data.userId = user.id;

      // user identity room (key change)
      await socket.join(user.id);

      this.logger.log(`User ${user.id} connected`);
    } catch (err) {
      this.logger.error('Error in handleConnection:', err);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AppSocket) {
    const userId = socket.data.userId;

    if (userId) {
      this.logger.log(`User ${userId} disconnected socket ${socket.id}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() conversationId: string,
  ) {
    const userId = requireUserId(socket);
    try {
      // Room membership is what authorizes receiving new_message events, so
      // it must be gated on actually being a participant.
      await this.chatService.verifyParticipant(conversationId, userId);
      await socket.join(conversationId);
      return { event: 'joined', data: conversationId };
    } catch (err) {
      this.logger.error(
        `Error in handleJoinConversation for conversation ${conversationId}:`,
        err,
      );
      socket.emit('chat_error', { message: 'Failed to join conversation' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() dto: CreateMessageDto,
  ) {
    const senderId = requireUserId(socket);
    try {
      const message = await this.chatService.createMessageIdempotent(
        dto,
        senderId,
      );
      // Deliver to the conversation room (open chat) AND the receiver's
      // personal room (joined on connect) — otherwise a recipient who isn't
      // currently viewing this conversation never hears about the message,
      // which makes unread badges impossible. Socket.IO delivers once per
      // socket even when it's in both rooms.
      const receiverId = await this.chatService.getReceiverIdFromConversation(
        dto.conversationId,
        senderId,
      );
      socket.to(dto.conversationId).to(receiverId).emit('new_message', message);
      return message;
    } catch (err) {
      this.logger.error(
        `Error in handleSendMessage for user ${senderId}:`,
        err,
      );
      socket.emit('chat_error', {
        message: 'Failed to send message',
        clientId: dto.clientId,
        conversationId: dto.conversationId,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('mark_seen')
  async handleMarkSeen(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() conversationId: string,
  ) {
    const userId = requireUserId(socket);
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
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() dto: DeleteMessageDto,
  ) {
    const userId = requireUserId(socket);
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
