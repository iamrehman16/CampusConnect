import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import { RetryableInit } from '../../../common/utils/retryable-init';
import {
  ResourceChunkPayload,
  VectorSearchResultDto,
} from '../dto/vector-search-result.dto';

/** User-facing message when the vector store can't be reached (G4). */
export const VECTOR_STORE_UNAVAILABLE_MESSAGE =
  'The AI assistant is temporarily unavailable. Please try again in a minute.';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly COLLECTION_NAME = 'campus_resources';
  private readonly VECTOR_SIZE = 3072;

  private readonly client: QdrantClient;
  private readonly collectionInit = new RetryableInit(() =>
    this.ensureCollection(),
  );

  constructor(
    @Inject(aiConfig.KEY) private aiCfg: ConfigType<typeof aiConfig>,
  ) {
    this.client = new QdrantClient({
      url: this.aiCfg.qdrantUrl,
      apiKey: this.aiCfg.qdrantApiKey,
    });
  }

  /**
   * Deliberately not awaited: Qdrant Cloud goes dormant on inactivity, and
   * a failed collection check used to abort Nest bootstrap and take the
   * whole API down with it (BACKLOG.md G4). Failure is logged in
   * ensureCollection(); every operation below retries via `ready()`.
   */
  onModuleInit(): void {
    this.collectionInit.ensure().catch(() => {
      this.logger.warn(
        'Qdrant unavailable at startup — AI retrieval/ingestion will retry on first use',
      );
    });
  }

  /** Throws the underlying Qdrant error if the collection still can't be ensured. */
  private ready(): Promise<void> {
    return this.collectionInit.ensure();
  }

  private async ensureCollection(): Promise<void> {
    try {
      const { collections } = await this.client.getCollections();
      const exists = collections.some((c) => c.name === this.COLLECTION_NAME);

      if (exists) {
        this.logger.log(`Collection "${this.COLLECTION_NAME}" already exists`);
        return;
      }

      await this.client.createCollection(this.COLLECTION_NAME, {
        vectors: {
          size: this.VECTOR_SIZE,
          distance: 'Cosine',
        },
      });

      this.logger.log(
        `Collection "${this.COLLECTION_NAME}" created successfully`,
      );
    } catch (err) {
      this.logger.error('Failed to initialize Qdrant collection', err);
      throw err;
    }
  }

  async upsert(
    resourceId: string,
    vector: number[],
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      await this.ready();
      await this.client.upsert(this.COLLECTION_NAME, {
        wait: true,
        points: [{ id: resourceId, vector, payload }],
      });
      this.logger.log(`Vector upserted for resource: ${resourceId}`);
    } catch (err) {
      this.logger.error(
        `Failed to upsert vector for resource: ${resourceId}`,
        err,
      );
      throw err;
    }
  }

  async upsertMany(
    points: { id: string; vector: number[]; payload: Record<string, any> }[],
  ): Promise<void> {
    try {
      await this.ready();
      await this.client.upsert(this.COLLECTION_NAME, {
        wait: true,
        points,
      });
      this.logger.log(`Batch upserted ${points.length} points`);
    } catch (err) {
      this.logger.error('Failed to batch upsert vectors', err);
      throw err;
    }
  }

  async search(
    vector: number[],
    filter: Record<string, any>,
    limit = 5,
  ): Promise<VectorSearchResultDto[]> {
    // Search is on the user-facing chat path, so a Qdrant outage surfaces
    // as a typed 503 with a readable message (the SSE handler forwards
    // `err.message`) rather than a raw "fetch failed".
    let results: Awaited<ReturnType<QdrantClient['search']>>;
    try {
      await this.ready();
      results = await this.client.search(this.COLLECTION_NAME, {
        vector,
        filter,
        limit,
        with_payload: true,
      });
    } catch (err) {
      this.logger.error('Vector search failed', err);
      throw new ServiceUnavailableException(VECTOR_STORE_UNAVAILABLE_MESSAGE, {
        cause: err,
      });
    }

    return results.map((r) => ({
      resourceId: r.id as string,
      score: r.score,
      // Qdrant's client types payload as an untyped record — this cast
      // assumes it's always the shape IngestionService writes (see
      // ingestion.service.ts's upsertMany call).
      payload: (r.payload ?? {}) as unknown as ResourceChunkPayload,
    }));
  }
}
