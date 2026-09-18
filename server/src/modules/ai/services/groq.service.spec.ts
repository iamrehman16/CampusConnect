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
});
