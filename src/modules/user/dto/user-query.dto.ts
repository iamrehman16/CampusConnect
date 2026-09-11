import { IsInt, IsOptional, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import { Roles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class UserQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(Roles)
  role?: Roles;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  semester?: number;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
