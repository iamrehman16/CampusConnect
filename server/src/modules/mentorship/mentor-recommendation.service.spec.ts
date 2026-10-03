import { Model, Types } from 'mongoose';
import { MentorRecommendationService } from './mentor-recommendation.service';
import { MentorshipDocument } from './schema/mentorship.schema';
import { UserService } from '../user/user.service';
import { BlockService } from '../moderation/block.service';
import { MentorSummaryDto } from '../user/dto/mentor-summary.dto';
import { ReputationTier } from '../reputation/tiers';

const mentor = (id: string, topics: string[]): MentorSummaryDto => ({
  id,
  name: id,
  role: 'contributor' as MentorSummaryDto['role'],
  tier: ReputationTier.REGULAR,
  contributionScore: 10,
  expertise: [],
  mentorTopics: topics,
  maxActiveMentees: 3,
  slotsLeft: 1,
  ratingAverage: null,
  ratingCount: 0,
});

function build(opts: {
  me?: Record<string, unknown>;
  pool: MentorSummaryDto[];
  openWith?: Types.ObjectId[];
  blocked?: string[];
}) {
  const findMentors = jest.fn().mockResolvedValue({ data: opts.pool });
  const service = new MentorRecommendationService(
    {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue(
            (opts.openWith ?? []).map((mentor) => ({ mentor })),
          ),
      }),
    } as unknown as Model<MentorshipDocument>,
    {
      findOne: jest
        .fn()
        .mockResolvedValue(opts.me ?? { interests: ['Graphs'] }),
      findMentors,
    } as unknown as UserService,
    {
      blockedIdsFor: jest.fn().mockResolvedValue(new Set(opts.blocked ?? [])),
    } as unknown as BlockService,
  );
  return { service, findMentors };
}

describe('MentorRecommendationService', () => {
  const me = new Types.ObjectId().toString();

  it('scores only mentors with a free slot (asks the directory for hasCapacity)', async () => {
    const { service, findMentors } = build({ pool: [mentor('a', ['Graphs'])] });

    await service.recommend(me);

    expect(findMentors).toHaveBeenCalledWith(
      expect.objectContaining({ hasCapacity: true }),
      me,
    );
  });

  it("doesn't recommend a mentor you already have a pending or active mentorship with", async () => {
    const taken = new Types.ObjectId();
    const { service } = build({
      pool: [mentor(taken.toString(), ['Graphs']), mentor('free', ['Graphs'])],
      openWith: [taken],
    });

    const r = await service.recommend(me);

    expect(r.mentors.map((m) => m.id)).toEqual(['free']);
  });

  it("doesn't recommend anyone blocked in either direction", async () => {
    const { service } = build({
      pool: [mentor('blocked', ['Graphs']), mentor('ok', ['Graphs'])],
      blocked: ['blocked'],
    });

    const r = await service.recommend(me);

    expect(r.mentors.map((m) => m.id)).toEqual(['ok']);
  });

  it('returns the reasons alongside each mentor', async () => {
    const { service } = build({ pool: [mentor('a', ['Graphs'])] });

    const r = await service.recommend(me);

    expect(r.personalized).toBe(true);
    expect(r.mentors[0].reasons).toEqual(['Helps with Graphs']);
  });

  it('cold start for a student with no profile data', async () => {
    const { service } = build({ me: {}, pool: [mentor('a', ['Graphs'])] });

    const r = await service.recommend(me);

    expect(r.personalized).toBe(false);
    expect(r.mentors).toHaveLength(1);
  });

  it('clamps the requested limit', async () => {
    const pool = Array.from({ length: 20 }, (_, i) =>
      mentor(`m${i}`, ['Graphs']),
    );
    const { service } = build({ pool });

    expect((await service.recommend(me, 999)).mentors).toHaveLength(12);
    expect((await service.recommend(me, 0)).mentors).toHaveLength(1);
  });
});
