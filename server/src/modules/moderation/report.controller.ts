import { Body, Controller, Post, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser } from '../auth/types/current-user';

@Controller('reports')
export class ReportController {
  constructor(private readonly reports: ReportService) {}

  @Post()
  create(@Req() req: { user: CurrentUser }, @Body() dto: CreateReportDto) {
    return this.reports.create(req.user.id, dto);
  }
}
