import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  // Omitted → falls back to the user's most recently active thread
  // (ConversationService#getOrCreateConversation). No sidebar/thread
  // picker on the client yet (BACKLOG.md B7), so most callers won't send
  // this until then.
  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}
