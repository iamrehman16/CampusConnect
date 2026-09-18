import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { GroqService } from './groq.service';
import { ChatMessage } from '../interfaces/conversation.interface';
import {
  RetrievalResult,
  RetrievedContext,
} from '../interfaces/retrieved-context.interface';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private readonly SCORE_THRESHOLD = 0.6;
  private readonly TOP_K = 5;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly groqService: GroqService,
  ) {}

  async retrieve(
    query: string,
    recentMessages: ChatMessage[] = [],
    summaryBuffer?: string,
  ): Promise<RetrievalResult> {
    const contextualQuery = await this.groqService.contextualizeQuery(
      query,
      recentMessages,
      summaryBuffer,
    );

    const vector = await this.embeddingService.embedQuery(contextualQuery);

    const results = await this.vectorStoreService.search(
      vector,
      {},
      this.TOP_K,
    );

    if (results.length === 0) {
      return { context: [], status: 'no-matches' };
    }

    const context: RetrievedContext[] = results
      .filter((r) => r.score >= this.SCORE_THRESHOLD)
      .map((r) => ({
        text: r.payload.text,
        pageNumber: r.payload.pageNumber,
        title: r.payload.title,
        resourceId: r.payload.resourceId,
        semester: r.payload.semester,
        course: r.payload.course,
        score: r.score,
      }));

    if (context.length === 0) {
      this.logger.debug(
        `Retrieval found ${results.length} candidate(s) but none cleared the ${this.SCORE_THRESHOLD} score threshold`,
      );
      return { context: [], status: 'below-threshold' };
    }

    return { context, status: 'ok' };
  }
}
