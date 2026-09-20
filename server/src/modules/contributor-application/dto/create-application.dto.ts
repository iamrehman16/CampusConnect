import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  APPLICATION_REASON_MAX,
  APPLICATION_REASON_MIN,
} from '../contributor-application.constants';

export class CreateApplicationDto {
  @IsString()
  @MinLength(APPLICATION_REASON_MIN)
  @MaxLength(APPLICATION_REASON_MAX)
  reason: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  sampleUrl?: string;
}
