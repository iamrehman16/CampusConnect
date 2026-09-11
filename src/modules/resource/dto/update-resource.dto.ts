import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceDto } from './create-resource.dto';

export class UpdateResourceByContributorDto extends PartialType(
  CreateResourceDto,
) {}
