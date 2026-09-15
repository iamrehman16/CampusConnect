import { Inject, Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @Inject(aiConfig.KEY) private aiCfg: ConfigType<typeof aiConfig>,
  ) {
    this.genAI = new GoogleGenerativeAI(this.aiCfg.geminiApiKey!);
  }

  async embed(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.aiCfg.models.embedding,
      });

      const result = await model.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType: 'RETRIEVAL_DOCUMENT' as any,
      });

      return result.embedding.values;
    } catch (err) {
      this.logger.error('Failed to generate embedding', err);
      throw err;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.aiCfg.models.embedding,
      });

      const results = await Promise.all(
        texts.map((text) =>
          model.embedContent({
            content: { parts: [{ text }], role: 'user' },
            taskType: 'RETRIEVAL_DOCUMENT' as any,
          }),
        ),
      );

      return results.map((r) => r.embedding.values);
    } catch (err) {
      this.logger.error('Failed to generate batch embeddings', err);
      throw err;
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.aiCfg.models.embedding,
      });

      const result = await model.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType: 'RETRIEVAL_QUERY' as any,
      });

      return result.embedding.values;
    } catch (err) {
      this.logger.error('Failed to generate query embedding', err);
      throw err;
    }
  }
}
