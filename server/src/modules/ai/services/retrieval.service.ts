import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { GroqService } from './groq.service';
import { MemoryService } from './memory.service';
import { ChatMessage } from '../interfaces/conversation.interface';
import {
  MemoryRecall,
  RetrievalResult,
  RetrievedContext,
} from '../interfaces/retrieved-context.interface';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private readonly SCORE_THRESHOLD = 0.6;
  /**
   * Candidates must also score within this margin of the best hit. With
   * gemini-embedding-001 over course notes, unrelated documents sit at a
   * ~0.55–0.62 noise floor while real matches score ~0.66–0.78, so the
   * absolute threshold alone let in (and cited) off-topic notes — e.g.
   * "Linked Lists" at 0.589 next to "Banker's Algorithm" at 0.751. Measured
   * on the demo corpus (2026-09-26); revisit with E14's evaluation set.
   */
  private readonly RELATIVE_MARGIN = 0.05;
  private readonly TOP_K = 5;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStoreService: VectorStoreService,
    private readonly groqService: GroqService,
    private readonly memoryService: MemoryService,
  ) {}

  async retrieve(
    userId: string,
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

    // Cross-session memory recall (BACKLOG.md B6) runs alongside
    // document-RAG retrieval, off the same contextualized query vector —
    // it degrades to [] internally on failure, never throws, so it can't
    // take down retrieval for a Qdrant/embedding hiccup on this path.
    const memories: MemoryRecall[] = await this.memoryService.retrieveMemories(
      userId,
      vector,
    );

    const results = await this.vectorStoreService.search(
      vector,
      {},
      this.TOP_K,
    );

    if (results.length === 0) {
      return { context: [], status: 'no-matches', memories };
    }

    const best = Math.max(...results.map((r) => r.score));
    const cutoff = Math.max(this.SCORE_THRESHOLD, best - this.RELATIVE_MARGIN);

    const context: RetrievedContext[] = results
      .filter((r) => r.score >= cutoff)
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
      return { context: [], status: 'below-threshold', memories };
    }

    return { context, status: 'ok', memories };
  }
}
