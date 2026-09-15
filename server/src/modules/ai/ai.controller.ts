import { Body, Controller, Delete, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AiChatService } from './services/ai-chat.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat/stream')
  async stream(
    @Req() req,
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
    );

    observable.subscribe({
      next: (event: MessageEvent) => {
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
      },
      error: (err) => {
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`,
        );
        res.end();
      },
      complete: () => {
        res.end();
      },
    });

    req.on('close', () => {
      res.end();
    });
  }

  @Post('chat')
  async chat(@Req() req, @Body() chatMessageDto: ChatMessageDto) {
    const answer = await this.aiChatService.getChatResponse(
      req.user.id,
      chatMessageDto.message,
    );
    return answer;
  }

  @Delete('chat/session')
  async clearSession(@Req() req) {
    await this.aiChatService.clearSession(req.user.id);
    return { message: 'Session cleared' };
  }
}
