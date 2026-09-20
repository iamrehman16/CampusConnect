import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ContributorApplicationService } from './contributor-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CurrentUser } from '../auth/types/current-user';

@Controller('contributor-applications')
export class ContributorApplicationController {
  constructor(private readonly service: ContributorApplicationService) {}

  @Post()
  apply(@Req() req: { user: CurrentUser }, @Body() dto: CreateApplicationDto) {
    return this.service.apply(req.user.id, dto);
  }

  /** Latest application + score/eligibility, for the applicant's own UI. */
  @Get('me')
  mine(@Req() req: { user: CurrentUser }) {
    return this.service.getMine(req.user.id);
  }
}
