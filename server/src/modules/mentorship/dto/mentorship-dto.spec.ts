import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { MentorshipQueryDto } from './mentorship-query.dto';
import { CreateMentorshipDto } from './create-mentorship.dto';

// Same options as main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});
const query = (q: Record<string, unknown>) =>
  pipe.transform(q, {
    type: 'query',
    metatype: MentorshipQueryDto,
  }) as Promise<MentorshipQueryDto>;
const body = (b: Record<string, unknown>) =>
  pipe.transform(b, { type: 'body', metatype: CreateMentorshipDto });

describe('MentorshipQueryDto', () => {
  it('requires the viewpoint', async () => {
    await expect(query({})).rejects.toThrow();
    await expect(query({ as: 'admin' })).rejects.toThrow();
  });

  it('parses comma-separated statuses into an array', async () => {
    const dto = await query({ as: 'mentor', status: 'pending, active' });
    expect(dto.status).toEqual(['pending', 'active']);
  });

  it('rejects an unknown status', async () => {
    await expect(
      query({ as: 'mentee', status: 'pending,bogus' }),
    ).rejects.toThrow();
  });

  it('leaves status undefined when omitted', async () => {
    expect((await query({ as: 'mentee' })).status).toBeUndefined();
  });
});

describe('CreateMentorshipDto', () => {
  const valid = {
    mentorId: '6aaf7e0fed272db1d87a661a',
    topic: 'Algorithms',
    introMessage: 'I would like help preparing for the DSA final exam.',
  };

  it('accepts a valid request', async () => {
    await expect(body(valid)).resolves.toMatchObject({ topic: 'Algorithms' });
  });

  it.each([
    ['bad mentor id', { mentorId: 'nope' }],
    ['topic too short', { topic: 'a' }],
    ['topic too long', { topic: 'x'.repeat(81) }],
    ['intro too short', { introMessage: 'help me' }],
    ['intro too long', { introMessage: 'x'.repeat(501) }],
    ['unknown field', { status: 'active' }],
  ])('rejects %s', async (_l, patch) => {
    await expect(body({ ...valid, ...patch })).rejects.toThrow();
  });
});
