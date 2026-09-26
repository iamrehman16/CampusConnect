import { VectorCleanupListener } from './vector-cleanup.listener';
import { VectorStoreService } from './services/vector-store.service';

describe('VectorCleanupListener', () => {
  const event = { resourceId: 'res-1', uploaderId: 'user-1' };

  it('deletes the removed resource from the vector store', async () => {
    const vectorStore = {
      deleteByResourceId: jest.fn().mockResolvedValue(undefined),
    };
    const listener = new VectorCleanupListener(
      vectorStore as unknown as VectorStoreService,
    );

    await listener.onResourceRemoved(event);

    expect(vectorStore.deleteByResourceId).toHaveBeenCalledWith('res-1');
  });

  it('logs and swallows a Qdrant failure instead of failing the delete', async () => {
    const vectorStore = {
      deleteByResourceId: jest.fn().mockRejectedValue(new Error('down')),
    };
    const listener = new VectorCleanupListener(
      vectorStore as unknown as VectorStoreService,
    );

    await expect(listener.onResourceRemoved(event)).resolves.toBeUndefined();
  });
});
