import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ReportReason, ReportTargetType } from '../enums/report.enums';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  /** A message id, a conversation id or a user id, per `targetType`. */
  @IsMongoId()
  targetId: string;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
