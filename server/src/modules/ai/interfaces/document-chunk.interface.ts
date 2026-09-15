export interface DocumentChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface ParsedDocument {
  chunks: DocumentChunk[];
  totalPages: number;
}
