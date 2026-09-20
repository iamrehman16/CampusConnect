import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Roles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

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
  academicInfo?: string;

  @IsOptional()
  expertise?: string;
}
