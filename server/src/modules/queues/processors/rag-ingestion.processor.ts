import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { QUEUES } from '../queue.constants';
import { Logger } from '@nestjs/common';
import { IngestionService } from '../../ai/services/ingestion.service';
import { Job } from 'bullmq';
import { IngestResourceJobPayload } from '../interfaces/ingest-resource-job.interface';

@Processor(QUEUES.RAG_INGESTION)
export class RagIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(RagIngestionProcessor.name);

  constructor(private readonly ingestionService: IngestionService) {
    super();
  }

  async process(job: Job<IngestResourceJobPayload>): Promise<void> {
    this.logger.log(
      `Processing ingestion job ${job.id} for resource: ${job.data.resourceId}`,
    );
    await this.ingestionService.ingest(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<IngestResourceJobPayload>) {
    this.logger.log(
      `Ingestion job ${job.id} completed for resource: ${job.data.resourceId}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<IngestResourceJobPayload>, error: Error) {
    this.logger.error(
      `Ingestion job ${job.id} failed for resource: ${job.data.resourceId} — attempts: ${job.attemptsMade}`,
      error.stack,
    );
  }
}
