import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  department: string;

  @IsNumber()
  @Min(1)
  @Max(8)
  semester: number;

  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @IsString()
  academicInfo: string;

  // Trimmed and required: this is the user's public display name. It used
  // to be seeded with the email at registration, so an empty value here
  // left the email showing as the author name across the app.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  expertise: string[];

  @IsBoolean()
  isOpenToMentor: boolean;

  @IsString()
  avatar: string;
}
