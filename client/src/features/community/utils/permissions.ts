import type { User } from '@/shared/types/auth.types';
import { UserRole } from '@/shared/types/enums';
import type { AuthorPost, AuthorComment } from '../types/community.dto';

/**
 * Checks if the current user has permission to edit or delete a post.
 * Admin can edit anything. Owners can edit their own posts based on email.
 */
export function canEditPost(currentUser: User | null, author: AuthorPost): boolean {
  if (!currentUser) return false;
  if (currentUser.role === UserRole.ADMIN) return true;
  return currentUser.email === author.email;
}

/**
 * Checks if the current user has permission to edit or delete a comment.
 * Admin can edit anything. Owners can edit their own based on name (since DTO lacks email).
 */
export function canEditComment(currentUser: User | null, author: AuthorComment): boolean {
  if (!currentUser) return false;
  if (currentUser.role === UserRole.ADMIN) return true;
  return currentUser.name === author.name;
}
