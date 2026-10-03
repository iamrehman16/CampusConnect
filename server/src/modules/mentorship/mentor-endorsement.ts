/**
 * Pure helpers for skill endorsements (BACKLOG.md E11).
 */

export interface EndorsementTag {
  tag: string;
  count: number;
  endorsedByMe: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * The mentor's own spelling of a label that matches what was asked for
 * (case/space-insensitive), or null — so only skills the mentor actually
 * lists can be endorsed, and the stored text is theirs, not the endorser's.
 */
export function canonicalTag(
  requested: string,
  mentorLabels: string[],
): string | null {
  const wanted = norm(requested);
  return mentorLabels.find((label) => norm(label) === wanted) ?? null;
}

/** Every label the mentor lists (deduplicated), with counts, most endorsed first. */
export function buildEndorsementTags(
  mentorLabels: string[],
  counts: Map<string, number>,
  mine: Set<string>,
): EndorsementTag[] {
  const seen = new Set<string>();
  const tags: EndorsementTag[] = [];
  for (const label of mentorLabels) {
    const key = norm(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push({
      tag: label,
      count: counts.get(label) ?? 0,
      endorsedByMe: mine.has(label),
    });
  }
  return tags.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
