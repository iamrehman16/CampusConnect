import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Roles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Roles)
  role?: Roles;

  @IsOptional()
  @IsEnum(UserStatus)
  accountStatus?: UserStatus;

  @IsOptional()
  @IsString()
  academicInfo?: string;

  @IsOptional()
  @IsString()
  expertise?: string;
}
