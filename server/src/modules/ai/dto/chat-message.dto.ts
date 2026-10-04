import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  // Omitted → starts a new thread (ConversationService#getOrCreateConversation);
  // the stream's citations event carries the new id back to the client.
  @IsOptional()
  @IsMongoId()
  conversationId?: string;

  // A failed assistant reply being retried (BACKLOG.md D12): it and the
  // question it answered are replaced rather than duplicated.
  @IsOptional()
  @IsMongoId()
  retryOfMessageId?: string;
}
