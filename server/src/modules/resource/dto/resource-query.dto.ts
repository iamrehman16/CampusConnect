import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType } from '../enums/resource-types.enum';
import { ResourceSort } from '../enums/resource-sort.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class ResourceQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  semester?: number;

  @IsOptional()
  @IsEnum(ResourceSort)
  sort?: ResourceSort = ResourceSort.NEWEST;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsString()
  uploadedBy?: string;

  /** Course code, matched exactly but case-insensitively ("cs-341"). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  course?: string;
}
