import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import {
  VECTOR_STORE_UNAVAILABLE_MESSAGE,
  VectorStoreService,
} from './vector-store.service';

const getCollections = jest.fn();
const createCollection = jest.fn();
const search = jest.fn();
const upsert = jest.fn();

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => ({
    getCollections,
    createCollection,
    search,
    upsert,
  })),
}));

const cfg = {
  qdrantUrl: 'http://qdrant.test',
  qdrantApiKey: 'k',
  qdrantCollectionSuffix: '',
} as unknown as ConfigType<typeof aiConfig>;

const flush = () => new Promise((r) => setImmediate(r));

describe('VectorStoreService — Qdrant down at boot (BACKLOG.md G4)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw from onModuleInit when Qdrant is unreachable', async () => {
    getCollections.mockRejectedValueOnce(new Error('connect timeout'));
    const service = new VectorStoreService(cfg);

    expect(() => service.onModuleInit()).not.toThrow();
    await flush();
    expect(getCollections).toHaveBeenCalledTimes(1);
  });

  it('retries collection init on the next search and succeeds once Qdrant is back', async () => {
    getCollections
      .mockRejectedValueOnce(new Error('connect timeout'))
      .mockResolvedValueOnce({ collections: [{ name: 'campus_resources' }] });
    search.mockResolvedValueOnce([
      { id: 'p1', score: 0.9, payload: { text: 't' } },
    ]);
    const service = new VectorStoreService(cfg);
    service.onModuleInit();
    await flush();

    const results = await service.search([0.1], {}, 5);

    expect(getCollections).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(1);
  });

  it('surfaces a typed 503 with a readable message while Qdrant stays down', async () => {
    getCollections.mockRejectedValue(new Error('connect timeout'));
    const service = new VectorStoreService(cfg);
    service.onModuleInit();
    await flush();

    const err = await service.search([0.1], {}, 5).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ServiceUnavailableException);
    expect((err as Error).message).toBe(VECTOR_STORE_UNAVAILABLE_MESSAGE);
    expect(search).not.toHaveBeenCalled();
  });
});
