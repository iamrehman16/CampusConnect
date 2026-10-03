import { buildScoreSeries, startOfUtcMonth } from './impact-series';

describe('buildScoreSeries (E15)', () => {
  const end = new Date('2026-10-03T15:00:00Z');

  it('returns one point per day, oldest first, ending on the end day', () => {
    const series = buildScoreSeries(0, [], end, 5);

    expect(series.map((p) => p.date)).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
  });

  it('accumulates from the balance before the window and carries quiet days forward', () => {
    const series = buildScoreSeries(
      20,
      [
        { day: '2026-10-01', points: 10 },
        { day: '2026-10-03', points: 2 },
      ],
      end,
      4,
    );

    expect(series.map((p) => p.score)).toEqual([20, 30, 30, 32]);
  });

  it('never dips below zero when a reversal exceeds the running score', () => {
    const series = buildScoreSeries(
      5,
      [{ day: '2026-10-02', points: -50 }],
      end,
      3,
    );

    expect(series.map((p) => p.score)).toEqual([5, 0, 0]);
  });

  it('ignores events outside the window', () => {
    const series = buildScoreSeries(
      0,
      [{ day: '2020-01-01', points: 99 }],
      end,
      3,
    );

    expect(series.every((p) => p.score === 0)).toBe(true);
  });
});

describe('startOfUtcMonth', () => {
  it('is the first instant of the UTC month', () => {
    expect(
      startOfUtcMonth(new Date('2026-10-31T23:59:59Z')).toISOString(),
    ).toBe('2026-10-01T00:00:00.000Z');
  });
});
