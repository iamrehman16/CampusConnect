import { IsOptional, IsString, MaxLength } from 'class-validator';
import { DECLINE_REASON_MAX } from '../mentorship.constants';

export class DeclineMentorshipDto {
  @IsOptional()
  @IsString()
  @MaxLength(DECLINE_REASON_MAX)
  reason?: string;
}
