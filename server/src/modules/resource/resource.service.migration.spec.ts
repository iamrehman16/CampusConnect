import { Model } from 'mongoose';
import { ResourceService } from './resource.service';
import { ResourceDocument } from './schemas/resource.schema';

function build(modifiedCount: number) {
  const updateMany = jest.fn().mockResolvedValue({ modifiedCount });
  const service = new ResourceService(
    {} as never,
    {} as never,
    {} as never,
    { collection: { updateMany } } as unknown as Model<ResourceDocument>,
    {} as never,
    {} as never,
  );
  const warn = jest
    .spyOn(service['logger'], 'warn')
    .mockImplementation(() => undefined);
  return { service, updateMany, warn };
}

describe('ResourceService#onModuleInit (uploadedBy string -> ObjectId)', () => {
  it('converts only legacy string rows, in one pipeline update', async () => {
    const { service, updateMany } = build(3);

    await service.onModuleInit();

    const [filter, pipeline] = updateMany.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>[],
    ];
    expect(filter).toEqual({ uploadedBy: { $type: 'string' } });
    expect(pipeline[0]).toEqual({
      $set: { uploadedBy: { $toObjectId: '$uploadedBy' } },
    });
  });

  it('says so when it converted something, and stays quiet when there is nothing to do', async () => {
    const converted = build(3);
    await converted.service.onModuleInit();
    expect(converted.warn).toHaveBeenCalledTimes(1);

    const clean = build(0);
    await clean.service.onModuleInit();
    expect(clean.warn).not.toHaveBeenCalled();
  });
});
