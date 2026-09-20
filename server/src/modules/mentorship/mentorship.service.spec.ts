import 'reflect-metadata';
import { Model, Types } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MentorshipService } from './mentorship.service';
import { MentorshipDocument } from './schema/mentorship.schema';
import { MentorshipStatus } from './mentorship.state';
import { UserService } from '../user/user.service';
import { ChatService } from '../chat/chat.service';
import { PaginationService } from '../../common/services/pagination.service';

const mentorId = new Types.ObjectId();
const menteeId = new Types.ObjectId();
const strangerId = new Types.ObjectId();
const mentorshipId = new Types.ObjectId();
const conversationId = new Types.ObjectId();

const intro = 'I am struggling with dynamic programming and need a plan.';

const execOf = (result: unknown) => ({
  exec: jest.fn().mockResolvedValue(result),
});
const leanOf = (result: unknown) => ({
  lean: jest.fn().mockReturnValue(execOf(result)),
  populate: jest.fn().mockReturnThis(),
});

function claimedDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: mentorshipId,
    id: mentorshipId.toString(),
    mentor: mentorId,
    mentee: menteeId,
    topic: 'DP',
    introMessage: intro,
    status: MentorshipStatus.ACTIVE,
    ...overrides,
  };
}

function build(opts: {
  mentor?: Record<string, unknown>;
  model?: Record<string, unknown>;
  reserve?: boolean;
  chat?: Record<string, unknown>;
}) {
  const userService = {
    findOne: jest.fn().mockResolvedValue({
      isOpenToMentor: true,
      accountStatus: 'Active',
      maxActiveMentees: 3,
      activeMenteeCount: 0,
      ...opts.mentor,
    }),
    reserveMenteeSlot: jest.fn().mockResolvedValue(opts.reserve ?? true),
    releaseMenteeSlot: jest.fn().mockResolvedValue(undefined),
  };
  const chatService = {
    findOrCreateConversation: jest
      .fn()
      .mockResolvedValue({ _id: conversationId }),
    createMessageIdempotent: jest.fn().mockResolvedValue({}),
    markSeen: jest.fn().mockResolvedValue(undefined),
    ...opts.chat,
  };
  const eventEmitter = { emit: jest.fn() };
  const service = new MentorshipService(
    (opts.model ?? {}) as unknown as Model<MentorshipDocument>,
    userService as unknown as UserService,
    chatService as unknown as ChatService,
    {} as PaginationService,
    eventEmitter as unknown as EventEmitter2,
  );
  return { service, userService, chatService, eventEmitter };
}

describe('MentorshipService#request', () => {
  const dto = {
    mentorId: mentorId.toString(),
    topic: 'DP',
    introMessage: intro,
  };

  function requestModel(overrides: Record<string, unknown> = {}) {
    return {
      countDocuments: jest.fn().mockReturnValue(execOf(0)),
      create: jest.fn().mockResolvedValue({
        id: mentorshipId.toString(),
        topic: 'DP',
        status: MentorshipStatus.PENDING,
      }),
      ...overrides,
    };
  }

  it('creates a pending request and emits mentorship.requested', async () => {
    const { service, eventEmitter } = build({ model: requestModel() });

    const res = await service.request(menteeId.toString(), dto);

    expect(res).toEqual({
      id: mentorshipId.toString(),
      status: MentorshipStatus.PENDING,
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'mentorship.requested',
      expect.objectContaining({
        mentorId: mentorId.toString(),
        menteeId: menteeId.toString(),
        topic: 'DP',
      }),
    );
  });

  it('refuses to request yourself', async () => {
    const { service } = build({ model: requestModel() });

    await expect(
      service.request(mentorId.toString(), dto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['not open to mentoring', { isOpenToMentor: false }],
    ['suspended', { accountStatus: 'Suspended' }],
  ])('refuses a mentor who is %s', async (_l, mentor) => {
    const model = requestModel();
    const { service } = build({ mentor, model });

    await expect(
      service.request(menteeId.toString(), dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(model.create).not.toHaveBeenCalled();
  });

  it('refuses a mentor with no free slots', async () => {
    const { service } = build({
      mentor: { maxActiveMentees: 2, activeMenteeCount: 2 },
      model: requestModel(),
    });

    await expect(
      service.request(menteeId.toString(), dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('treats a mentor with no counter/limit fields (legacy docs) as having the default capacity', async () => {
    const { service } = build({
      mentor: { maxActiveMentees: undefined, activeMenteeCount: undefined },
      model: requestModel(),
    });

    await expect(
      service.request(menteeId.toString(), dto),
    ).resolves.toMatchObject({ status: MentorshipStatus.PENDING });
  });

  it('caps how many requests one student can have waiting', async () => {
    const { service } = build({
      model: requestModel({
        countDocuments: jest.fn().mockReturnValue(execOf(5)),
      }),
    });

    await expect(
      service.request(menteeId.toString(), dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps the unique open-pair index violation to 409', async () => {
    const { service, eventEmitter } = build({
      model: requestModel({
        create: jest
          .fn()
          .mockRejectedValue(
            Object.assign(new Error('E11000'), { code: 11000 }),
          ),
      }),
    });

    await expect(
      service.request(menteeId.toString(), dto),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('rethrows unexpected persistence errors', async () => {
    const { service } = build({
      model: requestModel({
        create: jest.fn().mockRejectedValue(new Error('db')),
      }),
    });

    await expect(service.request(menteeId.toString(), dto)).rejects.toThrow(
      'db',
    );
  });
});

describe('MentorshipService#accept', () => {
  function acceptModel(claim: unknown, extra: Record<string, unknown> = {}) {
    return {
      findOneAndUpdate: jest.fn().mockReturnValue(execOf(claim)),
      updateOne: jest.fn().mockReturnValue(execOf({})),
      findById: jest.fn().mockReturnValue({
        ...leanOf({
          ...claimedDoc(),
          mentor: { _id: mentorId, name: 'M', tier: 'newcomer' },
          mentee: { _id: menteeId, name: 'S', tier: 'newcomer' },
          conversationId,
        }),
      }),
      ...extra,
    };
  }

  it('reserves a slot, claims atomically, opens the chat with the intro, and emits', async () => {
    const model = acceptModel(claimedDoc());
    const { service, userService, chatService, eventEmitter } = build({
      model,
    });

    await service.accept(mentorshipId.toString(), mentorId.toString());

    expect(userService.reserveMenteeSlot).toHaveBeenCalledWith(
      mentorId.toString(),
    );
    // Atomic claim: filter carries status AND the acting mentor.
    const [filter] = model.findOneAndUpdate.mock.calls[0] as [
      { status: { $in: string[] }; mentor: Types.ObjectId },
    ];
    expect(filter.status.$in).toEqual([MentorshipStatus.PENDING]);
    expect(filter.mentor.equals(mentorId)).toBe(true);

    expect(chatService.findOrCreateConversation).toHaveBeenCalledWith(
      mentorId.toString(),
      { participantId: menteeId.toString() },
    );
    const [msg, sender] = chatService.createMessageIdempotent.mock.calls[0] as [
      { content: string; clientId: string; conversationId: string },
      string,
    ];
    expect(sender).toBe(menteeId.toString());
    expect(msg.content).toContain(intro);
    // Deterministic id => retrying a rolled-back accept can't duplicate it.
    expect(msg.clientId).toBe(`mentorship-intro-${mentorshipId.toString()}`);
    expect(chatService.markSeen).toHaveBeenCalledWith(
      conversationId.toString(),
      mentorId.toString(),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'mentorship.accepted',
      expect.objectContaining({ conversationId: conversationId.toString() }),
    );
    expect(userService.releaseMenteeSlot).not.toHaveBeenCalled();
  });

  it('refuses when the mentor is at capacity, without claiming anything', async () => {
    const model = acceptModel(claimedDoc());
    const { service, eventEmitter } = build({ model, reserve: false });

    await expect(
      service.accept(mentorshipId.toString(), mentorId.toString()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(model.findOneAndUpdate).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('gives the slot back when the request cannot be claimed (already handled / not theirs)', async () => {
    const model = acceptModel(null, {
      findById: jest.fn().mockReturnValue(leanOf(null)),
    });
    const { service, userService } = build({ model });

    await expect(
      service.accept(mentorshipId.toString(), mentorId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(userService.releaseMenteeSlot).toHaveBeenCalledWith(
      mentorId.toString(),
    );
  });

  it('rolls back to pending and frees the slot when the conversation cannot be opened', async () => {
    const model = acceptModel(claimedDoc());
    const { service, userService, eventEmitter } = build({
      model,
      chat: {
        findOrCreateConversation: jest
          .fn()
          .mockRejectedValue(new Error('chat down')),
      },
    });

    await expect(
      service.accept(mentorshipId.toString(), mentorId.toString()),
    ).rejects.toThrow('chat down');

    expect(model.updateOne).toHaveBeenCalledWith(
      { _id: mentorshipId, status: MentorshipStatus.ACTIVE },
      expect.objectContaining({ status: MentorshipStatus.PENDING }),
    );
    expect(userService.releaseMenteeSlot).toHaveBeenCalledWith(
      mentorId.toString(),
    );
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});

describe('MentorshipService — claim error mapping', () => {
  function modelNoMatch(existing: unknown) {
    return {
      findOneAndUpdate: jest.fn().mockReturnValue(execOf(null)),
      findById: jest.fn().mockReturnValue(leanOf(existing)),
    };
  }
  const existing = (status: MentorshipStatus) => ({
    _id: mentorshipId,
    mentor: mentorId,
    mentee: menteeId,
    status,
  });

  it('404s for a stranger (indistinguishable from a missing id — no probing)', async () => {
    const { service } = build({
      model: modelNoMatch(existing(MentorshipStatus.PENDING)),
    });

    await expect(
      service.cancel(mentorshipId.toString(), strangerId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('403s when a party acts outside their role (mentee tries to decline)', async () => {
    const { service } = build({
      model: modelNoMatch(existing(MentorshipStatus.PENDING)),
    });

    await expect(
      service.decline(mentorshipId.toString(), menteeId.toString()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('409s when the action is not valid from the current status', async () => {
    const { service } = build({
      model: modelNoMatch(existing(MentorshipStatus.COMPLETED)),
    });

    await expect(
      service.complete(mentorshipId.toString(), mentorId.toString()),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('MentorshipService#decline / cancel / complete', () => {
  function transitionModel(claim: unknown) {
    return {
      findOneAndUpdate: jest.fn().mockReturnValue(execOf(claim)),
      findById: jest.fn().mockReturnValue(
        leanOf({
          ...claimedDoc(),
          mentor: { _id: mentorId, name: 'M', tier: 'newcomer' },
          mentee: { _id: menteeId, name: 'S', tier: 'newcomer' },
        }),
      ),
    };
  }

  it('decline stores the trimmed reason and notifies via event', async () => {
    const model = transitionModel(
      claimedDoc({ status: MentorshipStatus.DECLINED, declineReason: 'Busy' }),
    );
    const { service, eventEmitter, userService } = build({ model });

    await service.decline(
      mentorshipId.toString(),
      mentorId.toString(),
      '  Busy ',
    );

    const [, update] = model.findOneAndUpdate.mock.calls[0] as [
      unknown,
      { declineReason?: string; status: string },
    ];
    expect(update).toMatchObject({ status: 'declined', declineReason: 'Busy' });
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'mentorship.declined',
      expect.objectContaining({ reason: 'Busy' }),
    );
    // A pending request never held a slot.
    expect(userService.releaseMenteeSlot).not.toHaveBeenCalled();
  });

  it('cancel is a mentee-only pending -> cancelled claim and holds no slot', async () => {
    const model = transitionModel(
      claimedDoc({ status: MentorshipStatus.CANCELLED }),
    );
    const { service, userService } = build({ model });

    await service.cancel(mentorshipId.toString(), menteeId.toString());

    const [filter] = model.findOneAndUpdate.mock.calls[0] as [
      { mentee: Types.ObjectId; status: { $in: string[] } },
    ];
    expect(filter.mentee.equals(menteeId)).toBe(true);
    expect(filter.status.$in).toEqual([MentorshipStatus.PENDING]);
    expect(userService.releaseMenteeSlot).not.toHaveBeenCalled();
  });

  it.each([
    ['mentor', mentorId],
    ['mentee', menteeId],
  ])(
    'complete by the %s releases the mentor slot and emits who ended it',
    async (_r, actor) => {
      const model = transitionModel(
        claimedDoc({ status: MentorshipStatus.COMPLETED }),
      );
      const { service, userService, eventEmitter } = build({ model });

      await service.complete(mentorshipId.toString(), actor.toString());

      // Either party is allowed => the filter is an $or over both roles.
      const [filter] = model.findOneAndUpdate.mock.calls[0] as [
        { $or: unknown[] },
      ];
      expect(filter.$or).toHaveLength(2);
      expect(userService.releaseMenteeSlot).toHaveBeenCalledWith(
        mentorId.toString(),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'mentorship.completed',
        expect.objectContaining({ completedBy: actor.toString() }),
      );
    },
  );
});
