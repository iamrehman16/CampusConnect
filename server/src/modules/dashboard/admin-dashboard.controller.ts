import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';

@Controller('admin/dashboard')
@Role(Roles.ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getOverviewStats();
  }

  @Get('resources/analytics')
  getResourceAnalytics() {
    return this.dashboardService.getResourceAnalytics();
  }

  @Get('users/growth')
  getUserGrowth() {
    return this.dashboardService.getUserGrowth();
  }
}
