/**
 * Shape of the payload stored on each Qdrant point by MemoryService —
 * see memory.service.ts's storeMemory. Kept in a separate Qdrant
 * collection from ResourceChunkPayload (vector-search-result.dto.ts):
 * cross-session conversation memory is not document-RAG context, and the
 * two must not be conflated (BACKLOG.md B6).
 */
export interface MemoryPayload {
  userId: string;
  conversationId: string;
  text: string;
  createdAt: string;
}

export class MemorySearchResultDto {
  pointId: string;
  score: number;
  payload: MemoryPayload;
}
