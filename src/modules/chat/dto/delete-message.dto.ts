import { IsMongoId } from 'class-validator';

export class DeleteMessageDto {
  @IsMongoId()
  messageId: string;

  @IsMongoId()
  conversationId: string;
}
