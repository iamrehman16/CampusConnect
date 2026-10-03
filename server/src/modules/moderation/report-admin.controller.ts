import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { Role } from '../auth/decorators/role.decorator';
import { Roles } from '../user/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Role(Roles.ADMIN)
export class ReportAdminController {
  constructor(private readonly reports: ReportService) {}

  @Get()
  list(@Query() dto: ReportQueryDto) {
    return this.reports.list(dto);
  }

  @Patch(':id/resolve')
  resolve(
    @Req() req: { user: CurrentUser },
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reports.resolve(req.user.id, id, dto);
  }
}
