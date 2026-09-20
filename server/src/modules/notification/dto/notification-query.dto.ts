import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class NotificationQueryDto extends BaseQueryDto {
  /**
   * Reads the RAW query value (`obj[key]`): the global pipe's
   * `enableImplicitConversion` has already run Boolean('false') === true on
   * `value` by the time this transform executes.
   */
  @IsOptional()
  @Transform(({ obj, key }: { obj: Record<string, unknown>; key: string }) =>
    obj[key] === undefined
      ? undefined
      : obj[key] === 'true' || obj[key] === true,
  )
  @IsBoolean()
  unreadOnly?: boolean;
}
