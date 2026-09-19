import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Groq from 'groq-sdk';
import aiConfig from '../config/ai.config';
import { ChatMessage } from '../interfaces/conversation.interface';
import {
  MemoryRecall,
  RetrievedContext,
} from '../interfaces/retrieved-context.interface';

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
    memories: MemoryRecall[] = [],
  ): Groq.Chat.ChatCompletionMessageParam[] {
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [];

    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    if (summaryBuffer) {
      messages.push({
        role: 'system',
        content: `Previous conversation summary:\n${summaryBuffer}`,
      });
    }

    // Cross-session memory recall (BACKLOG.md B6) is injected as its own
    // system block, distinct from document-RAG context below — it's a
    // recalled fact from a past conversation, not a citable source, so it
    // must never be conflated with the `context` block into a citation.
    if (memories.length > 0) {
      const memoryBlock = memories.map((m) => `- ${m.text}`).join('\n');
      messages.push({
        role: 'system',
        content: `Relevant memories from your past conversations with this user:\n${memoryBlock}\n\nUse these only if relevant to the current question. Do not cite them as sources.`,
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

  /**
   * Short (3-6 word) thread title from the first user message, generated
   * with the same fast/cheap model used for summary compression
   * (CLAUDE.md §4). Caller (ConversationService#maybeGenerateTitle) treats
   * a thrown GroqServiceError as non-fatal and falls back to a default —
   * this is a nice-to-have side effect, never on the chat-response
   * critical path (BACKLOG.md B4).
   */
  async generateTitle(userMessage: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create(
        {
          messages: [
            {
              role: 'system',
              content:
                "Generate a short, specific title (3-6 words) summarizing what this conversation is about, based on the user's message. Return only the title text — no quotes, no trailing punctuation, no preamble.",
            },
            { role: 'user', content: userMessage },
          ],
          model: this.aiCfg.models.fast,
        },
        { timeout: this.aiCfg.groqTimeoutMs },
      );
      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      this.handleGroqError('generateTitle', err);
    }
  }

  /**
   * Refines a follow-up user query using conversation history (if any)
   * into a self-contained query suitable for vector store search.
   * If there is no history, or the LLM call fails, falls back gracefully to original query.
   */
  async contextualizeQuery(
    userQuery: string,
    recentMessages: ChatMessage[],
    summaryBuffer?: string,
  ): Promise<string> {
    if (recentMessages.length === 0 && !summaryBuffer) {
      return userQuery;
    }

    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are an expert search-query refiner. Given the recent conversation history (including recent messages and/or a summary buffer) and a follow-up user query, rewrite the query to be a self-contained, descriptive search query suitable for vector search.
It must include all necessary context from previous messages (such as resolving pronouns like 'it', 'they', 'this', 'that' to their actual referents) without losing the original search intent.
Do not generate explanations, introduction, markdown, quotes, or preamble. Return ONLY the refined, self-contained search query.`,
        },
      ];

      if (summaryBuffer) {
        messages.push({
          role: 'system',
          content: `Previous conversation summary:\n${summaryBuffer}`,
        });
      }

      if (recentMessages.length > 0) {
        const historyText = recentMessages
          .map(
            (m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`,
          )
          .join('\n');
        messages.push({
          role: 'system',
          content: `Recent conversation history:\n${historyText}`,
        });
      }

      messages.push({
        role: 'user',
        content: `Follow-up user query to rewrite: ${userQuery}`,
      });

      const completion = await this.groq.chat.completions.create(
        {
          messages,
          model: this.aiCfg.models.fast,
        },
        { timeout: this.aiCfg.groqTimeoutMs },
      );

      const refined = completion.choices[0]?.message?.content?.trim() || '';
      if (refined) {
        this.logger.debug(
          `Contextualized query: "${userQuery}" -> "${refined}"`,
        );
        return refined;
      }
      return userQuery;
    } catch (err) {
      this.logger.error(
        `Failed to contextualize query: ${
          err instanceof Error ? err.message : String(err)
        }. Falling back to original query.`,
      );
      return userQuery;
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
