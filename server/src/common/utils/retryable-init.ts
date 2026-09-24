/**
 * Memoizes an async initialization step (e.g. "make sure this Qdrant
 * collection exists") without making a failure permanent.
 *
 * - Concurrent callers share one in-flight attempt.
 * - A successful attempt is cached forever; later calls resolve immediately.
 * - A failed attempt is *not* cached: the rejection is returned to the
 *   callers of that attempt, and the next `ensure()` starts a fresh one.
 *
 * Exists so an external dependency that is down at boot (Qdrant Cloud goes
 * dormant on inactivity) degrades the features that need it instead of
 * aborting Nest bootstrap and taking the whole API down (BACKLOG.md G4).
 */
export class RetryableInit {
  private attempt: Promise<void> | null = null;

  constructor(private readonly init: () => Promise<void>) {}

  ensure(): Promise<void> {
    if (!this.attempt) {
      this.attempt = this.init().catch((err: unknown) => {
        this.attempt = null;
        throw err;
      });
    }
    return this.attempt;
  }
}
