import { IsBoolean, IsMongoId } from 'class-validator';

export class TypingDto {
  @IsMongoId()
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}
