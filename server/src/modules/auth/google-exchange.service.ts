import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

const CODE_TTL_MS = 60_000;

/**
 * One-time codes that carry a user id from the Google callback redirect to the
 * client, so tokens never appear in a URL (browser history, logs, referrers).
 *
 * Flagged shortcut (BACKLOG.md F2): in-memory, so codes don't survive a restart
 * or work across several server instances. Fine for a single Render instance
 * and a 60s lifetime; move to Redis before scaling out.
 */
@Injectable()
export class GoogleExchangeService {
  private readonly codes = new Map<
    string,
    { userId: string; expiresAt: number }
  >();

  issue(userId: string): string {
    this.sweep();
    const code = randomBytes(32).toString('base64url');
    this.codes.set(code, { userId, expiresAt: Date.now() + CODE_TTL_MS });
    return code;
  }

  /** Returns the user id once, then forgets the code. */
  consume(code: string): string | null {
    const entry = this.codes.get(code);
    this.codes.delete(code);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.userId;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [code, entry] of this.codes) {
      if (entry.expiresAt < now) this.codes.delete(code);
    }
  }
}
