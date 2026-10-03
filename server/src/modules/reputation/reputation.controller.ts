import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { LeaderboardService } from './leaderboard.service';
import {
  LeaderboardPeriod,
  LeaderboardQueryDto,
} from './dto/leaderboard-query.dto';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import { CurrentUser } from '../auth/types/current-user';
import { ParseMongoIdPipe } from '../../common/pipes/is-mongo-id.pipe';

@Controller('reputation')
export class ReputationController {
  constructor(
    private readonly reputationService: ReputationService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  /** The caller's own score history (newest first). */
  @Get('me/history')
  history(@Req() req: { user: CurrentUser }, @Query() query: BaseQueryDto) {
    return this.reputationService.getHistory(req.user.id, query);
  }

  /** Public leaderboard: this month's earners, or lifetime (BACKLOG.md E15). */
  @Get('leaderboard')
  topEarners(@Query() query: LeaderboardQueryDto) {
    return this.leaderboard.top(
      query.period ?? LeaderboardPeriod.MONTH,
      query.limit ?? 10,
    );
  }

  /** Earned badges for any user's public profile. */
  @Get('users/:id/badges')
  badges(@Param('id', ParseMongoIdPipe) id: string) {
    return this.reputationService.getBadges(id);
  }
}
