import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { CurrentUser } from '../auth/types/current-user';
import { GetMessagesDto } from './dto/get-message.dto';

@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  findOrCreate(
    @Req() req: { user: CurrentUser },
    @Body() dto: StartConversationDto,
  ) {
    return this.chatService.findOrCreateConversation(req.user.id, dto);
  }

  @Get()
  getMyConversations(@Req() req: { user: CurrentUser }) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Get('messages')
  getMessages(@Req() req: { user: CurrentUser }, @Query() dto: GetMessagesDto) {
    return this.chatService.getMessages(req.user.id, dto);
  }
}
