import {
  isWithinEditWindow,
  ratingDelta,
  ratingEditableUntil,
} from './mentorship-feedback';
import { RATING_EDIT_WINDOW_MS } from './mentorship.constants';

describe('mentorship feedback rules (E11)', () => {
  const ratedAt = new Date('2026-10-03T10:00:00Z');

  it('allows edits up to and including the window end, not after', () => {
    const end = ratingEditableUntil(ratedAt);

    expect(end.getTime() - ratedAt.getTime()).toBe(RATING_EDIT_WINDOW_MS);
    expect(isWithinEditWindow(ratedAt, new Date(end.getTime()))).toBe(true);
    expect(isWithinEditWindow(ratedAt, new Date(end.getTime() + 1))).toBe(
      false,
    );
  });

  it('a first rating adds to both the sum and the count', () => {
    expect(ratingDelta(undefined, 4)).toEqual({ sumDelta: 4, countDelta: 1 });
  });

  it('an edit adjusts only the sum, by the difference', () => {
    expect(ratingDelta(5, 2)).toEqual({ sumDelta: -3, countDelta: 0 });
    expect(ratingDelta(2, 5)).toEqual({ sumDelta: 3, countDelta: 0 });
    expect(ratingDelta(3, 3)).toEqual({ sumDelta: 0, countDelta: 0 });
  });
});
