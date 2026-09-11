import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

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
}
