import { RetrievalService } from './retrieval.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { GroqService } from './groq.service';
import { MemoryService } from './memory.service';
import { VectorSearchResultDto } from '../dto/vector-search-result.dto';

function buildService(searchResults: VectorSearchResultDto[]) {
  const embeddingService: Partial<EmbeddingService> = {
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  };
  const vectorStoreService: Partial<VectorStoreService> = {
    search: jest.fn().mockResolvedValue(searchResults),
  };
  const groqService: Partial<GroqService> = {
    contextualizeQuery: jest.fn().mockImplementation((q) => Promise.resolve(q)),
  };
  const memoryService: Partial<MemoryService> = {
    retrieveMemories: jest.fn().mockResolvedValue([]),
  };

  const service = new RetrievalService(
    embeddingService as EmbeddingService,
    vectorStoreService as VectorStoreService,
    groqService as GroqService,
    memoryService as MemoryService,
  );

  return { service, memoryService };
}

function result(score: number, title = 'Some Resource'): VectorSearchResultDto {
  return {
    resourceId: 'resource-1',
    score,
    payload: {
      text: 'chunk text',
      pageNumber: 1,
      title,
      resourceId: 'resource-1',
      semester: 3,
      course: 'CS101',
      chunkIndex: 0,
      subject: 'Computer Science',
      resourceType: 'notes',
      fileType: 'pdf',
    },
  };
}

describe('RetrievalService#retrieve', () => {
  it('returns status "ok" with context when results clear the score threshold', async () => {
    const { service } = buildService([result(0.9), result(0.75)]);

    const { context, status } = await service.retrieve(
      'user-1',
      'what is chapter 3',
    );

    expect(status).toBe('ok');
    expect(context).toHaveLength(2);
  });

  it('returns status "no-matches" when the vector store returns nothing at all', async () => {
    const { service } = buildService([]);

    const { context, status } = await service.retrieve(
      'user-1',
      'an unrelated query',
    );

    expect(status).toBe('no-matches');
    expect(context).toEqual([]);
  });

  it('returns status "below-threshold" when candidates exist but none clear the threshold', async () => {
    const { service } = buildService([result(0.4), result(0.3)]);

    const { context, status } = await service.retrieve(
      'user-1',
      'a vague query',
    );

    expect(status).toBe('below-threshold');
    expect(context).toEqual([]);
  });

  it('includes cross-session memory recall alongside document-RAG context (B6)', async () => {
    const { service, memoryService } = buildService([result(0.9)]);
    (memoryService.retrieveMemories as jest.Mock).mockResolvedValue([
      {
        text: 'remembered fact',
        conversationId: 'convo-1',
        score: 0.7,
        createdAt: new Date(),
      },
    ]);

    const { memories } = await service.retrieve('user-1', 'what is chapter 3');

    expect(memoryService.retrieveMemories).toHaveBeenCalledWith(
      'user-1',
      [0.1, 0.2, 0.3],
    );
    expect(memories).toHaveLength(1);
    expect(memories[0].text).toBe('remembered fact');
  });

  it('still returns document-RAG context when memory recall fails to resolve gracefully to []', async () => {
    const { service, memoryService } = buildService([result(0.9)]);
    (memoryService.retrieveMemories as jest.Mock).mockResolvedValue([]);

    const { context, status, memories } = await service.retrieve(
      'user-1',
      'what is chapter 3',
    );

    expect(status).toBe('ok');
    expect(context).toHaveLength(1);
    expect(memories).toEqual([]);
  });
});
