import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export enum MentorSort {
  /** Highest reputation first (default). */
  SCORE = 'score',
  /** Most recently online first. */
  ACTIVE = 'active',
}

export class MentorQueryDto extends BaseQueryDto {
  /** Matches mentor name, mentoring topics or expertise (never email). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  /** Matches mentoring topics or expertise (substring, case-insensitive). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  topic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  semesterMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  semesterMax?: number;

  @IsOptional()
  @IsEnum(MentorSort)
  sort?: MentorSort;
}
