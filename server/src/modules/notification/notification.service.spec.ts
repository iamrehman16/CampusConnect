import { Model, Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationDocument } from './schema/notification.schema';
import { NotificationType } from './enums/notification-type.enum';
import { PaginationService } from '../../common/services/pagination.service';

function leanChain(result: unknown) {
  return {
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
}

function doc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(),
    type: NotificationType.NEW_MESSAGE,
    title: 'Sara',
    body: 'hi',
    link: '/chat/c1',
    count: 1,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function build(model: Record<string, unknown>) {
  return new NotificationService(
    model as unknown as Model<NotificationDocument>,
    {} as PaginationService,
  );
}

const userId = new Types.ObjectId().toString();

describe('NotificationService#record', () => {
  it('creates a plain notification for types without a dedupeKey', async () => {
    const created = doc({ type: NotificationType.RESOURCE_APPROVED });
    const model = {
      create: jest.fn().mockResolvedValue({ toObject: () => created }),
      findOneAndUpdate: jest.fn(),
    };

    const dto = await build(model).record(
      userId,
      NotificationType.RESOURCE_APPROVED,
      { resourceId: 'r1', title: 'Notes' },
    );

    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.RESOURCE_APPROVED,
        link: '/resources/r1',
      }),
    );
    expect(dto.id).toBe(created._id.toString());
  });

  it('groups message notifications by conversation via an unread upsert that increments count', async () => {
    const grouped = doc({ count: 3 });
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue(leanChain(grouped)),
    };

    const dto = await build(model).record(
      userId,
      NotificationType.NEW_MESSAGE,
      {
        conversationId: 'c1',
        senderName: 'Sara',
        preview: 'hi',
      },
    );

    const [filter, update, options] = model.findOneAndUpdate.mock.calls[0] as [
      Record<string, unknown>,
      Record<string, unknown>,
      unknown,
    ];
    expect(filter).toMatchObject({
      dedupeKey: 'new_message:c1',
      isRead: false,
    });
    expect(update).toMatchObject({ $inc: { count: 1 } });
    expect(options).toMatchObject({ upsert: true, new: true });
    expect(dto.count).toBe(3);
  });

  it('retries as a plain update when the upsert loses a race on the unique unread index', async () => {
    const winner = doc({ count: 2 });
    const model = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnThis(),
          exec: jest
            .fn()
            .mockRejectedValue(
              Object.assign(new Error('E11000'), { code: 11000 }),
            ),
        })
        .mockReturnValueOnce(leanChain(winner)),
    };

    const dto = await build(model).record(
      userId,
      NotificationType.NEW_MESSAGE,
      {
        conversationId: 'c1',
        senderName: 'Sara',
        preview: 'hi',
      },
    );

    expect(model.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(dto.count).toBe(2);
  });

  it('rethrows non-duplicate-key errors instead of swallowing them', async () => {
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('mongo down')),
      }),
    };

    await expect(
      build(model).record(userId, NotificationType.NEW_MESSAGE, {
        conversationId: 'c1',
        senderName: 'Sara',
        preview: 'hi',
      }),
    ).rejects.toThrow('mongo down');
  });
});

describe('NotificationService#markRead', () => {
  it('scopes the update to the caller so others cannot mark it', async () => {
    const model = {
      findOneAndUpdate: jest.fn().mockReturnValue(leanChain(null)),
    };
    const id = new Types.ObjectId().toString();

    await expect(build(model).markRead(userId, id)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const [filter] = model.findOneAndUpdate.mock.calls[0] as [
      { _id: Types.ObjectId; user: Types.ObjectId },
    ];
    expect(filter.user.toString()).toBe(userId);
    expect(filter._id.toString()).toBe(id);
  });
});
