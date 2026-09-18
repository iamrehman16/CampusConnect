/**
 * Shape of the payload stored on each Qdrant point by
 * IngestionService — see ingestion.service.ts's upsertMany call.
 */
export interface ResourceChunkPayload {
  resourceId: string;
  chunkIndex: number;
  pageNumber: number;
  text: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  resourceType: string;
  fileType: string;
}

export class VectorSearchResultDto {
  resourceId: string;
  score: number;
  payload: ResourceChunkPayload;
}
