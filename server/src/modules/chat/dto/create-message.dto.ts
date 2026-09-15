import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  conversationId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsString()
  clientId: string;
}
