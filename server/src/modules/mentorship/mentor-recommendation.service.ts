import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Mentorship, MentorshipDocument } from './schema/mentorship.schema';
import { MentorshipStatus } from './mentorship.state';
import { UserService } from '../user/user.service';
import { MentorQueryDto } from '../user/dto/mentor-query.dto';
import { MentorSummaryDto } from '../user/dto/mentor-summary.dto';
import { recommendMentors } from '../user/mentor-matching';
import { BlockService } from '../moderation/block.service';

/** How many open mentors are scored per request (see E14's note on scale). */
const CANDIDATE_POOL = 100;
export const DEFAULT_RECOMMENDATIONS = 3;
export const MAX_RECOMMENDATIONS = 12;

export interface RecommendedMentorDto extends MentorSummaryDto {
  /** Why this mentor was picked, e.g. "Helps with Data Structures". */
  reasons: string[];
}

export interface RecommendedMentorsDto {
  mentors: RecommendedMentorDto[];
  /** False on a cold start: these are top contributors, not matches. */
  personalized: boolean;
}

/**
 * "Recommended for you" (BACKLOG.md E12). Scoring lives in the pure
 * `recommendMentors`; this only gathers inputs and applies the exclusions that
 * need data from other modules: mentors you're already working with (pending
 * or active) and anyone blocked either way.
 */
@Injectable()
export class MentorRecommendationService {
  constructor(
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly userService: UserService,
    private readonly blocks: BlockService,
  ) {}

  async recommend(
    userId: string,
    limit = DEFAULT_RECOMMENDATIONS,
  ): Promise<RecommendedMentorsDto> {
    const [me, pool, openWith, blocked] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findMentors(
        Object.assign(new MentorQueryDto(), {
          page: 1,
          limit: CANDIDATE_POOL,
          hasCapacity: true,
        }),
        userId,
      ),
      this.mentorshipModel
        .find({
          mentee: new Types.ObjectId(userId),
          status: { $in: [MentorshipStatus.PENDING, MentorshipStatus.ACTIVE] },
        })
        .select('mentor')
        .lean()
        .exec(),
      this.blocks.blockedIdsFor(userId),
    ]);

    const excluded = new Set([
      ...openWith.map((m) => m.mentor.toString()),
      ...blocked,
    ]);
    const candidates = pool.data.filter((m) => !excluded.has(m.id));

    const { mentors, personalized } = recommendMentors(
      candidates,
      {
        interests: me.interests ?? [],
        department: me.department,
        semester: me.semester,
      },
      Math.min(Math.max(limit, 1), MAX_RECOMMENDATIONS),
    );

    return {
      personalized,
      mentors: mentors.map(({ mentor, reasons }) => ({ ...mentor, reasons })),
    };
  }
}
