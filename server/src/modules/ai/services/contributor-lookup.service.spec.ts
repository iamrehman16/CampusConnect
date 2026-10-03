import { Model, Types } from 'mongoose';
import { ContributorLookupService } from './contributor-lookup.service';
import { ResourceDocument } from '../../resource/schemas/resource.schema';
import { ReputationTier } from '../../reputation/tiers';

function findChain(result: unknown, reject = false) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: reject
      ? jest.fn().mockRejectedValue(result)
      : jest.fn().mockResolvedValue(result),
  };
  return chain;
}

function build(chain: ReturnType<typeof findChain>) {
  const find = jest.fn().mockReturnValue(chain);
  const service = new ContributorLookupService({
    find,
  } as unknown as Model<ResourceDocument>);
  return { service, find };
}

describe('ContributorLookupService', () => {
  it('resolves every uploader with a single batched query', async () => {
    const r1 = new Types.ObjectId();
    const r2 = new Types.ObjectId();
    const u1 = new Types.ObjectId();
    const chain = findChain([
      {
        _id: r1,
        uploadedBy: { _id: u1, name: 'Ayesha', tier: ReputationTier.STAR },
      },
      { _id: r2, uploadedBy: null },
    ]);
    const { service, find } = build(chain);

    const result = await service.resolve([r1.toString(), r2.toString()]);

    expect(find).toHaveBeenCalledTimes(1);
    expect(result.get(r1.toString())).toEqual({
      id: u1.toString(),
      name: 'Ayesha',
      avatar: undefined,
      tier: ReputationTier.STAR,
    });
    expect(result.has(r2.toString())).toBe(false);
  });

  it('does not query when there is nothing cited', async () => {
    const { service, find } = build(findChain([]));

    expect((await service.resolve([])).size).toBe(0);
    expect(find).not.toHaveBeenCalled();
  });

  it('logs and degrades to no contributors when the lookup fails', async () => {
    const { service } = build(findChain(new Error('mongo down'), true));
    const logged = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => undefined);

    const result = await service.resolve([new Types.ObjectId().toString()]);

    expect(result.size).toBe(0);
    expect(logged).toHaveBeenCalledTimes(1);
  });
});
