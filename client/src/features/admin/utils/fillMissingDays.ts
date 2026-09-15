// features/admin/utils/fillMissingDays.ts
import type { DailyCount } from "../types/admin.dto";

export function fillMissingDays(data: DailyCount[], days = 30): DailyCount[] {
  const map = new Map(data.map((d) => [d.date, d.count]));
  const result: DailyCount[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    result.push({ date: key, count: map.get(key) ?? 0 });
  }

  return result;
}
