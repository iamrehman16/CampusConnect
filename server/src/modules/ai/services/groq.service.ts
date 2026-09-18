import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Groq from 'groq-sdk';
import aiConfig from '../config/ai.config';
import { ChatMessage } from '../interfaces/conversation.interface';
import { RetrievedContext } from '../interfaces/retrieved-context.interface';

const SYSTEM_PROMPT = `You are CampusConnect AI, a helpful academic assistant for university students.
Answer clearly and concisely. If you don't know something, say so honestly.`;

/**
 * Typed error surfaced by every GroqService call site, so callers can
 * distinguish "ask the user to retry" (rate limit / 5xx / timeout) from a
 * non-retryable failure without inspecting the Groq SDK's error hierarchy.
 */
export class GroqServiceError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly retryable: boolean,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'GroqServiceError';
  }
}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || (status !== undefined && status >= 500);
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly groq: Groq;

  constructor(
    @Inject(aiConfig.KEY) private aiCfg: ConfigType<typeof aiConfig>,
  ) {
    this.groq = new Groq({ apiKey: this.aiCfg.groqApiKey });
  }

  private handleGroqError(operation: string, err: unknown): never {
    const status: number | undefined =
      err instanceof Groq.APIError && typeof err.status === 'number'
        ? err.status
        : undefined;
    const retryable = isRetryableStatus(status);

    this.logger.error(
      `Groq call failed [${operation}]${status ? ` (status ${status})` : ''}: ${
        err instanceof Error ? err.message : String(err)
      }`,
      err instanceof Error ? err.stack : undefined,
    );

    throw new GroqServiceError(
      retryable
        ? 'The AI service is temporarily unavailable. Please try again.'
        : 'The AI service failed to process this request.',
      operation,
      retryable,
      err,
    );
  }

  buildMessages(
    summaryBuffer: string,
    recentMessages: ChatMessage[],
    userQuery: string,
    context: RetrievedContext[],
  ): Groq.Chat.ChatCompletionMessageParam[] {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    if (summaryBuffer) {
      messages.push({
        role: 'system',
        content: `Previous conversation summary:\n${summaryBuffer}`,
      });
    }

    if (context.length > 0) {
      const contextBlock = context
        .map((c) => `[Source: ${c.title}, Page ${c.pageNumber}]\n${c.text}`)
        .join('\n\n---\n\n');

      messages.push({
        role: 'system',
        content: `Relevant resources from the campus knowledge base:\n\n${contextBlock}\n\nUse this information to answer the question. Do not add citations in your response — they will be appended separately.`,
      });
    }

    messages.push(
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    );
    messages.push({ role: 'user', content: userQuery });

    return messages;
  }

  async generateResponse(
    messages: Groq.Chat.ChatCompletionMessageParam[],
  ): Promise<string> {
    try {
      const response = await this.groq.chat.completions.create(
        { messages, model: this.aiCfg.models.reasoning },
        { timeout: this.aiCfg.groqTimeoutMs },
      );
      return response.choices[0]?.message?.content || '';
    } catch (err) {
      this.handleGroqError('generateResponse', err);
    }
  }

  async summarize(content: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create(
        {
          messages: [
            { role: 'system', content: 'You are a concise summarizer.' },
            { role: 'user', content },
          ],
          model: this.aiCfg.models.fast,
        },
        { timeout: this.aiCfg.groqTimeoutMs },
      );
      return completion.choices[0]?.message?.content || '';
    } catch (err) {
      this.handleGroqError('summarize', err);
    }
  }

  async generateStream(
    messages: Groq.Chat.ChatCompletionMessageParam[],
  ): Promise<AsyncIterable<Groq.Chat.ChatCompletionChunk>> {
    try {
      return await this.groq.chat.completions.create(
        { messages, model: this.aiCfg.models.reasoning, stream: true },
        { timeout: this.aiCfg.groqTimeoutMs },
      );
    } catch (err) {
      this.handleGroqError('generateStream', err);
    }
  }
}
