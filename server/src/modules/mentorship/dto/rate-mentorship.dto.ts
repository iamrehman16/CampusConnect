import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { REVIEW_MAX } from '../mentorship.constants';

export class RateMentorshipDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(REVIEW_MAX)
  review?: string;
}
