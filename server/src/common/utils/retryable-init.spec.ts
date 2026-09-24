import { RetryableInit } from './retryable-init';

describe('RetryableInit', () => {
  it('shares one in-flight attempt between concurrent callers', async () => {
    const init = jest.fn().mockResolvedValue(undefined);
    const ri = new RetryableInit(init);

    await Promise.all([ri.ensure(), ri.ensure(), ri.ensure()]);

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('caches success', async () => {
    const init = jest.fn().mockResolvedValue(undefined);
    const ri = new RetryableInit(init);

    await ri.ensure();
    await ri.ensure();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('does not cache failure — the next call retries', async () => {
    const init = jest
      .fn()
      .mockRejectedValueOnce(new Error('connect timeout'))
      .mockResolvedValueOnce(undefined);
    const ri = new RetryableInit(init);

    await expect(ri.ensure()).rejects.toThrow('connect timeout');
    await expect(ri.ensure()).resolves.toBeUndefined();

    expect(init).toHaveBeenCalledTimes(2);
  });
});
