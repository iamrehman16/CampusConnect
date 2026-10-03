import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReputationEvent,
  ReputationEventDocument,
} from './schema/reputation-event.schema';
import { UserService } from '../user/user.service';
import {
  LeaderboardEntryDto,
  LeaderboardPeriod,
} from './dto/leaderboard-query.dto';
import { startOfUtcMonth } from './impact-series';

/**
 * How many extra ranked ids to fetch for every one shown, so people who are
 * suspended or opted out can be dropped without leaving the board short.
 */
const OVERFETCH = 4;

/**
 * Public leaderboard (BACKLOG.md E15). All-time reuses the existing
 * top-contributors query (lifetime `contributionScore`); "this month" ranks by
 * net points in the reputation ledger since the start of the UTC month. Both
 * exclude suspended accounts and anyone who opted out.
 */
@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(ReputationEvent.name)
    private readonly eventModel: Model<ReputationEventDocument>,
    private readonly userService: UserService,
  ) {}

  async top(
    period: LeaderboardPeriod,
    limit: number,
    now: Date = new Date(),
  ): Promise<LeaderboardEntryDto[]> {
    return period === LeaderboardPeriod.ALL
      ? this.allTime(limit)
      : this.thisMonth(limit, now);
  }

  private async allTime(limit: number): Promise<LeaderboardEntryDto[]> {
    const rows = await this.userService.findTopContributors(limit);
    return rows.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      tier: u.tier,
      points: u.contributionScore,
    }));
  }

  private async thisMonth(
    limit: number,
    now: Date,
  ): Promise<LeaderboardEntryDto[]> {
    const ranked = await this.eventModel
      .aggregate<{
        _id: { toString(): string };
        points: number;
      }>([
        { $match: { createdAt: { $gte: startOfUtcMonth(now) } } },
        { $group: { _id: '$user', points: { $sum: '$points' } } },
        { $match: { points: { $gt: 0 } } },
        { $sort: { points: -1, _id: 1 } },
        { $limit: limit * OVERFETCH },
      ])
      .exec();
    if (ranked.length === 0) return [];

    const visible = new Map(
      (
        await this.userService.findLeaderboardCandidates(
          ranked.map((r) => r._id.toString()),
        )
      ).map((u) => [u.id, u]),
    );

    return ranked
      .flatMap((r) => {
        const user = visible.get(r._id.toString());
        return user ? [{ user, points: r.points }] : [];
      })
      .slice(0, limit)
      .map(({ user, points }, i) => ({
        rank: i + 1,
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        tier: user.tier,
        points,
      }));
  }
}
