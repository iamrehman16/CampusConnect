import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import FormData from 'form-data';
import { fetchBuffer } from '../commom/utils/http.utils';
import nodeFetch from 'node-fetch';
import {
  DocumentChunk,
  ParsedDocument,
} from '../interfaces/document-chunk.interface';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);
  private readonly LLAMA_PARSE_BASE_URL =
    'https://api.cloud.llamaindex.ai/api/v1/parsing';
  private readonly MAX_POLL_ATTEMPTS = 30;
  private readonly POLL_INTERVAL_MS = 3000;

  constructor(
    @Inject(aiConfig.KEY) private aiCfg: ConfigType<typeof aiConfig>,
  ) {}

  // Fetches the file into memory and uploads directly to LlamaParse
  // No disk involved — buffer lives in process memory for the duration of this call
  private async uploadForParsing(
    fileUrl: string,
    resourceId: string,
    retries = 3,
  ): Promise<string> {
    const buffer = await fetchBuffer(fileUrl);

    // Derive filename from URL for LlamaParse's content-type sniffing
    const urlPath = new URL(fileUrl).pathname;
    const filename = urlPath.split('/').pop() || `resource_${resourceId}.bin`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const formData = new FormData();
      // Pass buffer directly — no temp file read needed
      formData.append('file', buffer, { filename });
      formData.append('result_type', 'markdown');

      const response = await nodeFetch(`${this.LLAMA_PARSE_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.aiCfg.llamaCloudApiKey}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (response.ok) {
        const data = (await response.json()) as { id: string };
        return data.id;
      }

      const error = await response.text();

      if (response.status !== 500 || attempt === retries) {
        throw new Error(
          `LlamaParse upload failed: ${response.status} — ${error}`,
        );
      }

      this.logger.warn(
        `LlamaParse upload attempt ${attempt}/${retries} failed with 500, retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }

    throw new Error('LlamaParse upload failed after all retries');
  }

  private async pollForResult(
    jobId: string,
  ): Promise<Array<{ text: string; metadata: { page_label: string } }>> {
    for (let attempt = 0; attempt < this.MAX_POLL_ATTEMPTS; attempt++) {
      const response = await fetch(
        `${this.LLAMA_PARSE_BASE_URL}/job/${jobId}/result/json`,
        {
          headers: { Authorization: `Bearer ${this.aiCfg.llamaCloudApiKey}` },
        },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          pages: Array<{ text: string; page: number }>;
        };
        return data.pages.map((p) => ({
          text: p.text,
          metadata: { page_label: String(p.page) },
        }));
      }

      if (response.status !== 404) {
        throw new Error(`LlamaParse polling failed: ${response.statusText}`);
      }

      this.logger.log(
        `Polling attempt ${attempt + 1}/${this.MAX_POLL_ATTEMPTS} for job: ${jobId}`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, this.POLL_INTERVAL_MS),
      );
    }

    throw new Error(
      `LlamaParse job timed out after ${this.MAX_POLL_ATTEMPTS} attempts`,
    );
  }

  async parse(fileUrl: string, resourceId: string): Promise<ParsedDocument> {
    try {
      const jobId = await this.uploadForParsing(fileUrl, resourceId);
      this.logger.log(
        `LlamaParse job started: ${jobId} for resource: ${resourceId}`,
      );

      const pages = await this.pollForResult(jobId);

      if (!pages.length) {
        this.logger.warn(`Empty parse result for resource: ${resourceId}`);
        return { chunks: [], totalPages: 0 };
      }

      const chunks: DocumentChunk[] = pages
        .filter((p) => p.text?.trim())
        .map((p, index) => ({
          text: p.text,
          pageNumber: parseInt(p.metadata?.page_label ?? `${index + 1}`, 10),
          chunkIndex: index,
        }));

      this.logger.log(
        `Parsed resource: ${resourceId} — ${chunks.length} pages`,
      );
      return { chunks, totalPages: pages.length };
    } catch (err) {
      this.logger.error(
        `Failed to parse document for resource: ${resourceId}`,
        err,
      );
      throw err;
    }
  }
}
