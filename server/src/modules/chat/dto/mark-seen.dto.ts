import { IsMongoId, IsString } from 'class-validator';

export class MarkSeenDto {
  @IsMongoId()
  conversationId: string;

  @IsMongoId()
  seenBy: string;
}
