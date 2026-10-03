import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { ReportStatus } from '../enums/report.enums';

export class ReportQueryDto extends BaseQueryDto {
  /** Defaults to the open queue. */
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
