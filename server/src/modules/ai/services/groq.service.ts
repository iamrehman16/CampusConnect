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

  /**
   * Rough chars/4 approximation (BACKLOG.md B9), not an exact tokenizer —
   * Groq serves Llama models, not OpenAI's cl100k, so a GPT-specific
   * tokenizer (e.g. tiktoken) would give a precise count for the wrong
   * vocabulary. This is a safety-net budget, not a billing-accurate one.
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private sumTokens(messages: Groq.Chat.ChatCompletionMessageParam[]): number {
    return messages.reduce(
      (sum, m) =>
        sum +
        this.estimateTokens(typeof m.content === 'string' ? m.content : ''),
      0,
    );
  }

  buildMessages(
    summaryBuffer: string,
    recentMessages: ChatMessage[],
    userQuery: string,
    context: RetrievedContext[],
    memories: MemoryRecall[] = [],
  ): Groq.Chat.ChatCompletionMessageParam[] {
    const mandatory: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];
    if (summaryBuffer) {
      mandatory.push({
        role: 'system',
        content: `Previous conversation summary:\n${summaryBuffer}`,
      });
    }
    const queryMessage: Groq.Chat.ChatCompletionMessageParam = {
      role: 'user',
      content: userQuery,
    };

    // Cross-session memory recall (BACKLOG.md B6) is its own system block,
    // distinct from document-RAG context below — it's a recalled fact from
    // a past conversation, not a citable source, so it must never be
    // conflated with the `context` block into a citation.
    const memoryMessage: Groq.Chat.ChatCompletionMessageParam | null =
      memories.length > 0
        ? {
            role: 'system',
            content: `Relevant memories from your past conversations with this user:\n${memories
              .map((m) => `- ${m.text}`)
              .join(
                '\n',
              )}\n\nUse these only if relevant to the current question. Do not cite them as sources.`,
          }
        : null;

    const contextMessage: Groq.Chat.ChatCompletionMessageParam | null =
      context.length > 0
        ? {
            role: 'system',
            content: `Relevant resources from the campus knowledge base:\n\n${context
              .map(
                (c) => `[Source: ${c.title}, Page ${c.pageNumber}]\n${c.text}`,
              )
              .join(
                '\n\n---\n\n',
              )}\n\nUse this information to answer the question. Do not add citations in your response — they will be appended separately.`,
          }
        : null;

    const historyMessages: Groq.Chat.ChatCompletionMessageParam[] =
      recentMessages.map((m) => ({ role: m.role, content: m.content }));

    return this.assembleWithinBudget(
      mandatory,
      memoryMessage,
      contextMessage,
      historyMessages,
      queryMessage,
    );
  }

  /**
   * Enforces `aiCfg.maxPromptTokens` (BACKLOG.md B9) once B5 (query
   * rewriting) and B6 (cross-session memory) both feed unbounded content
   * into the same assembled prompt. Drop order, lowest priority first:
   * memory recall, then document RAG context, then the oldest recent
   * exchanges — `mandatory` (system prompt + summary) and the current
   * user query are never dropped, since the request would be meaningless
   * without them; if the budget is still exceeded after dropping
   * everything else, it goes out over budget rather than broken.
   * Every drop is logged — no silent truncation.
   */
  private assembleWithinBudget(
    mandatory: Groq.Chat.ChatCompletionMessageParam[],
    memoryMessage: Groq.Chat.ChatCompletionMessageParam | null,
    contextMessage: Groq.Chat.ChatCompletionMessageParam | null,
    historyMessages: Groq.Chat.ChatCompletionMessageParam[],
    queryMessage: Groq.Chat.ChatCompletionMessageParam,
  ): Groq.Chat.ChatCompletionMessageParam[] {
    const budget = this.aiCfg.maxPromptTokens;
    let includeMemory = memoryMessage !== null;
    let includeContext = contextMessage !== null;
    const history = [...historyMessages];

    const assemble = () => [
      ...mandatory,
      ...(includeMemory && memoryMessage ? [memoryMessage] : []),
      ...(includeContext && contextMessage ? [contextMessage] : []),
      ...history,
      queryMessage,
    ];

    let assembled = assemble();
    let tokens = this.sumTokens(assembled);
    if (tokens <= budget) return assembled;

    if (includeMemory) {
      const before = tokens;
      includeMemory = false;
      assembled = assemble();
      tokens = this.sumTokens(assembled);
      this.logger.warn(
        `Prompt token budget exceeded (~${before} > ${budget} tokens) — dropped cross-session memory recall for this turn`,
      );
      if (tokens <= budget) return assembled;
    }

    if (includeContext) {
      const before = tokens;
      includeContext = false;
      assembled = assemble();
      tokens = this.sumTokens(assembled);
      this.logger.warn(
        `Prompt token budget still exceeded (~${before} > ${budget} tokens) after dropping memory — dropped document RAG context for this turn`,
      );
      if (tokens <= budget) return assembled;
    }

    let droppedHistoryCount = 0;
    while (history.length > 0 && this.sumTokens(assemble()) > budget) {
      history.shift(); // oldest exchange first
      droppedHistoryCount++;
    }
    assembled = assemble();
    tokens = this.sumTokens(assembled);
    if (droppedHistoryCount > 0) {
      this.logger.warn(
        `Prompt token budget still exceeded after dropping memory and RAG context — dropped ${droppedHistoryCount} oldest recent message(s) to fit ~${budget} tokens`,
      );
    }
    if (tokens > budget) {
      this.logger.warn(
        `Prompt still ~${tokens} tokens (budget ~${budget}) after dropping all optional content — sending system prompt/summary/query as-is rather than breaking the request`,
      );
    }

    return assembled;
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
