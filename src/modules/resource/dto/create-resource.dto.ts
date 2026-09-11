import {
  IsString,
  IsNumber,
  IsIn,
  IsEnum,
  MaxLength,
  Min,
  Max,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '../enums/resource-types.enum';

export class CreateResourceDto {
  // --- Academic metadata (user fills in form) ---
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsString()
  subject: string;

  @IsString()
  course: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(8)
  semester: number;

  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // --- Cloudinary upload result (client sends after direct upload) ---
  @IsString()
  publicId: string; // Cloudinary: public_id

  @IsString()
  secureUrl: string; // Cloudinary: secure_url

  @IsString()
  cloudinarySignature: string; // Cloudinary: signature — used for server-side verification

  @Type(() => Number)
  @IsNumber()
  version: number; // Cloudinary: version — used in signature verification

  @IsString()
  format: string; // Cloudinary: format (e.g. 'pdf', 'png')

  @Type(() => Number)
  @IsNumber()
  bytes: number; // Cloudinary: bytes

  @IsString()
  originalName: string; // original filename — for inferFileType fallback

  @IsIn(['image', 'raw'])
  cloudinaryResourceType: 'image' | 'raw';
}
