import { Injectable } from '@nestjs/common';
import {
  DocumentChunk,
  ParsedDocument,
} from '../interfaces/document-chunk.interface';

@Injectable()
export class ChunkingService {
  private readonly MAX_CHUNK_CHARS = 2000;
  private readonly OVERLAP_CHARS = 200;

  chunkDocument(parsed: ParsedDocument): DocumentChunk[] {
    const result: DocumentChunk[] = [];
    let globalIndex = 0;

    for (const page of parsed.chunks) {
      if (page.text.length <= this.MAX_CHUNK_CHARS) {
        result.push({ ...page, chunkIndex: globalIndex++ });
      } else {
        const subChunks = this.splitWithOverlap(page.text);
        for (const sub of subChunks) {
          result.push({
            text: sub,
            pageNumber: page.pageNumber,
            chunkIndex: globalIndex++,
          });
        }
      }
    }

    return result;
  }

  private splitWithOverlap(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.MAX_CHUNK_CHARS, text.length);
      chunks.push(text.slice(start, end));
      start += this.MAX_CHUNK_CHARS - this.OVERLAP_CHARS;
    }

    return chunks;
  }
}
