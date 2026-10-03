import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserService, ratingSummary } from '../user/user.service';
import {
  Resource,
  ResourceDocument,
} from '../resource/schemas/resource.schema';
import { ApprovalStatus } from '../resource/enums/approval-status.enum';
import {
  ReputationEvent,
  ReputationEventDocument,
} from '../reputation/schema/reputation-event.schema';
import { ReputationEventType } from '../reputation/enums/reputation-event-type.enum';
import {
  Mentorship,
  MentorshipDocument,
} from '../mentorship/schema/mentorship.schema';
import { MentorshipStatus } from '../mentorship/mentorship.state';
import { tierProgress } from '../reputation/tiers';
import { buildScoreSeries, startOfUtcMonth } from '../reputation/impact-series';
import { MyImpactDto } from './dto/my-impact.dto';

const HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface Sum {
  _id: null;
  total: number;
}
interface DaySum {
  _id: string;
  points: number;
}

/**
 * Everything the "My impact" panel shows, gathered in one place so the
 * dashboard controller stays thin (BACKLOG.md E15). Each figure comes from its
 * source of truth: the reputation ledger for score history, AI citations and
 * this month's points; resources for downloads; mentorships for mentees; the
 * user's denormalized totals for rating.
 */
@Injectable()
export class ImpactService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(ReputationEvent.name)
    private readonly eventModel: Model<ReputationEventDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
  ) {}

  async getMyImpact(
    userId: string,
    now: Date = new Date(),
  ): Promise<MyImpactDto> {
    const user = new Types.ObjectId(userId);
    const windowStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        (HISTORY_DAYS - 1) * DAY_MS,
    );
    const monthStart = startOfUtcMonth(now);

    const [
      me,
      resourceRows,
      aiCitations,
      before,
      daily,
      month,
      active,
      completed,
    ] = await Promise.all([
      this.userService.findOne(userId),
      this.resourceModel
        .aggregate<{ _id: null; count: number; downloads: number }>([
          {
            $match: {
              uploadedBy: user,
              isDeleted: false,
              approvalStatus: ApprovalStatus.APPROVED,
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              downloads: { $sum: '$downloads' },
            },
          },
        ])
        .exec(),
      this.eventModel
        .countDocuments({ user, type: ReputationEventType.AI_CITATION })
        .exec(),
      this.eventModel
        .aggregate<Sum>([
          { $match: { user, createdAt: { $lt: windowStart } } },
          { $group: { _id: null, total: { $sum: '$points' } } },
        ])
        .exec(),
      this.eventModel
        .aggregate<DaySum>([
          { $match: { user, createdAt: { $gte: windowStart } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              points: { $sum: '$points' },
            },
          },
        ])
        .exec(),
      this.eventModel
        .aggregate<Sum>([
          { $match: { user, createdAt: { $gte: monthStart } } },
          { $group: { _id: null, total: { $sum: '$points' } } },
        ])
        .exec(),
      this.mentorshipModel
        .countDocuments({ mentor: user, status: MentorshipStatus.ACTIVE })
        .exec(),
      this.mentorshipModel
        .countDocuments({ mentor: user, status: MentorshipStatus.COMPLETED })
        .exec(),
    ]);

    const score = me.contributionScore ?? 0;
    const progress = tierProgress(score);
    const { ratingAverage, ratingCount } = ratingSummary(
      me.mentorRatingSum,
      me.mentorRatingCount,
    );

    return {
      score,
      tier: progress.tier,
      nextTier: progress.next && {
        tier: progress.next.tier,
        minScore: progress.next.minScore,
        pointsToGo: progress.pointsToNext,
      },
      tierFraction: progress.fraction,
      history: buildScoreSeries(
        before[0]?.total ?? 0,
        daily.map((d) => ({ day: d._id, points: d.points })),
        now,
        HISTORY_DAYS,
      ),
      pointsThisMonth: Math.max(0, month[0]?.total ?? 0),
      resources: resourceRows[0]?.count ?? 0,
      downloads: resourceRows[0]?.downloads ?? 0,
      aiCitations,
      mentees: { active, completed },
      rating: { average: ratingAverage, count: ratingCount },
    };
  }
}
