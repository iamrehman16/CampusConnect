import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DomainEvents,
  ResourceRemovedEvent,
} from '../../common/events/domain-events';
import { VectorStoreService } from './services/vector-store.service';

/**
 * Keeps the RAG index in step with the library: a removed resource's
 * chunks are deleted from Qdrant, otherwise the assistant keeps answering
 * from (and citing) a resource whose page now 404s. Failures are logged
 * with context and never propagate to the delete request.
 */
@Injectable()
export class VectorCleanupListener {
  private readonly logger = new Logger(VectorCleanupListener.name);

  constructor(private readonly vectorStore: VectorStoreService) {}

  @OnEvent(DomainEvents.RESOURCE_REMOVED, { async: true })
  async onResourceRemoved(event: ResourceRemovedEvent): Promise<void> {
    try {
      await this.vectorStore.deleteByResourceId(event.resourceId);
    } catch (err) {
      this.logger.error(
        `Could not remove vectors for deleted resource ${event.resourceId}; it may still be retrieved until re-ingestion or manual cleanup`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }
}
