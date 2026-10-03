import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { MentorSuggestionService } from './services/mentor-suggestion.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { SetMessageFeedbackDto } from './dto/set-message-feedback.dto';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { AuthenticatedRequest } from './ai.controller';

@Controller('ai/conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly mentorSuggestions: MentorSuggestionService,
  ) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateConversationDto) {
    return this.conversationService.createConversation(req.user.id, dto.title);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.conversationService.listConversations(req.user.id);
  }

  @Get(':id/messages')
  getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseMongoIdPipe) id: string,
    @Query() dto: BaseQueryDto,
  ) {
    return this.conversationService.getMessages(req.user.id, id, dto);
  }

  /** "Ask a human" handoff under a weak or thumbs-downed answer (E14). */
  @Get(':id/messages/:messageId/mentor-suggestions')
  getMentorSuggestions(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('messageId', ParseMongoIdPipe) messageId: string,
  ) {
    return this.mentorSuggestions.suggest(req.user.id, id, messageId);
  }

  @Patch(':id/messages/:messageId/feedback')
  setMessageFeedback(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('messageId', ParseMongoIdPipe) messageId: string,
    @Body() dto: SetMessageFeedbackDto,
  ) {
    return this.conversationService.setMessageFeedback(
      req.user.id,
      id,
      messageId,
      dto.feedback,
    );
  }

  @Patch(':id')
  rename(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: RenameConversationDto,
  ) {
    return this.conversationService.renameConversation(
      req.user.id,
      id,
      dto.title,
    );
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    await this.conversationService.deleteConversation(req.user.id, id);
    return { message: 'Conversation deleted' };
  }
}
