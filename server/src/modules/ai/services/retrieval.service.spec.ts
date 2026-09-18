import { RetrievalService } from './retrieval.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { VectorSearchResultDto } from '../dto/vector-search-result.dto';

function buildService(searchResults: VectorSearchResultDto[]) {
  const embeddingService: Partial<EmbeddingService> = {
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  };
  const vectorStoreService: Partial<VectorStoreService> = {
    search: jest.fn().mockResolvedValue(searchResults),
  };

  const service = new RetrievalService(
    embeddingService as EmbeddingService,
    vectorStoreService as VectorStoreService,
  );

  return service;
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
    const service = buildService([result(0.9), result(0.75)]);

    const { context, status } = await service.retrieve('what is chapter 3');

    expect(status).toBe('ok');
    expect(context).toHaveLength(2);
  });

  it('returns status "no-matches" when the vector store returns nothing at all', async () => {
    const service = buildService([]);

    const { context, status } = await service.retrieve('an unrelated query');

    expect(status).toBe('no-matches');
    expect(context).toEqual([]);
  });

  it('returns status "below-threshold" when candidates exist but none clear the threshold', async () => {
    const service = buildService([result(0.4), result(0.3)]);

    const { context, status } = await service.retrieve('a vague query');

    expect(status).toBe('below-threshold');
    expect(context).toEqual([]);
  });
});
