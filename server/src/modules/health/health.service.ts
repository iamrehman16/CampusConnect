import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { VectorStoreService } from '../ai/services/vector-store.service';
import { GroqService } from '../ai/services/groq.service';

export type DependencyState = 'up' | 'down';

export interface DependencyCheck {
  status: DependencyState;
  latencyMs: number;
}

export interface HealthReport {
  /**
   * ok: everything reachable. degraded: the API works but Qdrant or Groq (AI) is down or misconfigured. down: MongoDB is unreachable, so nothing
   * useful works.
   */
  status: 'ok' | 'degraded' | 'down';
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    mongo: DependencyCheck;
    qdrant: DependencyCheck;
    groq: DependencyCheck;
  };
}

const CHECK_TIMEOUT_MS = 3000;
// Render polls health often and Qdrant/Groq calls cost quota: reuse a recent result.
const CACHE_TTL_MS = 10_000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private cached: { at: number; report: HealthReport } | null = null;

  constructor(
    @InjectConnection() private readonly mongo: Connection,
    private readonly vectorStore: VectorStoreService,
    private readonly groq: GroqService,
  ) {}

  /** Liveness only: the process is up and serving. Touches no dependency. */
  live(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness: probes each dependency (Mongo, Qdrant, Groq) in parallel. */
  async check(): Promise<HealthReport> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < CACHE_TTL_MS) {
      return this.cached.report;
    }

    const [mongo, qdrant, groq] = await Promise.all([
      this.probe('mongo', async () => {
        if (!this.mongo.db) throw new Error('MongoDB is not connected');
        await this.mongo.db.admin().ping();
      }),
      this.probe('qdrant', () => this.vectorStore.ping()),
      this.probe('groq', () => this.groq.ping()),
    ]);

    const status =
      mongo.status === 'down'
        ? 'down'
        : qdrant.status === 'down' || groq.status === 'down'
          ? 'degraded'
          : 'ok';

    const report: HealthReport = {
      status,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date(now).toISOString(),
      checks: { mongo, qdrant, groq },
    };
    this.cached = { at: now, report };
    return report;
  }

  /**
   * Runs one probe with a timeout. The error is logged here and deliberately
   * not returned: the endpoint is public and shouldn't leak hostnames or
   * driver messages.
   */
  private async probe(
    name: string,
    fn: () => Promise<void>,
  ): Promise<DependencyCheck> {
    const started = Date.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS} ms`)),
            CHECK_TIMEOUT_MS,
          );
        }),
      ]);
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (err) {
      this.logger.warn(
        `Health check failed for ${name}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { status: 'down', latencyMs: Date.now() - started };
    } finally {
      clearTimeout(timer);
    }
  }
}
