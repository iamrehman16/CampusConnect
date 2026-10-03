import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { BlockService } from './block.service';
import { UserBlockDocument } from './schema/user-block.schema';
import { UserService } from '../user/user.service';

const exec = <T>(v: T) => ({ exec: jest.fn().mockResolvedValue(v) });

function build(model: Record<string, jest.Mock>, findOne = jest.fn()) {
  return new BlockService(
    model as unknown as Model<UserBlockDocument>,
    { findOne } as unknown as UserService,
  );
}

const a = new Types.ObjectId().toString();
const b = new Types.ObjectId().toString();

describe('BlockService', () => {
  it("can't block yourself", async () => {
    const create = jest.fn();
    await expect(build({ create }).block(a, a)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('is idempotent: a duplicate-key error on re-block is success', async () => {
    const create = jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));

    await expect(
      build({ create }, jest.fn().mockResolvedValue({})).block(a, b),
    ).resolves.toBeUndefined();
  });

  it('rethrows any other storage error instead of swallowing it', async () => {
    const create = jest.fn().mockRejectedValue(new Error('mongo down'));

    await expect(
      build({ create }, jest.fn().mockResolvedValue({})).block(a, b),
    ).rejects.toThrow('mongo down');
  });

  it('checks both directions when asking whether two users are blocked', async () => {
    const exists = jest.fn().mockReturnValue(exec({ _id: 1 }));
    const service = build({ exists });

    expect(await service.isBlockedEitherWay(a, b)).toBe(true);
    const [filter] = exists.mock.calls[0] as [{ $or: unknown[] }];
    expect(filter.$or).toHaveLength(2);
  });

  it('assertCanContact passes when nobody blocked anybody', async () => {
    const service = build({ exists: jest.fn().mockReturnValue(exec(null)) });

    await expect(service.assertCanContact(a, b)).resolves.toBeUndefined();
  });

  it('assertCanContact refuses with a neutral message that does not say who blocked', async () => {
    const service = build({
      exists: jest.fn().mockReturnValue(exec({ _id: 1 })),
    });

    const err = await service.assertCanContact(a, b).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ForbiddenException);
    expect((err as Error).message).toBe("You can't contact this user");
  });

  it('unblock removes only the caller-to-target row', async () => {
    const deleteOne = jest.fn().mockReturnValue(exec({}));
    await build({ deleteOne }).unblock(a, b);

    const [filter] = deleteOne.mock.calls[0] as [
      { blocker: Types.ObjectId; blocked: Types.ObjectId },
    ];
    expect(filter.blocker.toString()).toBe(a);
    expect(filter.blocked.toString()).toBe(b);
  });

  it('blockedIdsFor returns the other party in both directions', async () => {
    const me = a;
    const iBlocked = new Types.ObjectId();
    const blockedMe = new Types.ObjectId();
    const find = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { blocker: new Types.ObjectId(me), blocked: iBlocked },
        { blocker: blockedMe, blocked: new Types.ObjectId(me) },
      ]),
    });

    const ids = await build({ find }).blockedIdsFor(me);

    expect([...ids].sort()).toEqual(
      [iBlocked.toString(), blockedMe.toString()].sort(),
    );
  });
});
