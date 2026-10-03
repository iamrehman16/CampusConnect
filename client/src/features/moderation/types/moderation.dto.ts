/** A user the signed-in member has blocked (BACKLOG.md E16). */
export interface BlockedUser {
  id: string;
  name: string;
  avatar?: string;
  blockedAt: string;
}
