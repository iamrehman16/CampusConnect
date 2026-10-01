import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MessageKind } from '../enums/message-kind.enum';

export class CreateMessageDto {
  @IsMongoId()
  conversationId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsEnum(MessageKind)
  kind?: MessageKind;

  /** Required (and only meaningful) when `kind` is not `text`. */
  @ValidateIf((o: CreateMessageDto) => !!o.kind && o.kind !== MessageKind.TEXT)
  @IsMongoId()
  contextId?: string;
}
