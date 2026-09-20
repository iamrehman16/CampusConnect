import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationDto } from './dto/notification.dto';

/**
 * Push-only. Shares the `/chat` namespace on purpose: ChatGateway already
 * authenticates each socket and joins it to a room named after its user id,
 * so notifications ride the client's existing connection (no second socket).
 * That "room == user id" convention is the contract this class relies on.
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
  },
  namespace: '/chat',
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  /** Authoritative unread total, for changes the client didn't initiate. */
  pushUnreadCount(userId: string, count: number): void {
    this.server.to(userId).emit('notification_unread_count', { count });
  }

  push(userId: string, notification: NotificationDto): void {
    this.server.to(userId).emit('notification', notification);
  }
}
