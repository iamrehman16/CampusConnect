import { Injectable, Logger } from '@nestjs/common';
import { DocumentParserService } from './document-parser.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { createHash } from 'crypto';
import { ChunkingService } from './chunking.service';
import { IngestResourceJobPayload } from '../../queues/interfaces/ingest-resource-job.interface';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly documentParserService: DocumentParserService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly chunkingService: ChunkingService,
  ) {}

  async ingest(resource: IngestResourceJobPayload): Promise<void> {
    const resourceId = resource.resourceId;
    this.logger.log(`Starting ingestion for resource: ${resourceId}`);

    // 1. Parse — get pages
    const parsed = await this.documentParserService.parse(
      resource.fileUrl,
      resourceId,
    );

    if (!parsed.chunks.length) {
      this.logger.warn(
        `Skipping ingestion for resource: ${resourceId} — empty parse result`,
      );
      return;
    }

    // 2. Chunk — split long pages, preserve page numbers
    const chunks = this.chunkingService.chunkDocument(parsed);
    this.logger.log(
      `Resource ${resourceId} split into ${chunks.length} chunks`,
    );

    // 3. Embed all chunks in batch
    const vectors = await this.embeddingService.embedBatch(
      chunks.map((c) => c.text),
    );

    // 4. Upsert all points to Qdrant
    await this.vectorStoreService.upsertMany(
      chunks.map((chunk, i) => ({
        id: this.toUuid(`${resourceId}_${chunk.chunkIndex}`),
        vector: vectors[i],
        payload: {
          resourceId,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          text: chunk.text,
          title: resource.title,
          subject: resource.subject,
          course: resource.course,
          semester: resource.semester,
          resourceType: resource.resourceType,
          fileType: resource.fileType,
        },
      })),
    );

    this.logger.log(
      `Ingestion complete for resource: ${resourceId} — ${chunks.length} vectors stored`,
    );
  }
  private toUuid(mongoId: string): string {
    const hash = createHash('md5').update(mongoId).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  }
}
