import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './post.dto';

export class AdminUpdatePostDto extends PartialType(CreatePostDto) {
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
}
