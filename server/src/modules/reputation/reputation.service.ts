import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ReputationEvent,
  ReputationEventDocument,
} from './schema/reputation-event.schema';
import { ReputationEventType } from './enums/reputation-event-type.enum';
import { AwardableEventType, REPUTATION_POINTS } from './reputation.points';
import {
  BackfillResultDto,
  ReputationEventDto,
} from './dto/reputation-event.dto';
import { UserService } from '../user/user.service';
import { EarnedBadge, evaluateBadges } from './badges';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';
import { BaseQueryDto } from '../../common/dto/base-query.dto';
import {
  Resource,
  ResourceDocument,
} from '../resource/schemas/resource.schema';
import { ApprovalStatus } from '../resource/enums/approval-status.enum';
import { Post, PostDocument } from '../post/schemas/post.schema';

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectModel(ReputationEvent.name)
    private readonly eventModel: Model<ReputationEventDocument>,
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly userService: UserService,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Award the fixed points for an event, once per (type, sourceId).
   * @returns false when this exact cause was already recorded.
   */
  award(
    userId: string,
    type: AwardableEventType,
    sourceId: string,
  ): Promise<boolean> {
    return this.appendEvent(userId, type, REPUTATION_POINTS[type], sourceId);
  }

  /**
   * A resource was removed: claw back exactly what it earned its uploader
   * (sum of its ledger rows), as one negative row. No-op when it earned nothing
   * or was already reversed.
   */
  async reverseResource(userId: string, resourceId: string): Promise<boolean> {
    const [earned] = await this.eventModel
      .aggregate<{ total: number }>([
        {
          $match: {
            user: new Types.ObjectId(userId),
            type: ReputationEventType.RESOURCE_APPROVED,
            sourceId: resourceId,
          },
        },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ])
      .exec();

    if (!earned || earned.total <= 0) return false;

    return this.appendEvent(
      userId,
      ReputationEventType.RESOURCE_REMOVED,
      -earned.total,
      resourceId,
    );
  }

  /** Badges the user currently qualifies for (computed, never stored). */
  async getBadges(userId: string): Promise<EarnedBadge[]> {
    const user = new Types.ObjectId(userId);
    const [approvedResources, posts, upvotesReceived] = await Promise.all([
      this.resourceModel
        .countDocuments({
          uploadedBy: user,
          approvalStatus: ApprovalStatus.APPROVED,
          isDeleted: false,
        })
        .exec(),
      this.postModel.countDocuments({ author: user, isDeleted: false }).exec(),
      this.eventModel
        .countDocuments({
          user,
          type: ReputationEventType.POST_UPVOTE_RECEIVED,
        })
        .exec(),
    ]);

    return evaluateBadges({ approvedResources, posts, upvotesReceived });
  }

  async getHistory(
    userId: string,
    dto: BaseQueryDto,
  ): Promise<PaginatedResult<ReputationEventDto>> {
    const user = new Types.ObjectId(userId);
    const result = await this.paginationService.paginate(
      this.eventModel,
      dto,
      { build: () => ({ user }) },
      { build: () => ({ createdAt: -1 }) },
    );

    return {
      ...result,
      data: result.data.map((e) => ({
        id: (e as ReputationEvent & { _id: Types.ObjectId })._id.toString(),
        type: e.type,
        points: e.points,
        sourceId: e.sourceId,
        createdAt: e.createdAt,
      })),
    };
  }

  /**
   * Idempotent: award history for content that predates the ledger, then
   * recompute every user's score from the ledger (the ledger is the source of
   * truth, so this also overwrites any legacy hand-set scores).
   */
  async backfill(): Promise<BackfillResultDto> {
    let awarded = 0;

    const resources = await this.resourceModel
      .find({ approvalStatus: ApprovalStatus.APPROVED, isDeleted: false })
      .select('_id uploadedBy')
      .lean()
      .exec();
    for (const r of resources) {
      const ok = await this.award(
        r.uploadedBy.toString(),
        ReputationEventType.RESOURCE_APPROVED,
        r._id.toString(),
      );
      if (ok) awarded++;
    }

    const posts = await this.postModel
      .find({ isDeleted: false, 'upvotes.0': { $exists: true } })
      .select('_id author upvotes')
      .lean()
      .exec();
    for (const p of posts) {
      const authorId = p.author.toString();
      for (const voter of p.upvotes) {
        const voterId = voter.toString();
        if (voterId === authorId) continue; // no self-upvote farming
        const ok = await this.award(
          authorId,
          ReputationEventType.POST_UPVOTE_RECEIVED,
          `${p._id.toString()}:${voterId}`,
        );
        if (ok) awarded++;
      }
    }

    const usersRecomputed = await this.recomputeAllScores();
    return { awarded, usersRecomputed };
  }

  /** Rebuild every `contributionScore` from the ledger. Also the drift repair. */
  async recomputeAllScores(): Promise<number> {
    const totals = await this.eventModel
      .aggregate<{
        _id: Types.ObjectId;
        total: number;
      }>([{ $group: { _id: '$user', total: { $sum: '$points' } } }])
      .exec();

    for (const t of totals) {
      await this.userService.setContributionScore(
        t._id.toString(),
        Math.max(0, t.total),
      );
    }
    await this.userService.zeroContributionScoresExcept(
      totals.map((t) => t._id.toString()),
    );
    return totals.length;
  }

  /**
   * Ledger row first (its unique index is the idempotency guard), then the
   * denormalized score. Not transactional — a crash between the two leaves the
   * score short by `points`; `recomputeAllScores` repairs that drift. Flagged
   * shortcut: a transaction would need a replica set on every environment.
   */
  private async appendEvent(
    userId: string,
    type: ReputationEventType,
    points: number,
    sourceId: string,
  ): Promise<boolean> {
    try {
      await this.eventModel.create({
        user: new Types.ObjectId(userId),
        type,
        points,
        sourceId,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) return false;
      throw err;
    }

    try {
      await this.userService.adjustContributionScore(userId, points);
    } catch (err) {
      this.logger.error(
        `Ledger row written but score update failed for user ${userId} (${type} ${sourceId}, ${points}pts); run reputation backfill/recompute to repair`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
    return true;
  }
}
