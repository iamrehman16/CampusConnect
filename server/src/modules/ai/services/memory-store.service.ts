import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import { RetryableInit } from '../../../common/utils/retryable-init';
import {
  MemoryPayload,
  MemorySearchResultDto,
} from '../dto/memory-search-result.dto';

/**
 * Qdrant-backed store for cross-session long-term memory (BACKLOG.md B6).
 * Deliberately a separate collection from VectorStoreService's
 * `campus_resources` — memory recall is not document-RAG context and must
 * not be conflated with it (CLAUDE.md §4 on the citation pipeline, and
 * B6's acceptance criteria). Mirrors VectorStoreService's shape
 * (including the `getCollections()` workaround for the same Qdrant
 * client quirk) rather than sharing code with it, since the two stores
 * are meant to evolve independently.
 */
@Injectable()
export class MemoryStoreService implements OnModuleInit {
  private readonly logger = new Logger(MemoryStoreService.name);
  private readonly COLLECTION_NAME = 'campus_memory';
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
   * Not awaited, same reason as VectorStoreService.onModuleInit (BACKLOG.md
   * G4): a dormant Qdrant must not abort app bootstrap. Operations retry
   * via `collectionInit.ensure()`; MemoryService already degrades memory
   * recall/storage to a logged no-op when these throw.
   */
  onModuleInit(): void {
    this.collectionInit.ensure().catch(() => {
      this.logger.warn(
        'Qdrant unavailable at startup — memory collection will retry on first use',
      );
    });
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
      this.logger.error('Failed to initialize Qdrant memory collection', err);
      throw err;
    }
  }

  async upsert(
    pointId: string,
    vector: number[],
    payload: MemoryPayload,
  ): Promise<void> {
    await this.collectionInit.ensure();
    await this.client.upsert(this.COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload: payload as unknown as Record<string, unknown>,
        },
      ],
    });
  }

  async search(
    vector: number[],
    userId: string,
    limit: number,
  ): Promise<MemorySearchResultDto[]> {
    await this.collectionInit.ensure();
    const results = await this.client.search(this.COLLECTION_NAME, {
      vector,
      filter: { must: [{ key: 'userId', match: { value: userId } }] },
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      pointId: r.id as string,
      score: r.score,
      payload: (r.payload ?? {}) as unknown as MemoryPayload,
    }));
  }
}
