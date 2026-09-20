import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { normalizeTags } from '../../../common/utils/normalize-tags';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @MinLength(6)
  newPassword?: string;

  @IsOptional()
  @IsString()
  academicInfo?: string;

  @IsOptional()
  @IsString()
  expertise?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @IsBoolean()
  isOpenToMentor?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mentorBio?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeTags(value))
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  mentorTopics?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxActiveMentees?: number;
}
