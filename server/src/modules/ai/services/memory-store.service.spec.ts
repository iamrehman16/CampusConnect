import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import { MemoryStoreService } from './memory-store.service';

const getCollections = jest.fn();
const createCollection = jest.fn();
const createPayloadIndex = jest.fn();
const search = jest.fn();

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => ({
    getCollections,
    createCollection,
    createPayloadIndex,
    search,
  })),
}));

const cfg = {
  qdrantUrl: 'http://qdrant.test',
  qdrantApiKey: 'k',
  qdrantCollectionSuffix: '_demo',
} as unknown as ConfigType<typeof aiConfig>;

const USER_ID_INDEX = {
  field_name: 'userId',
  field_schema: 'keyword',
  wait: true,
};

// Qdrant Cloud strict mode rejects filtering on an unindexed payload field,
// so search() (filtered by userId) needs the index to exist.
describe('MemoryStoreService — userId payload index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search.mockResolvedValue([]);
  });

  it('indexes userId when it creates the collection', async () => {
    getCollections.mockResolvedValueOnce({ collections: [] });
    const service = new MemoryStoreService(cfg);

    await service.search([0.1], 'user-1', 3);

    expect(createCollection).toHaveBeenCalledWith(
      'campus_memory_demo',
      expect.anything(),
    );
    expect(createPayloadIndex).toHaveBeenCalledWith(
      'campus_memory_demo',
      USER_ID_INDEX,
    );
  });

  it('indexes userId on a collection that already exists without it', async () => {
    getCollections.mockResolvedValueOnce({
      collections: [{ name: 'campus_memory_demo' }],
    });
    const service = new MemoryStoreService(cfg);

    await service.search([0.1], 'user-1', 3);

    expect(createCollection).not.toHaveBeenCalled();
    expect(createPayloadIndex).toHaveBeenCalledWith(
      'campus_memory_demo',
      USER_ID_INDEX,
    );
    expect(search).toHaveBeenCalledWith(
      'campus_memory_demo',
      expect.objectContaining({
        filter: { must: [{ key: 'userId', match: { value: 'user-1' } }] },
      }),
    );
  });
});
