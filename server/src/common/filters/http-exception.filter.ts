import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal Server Error', error: 'Internal Server Error' };

    let message: string | string[];
    let error: string | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const body = exceptionResponse as Record<string, unknown>;
      const bodyMessage = body.message;
      message =
        typeof bodyMessage === 'string' || Array.isArray(bodyMessage)
          ? (bodyMessage as string | string[])
          : 'Internal Server Error';
      error = typeof body.error === 'string' ? body.error : undefined;
    } else {
      message = exceptionResponse;
    }

    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: error || this.getHttpStatusName(status),
    };

    if (status === (HttpStatus.INTERNAL_SERVER_ERROR as number)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private getHttpStatusName(status: number): string {
    return HttpStatus[status] || 'Unknown Error';
  }
}
