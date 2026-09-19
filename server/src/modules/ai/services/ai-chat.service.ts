import { Injectable } from '@nestjs/common';
import { GroqService } from './groq.service';
import { ConversationService } from './conversation.service';
import { RetrievalService } from './retrieval.service';
import {
  Citation,
  ChatResponse,
  RetrievedContext,
} from '../interfaces/retrieved-context.interface';
import { Observable } from 'rxjs';

@Injectable()
export class AiChatService {
  constructor(
    private readonly groqService: GroqService,
    private readonly conversationService: ConversationService,
    private readonly retrievalService: RetrievalService,
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

    const { assistantMessageId } =
      await this.conversationService.appendMessages(
        conversation,
        message,
        answer,
        (content: string) => this.groqService.summarize(content),
      );

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

    const citations = this.buildCitations(context);

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

    const citations = this.buildCitations(context);

    return new Observable<MessageEvent>((observer) => {
      // The Observable executor must be synchronous, so this async IIFE is
      // deliberately not awaited — its own try/catch below routes every
      // failure to observer.error(), so nothing here can reject silently.
      void (async () => {
        let fullAnswer = '';
        try {
          // Started inside the observable executor (not awaited above) so
          // that a Groq failure here — e.g. a 429/5xx from generateStream —
          // reaches observer.error() below and becomes a graceful SSE
          // 'error' event, instead of rejecting streamChatResponse's
          // promise after the controller has already flushed headers.
          const stream = await this.groqService.generateStream(messages);

          for await (const chunk of stream) {
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
          // first time, when no conversationId was sent and one got
          // created via the getOrCreateConversation fallback.
          observer.next({
            data: {
              type: 'citations',
              citations,
              retrievalStatus,
              conversationId: conversation._id.toString(),
            },
          } as MessageEvent);
          observer.next({ data: { type: 'done' } } as MessageEvent);

          // Persist to conversation history after full answer is assembled
          const { assistantMessageId } =
            await this.conversationService.appendMessages(
              conversation,
              message,
              fullAnswer,
              (content: string) => this.groqService.summarize(content),
            );

          // BACKLOG.md C1 — the client has no real message id until now
          // (appendMessages runs after 'done' is already flushed, by
          // design — see the comment above). Sent as its own event rather
          // than folded into 'done' so 'done' still means "stop waiting on
          // tokens" without being delayed by the DB write.
          observer.next({
            data: { type: 'message-saved', messageId: assistantMessageId },
          } as MessageEvent);

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
          observer.error(err);
        }
      })();
    });
  }

  async clearSession(userId: string): Promise<void> {
    // No conversationId from the client yet (BACKLOG.md B2 adds thread
    // selection) — clears the user's most recently active thread, the
    // same bridge behavior getOrCreateConversation uses elsewhere in this
    // service.
    const conversation =
      await this.conversationService.getOrCreateConversation(userId);
    await this.conversationService.clearConversation(
      userId,
      conversation._id.toString(),
    );
  }
}
