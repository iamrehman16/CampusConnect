import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { AppSocket } from '../types/app-socket';
import { AuthJwtPayload } from '../../auth/types/auth-jwtPayload';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const socket: AppSocket = context.switchToWs().getClient();
    const userId = socket.data.userId;

    if (!userId) throw new WsException('Unauthorized');

    return true;
  }

  validateSocket(socket: AppSocket): { id: string } {
    // socket.handshake.auth is untyped (`{[key: string]: any}`) upstream in
    // socket.io — narrow explicitly rather than trusting its shape.
    const authToken: unknown = socket.handshake.auth?.token;
    const headerToken = socket.handshake.headers?.authorization?.replace(
      'Bearer ',
      '',
    );
    const token = typeof authToken === 'string' ? authToken : headerToken;

    if (!token) throw new WsException('No token provided');

    try {
      const payload = this.jwtService.verify<AuthJwtPayload>(token);
      return { id: payload.sub };
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
