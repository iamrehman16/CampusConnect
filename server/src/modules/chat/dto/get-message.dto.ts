import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
export class GetMessagesDto extends BaseQueryDto {
  @IsMongoId()
  conversationId: string;

  @IsOptional()
  @IsString()
  before?: string;
}
