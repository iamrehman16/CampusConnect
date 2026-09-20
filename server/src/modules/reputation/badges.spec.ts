import { BADGE_DEFINITIONS, evaluateBadges } from './badges';

const none = { approvedResources: 0, posts: 0, upvotesReceived: 0 };
const keys = (s: Parameters<typeof evaluateBadges>[0]) =>
  evaluateBadges(s).map((b) => b.key);

describe('evaluateBadges', () => {
  it('earns nothing with no activity', () => {
    expect(keys(none)).toEqual([]);
  });

  it('awards resource badges at their thresholds', () => {
    expect(keys({ ...none, approvedResources: 1 })).toEqual(['first_resource']);
    expect(keys({ ...none, approvedResources: 4 })).toEqual(['first_resource']);
    expect(keys({ ...none, approvedResources: 5 })).toEqual([
      'first_resource',
      'resource_library',
    ]);
  });

  it('awards community badges', () => {
    expect(keys({ ...none, posts: 1 })).toEqual(['first_post']);
    expect(keys({ ...none, upvotesReceived: 9 })).toEqual([]);
    expect(keys({ ...none, upvotesReceived: 10 })).toEqual(['well_received']);
  });

  it('returns display fields only (not the predicate)', () => {
    const [badge] = evaluateBadges({ ...none, posts: 1 });
    expect(Object.keys(badge).sort()).toEqual(['description', 'key', 'label']);
  });

  it('badge keys are unique', () => {
    const all = BADGE_DEFINITIONS.map((b) => b.key);
    expect(new Set(all).size).toBe(all.length);
  });
});
