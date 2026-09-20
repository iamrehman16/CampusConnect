import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NotificationQueryDto } from './notification-query.dto';

// Same options as main.ts. `enableImplicitConversion` would otherwise turn the
// query string 'false' into boolean true (Boolean('false')).
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});
const run = (q: Record<string, unknown>) =>
  pipe.transform(q, {
    type: 'query',
    metatype: NotificationQueryDto,
  }) as Promise<NotificationQueryDto>;

describe('NotificationQueryDto.unreadOnly', () => {
  it.each([
    ['true', true],
    ['false', false],
  ])("parses '%s' as %s", async (raw, expected) => {
    expect((await run({ unreadOnly: raw })).unreadOnly).toBe(expected);
  });

  it('is left undefined when omitted', async () => {
    expect((await run({})).unreadOnly).toBeUndefined();
  });
});
