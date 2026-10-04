import { Injectable, Logger } from '@nestjs/common';
import { GroqService } from './groq.service';
import { ConversationService } from './conversation.service';
import { RetrievalService } from './retrieval.service';
import { ContributorLookupService } from './contributor-lookup.service';
import {
  Citation,
  ChatResponse,
  RetrievedContext,
} from '../interfaces/retrieved-context.interface';
import { Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DomainEvents,
  ResourceCitedEvent,
} from '../../../common/events/domain-events';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  // Hard cap on one reply's generation, which keeps running after a client
  // disconnect (BACKLOG.md D12). Must stay below ConversationService's
  // STALE_GENERATION_MS.
  private readonly MAX_GENERATION_MS = 120_000;

  constructor(
    private readonly groqService: GroqService,
    private readonly conversationService: ConversationService,
    private readonly retrievalService: RetrievalService,
    private readonly contributorLookup: ContributorLookupService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * A resource can be split into several chunks, and more than one chunk
   * from the same resource can clear the retrieval threshold — dedupe by
   * resourceId (the source document) so the same resource isn't cited
   * twice, keeping the first (highest-scoring, since `context` is ordered
   * by descending score) chunk's page as the citation's page.
   */
  private buildCitations(context: RetrievedContext[]): Citation[] {
    const seen = new Set<string>();
    const citations: Citation[] = [];

    for (const c of context) {
      if (seen.has(c.resourceId)) continue;
      seen.add(c.resourceId);
      citations.push({
        title: c.title,
        pageNumber: c.pageNumber,
        semester: c.semester,
        course: c.course,
        resourceId: c.resourceId,
      });
    }

    return citations;
  }

  /** Adds each citation's uploader via one batched lookup (E14). */
  private async attachContributors(citations: Citation[]): Promise<Citation[]> {
    const contributors = await this.contributorLookup.resolve(
      citations.map((c) => c.resourceId),
    );
    return citations.map((c) => {
      const contributor = contributors.get(c.resourceId);
      return contributor ? { ...c, contributor } : c;
    });
  }

  /**
   * Tells the reputation module which contributors' resources just backed an
   * answer (E14). Fire-and-forget: the listener is async and logs its own
   * failures, so this can never affect the response.
   */
  private emitCitations(userId: string, citations: Citation[]): void {
    for (const c of citations) {
      if (!c.contributor) continue;
      this.eventEmitter.emit(DomainEvents.RESOURCE_CITED, {
        resourceId: c.resourceId,
        uploaderId: c.contributor.id,
        citedForUserId: userId,
      } satisfies ResourceCitedEvent);
    }
  }

  async getChatResponse(
    userId: string,
    message: string,
    conversationId?: string,
  ): Promise<ChatResponse> {
    const conversation = await this.conversationService.getOrCreateConversation(
      userId,
      conversationId,
    );
    const retrieval = await this.retrievalService.retrieve(
      userId,
      message,
      conversation.recentMessages,
      conversation.summaryBuffer,
    );
    const isNewThread = conversation.recentMessages.length === 0;
    const { context, status: retrievalStatus, memories } = retrieval;

    const messages = this.groqService.buildMessages(
      conversation.summaryBuffer,
      conversation.recentMessages,
      message,
      context,
      memories,
    );

    const answer = await this.groqService.generateResponse(messages);
    const citations = await this.attachContributors(
      this.buildCitations(context),
    );

    const { assistantMessageId } =
      await this.conversationService.appendMessages(
        conversation,
        message,
        answer,
        (content: string) => this.groqService.summarize(content),
        { citations, retrievalStatus },
      );
    this.emitCitations(userId, citations);

    // Fire-and-forget (BACKLOG.md B4): maybeGenerateTitle never rejects —
    // a failed Groq call is logged and falls back to a default there, so
    // this never blocks or errors the chat response over a nice-to-have.
    if (isNewThread) {
      void this.conversationService.maybeGenerateTitle(
        conversation,
        message,
        (m) => this.groqService.generateTitle(m),
      );
    }

    return {
      answer,
      citations,
      retrievalStatus,
      conversationId: conversation._id.toString(),
      messageId: assistantMessageId,
    };
  }

  async streamChatResponse(
    userId: string,
    message: string,
    conversationId?: string,
    retryOfMessageId?: string,
  ): Promise<Observable<MessageEvent>> {
    const conversation = await this.conversationService.getOrCreateConversation(
      userId,
      conversationId,
    );
    const retrieval = await this.retrievalService.retrieve(
      userId,
      message,
      conversation.recentMessages,
      conversation.summaryBuffer,
    );
    const isNewThread = conversation.recentMessages.length === 0;
    const { context, status: retrievalStatus, memories } = retrieval;

    const messages = this.groqService.buildMessages(
      conversation.summaryBuffer,
      conversation.recentMessages,
      message,
      context,
      memories,
    );

    const citations = await this.attachContributors(
      this.buildCitations(context),
    );

    // BACKLOG.md D12 — persist the exchange (user message + a "generating"
    // placeholder) before generating. The generation below is deliberately
    // not tied to the client connection: unsubscribing only stops events
    // being delivered, the loop still runs to completion (bounded by
    // MAX_GENERATION_MS) and fills the placeholder, so a client that left or
    // refreshed finds the finished reply in the thread history.
    const { assistantMessageId } = await this.conversationService.startExchange(
      conversation,
      message,
      retryOfMessageId,
    );

    return new Observable<MessageEvent>((observer) => {
      // The Observable executor must be synchronous, so this async IIFE is
      // deliberately not awaited — its own try/catch below routes every
      // failure to observer.error(), so nothing here can reject silently.
      void (async () => {
        let fullAnswer = '';
        try {
          // Lets the client address this reply (retry, feedback) and, for a
          // new thread, learn the id before generation finishes.
          observer.next({
            data: {
              type: 'message-saved',
              messageId: assistantMessageId,
              conversationId: conversation._id.toString(),
            },
          } as MessageEvent);
          const startedAt = Date.now();
          // Started inside the observable executor (not awaited above) so
          // that a Groq failure here — e.g. a 429/5xx from generateStream —
          // reaches observer.error() below and becomes a graceful SSE
          // 'error' event, instead of rejecting streamChatResponse's
          // promise after the controller has already flushed headers.
          const stream = await this.groqService.generateStream(messages);

          for await (const chunk of stream) {
            if (Date.now() - startedAt > this.MAX_GENERATION_MS) {
              throw new Error('AI generation exceeded its time limit');
            }
            const token = chunk.choices[0]?.delta?.content ?? '';
            if (token) {
              fullAnswer += token;
              observer.next({ data: { type: 'token', token } } as MessageEvent);
            }
          }
          // Stream complete — emit citations (with retrieval status, so an
          // empty array distinguishes "nothing matched" from "matches were
          // too weak to trust") then done. conversationId is included so
          // the client learns which thread this landed in — relevant the
          // first time, when no conversationId was sent and a new thread
          // was created by getOrCreateConversation.
          observer.next({
            data: {
              type: 'citations',
              citations,
              retrievalStatus,
              conversationId: conversation._id.toString(),
            },
          } as MessageEvent);
          observer.next({ data: { type: 'done' } } as MessageEvent);

          // Fill the placeholder after 'done' is flushed, so 'done' still
          // means "stop waiting on tokens" without waiting on the DB write.
          await this.conversationService.completeExchange(
            conversation,
            assistantMessageId,
            message,
            fullAnswer,
            (content: string) => this.groqService.summarize(content),
            { citations, retrievalStatus },
          );

          this.emitCitations(userId, citations);

          // Fire-and-forget (BACKLOG.md B4) — see getChatResponse for why
          // this can't block or error the response.
          if (isNewThread) {
            void this.conversationService.maybeGenerateTitle(
              conversation,
              message,
              (m) => this.groqService.generateTitle(m),
            );
          }

          observer.complete();
        } catch (err) {
          try {
            await this.conversationService.failExchange(
              assistantMessageId,
              fullAnswer,
            );
          } catch (failErr) {
            this.logger.error(
              `Could not mark AI message ${assistantMessageId} as failed`,
              failErr instanceof Error ? failErr.stack : String(failErr),
            );
          }
          observer.error(err);
        }
      })();
    });
  }

  async clearSession(userId: string): Promise<void> {
    // Legacy endpoint with no conversationId — clears the user's most
    // recently active thread. Nothing to clear if they have none.
    const conversation =
      await this.conversationService.findMostRecentConversation(userId);
    if (!conversation) return;
    await this.conversationService.clearConversation(
      userId,
      conversation._id.toString(),
    );
  }
}
