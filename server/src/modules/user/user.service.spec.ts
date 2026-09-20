import 'reflect-metadata';
import { UserService } from './user.service';
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
      maxActiveMentees: 3,
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
