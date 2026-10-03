import 'reflect-metadata';
import { UserService, ratingSummary } from './user.service';
import { User } from './schemas/user.schema';
import { PaginationService } from '../../common/services/pagination.service';
import { ValidationPipe } from '@nestjs/common';
import { MentorQueryDto } from './dto/mentor-query.dto';
import { Model, Types } from 'mongoose';

describe('UserService', () => {
  it('should be defined', () => {
    const userModel: Partial<Model<User>> = {};
    const paginationService: Partial<PaginationService> = {};

    const service = new UserService(
      userModel as Model<User>,
      paginationService as PaginationService,
    );

    expect(service).toBeDefined();
  });
});

describe('UserService score/tier writes', () => {
  function build() {
    const exec = jest.fn().mockResolvedValue({});
    const updateOne = jest.fn().mockReturnValue({ exec });
    const service = new UserService(
      { updateOne } as unknown as Model<User>,
      {} as PaginationService,
    );
    return { service, updateOne };
  }

  it('adjustContributionScore writes score and tier in one pipeline update (requires updatePipeline)', async () => {
    const { service, updateOne } = build();

    await service.adjustContributionScore('u1', 10);

    const [filter, update, options] = updateOne.mock.calls[0] as [
      unknown,
      unknown[],
      { updatePipeline?: boolean },
    ];
    expect(filter).toEqual({ _id: 'u1' });
    expect(Array.isArray(update)).toBe(true);
    // Mongoose throws "Cannot pass an array to query updates unless the
    // `updatePipeline` option is set" without this — mocks can't catch it.
    expect(options).toEqual({ updatePipeline: true });
    expect(JSON.stringify(update)).toContain('$switch');
  });

  it('setContributionScore stores the tier derived from the score', async () => {
    const { service, updateOne } = build();

    await service.setContributionScore('u1', 60);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      { contributionScore: 60, tier: 'trusted' },
    );
  });
});

describe('UserService#findMentors', () => {
  it('maps only whitelisted public fields — no email, status or last-seen leaks', async () => {
    const id = new Types.ObjectId();
    const paginate = jest.fn().mockResolvedValue({
      data: [
        {
          _id: id,
          name: 'Sara',
          email: 'sara@private.example',
          accountStatus: 'Active',
          lastSeenAt: new Date(),
          hashedRefreshToken: 'secret',
          avatar: 'a.png',
          department: 'CS',
          semester: 7,
          role: 'Contributor',
          tier: 'trusted',
          contributionScore: 60,
          expertise: ['DSA'],
          mentorBio: 'Hi',
          mentorTopics: ['OS'],
          maxActiveMentees: 4,
          activeMenteeCount: 1,
          mentorRatingSum: 9,
          mentorRatingCount: 2,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPage: 1,
    });
    const service = new UserService(
      {} as Model<User>,
      { paginate } as unknown as PaginationService,
    );

    const result = await service.findMentors(
      {},
      new Types.ObjectId().toString(),
    );

    expect(result.data[0]).toEqual({
      id: id.toString(),
      name: 'Sara',
      avatar: 'a.png',
      department: 'CS',
      semester: 7,
      role: 'Contributor',
      tier: 'trusted',
      contributionScore: 60,
      expertise: ['DSA'],
      mentorBio: 'Hi',
      mentorTopics: ['OS'],
      maxActiveMentees: 4,
      slotsLeft: 3,
      ratingAverage: 4.5,
      ratingCount: 2,
    });
    // The projection is also restricted at the query level.
    const args = paginate.mock.calls[0] as unknown[];
    const select = args[4] as string;
    expect(select).not.toContain('email');
    expect(select).not.toContain('lastSeenAt');
  });
});

describe('MentorQueryDto — through the production ValidationPipe', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const run = (q: Record<string, unknown>) =>
    pipe.transform(q, { type: 'query', metatype: MentorQueryDto });

  it('coerces numeric query strings and applies defaults', async () => {
    await expect(run({ semesterMin: '3', page: '2' })).resolves.toMatchObject({
      semesterMin: 3,
      page: 2,
    });
  });

  it.each([
    ['semester out of range', { semesterMin: '9' }],
    ['unknown sort', { sort: 'random' }],
    ['unknown field', { email: 'x@y.com' }],
    ['over-long search', { search: 'x'.repeat(101) }],
  ])('rejects %s', async (_l, q) => {
    await expect(run(q)).rejects.toThrow();
  });
});

describe('UserService mentee slots', () => {
  function build(modified: number) {
    const exec = jest.fn().mockResolvedValue({ modifiedCount: modified });
    const updateOne = jest.fn().mockReturnValue({ exec });
    const service = new UserService(
      { updateOne } as unknown as Model<User>,
      {} as PaginationService,
    );
    return { service, updateOne };
  }

  it("reserveMenteeSlot compares the counter to the mentor's max INSIDE the write", async () => {
    const { service, updateOne } = build(1);

    await expect(service.reserveMenteeSlot('m1')).resolves.toBe(true);

    const [filter, update] = updateOne.mock.calls[0] as [
      { _id: string; $expr: unknown },
      unknown,
    ];
    expect(filter._id).toBe('m1');
    // Atomic capacity check: an $expr on the same document, not a prior read.
    expect(JSON.stringify(filter.$expr)).toContain('$lt');
    expect(JSON.stringify(filter.$expr)).toContain('$activeMenteeCount');
    expect(JSON.stringify(filter.$expr)).toContain('$maxActiveMentees');
    expect(update).toEqual({ $inc: { activeMenteeCount: 1 } });
  });

  it('reserveMenteeSlot reports a full mentor (no document matched)', async () => {
    const { service } = build(0);

    await expect(service.reserveMenteeSlot('m1')).resolves.toBe(false);
  });

  it('releaseMenteeSlot never lets the counter go below zero', async () => {
    const { service, updateOne } = build(1);

    await service.releaseMenteeSlot('m1');

    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'm1', activeMenteeCount: { $gt: 0 } },
      { $inc: { activeMenteeCount: -1 } },
    );
  });
});

describe('UserService#findPublicProfile', () => {
  // Regression: public profiles used findOne, which returned the email.
  it('selects public fields only, never email or account status', async () => {
    const exec = jest.fn().mockResolvedValue({ name: 'Hamza' });
    const lean = jest.fn().mockReturnValue({ exec });
    const select = jest.fn().mockReturnValue({ lean });
    const findById = jest.fn().mockReturnValue({ select });
    const service = new UserService(
      { findById } as unknown as Model<User>,
      {} as PaginationService,
    );

    await service.findPublicProfile('u1');

    const fields = (select.mock.calls[0] as [string])[0].split(/\s+/);
    expect(fields).toEqual(expect.arrayContaining(['name', 'avatar', 'tier']));
    expect(fields).not.toContain('email');
    expect(fields).not.toContain('accountStatus');
    expect(fields).not.toContain('isOnboarded');
  });

  it('404s for an unknown user', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const findById = jest.fn().mockReturnValue({
      select: () => ({ lean: () => ({ exec }) }),
    });
    const service = new UserService(
      { findById } as unknown as Model<User>,
      {} as PaginationService,
    );

    await expect(service.findPublicProfile('nope')).rejects.toThrow(
      'User with id nope not found',
    );
  });
});

describe('UserService#findTopContributors', () => {
  it('returns active members with reputation, highest first, as public rows', async () => {
    const id = new Types.ObjectId();
    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest
        .fn()
        .mockResolvedValue([
          { _id: id, name: 'Hamza', tier: 'trusted', contributionScore: 70 },
        ]),
    };
    const find = jest.fn().mockReturnValue(chain);
    const service = new UserService(
      { find } as unknown as Model<User>,
      {} as PaginationService,
    );

    const rows = await service.findTopContributors(5);

    expect(find).toHaveBeenCalledWith({
      contributionScore: { $gt: 0 },
      accountStatus: { $ne: 'Suspended' },
      showOnLeaderboard: { $ne: false },
    });
    expect(chain.sort).toHaveBeenCalledWith({ contributionScore: -1, _id: 1 });
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(chain.select).toHaveBeenCalledWith(
      'name avatar tier contributionScore',
    );
    expect(rows).toEqual([
      {
        id: id.toString(),
        name: 'Hamza',
        avatar: undefined,
        tier: 'trusted',
        contributionScore: 70,
      },
    ]);
  });
});

describe('UserService#changePassword (G5)', () => {
  async function build(currentPlain: string) {
    const bcrypt = await import('bcrypt');
    const stored = await bcrypt.hash(currentPlain, 4);
    const exec = jest.fn().mockResolvedValue({ password: stored });
    const select = jest.fn().mockReturnValue({ exec });
    const findById = jest.fn().mockReturnValue({ select });
    const updateOne = jest.fn().mockResolvedValue({});
    const service = new UserService(
      { findById, updateOne } as unknown as Model<User>,
      {} as PaginationService,
    );
    return { service, updateOne, select, bcrypt };
  }

  it('rejects a wrong current password and writes nothing', async () => {
    const { service, updateOne } = await build('right-one');

    await expect(
      service.changePassword('u1', {
        currentPassword: 'wrong',
        newPassword: 'new-secret',
      }),
    ).rejects.toThrow('Current password is incorrect');
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', async () => {
    const { service } = await build('same-one');

    await expect(
      service.changePassword('u1', {
        currentPassword: 'same-one',
        newPassword: 'same-one',
      }),
    ).rejects.toThrow('must be different');
  });

  it('stores a hash of the new password and signs out other sessions', async () => {
    const { service, updateOne, select, bcrypt } = await build('old-secret');

    await service.changePassword('u1', {
      currentPassword: 'old-secret',
      newPassword: 'new-secret',
    });

    expect(select).toHaveBeenCalledWith('+password');
    const [filter, update] = updateOne.mock.calls[0] as [
      unknown,
      { password: string; hashedRefreshToken: null },
    ];
    expect(filter).toEqual({ _id: 'u1' });
    expect(update.hashedRefreshToken).toBeNull();
    expect(update.password).not.toBe('new-secret');
    await expect(bcrypt.compare('new-secret', update.password)).resolves.toBe(
      true,
    );
  });
});

describe('ratingSummary (E11)', () => {
  it('is null before the first rating', () => {
    expect(ratingSummary(0, 0)).toEqual({
      ratingAverage: null,
      ratingCount: 0,
    });
    expect(ratingSummary(undefined, undefined)).toEqual({
      ratingAverage: null,
      ratingCount: 0,
    });
  });

  it('rounds the mean to one decimal', () => {
    expect(ratingSummary(14, 3)).toEqual({
      ratingAverage: 4.7,
      ratingCount: 3,
    });
    expect(ratingSummary(5, 1)).toEqual({ ratingAverage: 5, ratingCount: 1 });
  });
});

describe('UserService leaderboard visibility (E15)', () => {
  const find = (rows: unknown[]) =>
    jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(rows),
    });
  const service = (model: unknown) =>
    new UserService(model as Model<User>, {} as PaginationService);

  it('top contributors exclude suspended accounts and anyone who opted out', async () => {
    const f = find([]);

    await service({ find: f }).findTopContributors(5);

    const [filter] = f.mock.calls[0] as [Record<string, unknown>];
    expect(filter.showOnLeaderboard).toEqual({ $ne: false });
    expect(filter.accountStatus).toEqual({ $ne: 'Suspended' });
  });

  it('absent means visible: only an explicit false hides someone', async () => {
    const f = find([]);

    await service({ find: f }).findLeaderboardCandidates([
      new Types.ObjectId().toString(),
    ]);

    const [filter] = f.mock.calls[0] as [Record<string, unknown>];
    expect(filter.showOnLeaderboard).toEqual({ $ne: false });
  });

  it('does not query at all for an empty id list', async () => {
    const f = find([]);

    expect(await service({ find: f }).findLeaderboardCandidates([])).toEqual(
      [],
    );
    expect(f).not.toHaveBeenCalled();
  });
});
