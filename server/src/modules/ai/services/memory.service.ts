import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { EmbeddingService } from './embedding.service';
import { MemoryStoreService } from './memory-store.service';
import { MemoryRecall } from '../interfaces/retrieved-context.interface';

/**
 * Cross-session long-term memory (BACKLOG.md B6) — the actual "memory"
 * part of Epic B, as opposed to B1-B5's per-thread plumbing. Every
 * external call here (embedding + Qdrant) degrades gracefully: a failure
 * to store a memory means "no memory recall this turn" the next time
 * around, not a broken chat response, and a failure to retrieve means the
 * current turn proceeds with document-RAG context only (CLAUDE.md §3.3).
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly SCORE_THRESHOLD = 0.6;
  private readonly DEFAULT_LIMIT = 3;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly memoryStoreService: MemoryStoreService,
  ) {}

  /**
   * Same MD5-to-UUID convention as IngestionService#toUuid (CLAUDE.md §4)
   * — Qdrant requires UUID or integer point IDs. Suffixed with the
   * current timestamp so each aging summary chunk from the same
   * conversation becomes its own memory point rather than overwriting the
   * previous one — a thread accumulates memory over its lifetime instead
   * of only ever remembering its latest summary.
   */
  private toPointId(conversationId: string): string {
    const hash = createHash('md5')
      .update(`${conversationId}_${Date.now()}`)
      .digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  }

  /**
   * Fire-and-forget from ConversationService when a summary chunk ages
   * out of the sliding window (BACKLOG.md B6 — "completed or aging
   * threads"). Never throws: logged and swallowed on failure, since a
   * missed memory-store is a degraded future turn, not a broken current
   * one.
   */
  async storeMemory(
    userId: string,
    conversationId: string,
    text: string,
  ): Promise<void> {
    if (!text.trim()) return;

    try {
      const vector = await this.embeddingService.embed(text);
      await this.memoryStoreService.upsert(
        this.toPointId(conversationId),
        vector,
        {
          userId,
          conversationId,
          text,
          createdAt: new Date().toISOString(),
        },
      );
    } catch (err) {
      this.logger.error(
        `Failed to store cross-session memory for user ${userId}, conversation ${conversationId} — skipping this turn's memory write`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  /**
   * Retrieves relevant memories from the user's past conversations, gated
   * by the same score-threshold pattern as RetrievalService's document
   * RAG (CLAUDE.md's SCORE_THRESHOLD convention). Returns [] — not a
   * thrown error — on any failure, so a Qdrant hiccup degrades to "no
   * memory recall this turn" rather than failing the chat response.
   */
  async retrieveMemories(
    userId: string,
    queryVector: number[],
  ): Promise<MemoryRecall[]> {
    try {
      const results = await this.memoryStoreService.search(
        queryVector,
        userId,
        this.DEFAULT_LIMIT,
      );

      return results
        .filter((r) => r.score >= this.SCORE_THRESHOLD)
        .map((r) => ({
          text: r.payload.text,
          conversationId: r.payload.conversationId,
          score: r.score,
          createdAt: new Date(r.payload.createdAt),
        }));
    } catch (err) {
      this.logger.error(
        `Failed to retrieve cross-session memory for user ${userId} — proceeding without memory recall this turn`,
        err instanceof Error ? err.stack : undefined,
      );
      return [];
    }
  }
}
