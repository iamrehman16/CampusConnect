import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from './enums/user-role.enum';
import { AdminUpdateUserDto } from './dto/update-admin-profile.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Role(Roles.ADMIN)
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createByAdmin(@Body() dto: AdminCreateUserDto) {
    return this.userService.createUserByAdmin(dto);
  }

  @Get()
  findAll(@Query() dto: UserQueryDto) {
    return this.userService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.userService.updateUserByAdmin(id, dto);
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.userService.updateRole(id, dto.role);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.userService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
