import { MemoryService } from './memory.service';
import { EmbeddingService } from './embedding.service';
import { MemoryStoreService } from './memory-store.service';
import { MemorySearchResultDto } from '../dto/memory-search-result.dto';

function buildService() {
  const embeddingService: Partial<EmbeddingService> = {
    embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  };
  const memoryStoreService: Partial<MemoryStoreService> = {
    upsert: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
  };

  const service = new MemoryService(
    embeddingService as EmbeddingService,
    memoryStoreService as MemoryStoreService,
  );

  return { service, embeddingService, memoryStoreService };
}

function result(
  score: number,
  overrides: Partial<MemorySearchResultDto['payload']> = {},
): MemorySearchResultDto {
  return {
    pointId: 'point-1',
    score,
    payload: {
      userId: 'user-1',
      conversationId: 'convo-1',
      text: 'user asked about wifi setup last week',
      createdAt: new Date('2026-01-01').toISOString(),
      ...overrides,
    },
  };
}

describe('MemoryService#storeMemory', () => {
  it('embeds and upserts the aging text under the conversation, keyed by userId', async () => {
    const { service, embeddingService, memoryStoreService } = buildService();

    await service.storeMemory('user-1', 'convo-1', 'the user asked about wifi');

    expect(embeddingService.embed).toHaveBeenCalledWith(
      'the user asked about wifi',
    );
    expect(memoryStoreService.upsert).toHaveBeenCalledWith(
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ),
      [0.1, 0.2, 0.3],
      expect.objectContaining({
        userId: 'user-1',
        conversationId: 'convo-1',
        text: 'the user asked about wifi',
      }),
    );
  });

  it('skips storing blank text without calling the embedding service', async () => {
    const { service, embeddingService, memoryStoreService } = buildService();

    await service.storeMemory('user-1', 'convo-1', '   ');

    expect(embeddingService.embed).not.toHaveBeenCalled();
    expect(memoryStoreService.upsert).not.toHaveBeenCalled();
  });

  it('degrades to a no-op instead of throwing when the embedding call fails', async () => {
    const { service, embeddingService } = buildService();
    (embeddingService.embed as jest.Mock).mockRejectedValue(
      new Error('gemini down'),
    );

    await expect(
      service.storeMemory('user-1', 'convo-1', 'some text'),
    ).resolves.toBeUndefined();
  });

  it('degrades to a no-op instead of throwing when the Qdrant upsert fails', async () => {
    const { service, memoryStoreService } = buildService();
    (memoryStoreService.upsert as jest.Mock).mockRejectedValue(
      new Error('qdrant down'),
    );

    await expect(
      service.storeMemory('user-1', 'convo-1', 'some text'),
    ).resolves.toBeUndefined();
  });
});

describe('MemoryService#retrieveMemories', () => {
  it('returns memories that clear the score threshold, scoped to the user', async () => {
    const { service, memoryStoreService } = buildService();
    (memoryStoreService.search as jest.Mock).mockResolvedValue([
      result(0.9),
      result(0.4),
    ]);

    const memories = await service.retrieveMemories('user-1', [0.1, 0.2, 0.3]);

    expect(memoryStoreService.search).toHaveBeenCalledWith(
      [0.1, 0.2, 0.3],
      'user-1',
      3,
    );
    expect(memories).toHaveLength(1);
    expect(memories[0].text).toBe('user asked about wifi setup last week');
    expect(memories[0].createdAt).toBeInstanceOf(Date);
  });

  it('returns [] instead of throwing when Qdrant search fails', async () => {
    const { service, memoryStoreService } = buildService();
    (memoryStoreService.search as jest.Mock).mockRejectedValue(
      new Error('qdrant down'),
    );

    await expect(
      service.retrieveMemories('user-1', [0.1, 0.2, 0.3]),
    ).resolves.toEqual([]);
  });
});
