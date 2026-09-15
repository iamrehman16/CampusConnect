import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import { VectorSearchResultDto } from '../dto/vector-search-result.dto';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);
  private readonly COLLECTION_NAME = 'campus_resources';
  private readonly VECTOR_SIZE = 3072;

  private readonly client: QdrantClient;

  constructor(
    @Inject(aiConfig.KEY) private aiCfg: ConfigType<typeof aiConfig>,
  ) {
    this.client = new QdrantClient({
      url: this.aiCfg.qdrantUrl,
      apiKey: this.aiCfg.qdrantApiKey,
    });
  }

  async onModuleInit() {
    await this.ensureCollection();
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
    const results = await this.client.search(this.COLLECTION_NAME, {
      vector,
      filter,
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      resourceId: r.id as string,
      score: r.score,
      payload: r.payload ?? {},
    }));
  }
}
