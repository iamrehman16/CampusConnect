import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class PostQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  id?: string;
}
