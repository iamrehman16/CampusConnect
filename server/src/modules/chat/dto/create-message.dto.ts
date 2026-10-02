import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MessageKind } from '../types/message-context';

export class CreateMessageDto {
  @IsMongoId()
  conversationId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsString()
  clientId: string;

  /** Defaults to plain text. `resource` / `post` attach a context card. */
  @IsOptional()
  @IsEnum(MessageKind)
  kind?: MessageKind;

  /** Required exactly when `kind` is `resource` or `post`. */
  @ValidateIf(
    (dto: CreateMessageDto) => !!dto.kind && dto.kind !== MessageKind.TEXT,
  )
  @IsMongoId()
  contextId?: string;
}
