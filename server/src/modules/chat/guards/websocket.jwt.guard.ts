import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const socket: Socket = context.switchToWs().getClient();
    const userId = socket.data.userId;

    if (!userId) throw new WsException('Unauthorized');

    return true;
  }

  async validateSocket(socket: Socket): Promise<{ id: string }> {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) throw new WsException('No token provided');

    try {
      const payload = this.jwtService.verify(token);
      return { id: payload.sub };
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
