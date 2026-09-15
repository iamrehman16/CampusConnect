import { IsEnum, IsNotEmpty } from 'class-validator';
import { Roles } from '../enums/user-role.enum';

export class UpdateUserRoleDto {
  @IsEnum(Roles)
  @IsNotEmpty()
  role: Roles;
}
