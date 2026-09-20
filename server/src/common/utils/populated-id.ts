import { Types } from 'mongoose';

/**
 * Id of a reference that may be either an unpopulated ObjectId or a populated
 * document (`{ _id, ... }`) — `.lean()` results typed as ObjectId are often
 * populated at runtime. Returns null when neither shape matches.
 */
export function populatedId(ref: unknown): string | null {
  if (ref instanceof Types.ObjectId) return ref.toString();
  if (
    typeof ref === 'object' &&
    ref !== null &&
    '_id' in ref &&
    ref._id instanceof Types.ObjectId
  ) {
    return ref._id.toString();
  }
  return null;
}
