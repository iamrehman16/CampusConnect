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
import { TypingDto } from './dto/typing.dto';
import { PresenceService } from './presence.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ChatConversationReadEvent,
  ChatMessageReceivedEvent,
  DomainEvents,
} from '../../common/events/domain-events';
import { AppSocket, ChatSocketData } from './types/app-socket';

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

  constructor(
    private readonly chatService: ChatService,
    private readonly wsJwtGuard: WsJwtGuard,
    private readonly presence: PresenceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(socket: AppSocket) {
    try {
      const user = this.wsJwtGuard.validateSocket(socket);

      socket.data.userId = user.id;

      // user identity room (key change)
      await socket.join(user.id);

      await this.announceConnect(socket, user.id);

      this.logger.log(`User ${user.id} connected`);
    } catch (err) {
      this.logger.error('Error in handleConnection:', err);
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: AppSocket) {
    const userId = socket.data.userId;
    if (!userId) return;

    this.logger.log(`User ${userId} disconnected socket ${socket.id}`);

    try {
      const lastSeenAt = await this.presence.disconnect(userId, socket.id);
      if (!lastSeenAt) return;

      const partnerIds =
        await this.chatService.getConversationPartnerIds(userId);
      if (partnerIds.length === 0) return;

      this.server
        .to(partnerIds)
        .emit('presence', { userId, online: false, lastSeenAt });
    } catch (err) {
      this.logger.error(`Error broadcasting offline for ${userId}:`, err);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_presence')
  async handleGetPresence(@ConnectedSocket() socket: AppSocket) {
    const userId = requireUserId(socket);
    try {
      const partnerIds =
        await this.chatService.getConversationPartnerIds(userId);
      return this.presence.filterOnline(partnerIds);
    } catch (err) {
      this.logger.error(`Error in handleGetPresence for user ${userId}:`, err);
      socket.emit('chat_error', { message: 'Failed to load presence' });
      return [];
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: AppSocket,
    @MessageBody() dto: TypingDto,
  ) {
    const userId = requireUserId(socket);
    // Room membership is participant-verified in join_conversation, so it
    // doubles as the authorization check here (no DB hit per keystroke).
    if (!socket.rooms.has(dto.conversationId)) return;

    socket.to(dto.conversationId).emit('typing', {
      conversationId: dto.conversationId,
      userId,
      isTyping: dto.isTyping,
    });
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
      await this.notifyIfReceiverAway(
        dto.conversationId,
        senderId,
        receiverId,
        dto.content,
      );
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
      this.eventEmitter.emit(DomainEvents.CHAT_CONVERSATION_READ, {
        userId,
        conversationId,
      } satisfies ChatConversationReadEvent);
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

  /**
   * Emit a domain event (-> notification) only when the receiver isn't in the
   * conversation room, i.e. isn't looking at it. Best-effort: the message is
   * already persisted and delivered, so a failure here is logged, not thrown.
   */
  private async notifyIfReceiverAway(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<void> {
    try {
      const inRoom = await this.server.in(conversationId).fetchSockets();
      if (
        inRoom.some((s) => (s.data as ChatSocketData).userId === receiverId)
      ) {
        return;
      }

      this.eventEmitter.emit(DomainEvents.CHAT_MESSAGE_RECEIVED, {
        conversationId,
        senderId,
        receiverId,
        preview: content.length > 120 ? `${content.slice(0, 117)}...` : content,
      } satisfies ChatMessageReceivedEvent);
    } catch (err) {
      this.logger.error(
        `Failed to evaluate message notification for conversation ${conversationId}:`,
        err,
      );
    }
  }

  /**
   * On a user's first live socket: tell their conversation partners they're
   * online. (The reverse — which partners are online — is pulled by the
   * client via `get_presence`, so it can't be lost to a listener-registration
   * race at connect time.)
   */
  private async announceConnect(socket: AppSocket, userId: string) {
    const isFirstSocket = this.presence.connect(userId, socket.id);
    const partnerIds = await this.chatService.getConversationPartnerIds(userId);

    if (isFirstSocket && partnerIds.length > 0) {
      this.server.to(partnerIds).emit('presence', { userId, online: true });
    }
  }
}
