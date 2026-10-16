import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PushSubscriptionDto } from './push-subscription.dto';

const browserJson = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  expirationTime: null,
  keys: { p256dh: 'p', auth: 'a' },
};

const errorsFor = async (body: object) =>
  validate(plainToInstance(PushSubscriptionDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('PushSubscriptionDto', () => {
  it("accepts the browser's PushSubscription.toJSON() shape as-is", async () => {
    expect(await errorsFor(browserJson)).toEqual([]);
  });

  it('rejects a non-https endpoint and missing keys', async () => {
    const errors = await errorsFor({ endpoint: 'http://fcm.googleapis.com/x' });
    expect(errors.map((e) => e.property).sort()).toEqual(['endpoint', 'keys']);
  });
});
