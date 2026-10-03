import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MentorEndorsementService } from './mentor-endorsement.service';
import { EndorsementDocument } from './schema/endorsement.schema';
import { MentorshipDocument } from './schema/mentorship.schema';
import { UserService } from '../user/user.service';

const mentor = new Types.ObjectId().toString();
const me = new Types.ObjectId().toString();
const exec = <T>(v: T) => ({ exec: jest.fn().mockResolvedValue(v) });

function build(opts: {
  completed?: boolean;
  create?: jest.Mock;
  rows?: { endorser: Types.ObjectId; tag: string }[];
}) {
  const create = opts.create ?? jest.fn().mockResolvedValue({});
  const deleteOne = jest.fn().mockReturnValue(exec({}));
  const endorsementModel = {
    create,
    deleteOne,
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(opts.rows ?? []),
    }),
  };
  const mentorshipModel = {
    exists: jest
      .fn()
      .mockReturnValue(exec(opts.completed === false ? null : { _id: 1 })),
  };
  const userService = {
    findPublicProfile: jest.fn().mockResolvedValue({
      mentorTopics: ['Data Structures'],
      expertise: ['SQL'],
    }),
  };
  const service = new MentorEndorsementService(
    endorsementModel as unknown as Model<EndorsementDocument>,
    mentorshipModel as unknown as Model<MentorshipDocument>,
    userService as unknown as UserService,
  );
  return { service, create, deleteOne, mentorshipModel };
}

describe('MentorEndorsementService#endorse', () => {
  it('stores the mentor’s own spelling of the skill', async () => {
    const { service, create } = build({});

    await service.endorse(me, mentor, ' data structures ');

    const [saved] = create.mock.calls[0] as [{ tag: string }];
    expect(saved.tag).toBe('Data Structures');
  });

  it('refuses people without a COMPLETED mentorship with that mentor', async () => {
    const { service, create, mentorshipModel } = build({ completed: false });

    await expect(service.endorse(me, mentor, 'SQL')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(create).not.toHaveBeenCalled();
    const [filter] = mentorshipModel.exists.mock.calls[0] as [
      { status: string },
    ];
    expect(filter.status).toBe('completed');
  });

  it('refuses to endorse yourself', async () => {
    const { service, create } = build({});

    await expect(service.endorse(me, me, 'SQL')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("refuses a skill the mentor doesn't list", async () => {
    const { service, create } = build({});

    await expect(
      service.endorse(me, mentor, 'Painting'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('is idempotent: a duplicate-key error is success', async () => {
    const { service } = build({
      create: jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 })),
    });

    await expect(service.endorse(me, mentor, 'SQL')).resolves.toBeUndefined();
  });

  it('rethrows any other storage error', async () => {
    const { service } = build({
      create: jest.fn().mockRejectedValue(new Error('mongo down')),
    });

    await expect(service.endorse(me, mentor, 'SQL')).rejects.toThrow(
      'mongo down',
    );
  });
});

describe('MentorEndorsementService#retract', () => {
  it('lets you take back your own endorsement even without a mentorship check', async () => {
    const { service, deleteOne, mentorshipModel } = build({ completed: false });

    await service.retract(me, mentor, 'sql');

    expect(mentorshipModel.exists).not.toHaveBeenCalled();
    const [filter] = deleteOne.mock.calls[0] as [{ tag: string }];
    expect(filter.tag).toBe('SQL');
  });
});

describe('MentorEndorsementService#summary', () => {
  it('counts per skill, flags the viewer’s own, and says whether they may endorse', async () => {
    const other = new Types.ObjectId();
    const { service } = build({
      rows: [
        { endorser: new Types.ObjectId(me), tag: 'SQL' },
        { endorser: other, tag: 'SQL' },
        { endorser: other, tag: 'Data Structures' },
      ],
    });

    const result = await service.summary(me, mentor);

    expect(result.canEndorse).toBe(true);
    expect(result.tags).toEqual([
      { tag: 'SQL', count: 2, endorsedByMe: true },
      { tag: 'Data Structures', count: 1, endorsedByMe: false },
    ]);
  });
});
