import { Body, Controller, Delete, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AiChatService } from './services/ai-chat.service';
import { CurrentUser } from '../auth/types/current-user';

export type AuthenticatedRequest = Request & { user: CurrentUser };

@Controller('ai')
export class AiController {
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

    const observable = await this.aiChatService.streamChatResponse(
      req.user.id,
      chatMessageDto.message,
      chatMessageDto.conversationId,
    );

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
