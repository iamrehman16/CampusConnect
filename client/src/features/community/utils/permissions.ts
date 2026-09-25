import type { User } from '@/shared/types/auth.types';
import { UserRole } from '@/shared/types/enums';
import type { AuthorPost, AuthorComment } from '../types/community.dto';

/**
 * Checks if the current user has permission to edit or delete a post.
 * Admin can edit anything; otherwise only the author (matched by id).
 */
export function canEditPost(currentUser: User | null, author: AuthorPost): boolean {
  if (!currentUser) return false;
  if (currentUser.role === UserRole.ADMIN) return true;
  return currentUser._id === author._id;
}

/**
 * Checks if the current user has permission to edit or delete a comment.
 * Admin can edit anything; otherwise only the author (matched by id — names
 * aren't unique, so the old name comparison showed edit controls to anyone
 * sharing the author's display name).
 */
export function canEditComment(currentUser: User | null, author: AuthorComment): boolean {
  if (!currentUser) return false;
  if (currentUser.role === UserRole.ADMIN) return true;
  return currentUser._id === author._id;
}
