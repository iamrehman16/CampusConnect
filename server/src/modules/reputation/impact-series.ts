export interface DailyPoints {
  /** UTC day, `YYYY-MM-DD`. */
  day: string;
  points: number;
}

export interface ScorePoint {
  date: string;
  score: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The running score for each of the last `days` UTC days ending at `end`
 * (inclusive), from the balance before the window plus each day's net points.
 * Days with no events repeat the previous score, so a sparkline is continuous
 * (BACKLOG.md E15). Reversals make a day net negative; the series never goes
 * below 0, matching how `contributionScore` is floored.
 */
export function buildScoreSeries(
  startBalance: number,
  daily: DailyPoints[],
  end: Date,
  days: number,
): ScorePoint[] {
  const byDay = new Map(daily.map((d) => [d.day, d.points]));
  const series: ScorePoint[] = [];
  let running = startBalance;

  for (let i = days - 1; i >= 0; i--) {
    const date = dayKey(new Date(end.getTime() - i * DAY_MS));
    running = Math.max(0, running + (byDay.get(date) ?? 0));
    series.push({ date, score: running });
  }
  return series;
}

/** First instant of the UTC month containing `now`. */
export function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
