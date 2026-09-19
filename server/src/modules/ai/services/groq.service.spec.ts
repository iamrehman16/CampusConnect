import Groq from 'groq-sdk';
import { ConfigType } from '@nestjs/config';
import aiConfig from '../config/ai.config';
import { GroqService, GroqServiceError } from './groq.service';

type GroqInternals = { groq: { chat: { completions: { create: jest.Mock } } } };

function buildService(timeoutMs = 30_000) {
  const service = new GroqService({
    groqApiKey: 'test-key',
    models: { reasoning: 'reasoning-model', fast: 'fast-model' },
    groqTimeoutMs: timeoutMs,
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
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Previous conversation summary:'),
          }),
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Recent conversation history:'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('what about that?'),
          }),
        ]),
      }),
      expect.anything(),
    );
  });

  it('contextualizeQuery returns original query if no history', async () => {
    const { service, create } = buildService();

    const result = await service.contextualizeQuery('some query', []);

    expect(result).toBe('some query');
    expect(create).not.toHaveBeenCalled();
  });
});
