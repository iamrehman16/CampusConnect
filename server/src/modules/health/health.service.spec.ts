import type { Queue } from 'bullmq';
import type { Connection } from 'mongoose';
import type { VectorStoreService } from '../ai/services/vector-store.service';
import type { GroqService } from '../ai/services/groq.service';
import { HealthService } from './health.service';

function build(overrides: {
  mongo?: () => Promise<unknown>;
  redis?: () => Promise<unknown>;
  qdrant?: () => Promise<void>;
  groq?: () => Promise<void>;
}) {
  const ping = jest.fn(overrides.mongo ?? (() => Promise.resolve({ ok: 1 })));
  const redisPing = jest.fn(overrides.redis ?? (() => Promise.resolve('PONG')));
  const qdrantPing = jest.fn(overrides.qdrant ?? (() => Promise.resolve()));
  const groqPing = jest.fn(overrides.groq ?? (() => Promise.resolve()));

  const mongo = { db: { admin: () => ({ ping }) } } as unknown as Connection;
  const queue = {
    client: Promise.resolve({ ping: redisPing }),
  } as unknown as Queue;
  const vectorStore = { ping: qdrantPing } as unknown as VectorStoreService;
  const groq = { ping: groqPing } as unknown as GroqService;

  return {
    service: new HealthService(mongo, queue, vectorStore, groq),
    ping,
    redisPing,
    qdrantPing,
  };
}

describe('HealthService', () => {
  afterEach(() => jest.useRealTimers());

  it('reports ok when every dependency answers', async () => {
    const { service } = build({});

    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.checks.mongo.status).toBe('up');
    expect(report.checks.redis.status).toBe('up');
    expect(report.checks.qdrant.status).toBe('up');
  });

  it('degrades, not fails, when Qdrant is down', async () => {
    const { service } = build({
      qdrant: () => Promise.reject(new Error('ECONNRESET')),
    });

    const report = await service.check();

    expect(report.status).toBe('degraded');
    expect(report.checks.qdrant.status).toBe('down');
    expect(report.checks.mongo.status).toBe('up');
  });

  it('degrades when Groq is unreachable or a configured model was retired', async () => {
    const { service } = build({
      groq: () =>
        Promise.reject(new Error('Groq models not available: llama-3.3-70b')),
    });

    const report = await service.check();

    expect(report.status).toBe('degraded');
    expect(report.checks.groq.status).toBe('down');
    expect(JSON.stringify(report)).not.toContain('llama-3.3-70b');
  });

  it('degrades when Redis is down', async () => {
    const { service } = build({
      redis: () => Promise.reject(new Error('ENOTFOUND')),
    });

    expect((await service.check()).status).toBe('degraded');
  });

  it('is down when MongoDB is unreachable', async () => {
    const { service } = build({
      mongo: () => Promise.reject(new Error('server selection timeout')),
    });

    const report = await service.check();

    expect(report.status).toBe('down');
    expect(report.checks.mongo.status).toBe('down');
  });

  it('does not leak the underlying error message in the report', async () => {
    const { service } = build({
      qdrant: () =>
        Promise.reject(new Error('https://secret-host:6333 refused')),
    });

    expect(JSON.stringify(await service.check())).not.toContain('secret-host');
  });

  it('treats a probe that never answers as down after the timeout', async () => {
    jest.useFakeTimers();
    const { service } = build({ qdrant: () => new Promise<void>(() => {}) });

    const pending = service.check();
    await jest.advanceTimersByTimeAsync(3100);
    const report = await pending;

    expect(report.checks.qdrant.status).toBe('down');
    expect(report.status).toBe('degraded');
  });

  it('reuses a recent result instead of probing again', async () => {
    const { service, qdrantPing } = build({});

    await service.check();
    await service.check();

    expect(qdrantPing).toHaveBeenCalledTimes(1);
  });

  it('live() touches no dependency', () => {
    const { service, ping, redisPing, qdrantPing } = build({});

    expect(service.live().status).toBe('ok');
    expect(ping).not.toHaveBeenCalled();
    expect(redisPing).not.toHaveBeenCalled();
    expect(qdrantPing).not.toHaveBeenCalled();
  });
});
