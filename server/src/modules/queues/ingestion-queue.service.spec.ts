// ESM-only node-fetch (via DocumentParserService) can't load under Jest.
jest.mock('../ai/services/ingestion.service', () => ({
  IngestionService: class {},
}));

import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { IngestionService } from '../ai/services/ingestion.service';
import type { ResourceDocument } from '../resource/schemas/resource.schema';
import { IngestionStatus } from '../resource/enums/ingestion-status.enum';
import {
  INGESTION_BACKOFF_BASE_MS,
  INGESTION_CONCURRENCY,
  INGESTION_MAX_ATTEMPTS,
  IngestionQueueService,
} from './ingestion-queue.service';
import type { IngestResourceJobPayload } from './interfaces/ingest-resource-job.interface';

const payload = (id: string): IngestResourceJobPayload => ({
  resourceId: id,
  fileUrl: 'https://f',
  fileType: 'pdf',
  cloudinaryResourceType: 'raw',
  title: 't',
  subject: 's',
  course: 'c',
  semester: 1,
  resourceType: 'Notes',
});

const execChain = <T>(value: T) => ({
  lean: () => ({ exec: () => Promise.resolve(value) }),
  exec: () => Promise.resolve(value),
});

function build(ingest: jest.Mock) {
  const updateOne = jest.fn(() => execChain(undefined));
  const find = jest.fn(() => execChain([] as unknown[]));
  const findOneAndUpdate = jest.fn(() => execChain(null as unknown));
  const model = { updateOne, find, findOneAndUpdate };
  const service = new IngestionQueueService(
    model as unknown as Model<ResourceDocument>,
    { ingest } as unknown as IngestionService,
  );
  const statuses = (id: string) =>
    (
      updateOne.mock.calls as unknown as [
        { _id: string },
        Record<string, unknown>,
      ][]
    )
      .filter(([q]) => q._id === id)
      .map(([, u]) => u.ingestionStatus);
  return { service, model, updateOne, find, findOneAndUpdate, statuses };
}

const flush = () => jest.advanceTimersByTimeAsync(0);

describe('IngestionQueueService', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('ingests a job and marks it processing then done', async () => {
    const ingest = jest.fn().mockResolvedValue(undefined);
    const { service, statuses } = build(ingest);

    service.enqueue(payload('a'));
    await flush();

    expect(ingest).toHaveBeenCalledWith(payload('a'));
    expect(statuses('a')).toEqual([
      IngestionStatus.PROCESSING,
      IngestionStatus.DONE,
    ]);
  });

  it('runs at most INGESTION_CONCURRENCY jobs at once', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const ingest = jest.fn(() => gate);
    const { service } = build(ingest);

    ['a', 'b', 'c', 'd'].forEach((id) => service.enqueue(payload(id)));
    await flush();
    expect(ingest).toHaveBeenCalledTimes(INGESTION_CONCURRENCY);

    release();
    await flush();
    expect(ingest).toHaveBeenCalledTimes(4);
  });

  it('ignores a resource that is already queued', async () => {
    const ingest = jest.fn().mockResolvedValue(undefined);
    const { service } = build(ingest);

    service.enqueue(payload('a'));
    service.enqueue(payload('a'));
    await flush();

    expect(ingest).toHaveBeenCalledTimes(1);
  });

  it('retries with exponential backoff, then marks the resource failed', async () => {
    const ingest = jest.fn().mockRejectedValue(new Error('LlamaParse down'));
    const { service, updateOne, statuses } = build(ingest);
    jest.spyOn(service['logger'], 'error').mockImplementation();

    service.enqueue(payload('a'));
    await flush();
    expect(ingest).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(INGESTION_BACKOFF_BASE_MS - 1);
    expect(ingest).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(ingest).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(INGESTION_BACKOFF_BASE_MS * 2);
    expect(ingest).toHaveBeenCalledTimes(INGESTION_MAX_ATTEMPTS);

    await flush();
    expect(statuses('a').at(-1)).toBe(IngestionStatus.FAILED);
    expect(updateOne).toHaveBeenLastCalledWith(
      { _id: 'a' },
      expect.objectContaining({ ingestionError: 'LlamaParse down' }),
    );
  });

  it('re-queues pending and processing resources at boot', async () => {
    const ingest = jest.fn().mockResolvedValue(undefined);
    const { service, find } = build(ingest);
    const id = new Types.ObjectId();
    find.mockReturnValue(
      execChain([{ ...payload('x'), _id: id }]) as unknown as ReturnType<
        typeof find
      >,
    );

    await service.onApplicationBootstrap();
    await flush();

    expect(ingest).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: id.toString() }),
    );
  });

  it('retryFailed re-queues a failed resource and reports false otherwise', async () => {
    const ingest = jest.fn().mockResolvedValue(undefined);
    const { service, findOneAndUpdate } = build(ingest);

    expect(await service.retryFailed('nope')).toBe(false);

    const id = new Types.ObjectId();
    findOneAndUpdate.mockReturnValue(
      execChain({ ...payload('x'), _id: id }) as unknown as ReturnType<
        typeof findOneAndUpdate
      >,
    );
    expect(await service.retryFailed(id.toString())).toBe(true);
    await flush();
    expect(ingest).toHaveBeenCalledTimes(1);
  });

  it('stops taking work on shutdown and waits for in-flight jobs', async () => {
    let release!: () => void;
    const ingest = jest.fn(() => new Promise<void>((r) => (release = r)));
    const { service } = build(ingest);

    service.enqueue(payload('a'));
    await flush();
    const shutdown = service.onApplicationShutdown();
    service.enqueue(payload('b'));
    release();
    await shutdown;

    expect(ingest).toHaveBeenCalledTimes(1);
  });
});
