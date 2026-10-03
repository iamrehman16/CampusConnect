import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportResolution } from '../enums/report.enums';

export class ResolveReportDto {
  @IsEnum(ReportResolution)
  action: ReportResolution;

  /** Shown to the user on a warning; kept on the report either way. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
