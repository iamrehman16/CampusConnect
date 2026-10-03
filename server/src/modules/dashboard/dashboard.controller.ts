import { Controller, Get, Req } from '@nestjs/common';
import { Roles } from '../user/enums/user-role.enum';
import { DashboardService } from './dashboard.service';
import { ImpactService } from './impact.service';
import { Role } from '../auth/decorators/role.decorator';
import { CurrentUser } from '../auth/types/current-user';

@Controller('dashboard')
@Role(Roles.ADMIN, Roles.CONTRIBUTOR, Roles.STUDENT)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly impact: ImpactService,
  ) {}

  @Get('stats')
  getPublicStats() {
    return this.dashboardService.getPublicStats();
  }

  @Get('me/stats')
  getMyStats(@Req() req: { user: CurrentUser }) {
    return this.dashboardService.getMyStats(req.user.id);
  }

  /** "My impact" for the contributor panel (BACKLOG.md E15). */
  @Get('me/impact')
  getMyImpact(@Req() req: { user: CurrentUser }) {
    return this.impact.getMyImpact(req.user.id);
  }
}
