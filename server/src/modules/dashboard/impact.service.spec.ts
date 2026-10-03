import { Model, Types } from 'mongoose';
import { ImpactService } from './impact.service';
import { UserService } from '../user/user.service';
import { ResourceDocument } from '../resource/schemas/resource.schema';
import { ReputationEventDocument } from '../reputation/schema/reputation-event.schema';
import { MentorshipDocument } from '../mentorship/schema/mentorship.schema';
import { ReputationTier } from '../reputation/tiers';

const exec = <T>(v: T) => ({ exec: jest.fn().mockResolvedValue(v) });

function build(opts: {
  score?: number;
  resources?: unknown[];
  before?: unknown[];
  daily?: unknown[];
  month?: unknown[];
  citations?: number;
}) {
  const aggregate = jest
    .fn()
    // ledger aggregates are called in order: before, daily, month
    .mockReturnValueOnce(exec(opts.before ?? []))
    .mockReturnValueOnce(exec(opts.daily ?? []))
    .mockReturnValueOnce(exec(opts.month ?? []));
  const countDocuments = jest
    .fn()
    .mockReturnValueOnce(exec(opts.citations ?? 0));
  return new ImpactService(
    {
      findOne: jest.fn().mockResolvedValue({
        contributionScore: opts.score ?? 0,
        mentorRatingSum: 9,
        mentorRatingCount: 2,
      }),
    } as unknown as UserService,
    {
      aggregate: jest.fn().mockReturnValue(exec(opts.resources ?? [])),
    } as unknown as Model<ResourceDocument>,
    { aggregate, countDocuments } as unknown as Model<ReputationEventDocument>,
    {
      countDocuments: jest
        .fn()
        .mockReturnValueOnce(exec(2))
        .mockReturnValueOnce(exec(5)),
    } as unknown as Model<MentorshipDocument>,
  );
}

describe('ImpactService#getMyImpact', () => {
  const user = new Types.ObjectId().toString();
  const now = new Date('2026-10-03T12:00:00Z');

  it('assembles score, tier progress, history, downloads, citations, mentees and rating', async () => {
    const service = build({
      score: 32,
      resources: [{ _id: null, count: 3, downloads: 140 }],
      before: [{ _id: null, total: 20 }],
      daily: [{ _id: '2026-10-01', points: 10 }],
      month: [{ _id: null, total: 12 }],
      citations: 7,
    });

    const r = await service.getMyImpact(user, now);

    expect(r.score).toBe(32);
    expect(r.tier).toBe(ReputationTier.REGULAR);
    expect(r.nextTier).toEqual({
      tier: ReputationTier.TRUSTED,
      minScore: 50,
      pointsToGo: 18,
    });
    expect(r.resources).toBe(3);
    expect(r.downloads).toBe(140);
    expect(r.aiCitations).toBe(7);
    expect(r.pointsThisMonth).toBe(12);
    expect(r.mentees).toEqual({ active: 2, completed: 5 });
    expect(r.rating).toEqual({ average: 4.5, count: 2 });
    expect(r.history).toHaveLength(30);
    expect(r.history[r.history.length - 1].date).toBe('2026-10-03');
  });

  it('is all zeros, with a flat history, for someone with no activity', async () => {
    const r = await build({}).getMyImpact(user, now);

    expect(r.score).toBe(0);
    expect(r.resources).toBe(0);
    expect(r.downloads).toBe(0);
    expect(r.pointsThisMonth).toBe(0);
    expect(r.history.every((p) => p.score === 0)).toBe(true);
  });

  it('never reports negative points for the month (net of reversals)', async () => {
    const r = await build({ month: [{ _id: null, total: -8 }] }).getMyImpact(
      user,
      now,
    );

    expect(r.pointsThisMonth).toBe(0);
  });
});
