/**
 * Trim, drop empties and de-duplicate (case-insensitively, keeping the first
 * spelling) a user-supplied list of short labels. Non-arrays pass through
 * untouched so the validators report the real type error.
 */
export function normalizeTags(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      result.push(item); // let @IsString({ each: true }) reject it
      continue;
    }
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}
