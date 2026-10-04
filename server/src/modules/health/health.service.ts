import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import type { Connection } from 'mongoose';
import { QUEUES } from '../queues/queue.constants';
import { VectorStoreService } from '../ai/services/vector-store.service';

export type DependencyState = 'up' | 'down';

export interface DependencyCheck {
  status: DependencyState;
  latencyMs: number;
}

export interface HealthReport {
  /**
   * ok: everything reachable. degraded: the API works but Redis (ingestion
   * queue) or Qdrant (AI) is down. down: MongoDB is unreachable, so nothing
   * useful works.
   */
  status: 'ok' | 'degraded' | 'down';
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    mongo: DependencyCheck;
    redis: DependencyCheck;
    qdrant: DependencyCheck;
  };
}

const CHECK_TIMEOUT_MS = 3000;
// Render polls health often and Qdrant/Redis calls cost quota: reuse a recent result.
const CACHE_TTL_MS = 10_000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private cached: { at: number; report: HealthReport } | null = null;

  constructor(
    @InjectConnection() private readonly mongo: Connection,
    @InjectQueue(QUEUES.RAG_INGESTION) private readonly ingestionQueue: Queue,
    private readonly vectorStore: VectorStoreService,
  ) {}

  /** Liveness only: the process is up and serving. Touches no dependency. */
  live(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness: probes each dependency (Mongo, Redis, Qdrant) in parallel. */
  async check(): Promise<HealthReport> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < CACHE_TTL_MS) {
      return this.cached.report;
    }

    const [mongo, redis, qdrant] = await Promise.all([
      this.probe('mongo', async () => {
        if (!this.mongo.db) throw new Error('MongoDB is not connected');
        await this.mongo.db.admin().ping();
      }),
      this.probe('redis', async () => {
        const client = await this.ingestionQueue.client;
        await client.ping();
      }),
      this.probe('qdrant', () => this.vectorStore.ping()),
    ]);

    const status =
      mongo.status === 'down'
        ? 'down'
        : redis.status === 'down' || qdrant.status === 'down'
          ? 'degraded'
          : 'ok';

    const report: HealthReport = {
      status,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date(now).toISOString(),
      checks: { mongo, redis, qdrant },
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
