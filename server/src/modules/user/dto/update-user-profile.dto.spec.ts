import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import { UpdateUserProfileDto } from './update-user-profile.dto';

async function check(plain: Record<string, unknown>) {
  const dto = plainToInstance(UpdateUserProfileDto, plain);
  const errors = await validate(dto);
  return { dto, errors };
}

describe('UpdateUserProfileDto — mentor profile (E8)', () => {
  it('accepts a full mentor profile', async () => {
    const { errors, dto } = await check({
      isOpenToMentor: true,
      mentorBio: 'Happy to help with DSA and OS.',
      mentorTopics: ['Data Structures', 'Operating Systems'],
      maxActiveMentees: 5,
    });

    expect(errors).toHaveLength(0);
    expect(dto.maxActiveMentees).toBe(5);
  });

  it('normalizes topics: trims, drops empties, de-dupes case-insensitively', async () => {
    const { dto, errors } = await check({
      mentorTopics: ['  DSA ', 'dsa', '', '   ', 'OS', 'Dsa'],
    });

    expect(errors).toHaveLength(0);
    expect(dto.mentorTopics).toEqual(['DSA', 'OS']);
  });

  it.each([
    ['capacity below 1', { maxActiveMentees: 0 }],
    ['capacity above 10', { maxActiveMentees: 11 }],
    ['fractional capacity', { maxActiveMentees: 2.5 }],
    ['bio over 500 chars', { mentorBio: 'x'.repeat(501) }],
    [
      'more than 10 topics',
      { mentorTopics: Array.from({ length: 11 }, (_, i) => `t${i}`) },
    ],
    ['a topic over 40 chars', { mentorTopics: ['x'.repeat(41)] }],
    ['non-string topics', { mentorTopics: [1, 2] }],
    ['non-array topics', { mentorTopics: 'DSA' }],
    ['non-boolean isOpenToMentor', { isOpenToMentor: 'yes' }],
  ])('rejects %s', async (_label, plain) => {
    const { errors } = await check(plain);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateUserProfileDto — through the production ValidationPipe', () => {
  // Mirrors main.ts: forbidNonWhitelisted rejects any field the DTO doesn't
  // declare, which is what made the avatar picker's PATCH fail with 400.
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const run = (body: Record<string, unknown>) =>
    pipe.transform(body, { type: 'body', metatype: UpdateUserProfileDto });

  it('accepts the avatar the profile avatar picker sends', async () => {
    await expect(
      run({ avatar: '/assets/avatars/a1.png' }),
    ).resolves.toMatchObject({
      avatar: '/assets/avatars/a1.png',
    });
  });

  it('still rejects undeclared fields such as role', async () => {
    await expect(run({ role: 'Admin' })).rejects.toThrow();
  });

  it('rejects an over-long avatar value', async () => {
    await expect(run({ avatar: 'x'.repeat(501) })).rejects.toThrow();
  });
});
