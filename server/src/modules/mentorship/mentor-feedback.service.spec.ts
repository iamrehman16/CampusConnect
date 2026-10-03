import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { MentorFeedbackService } from './mentor-feedback.service';
import { MentorshipDocument } from './schema/mentorship.schema';
import { MentorshipStatus } from './mentorship.state';
import { UserService } from '../user/user.service';
import { RATING_EDIT_WINDOW_MS } from './mentorship.constants';

const chain = (result: unknown) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result),
});

const mentor = new Types.ObjectId();
const mentee = new Types.ObjectId();
const mid = new Types.ObjectId();
const now = new Date('2026-10-03T12:00:00Z');

function build(opts: {
  existing: unknown;
  before?: unknown;
  adjust?: jest.Mock;
}) {
  const findOne = jest.fn().mockReturnValue(chain(opts.existing));
  const findOneAndUpdate = jest
    .fn()
    .mockReturnValue(chain(opts.before ?? null));
  const adjustMentorRating =
    opts.adjust ?? jest.fn().mockResolvedValue(undefined);
  const emit = jest.fn();
  const service = new MentorFeedbackService(
    { findOne, findOneAndUpdate } as unknown as Model<MentorshipDocument>,
    { adjustMentorRating } as unknown as UserService,
    { emit } as unknown as EventEmitter2,
  );
  return { service, findOneAndUpdate, adjustMentorRating, emit };
}

const completed = (feedback?: { rating: number; ratedAt: Date }) => ({
  mentor,
  status: MentorshipStatus.COMPLETED,
  feedback,
});

describe('MentorFeedbackService#rate', () => {
  it('404s for a mentorship that is not yours (no probing)', async () => {
    const { service, findOneAndUpdate } = build({ existing: null });

    await expect(
      service.rate(mid.toString(), mentee.toString(), { rating: 5 }, now),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it.each([
    MentorshipStatus.PENDING,
    MentorshipStatus.ACTIVE,
    MentorshipStatus.DECLINED,
  ])('refuses to rate a %s mentorship', async (status) => {
    const { service, findOneAndUpdate } = build({
      existing: { mentor, status },
    });

    await expect(
      service.rate(mid.toString(), mentee.toString(), { rating: 4 }, now),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('a first rating adds (+rating, +1), emits an event once and reports the edit deadline', async () => {
    const { service, adjustMentorRating, emit, findOneAndUpdate } = build({
      existing: completed(),
      before: { mentor, feedback: undefined },
    });

    const res = await service.rate(
      mid.toString(),
      mentee.toString(),
      { rating: 4, review: '  great  ' },
      now,
    );

    expect(adjustMentorRating).toHaveBeenCalledWith(mentor.toString(), 4, 1);
    expect(emit).toHaveBeenCalledWith('mentorship.rated', {
      mentorshipId: mid.toString(),
      mentorId: mentor.toString(),
      menteeId: mentee.toString(),
      rating: 4,
    });
    expect(res.review).toBe('great');
    expect(res.editableUntil.getTime()).toBe(
      now.getTime() + RATING_EDIT_WINDOW_MS,
    );
    // the create filter demands "not yet rated"
    const [filter] = findOneAndUpdate.mock.calls[0] as [
      Record<string, unknown>,
    ];
    expect(filter.feedback).toEqual({ $exists: false });
  });

  it('an edit inside the window adjusts only by the difference and does NOT re-emit', async () => {
    const ratedAt = new Date(now.getTime() - 60 * 60 * 1000);
    const { service, adjustMentorRating, emit } = build({
      existing: completed({ rating: 5, ratedAt }),
      before: { mentor, feedback: { rating: 5, ratedAt } },
    });

    const res = await service.rate(
      mid.toString(),
      mentee.toString(),
      { rating: 2 },
      now,
    );

    expect(adjustMentorRating).toHaveBeenCalledWith(mentor.toString(), -3, 0);
    expect(emit).not.toHaveBeenCalled();
    expect(res.ratedAt).toEqual(ratedAt); // the window is measured from the FIRST rating
  });

  it('refuses an edit after the window closed', async () => {
    const ratedAt = new Date(now.getTime() - RATING_EDIT_WINDOW_MS - 1000);
    const { service, findOneAndUpdate, adjustMentorRating } = build({
      existing: completed({ rating: 5, ratedAt }),
    });

    await expect(
      service.rate(mid.toString(), mentee.toString(), { rating: 1 }, now),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findOneAndUpdate).not.toHaveBeenCalled();
    expect(adjustMentorRating).not.toHaveBeenCalled();
  });

  it('409s, changing nothing, when a concurrent write won the race', async () => {
    const { service, adjustMentorRating } = build({
      existing: completed(),
      before: null, // the conditional update matched nothing
    });

    await expect(
      service.rate(mid.toString(), mentee.toString(), { rating: 5 }, now),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(adjustMentorRating).not.toHaveBeenCalled();
  });

  it('logs and rethrows when the mentor totals cannot be updated', async () => {
    const { service } = build({
      existing: completed(),
      before: { mentor, feedback: undefined },
      adjust: jest.fn().mockRejectedValue(new Error('mongo down')),
    });
    const logged = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => undefined);

    await expect(
      service.rate(mid.toString(), mentee.toString(), { rating: 5 }, now),
    ).rejects.toThrow('mongo down');
    expect(logged).toHaveBeenCalledTimes(1);
  });
});
