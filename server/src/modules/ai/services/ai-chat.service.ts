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
  ): Promise<ChatResponse> {
    const [session, retrieval] = await Promise.all([
      this.conversationService.getOrCreateSession(userId),
      this.retrievalService.retrieve(message),
    ]);
    const { context, status: retrievalStatus } = retrieval;

    const messages = this.groqService.buildMessages(
      session.summaryBuffer,
      session.recentMessages,
      message,
      context,
    );

    const answer = await this.groqService.generateResponse(messages);

    await this.conversationService.appendMessages(
      userId,
      message,
      answer,
      this.groqService.summarize.bind(this.groqService),
    );

    const citations = this.buildCitations(context);

    return { answer, citations, retrievalStatus };
  }

  async streamChatResponse(
    userId: string,
    message: string,
  ): Promise<Observable<MessageEvent>> {
    const [session, retrieval] = await Promise.all([
      this.conversationService.getOrCreateSession(userId),
      this.retrievalService.retrieve(message),
    ]);
    const { context, status: retrievalStatus } = retrieval;

    const messages = this.groqService.buildMessages(
      session.summaryBuffer,
      session.recentMessages,
      message,
      context,
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
          // too weak to trust") then done
          observer.next({
            data: { type: 'citations', citations, retrievalStatus },
          } as MessageEvent);
          observer.next({ data: { type: 'done' } } as MessageEvent);

          // Persist to conversation history after full answer is assembled
          await this.conversationService.appendMessages(
            userId,
            message,
            fullAnswer,
            this.groqService.summarize.bind(this.groqService),
          );

          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      })();
    });
  }

  async clearSession(userId: string): Promise<void> {
    await this.conversationService.clearSession(userId);
  }
}
