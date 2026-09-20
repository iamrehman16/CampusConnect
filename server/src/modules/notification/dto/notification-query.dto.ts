import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class NotificationQueryDto extends BaseQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;
}
