import { IsBoolean, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './post.dto';

export class AdminUpdatePostDto extends PartialType(CreatePostDto) {
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;
}
