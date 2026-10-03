import { RATING_EDIT_WINDOW_MS } from './mentorship.constants';

/**
 * Pure rules for rating a mentorship (BACKLOG.md E11), kept apart from the
 * service so they are trivial to test and to read in one place.
 */

/** The moment after which a rating is immutable. */
export function ratingEditableUntil(ratedAt: Date): Date {
  return new Date(ratedAt.getTime() + RATING_EDIT_WINDOW_MS);
}

export function isWithinEditWindow(ratedAt: Date, now: Date): boolean {
  return now.getTime() <= ratingEditableUntil(ratedAt).getTime();
}

/** Change to a mentor's denormalized (sum, count) when a rating is saved. */
export function ratingDelta(
  previous: number | undefined,
  next: number,
): { sumDelta: number; countDelta: number } {
  return previous === undefined
    ? { sumDelta: next, countDelta: 1 }
    : { sumDelta: next - previous, countDelta: 0 };
}
