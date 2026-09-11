import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../user/enums/user-role.enum';
import { DashboardService } from './dashboard.service';
import { Role } from '../auth/decorators/role.decorator';
import { CurrentUser } from '../auth/types/current-user';

@Controller('dashboard')
@Role(Roles.ADMIN, Roles.CONTRIBUTOR, Roles.STUDENT)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getPublicStats() {
    return this.dashboardService.getPublicStats();
  }

  @Get('me/stats')
  getMyStats(@Req() dto: CurrentUser) {
    return this.dashboardService.getMyStats(dto.id);
  }
}
