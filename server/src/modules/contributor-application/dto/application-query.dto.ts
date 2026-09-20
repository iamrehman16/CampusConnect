import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { ApplicationStatus } from '../enums/application-status.enum';

export class ApplicationQueryDto extends BaseQueryDto {
  /** Defaults to the review queue (Pending). */
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
