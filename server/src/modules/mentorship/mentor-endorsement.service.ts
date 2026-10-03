import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Mentorship, MentorshipDocument } from './schema/mentorship.schema';
import { Endorsement, EndorsementDocument } from './schema/endorsement.schema';
import { MentorshipStatus } from './mentorship.state';
import {
  EndorsementTag,
  buildEndorsementTags,
  canonicalTag,
} from './mentor-endorsement';
import { UserService } from '../user/user.service';

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

export interface EndorsementSummaryDto {
  tags: EndorsementTag[];
  /** The viewer completed a mentorship with this mentor, so may endorse. */
  canEndorse: boolean;
}

/**
 * Mentees endorse specific skills of a mentor they've actually worked with
 * (BACKLOG.md E11). Abuse guards: only mentees of a COMPLETED mentorship with
 * that mentor, only labels the mentor lists, one endorsement per (endorser,
 * skill). Endorsements carry no reputation points — they're cheap to give.
 */
@Injectable()
export class MentorEndorsementService {
  constructor(
    @InjectModel(Endorsement.name)
    private readonly endorsementModel: Model<EndorsementDocument>,
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly userService: UserService,
  ) {}

  async summary(
    viewerId: string,
    mentorId: string,
  ): Promise<EndorsementSummaryDto> {
    const mentor = await this.userService.findPublicProfile(mentorId);
    const labels = [
      ...(mentor.mentorTopics ?? []),
      ...(mentor.expertise ?? []),
    ];

    const [rows, canEndorse] = await Promise.all([
      this.endorsementModel
        .find({ mentor: new Types.ObjectId(mentorId) })
        .select('endorser tag')
        .lean()
        .exec(),
      this.hasCompletedMentorship(viewerId, mentorId),
    ]);

    const counts = new Map<string, number>();
    const mine = new Set<string>();
    for (const row of rows) {
      counts.set(row.tag, (counts.get(row.tag) ?? 0) + 1);
      if (row.endorser.toString() === viewerId) mine.add(row.tag);
    }

    return { tags: buildEndorsementTags(labels, counts, mine), canEndorse };
  }

  /** Idempotent: endorsing the same skill twice is one endorsement. */
  async endorse(
    endorserId: string,
    mentorId: string,
    requestedTag: string,
  ): Promise<void> {
    await this.assertMayEndorse(endorserId, mentorId);
    const tag = await this.resolveTag(mentorId, requestedTag);

    try {
      await this.endorsementModel.create({
        mentor: new Types.ObjectId(mentorId),
        endorser: new Types.ObjectId(endorserId),
        tag,
      });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
  }

  async retract(
    endorserId: string,
    mentorId: string,
    requestedTag: string,
  ): Promise<void> {
    // Deliberately no completed-mentorship check: you can always take back
    // your own endorsement. Match the stored label case-insensitively.
    const tag = await this.resolveTag(mentorId, requestedTag, false);
    await this.endorsementModel
      .deleteOne({
        mentor: new Types.ObjectId(mentorId),
        endorser: new Types.ObjectId(endorserId),
        tag,
      })
      .exec();
  }

  private async assertMayEndorse(
    endorserId: string,
    mentorId: string,
  ): Promise<void> {
    if (endorserId === mentorId) {
      throw new BadRequestException('You cannot endorse yourself');
    }
    if (!(await this.hasCompletedMentorship(endorserId, mentorId))) {
      throw new ForbiddenException(
        'Only people who completed a mentorship with them can endorse a mentor',
      );
    }
  }

  private async resolveTag(
    mentorId: string,
    requested: string,
    mustExist = true,
  ): Promise<string> {
    const mentor = await this.userService.findPublicProfile(mentorId);
    const labels = [
      ...(mentor.mentorTopics ?? []),
      ...(mentor.expertise ?? []),
    ];
    const tag = canonicalTag(requested, labels);
    if (tag) return tag;
    if (mustExist) {
      throw new BadRequestException("That isn't one of this mentor's skills");
    }
    // Retracting a skill the mentor has since removed: use what was sent.
    return requested.trim();
  }

  private async hasCompletedMentorship(
    menteeId: string,
    mentorId: string,
  ): Promise<boolean> {
    const hit = await this.mentorshipModel
      .exists({
        mentor: new Types.ObjectId(mentorId),
        mentee: new Types.ObjectId(menteeId),
        status: MentorshipStatus.COMPLETED,
      })
      .exec();
    return hit !== null;
  }
}
