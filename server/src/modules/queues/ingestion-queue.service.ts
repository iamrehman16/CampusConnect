import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IngestionService } from '../ai/services/ingestion.service';
import {
  Resource,
  ResourceDocument,
} from '../resource/schemas/resource.schema';
import { ApprovalStatus } from '../resource/enums/approval-status.enum';
import { IngestionStatus } from '../resource/enums/ingestion-status.enum';
import type { IngestResourceJobPayload } from './interfaces/ingest-resource-job.interface';
import { toIngestionPayload } from './utils/to-ingestion-payload';

export const INGESTION_CONCURRENCY = 2;
export const INGESTION_MAX_ATTEMPTS = 3;
export const INGESTION_BACKOFF_BASE_MS = 5000;

interface Job {
  payload: IngestResourceJobPayload;
  attempt: number;
}

/**
 * In-process RAG ingestion queue (BACKLOG.md I5), replacing BullMQ/Redis.
 *
 * The queue itself is memory-only; durability comes from
 * `Resource.ingestionStatus` in Mongo. Anything left `pending`/`processing`
 * (restart, free-tier sleep, crash) is re-queued at boot. Single instance
 * only: a second instance would re-queue the first one's in-flight work.
 */
@Injectable()
export class IngestionQueueService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(IngestionQueueService.name);
  private readonly waiting: Job[] = [];
  private readonly queuedIds = new Set<string>();
  private readonly running = new Set<Promise<void>>();
  private readonly retryTimers = new Set<NodeJS.Timeout>();
  private stopping = false;

  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    private readonly ingestionService: IngestionService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const unfinished = await this.resourceModel
        .find({
          approvalStatus: ApprovalStatus.APPROVED,
          isDeleted: false,
          ingestionStatus: {
            $in: [IngestionStatus.PENDING, IngestionStatus.PROCESSING],
          },
        })
        .lean()
        .exec();
      for (const resource of unfinished) {
        this.enqueue(toIngestionPayload(resource));
      }
      if (unfinished.length) {
        this.logger.log(
          `Re-queued ${unfinished.length} unfinished ingestion(s) after boot`,
        );
      }
    } catch (err) {
      this.logger.error(
        'Could not recover unfinished ingestions at boot',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /** Stop taking work and let in-flight ingestions finish; retries wait for next boot. */
  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;
    this.retryTimers.forEach((t) => clearTimeout(t));
    this.retryTimers.clear();
    await Promise.allSettled([...this.running]);
  }

  /** Fire-and-forget. Callers set `ingestionStatus: pending` first so the job survives a restart. */
  enqueue(payload: IngestResourceJobPayload): void {
    if (this.stopping || this.queuedIds.has(payload.resourceId)) return;
    this.queuedIds.add(payload.resourceId);
    this.waiting.push({ payload, attempt: 1 });
    this.pump();
  }

  /** Admin retry of a `failed` ingestion. Returns false if nothing was eligible. */
  async retryFailed(resourceId: string): Promise<boolean> {
    const resource = await this.resourceModel
      .findOneAndUpdate(
        {
          _id: resourceId,
          isDeleted: false,
          ingestionStatus: IngestionStatus.FAILED,
        },
        {
          ingestionStatus: IngestionStatus.PENDING,
          ingestionAttempts: 0,
          $unset: { ingestionError: 1 },
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!resource) return false;
    this.enqueue(toIngestionPayload(resource));
    return true;
  }

  private pump(): void {
    while (
      !this.stopping &&
      this.running.size < INGESTION_CONCURRENCY &&
      this.waiting.length
    ) {
      const job = this.waiting.shift() as Job;
      const task = this.execute(job).finally(() => {
        this.running.delete(task);
        this.pump();
      });
      this.running.add(task);
    }
  }

  private async execute({ payload, attempt }: Job): Promise<void> {
    const { resourceId } = payload;
    await this.setStatus(resourceId, {
      ingestionStatus: IngestionStatus.PROCESSING,
      ingestionAttempts: attempt,
    });
    try {
      await this.ingestionService.ingest(payload);
      this.queuedIds.delete(resourceId);
      await this.setStatus(resourceId, {
        ingestionStatus: IngestionStatus.DONE,
        $unset: { ingestionError: 1 },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Ingestion failed for resource ${resourceId} (attempt ${attempt}/${INGESTION_MAX_ATTEMPTS})`,
        err instanceof Error ? err.stack : message,
      );
      if (attempt < INGESTION_MAX_ATTEMPTS && !this.stopping) {
        this.scheduleRetry({ payload, attempt: attempt + 1 });
        return;
      }
      this.queuedIds.delete(resourceId);
      await this.setStatus(resourceId, {
        ingestionStatus: IngestionStatus.FAILED,
        ingestionError: message.slice(0, 500),
      });
    }
  }

  private scheduleRetry(job: Job): void {
    const delay = INGESTION_BACKOFF_BASE_MS * 2 ** (job.attempt - 2);
    const timer = setTimeout(() => {
      this.retryTimers.delete(timer);
      this.waiting.push(job);
      this.pump();
    }, delay);
    this.retryTimers.add(timer);
  }

  /** A failed status write is logged, never thrown: it must not stall the pump. */
  private async setStatus(
    resourceId: string,
    update: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.resourceModel.updateOne({ _id: resourceId }, update).exec();
    } catch (err) {
      this.logger.error(
        `Could not record ingestion status for resource ${resourceId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
