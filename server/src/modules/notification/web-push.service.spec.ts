import { BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import {
  WebPushService,
  isAllowedPushEndpoint,
  toPushPayload,
} from './web-push.service';
import { PushSubscriptionDocument } from './schema/push-subscription.schema';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationDto } from './dto/notification.dto';

jest.mock('web-push', () => {
  const actual = jest.requireActual<typeof webpush>('web-push');
  return {
    ...actual,
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  };
});
const sendNotification = webpush.sendNotification as jest.MockedFunction<
  typeof webpush.sendNotification
>;

const FCM = 'https://fcm.googleapis.com/fcm/send/abc';

function notification(
  overrides: Partial<NotificationDto> = {},
): NotificationDto {
  return {
    id: 'n1',
    type: NotificationType.NEW_MESSAGE,
    title: 'Sara',
    body: 'hey',
    link: '/chat/c1',
    count: 1,
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function build(opts: { enabled?: boolean; subs?: unknown[] } = {}) {
  const model = {
    updateOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
    deleteOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(opts.subs ?? []),
    }),
  };
  const enabled = opts.enabled ?? true;
  const service = new WebPushService(
    model as unknown as Model<PushSubscriptionDocument>,
    {
      enabled,
      publicKey: enabled ? 'pub' : undefined,
      privateKey: enabled ? 'priv' : undefined,
      subject: enabled ? 'mailto:a@example.com' : undefined,
    },
  );
  service.onModuleInit();
  return { service, model };
}

beforeEach(() => sendNotification.mockReset());

describe('isAllowedPushEndpoint', () => {
  it.each([
    FCM,
    'https://updates.push.services.mozilla.com/wpush/v2/x',
    'https://web.push.apple.com/QH',
    'https://wns2-par02p.notify.windows.com/w/?token=x',
  ])('accepts the browser push service %s', (url) => {
    expect(isAllowedPushEndpoint(url)).toBe(true);
  });

  it.each([
    'https://169.254.169.254/latest/meta-data',
    'https://fcm.googleapis.com.evil.com/x',
    'https://localhost:3100/api',
    'not a url',
  ])('rejects %s so the server cannot be aimed at arbitrary hosts', (url) => {
    expect(isAllowedPushEndpoint(url)).toBe(false);
  });
});

describe('toPushPayload', () => {
  it('shows the grouped count and tags by type+link so the OS replaces it', () => {
    expect(toPushPayload(notification({ count: 3 }))).toEqual({
      title: 'Sara (3)',
      body: 'hey',
      link: '/chat/c1',
      tag: 'new_message:/chat/c1',
    });
  });
});

describe('WebPushService', () => {
  const userId = new Types.ObjectId();
  const sub = (endpoint = FCM) => ({
    _id: new Types.ObjectId(),
    user: userId,
    endpoint,
    p256dh: 'p',
    auth: 'a',
  });

  it('hides the public key when push is not configured', () => {
    expect(build({ enabled: false }).service.publicKey()).toEqual({
      publicKey: null,
    });
  });

  it('refuses endpoints outside the known push services', async () => {
    const { service, model } = build();

    await expect(
      service.subscribe(userId.toString(), {
        endpoint: 'https://internal.example.com/hook',
        keys: { p256dh: 'p', auth: 'a' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it('upserts by endpoint so a shared browser follows the signed-in user', async () => {
    const { service, model } = build();

    await service.subscribe(userId.toString(), {
      endpoint: FCM,
      keys: { p256dh: 'p', auth: 'a' },
    });

    expect(model.updateOne).toHaveBeenCalledWith(
      { endpoint: FCM },
      { $set: { user: userId, p256dh: 'p', auth: 'a' } },
      { upsert: true },
    );
  });

  it('sends nothing and queries nothing when disabled', async () => {
    const { service, model } = build({ enabled: false });

    await service.send([
      { userId: userId.toString(), notification: notification() },
    ]);

    expect(model.find).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('delivers to every subscription of the user', async () => {
    const { service } = build({ subs: [sub(), sub(`${FCM}2`)] });
    sendNotification.mockResolvedValue({
      statusCode: 201,
      body: '',
      headers: {},
    });

    await service.send([
      { userId: userId.toString(), notification: notification() },
    ]);

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: FCM, keys: { p256dh: 'p', auth: 'a' } },
      JSON.stringify(toPushPayload(notification())),
      expect.objectContaining({ TTL: expect.any(Number) as number }),
    );
  });

  it('deletes a subscription the push service reports as gone', async () => {
    const expired = sub();
    const { service, model } = build({ subs: [expired] });
    sendNotification.mockRejectedValue(
      new webpush.WebPushError('Gone', 410, {}, '', FCM),
    );

    await service.send([
      { userId: userId.toString(), notification: notification() },
    ]);

    expect(model.deleteOne).toHaveBeenCalledWith({ _id: expired._id });
  });

  it('keeps the subscription and resolves on a transient failure', async () => {
    const { service, model } = build({ subs: [sub()] });
    sendNotification.mockRejectedValue(
      new webpush.WebPushError('Unavailable', 503, {}, '', FCM),
    );

    await expect(
      service.send([
        { userId: userId.toString(), notification: notification() },
      ]),
    ).resolves.toBeUndefined();
    expect(model.deleteOne).not.toHaveBeenCalled();
  });
});
