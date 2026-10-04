import {
  Body,
  Controller,
  Delete,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AiChatService } from './services/ai-chat.service';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat/stream')
  async stream(
    @Req() req: AuthenticatedRequest,
    @Body() chatMessageDto: ChatMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let observable: Awaited<ReturnType<AiChatService['streamChatResponse']>>;
    try {
      observable = await this.aiChatService.streamChatResponse(
        req.user.id,
        chatMessageDto.message,
        chatMessageDto.conversationId,
        chatMessageDto.retryOfMessageId,
      );
    } catch (err: unknown) {
      // Headers are already flushed, so the global filter can't send a JSON
      // error; report it in-band as an SSE error event and close the stream.
      this.logger.error(
        `AI stream setup failed for user ${req.user.id}`,
        err instanceof Error ? err.stack : String(err),
      );
      if (!res.writableEnded) {
        const message =
          err instanceof Error ? err.message : 'AI request failed';
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      }
      return;
    }

    const subscription = observable.subscribe({
      next: (event: MessageEvent) => {
        if (res.writableEnded) return;
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
      },
      error: (err: unknown) => {
        if (res.writableEnded) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      },
      complete: () => {
        if (res.writableEnded) return;
        res.end();
      },
    });

    req.on('close', () => {
      subscription.unsubscribe();
      if (!res.writableEnded) {
        res.end();
      }
    });
  }

  @Post('chat')
  async chat(
    @Req() req: AuthenticatedRequest,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    const answer = await this.aiChatService.getChatResponse(
      req.user.id,
      chatMessageDto.message,
      chatMessageDto.conversationId,
    );
    return answer;
  }

  @Delete('chat/session')
  async clearSession(@Req() req: AuthenticatedRequest) {
    await this.aiChatService.clearSession(req.user.id);
    return { message: 'Session cleared' };
  }
}
