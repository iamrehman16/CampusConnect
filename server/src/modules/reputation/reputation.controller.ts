import { Controller, Get, Query, Req } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { CurrentUser } from '../auth/types/current-user';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  /** The caller's own score history (newest first). */
  @Get('me/history')
  history(@Req() req: { user: CurrentUser }, @Query() query: BaseQueryDto) {
    return this.reputationService.getHistory(req.user.id, query);
  }
}
