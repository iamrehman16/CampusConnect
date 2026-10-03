import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DomainEvents,
  PostUpvotedEvent,
  ResourceApprovedEvent,
  ResourceCitedEvent,
  ResourceRemovedEvent,
} from '../../common/events/domain-events';
import { ReputationService } from './reputation.service';
import { ReputationEventType } from './enums/reputation-event-type.enum';

/**
 * Domain event -> ledger adapter. Failures are logged with context and never
 * propagate to the originating request; `reputation backfill` repairs gaps.
 */
@Injectable()
export class ReputationListener {
  private readonly logger = new Logger(ReputationListener.name);

  constructor(private readonly reputation: ReputationService) {}

  @OnEvent(DomainEvents.RESOURCE_APPROVED, { async: true })
  onResourceApproved(event: ResourceApprovedEvent) {
    return this.run(`approve ${event.resourceId}`, () =>
      this.reputation.award(
        event.uploaderId,
        ReputationEventType.RESOURCE_APPROVED,
        event.resourceId,
      ),
    );
  }

  @OnEvent(DomainEvents.RESOURCE_REMOVED, { async: true })
  onResourceRemoved(event: ResourceRemovedEvent) {
    return this.run(`remove ${event.resourceId}`, () =>
      this.reputation.reverseResource(event.uploaderId, event.resourceId),
    );
  }

  /**
   * Once per (post, voter) ever: un-upvoting doesn't claw back and re-upvoting
   * doesn't re-award, so toggling can't be farmed. Self-upvotes don't count.
   */
  @OnEvent(DomainEvents.POST_UPVOTED, { async: true })
  onPostUpvoted(event: PostUpvotedEvent) {
    if (event.voterId === event.authorId) return Promise.resolve();
    return this.run(`upvote ${event.postId}`, () =>
      this.reputation.award(
        event.authorId,
        ReputationEventType.POST_UPVOTE_RECEIVED,
        `${event.postId}:${event.voterId}`,
      ),
    );
  }

  /**
   * Keyed by (resource, UTC day): the ledger's unique (type, sourceId) index
   * makes any further citations of the same resource that day no-ops, so an
   * uploader earns at most 1 point per resource per day however often it is
   * cited. Citations for your own resource don't count.
   */
  @OnEvent(DomainEvents.RESOURCE_CITED, { async: true })
  onResourceCited(event: ResourceCitedEvent) {
    if (event.citedForUserId === event.uploaderId) return Promise.resolve();
    const day = new Date().toISOString().slice(0, 10);
    return this.run(`cited ${event.resourceId}`, () =>
      this.reputation.award(
        event.uploaderId,
        ReputationEventType.AI_CITATION,
        `${event.resourceId}:${day}`,
      ),
    );
  }

  private async run(label: string, fn: () => Promise<boolean>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(
        `Reputation update failed (${label})`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
