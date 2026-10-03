import { Model, Types } from 'mongoose';
import { LeaderboardService } from './leaderboard.service';
import { ReputationEventDocument } from './schema/reputation-event.schema';
import { UserService } from '../user/user.service';
import { LeaderboardPeriod } from './dto/leaderboard-query.dto';
import { ReputationTier } from './tiers';

const id = () => new Types.ObjectId();
const cand = (uid: Types.ObjectId, name: string) => ({
  id: uid.toString(),
  name,
  tier: ReputationTier.REGULAR,
  contributionScore: 99,
});

function build(opts: {
  ranked?: { _id: Types.ObjectId; points: number }[];
  candidates?: ReturnType<typeof cand>[];
  top?: ReturnType<typeof cand>[];
}) {
  const aggregate = jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(opts.ranked ?? []),
  });
  const findLeaderboardCandidates = jest
    .fn()
    .mockResolvedValue(opts.candidates ?? []);
  const findTopContributors = jest.fn().mockResolvedValue(opts.top ?? []);
  const service = new LeaderboardService(
    { aggregate } as unknown as Model<ReputationEventDocument>,
    {
      findLeaderboardCandidates,
      findTopContributors,
    } as unknown as UserService,
  );
  return { service, aggregate, findLeaderboardCandidates, findTopContributors };
}

describe('LeaderboardService', () => {
  const now = new Date('2026-10-17T10:00:00Z');

  it('all time: reuses the top-contributors query and ranks from 1', async () => {
    const a = id();
    const b = id();
    const { service, findTopContributors, aggregate } = build({
      top: [cand(a, 'A'), cand(b, 'B')],
    });

    const r = await service.top(LeaderboardPeriod.ALL, 5, now);

    expect(findTopContributors).toHaveBeenCalledWith(5);
    expect(aggregate).not.toHaveBeenCalled();
    expect(r.map((e) => [e.rank, e.name, e.points])).toEqual([
      [1, 'A', 99],
      [2, 'B', 99],
    ]);
  });

  it('this month: ranks by points earned since the start of the UTC month', async () => {
    const a = id();
    const b = id();
    const { service, aggregate } = build({
      ranked: [
        { _id: a, points: 30 },
        { _id: b, points: 12 },
      ],
      candidates: [cand(b, 'B'), cand(a, 'A')], // DB order is irrelevant
    });

    const r = await service.top(LeaderboardPeriod.MONTH, 5, now);

    expect(r.map((e) => [e.rank, e.name, e.points])).toEqual([
      [1, 'A', 30],
      [2, 'B', 12],
    ]);
    const [pipeline] = aggregate.mock.calls[0] as [
      [{ $match: { createdAt: { $gte: Date } } }],
    ];
    expect(pipeline[0].$match.createdAt.$gte.toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    );
  });

  it('drops opted-out and suspended people (absent from candidates) and re-ranks without gaps', async () => {
    const [a, hidden, c] = [id(), id(), id()];
    const { service } = build({
      ranked: [
        { _id: a, points: 50 },
        { _id: hidden, points: 40 },
        { _id: c, points: 10 },
      ],
      candidates: [cand(a, 'A'), cand(c, 'C')],
    });

    const r = await service.top(LeaderboardPeriod.MONTH, 5, now);

    expect(r.map((e) => [e.rank, e.name])).toEqual([
      [1, 'A'],
      [2, 'C'],
    ]);
  });

  it('over-fetches so hidden people do not leave the board short, then trims to the limit', async () => {
    const ids = Array.from({ length: 8 }, () => id());
    const { service, aggregate } = build({
      ranked: ids.map((x, i) => ({ _id: x, points: 100 - i })),
      candidates: ids.map((x, i) => cand(x, `U${i}`)),
    });

    const r = await service.top(LeaderboardPeriod.MONTH, 3, now);

    expect(r).toHaveLength(3);
    const [pipeline] = aggregate.mock.calls[0] as [Record<string, unknown>[]];
    expect(pipeline.find((s) => '$limit' in s)).toEqual({ $limit: 12 });
  });

  it('is empty, without a user lookup, when nobody earned anything this month', async () => {
    const { service, findLeaderboardCandidates } = build({ ranked: [] });

    expect(await service.top(LeaderboardPeriod.MONTH, 5, now)).toEqual([]);
    expect(findLeaderboardCandidates).not.toHaveBeenCalled();
  });

  it('only counts net-positive earners (the pipeline filters points > 0)', async () => {
    const { service, aggregate } = build({});

    await service.top(LeaderboardPeriod.MONTH, 5, now);

    const [pipeline] = aggregate.mock.calls[0] as [Record<string, unknown>[]];
    expect(pipeline).toContainEqual({ $match: { points: { $gt: 0 } } });
  });
});
