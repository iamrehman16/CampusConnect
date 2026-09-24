import Groq from 'groq-sdk';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import { GroqService, GroqServiceError } from './groq.service';

type GroqInternals = { groq: { chat: { completions: { create: jest.Mock } } } };

function buildService(timeoutMs = 30_000, maxPromptTokens = 6000) {
  const service = new GroqService({
    groqApiKey: 'test-key',
    models: { reasoning: 'reasoning-model', fast: 'fast-model' },
    groqTimeoutMs: timeoutMs,
    maxPromptTokens,
  } as ConfigType<typeof aiConfig>);

  const create = jest.fn();
  (service as unknown as GroqInternals).groq = {
    chat: { completions: { create } },
  };

  return { service, create };
}

function rateLimitError() {
  return new Groq.RateLimitError(
    429,
    { message: 'rate limited' },
    'rate limited',
    new Headers(),
  );
}

function badRequestError() {
  return new Groq.BadRequestError(
    400,
    { message: 'bad request' },
    'bad request',
    new Headers(),
  );
}

describe('GroqService', () => {
  it('generateResponse returns content and passes the configured timeout', async () => {
    const { service, create } = buildService(15_000);
    create.mockResolvedValue({
      choices: [{ message: { content: 'hello' } }],
    });

    const result = await service.generateResponse([]);

    expect(result).toBe('hello');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'reasoning-model' }),
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it('generateResponse wraps a 429 as a retryable GroqServiceError', async () => {
    const { service, create } = buildService();
    create.mockRejectedValue(rateLimitError());

    await expect(service.generateResponse([])).rejects.toMatchObject({
      name: 'GroqServiceError',
      operation: 'generateResponse',
      retryable: true,
    } satisfies Partial<GroqServiceError>);
  });

  it('generateResponse wraps a 400 as a non-retryable GroqServiceError', async () => {
    const { service, create } = buildService();
    create.mockRejectedValue(badRequestError());

    await expect(service.generateResponse([])).rejects.toMatchObject({
      name: 'GroqServiceError',
      operation: 'generateResponse',
      retryable: false,
    } satisfies Partial<GroqServiceError>);
  });

  it('summarize wraps failures as a GroqServiceError instead of an unhandled rejection', async () => {
    const { service, create } = buildService();
    create.mockRejectedValue(new Error('network blip'));

    await expect(service.summarize('some content')).rejects.toBeInstanceOf(
      GroqServiceError,
    );
  });

  it('generateTitle returns trimmed content and uses the fast model', async () => {
    const { service, create } = buildService();
    create.mockResolvedValue({
      choices: [{ message: { content: '  Campus Wifi Setup Help  ' } }],
    });

    const result = await service.generateTitle('how do I connect to wifi');

    expect(result).toBe('Campus Wifi Setup Help');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'fast-model' }),
      expect.anything(),
    );
  });

  it('generateTitle wraps failures as a GroqServiceError instead of an unhandled rejection', async () => {
    const { service, create } = buildService();
    create.mockRejectedValue(new Error('network blip'));

    await expect(service.generateTitle('hi')).rejects.toBeInstanceOf(
      GroqServiceError,
    );
  });

  it('generateStream wraps a 5xx as a retryable GroqServiceError', async () => {
    const { service, create } = buildService();
    create.mockRejectedValue(
      new Groq.InternalServerError(
        503,
        { message: 'unavailable' },
        'unavailable',
        new Headers(),
      ),
    );

    await expect(service.generateStream([])).rejects.toMatchObject({
      name: 'GroqServiceError',
      operation: 'generateStream',
      retryable: true,
    } satisfies Partial<GroqServiceError>);
  });

  it('contextualizeQuery returns the refined query using history', async () => {
    const { service, create } = buildService();
    create.mockResolvedValue({
      choices: [
        { message: { content: 'What is the recommended textbook for CS101?' } },
      ],
    });

    const result = await service.contextualizeQuery(
      'what about that?',
      [
        {
          role: 'user',
          content: 'What course is CS101?',
          timestamp: new Date(),
        },
        {
          role: 'assistant',
          content: 'It is Introduction to Programming.',
          timestamp: new Date(),
        },
      ],
      'User asked about CS101 course content.',
    );

    expect(result).toBe('What is the recommended textbook for CS101?');
    const [body] = create.mock.calls[0] as [
      { messages: { role: string; content: string }[] },
    ];
    const has = (role: string, text: string) =>
      body.messages.some((m) => m.role === role && m.content.includes(text));
    expect(has('system', 'Previous conversation summary:')).toBe(true);
    expect(has('system', 'Recent conversation history:')).toBe(true);
    expect(has('user', 'what about that?')).toBe(true);
  });

  it('contextualizeQuery returns original query if no history', async () => {
    const { service, create } = buildService();

    const result = await service.contextualizeQuery('some query', []);

    expect(result).toBe('some query');
    expect(create).not.toHaveBeenCalled();
  });
});

describe('GroqService#buildMessages — token budget (B9)', () => {
  function contextOf(charCount: number) {
    return [
      {
        text: 'x'.repeat(charCount),
        pageNumber: 1,
        title: 'Doc',
        resourceId: 'r1',
        semester: 1,
        course: 'CS101',
        score: 0.9,
      },
    ];
  }

  function memoriesOf(charCount: number) {
    return [
      {
        text: 'y'.repeat(charCount),
        conversationId: 'c1',
        score: 0.9,
        createdAt: new Date(),
      },
    ];
  }

  it('keeps memory, RAG context, and history when everything fits the budget', () => {
    const { service } = buildService(30_000, 6000);

    const messages = service.buildMessages(
      '',
      [{ role: 'user', content: 'hi', timestamp: new Date() }],
      'question',
      contextOf(100),
      memoriesOf(100),
    );

    expect(
      messages.some((m) => (m.content as string).includes('Relevant memories')),
    ).toBe(true);
    expect(
      messages.some((m) =>
        (m.content as string).includes('campus knowledge base'),
      ),
    ).toBe(true);
    expect(messages.some((m) => m.role === 'user' && m.content === 'hi')).toBe(
      true,
    );
  });

  it('drops memory recall first when over budget, keeping RAG context and history', () => {
    const { service } = buildService(30_000, 200); // tiny budget, char/4 estimator

    const messages = service.buildMessages(
      '',
      [],
      'question',
      contextOf(50),
      memoriesOf(2000), // large enough alone to blow the budget
    );

    expect(
      messages.some((m) => (m.content as string).includes('Relevant memories')),
    ).toBe(false);
    expect(
      messages.some((m) =>
        (m.content as string).includes('campus knowledge base'),
      ),
    ).toBe(true);
  });

  it('drops RAG context next if dropping memory alone is not enough', () => {
    const { service } = buildService(30_000, 100);

    const messages = service.buildMessages(
      '',
      [],
      'question',
      contextOf(2000),
      memoriesOf(2000),
    );

    expect(
      messages.some((m) => (m.content as string).includes('Relevant memories')),
    ).toBe(false);
    expect(
      messages.some((m) =>
        (m.content as string).includes('campus knowledge base'),
      ),
    ).toBe(false);
  });

  it('trims the oldest recent messages last, after memory and context are already dropped', () => {
    const { service } = buildService(30_000, 60);
    const recentMessages = [
      { role: 'user' as const, content: 'a'.repeat(80), timestamp: new Date() },
      { role: 'assistant' as const, content: 'oldest', timestamp: new Date() },
      { role: 'user' as const, content: 'b'.repeat(80), timestamp: new Date() },
      { role: 'assistant' as const, content: 'newest', timestamp: new Date() },
    ];

    const messages = service.buildMessages(
      '',
      recentMessages,
      'question',
      contextOf(200),
      memoriesOf(200),
    );

    // Oldest pair dropped first; the newest exchange survives longer.
    expect(messages.some((m) => m.content === 'oldest')).toBe(false);
  });

  it('never drops the system prompt or the current user query, even far over budget', () => {
    const { service } = buildService(30_000, 10);

    const messages = service.buildMessages(
      '',
      [{ role: 'user', content: 'z'.repeat(500), timestamp: new Date() }],
      'the actual question',
      contextOf(500),
      memoriesOf(500),
    );

    expect(messages[0].role).toBe('system');
    expect(messages[messages.length - 1]).toEqual({
      role: 'user',
      content: 'the actual question',
    });
  });
});
