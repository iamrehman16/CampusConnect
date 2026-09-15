import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const socket = host.switchToWs().getClient();

    if (exception instanceof WsException) {
      socket.emit('error', { message: exception.message });
      return;
    }

    if (exception instanceof HttpException) {
      socket.emit('error', {
        message: exception.message,
        statusCode: exception.getStatus(),
      });
      return;
    }

    socket.emit('error', { message: 'Internal server error' });
  }
}
