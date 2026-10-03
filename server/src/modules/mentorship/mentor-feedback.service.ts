import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Mentorship, MentorshipDocument } from './schema/mentorship.schema';
import { MentorshipStatus } from './mentorship.state';
import { RateMentorshipDto } from './dto/rate-mentorship.dto';
import { MentorshipFeedbackDto } from './dto/mentorship.dto';
import { RATING_EDIT_WINDOW_MS } from './mentorship.constants';
import {
  isWithinEditWindow,
  ratingDelta,
  ratingEditableUntil,
} from './mentorship-feedback';
import { UserService } from '../user/user.service';
import {
  DomainEvents,
  MentorshipRatedEvent,
} from '../../common/events/domain-events';

/**
 * A mentee rates a COMPLETED mentorship (BACKLOG.md E11). One rating each,
 * editable for a short grace window, then immutable. Every write is a single
 * conditional update, so concurrent requests resolve in the database, and the
 * mentor's denormalized average is adjusted by the exact delta.
 */
@Injectable()
export class MentorFeedbackService {
  private readonly logger = new Logger(MentorFeedbackService.name);

  constructor(
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async rate(
    mentorshipId: string,
    menteeId: string,
    dto: RateMentorshipDto,
    now: Date = new Date(),
  ): Promise<MentorshipFeedbackDto> {
    const me = new Types.ObjectId(menteeId);
    const id = new Types.ObjectId(mentorshipId);

    // Not found and "not yours" are indistinguishable on purpose.
    const existing = await this.mentorshipModel
      .findOne({ _id: id, mentee: me })
      .select('mentor status feedback')
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Mentorship not found');
    if (existing.status !== MentorshipStatus.COMPLETED) {
      throw new ConflictException(
        'You can rate a mentorship once it is completed',
      );
    }
    if (
      existing.feedback &&
      !isWithinEditWindow(existing.feedback.ratedAt, now)
    ) {
      throw new ForbiddenException(
        'Ratings can only be changed within 24 hours of submitting them',
      );
    }

    const review = dto.review?.trim() || undefined;
    const isEdit = Boolean(existing.feedback);
    const cutoff = new Date(now.getTime() - RATING_EDIT_WINDOW_MS);

    // Create: only if still unrated. Edit: only while the window is open.
    const before = await this.mentorshipModel
      .findOneAndUpdate(
        isEdit
          ? { _id: id, mentee: me, 'feedback.ratedAt': { $gte: cutoff } }
          : { _id: id, mentee: me, feedback: { $exists: false } },
        isEdit
          ? {
              $set: {
                'feedback.rating': dto.rating,
                ...(review && { 'feedback.review': review }),
              },
              ...(!review && { $unset: { 'feedback.review': '' } }),
            }
          : {
              $set: {
                feedback: { rating: dto.rating, review, ratedAt: now },
              },
            },
        { new: false },
      )
      .select('mentor feedback')
      .lean()
      .exec();
    if (!before) {
      throw new ConflictException(
        'This rating just changed or its edit window closed — reload and try again',
      );
    }

    const { sumDelta, countDelta } = ratingDelta(
      before.feedback?.rating,
      dto.rating,
    );
    const mentorId = existing.mentor.toString();
    try {
      await this.userService.adjustMentorRating(mentorId, sumDelta, countDelta);
    } catch (err) {
      this.logger.error(
        `Rating saved but mentor ${mentorId} totals were not updated (mentorship ${mentorshipId}, ${sumDelta}/${countDelta}); recompute from the mentorship documents to repair`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }

    if (!isEdit) {
      this.eventEmitter.emit(DomainEvents.MENTORSHIP_RATED, {
        mentorshipId,
        mentorId,
        menteeId,
        rating: dto.rating,
      } satisfies MentorshipRatedEvent);
    }

    const ratedAt = before.feedback?.ratedAt ?? now;
    return {
      rating: dto.rating,
      review,
      ratedAt,
      editableUntil: ratingEditableUntil(ratedAt),
    };
  }
}
