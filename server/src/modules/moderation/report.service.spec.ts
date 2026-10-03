import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { ReportService } from './report.service';
import { ReportDocument } from './schema/report.schema';
import { ConversationDocument } from '../chat/schema/conversation.schema';
import { MessageDocument } from '../chat/schema/message.schema';
import { UserService } from '../user/user.service';
import { Roles } from '../user/enums/user-role.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import { PaginationService } from '../../common/services/pagination.service';
import {
  ReportReason,
  ReportResolution,
  ReportStatus,
  ReportTargetType,
} from './enums/report.enums';

const oid = () => new Types.ObjectId();
const chain = (result: unknown) => {
  const c = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
  return c;
};
const dupKey = () => Object.assign(new Error('dup'), { code: 11000 });

const me = oid();
const other = oid();
const convId = oid();

function build(
  opts: {
    message?: unknown;
    conversation?: unknown;
    history?: unknown[];
    create?: jest.Mock;
    userFindOne?: jest.Mock;
    reportDoc?: unknown;
    claimed?: unknown;
  } = {},
) {
  const create = opts.create ?? jest.fn().mockResolvedValue({ _id: oid() });
  const reportModel = {
    create,
    findById: jest.fn().mockReturnValue(chain(opts.reportDoc ?? null)),
    findOneAndUpdate: jest.fn().mockReturnValue(chain(opts.claimed ?? null)),
  };
  const conversationModel = {
    findOne: jest.fn().mockReturnValue(chain(opts.conversation ?? null)),
  };
  const messageModel = {
    findById: jest.fn().mockReturnValue(chain(opts.message ?? null)),
    find: jest.fn().mockReturnValue(chain(opts.history ?? [])),
  };
  const userService = {
    findOne:
      opts.userFindOne ?? jest.fn().mockResolvedValue({ role: Roles.STUDENT }),
    updateStatus: jest.fn().mockResolvedValue({}),
  };
  const eventEmitter = { emit: jest.fn() };
  const service = new ReportService(
    reportModel as unknown as Model<ReportDocument>,
    conversationModel as unknown as Model<ConversationDocument>,
    messageModel as unknown as Model<MessageDocument>,
    userService as unknown as UserService,
    {} as PaginationService,
    eventEmitter as unknown as EventEmitter2,
  );
  return {
    service,
    create,
    messageModel,
    userService,
    eventEmitter,
    reportModel,
  };
}

describe('ReportService#create', () => {
  const msgId = oid();
  const message = {
    _id: msgId,
    conversationId: convId,
    sender: other,
    content: 'abusive text',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    isDeleted: false,
  };

  it('reports a message: targets its sender and snapshots it with context, oldest first', async () => {
    const history = [
      {
        _id: msgId,
        sender: other,
        content: 'abusive text',
        createdAt: message.createdAt,
        isDeleted: false,
      },
      {
        _id: oid(),
        sender: me,
        content: 'earlier',
        createdAt: new Date('2026-10-01T09:00:00Z'),
        isDeleted: true,
      },
    ];
    const { service, create } = build({
      message,
      conversation: { _id: convId },
      history,
    });

    await service.create(me.toString(), {
      targetType: ReportTargetType.MESSAGE,
      targetId: msgId.toString(),
      reason: ReportReason.HARASSMENT,
    });

    const [saved] = create.mock.calls[0] as [Record<string, unknown>];
    expect(saved.reportedUser).toBe(other);
    expect(saved.targetKey).toBe(`message:${msgId.toString()}`);
    const evidence = saved.evidence as {
      content: string;
      wasDeleted: boolean;
    }[];
    expect(evidence.map((e) => e.content)).toEqual(['earlier', 'abusive text']);
    expect(evidence[0].wasDeleted).toBe(true); // deleted messages are retained
  });

  it("404s when the reporter isn't in the conversation (can't probe other people's messages)", async () => {
    const { service, create } = build({ message, conversation: null });

    await expect(
      service.create(me.toString(), {
        targetType: ReportTargetType.MESSAGE,
        targetId: msgId.toString(),
        reason: ReportReason.SPAM,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();
  });

  it("won't let you report your own message", async () => {
    const { service } = build({
      message: { ...message, sender: me },
      conversation: { _id: convId },
    });

    await expect(
      service.create(me.toString(), {
        targetType: ReportTargetType.MESSAGE,
        targetId: msgId.toString(),
        reason: ReportReason.SPAM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reports a conversation against the OTHER participant', async () => {
    const { service, create } = build({
      conversation: { _id: convId, participants: [me, other] },
      history: [],
    });

    await service.create(me.toString(), {
      targetType: ReportTargetType.CONVERSATION,
      targetId: convId.toString(),
      reason: ReportReason.INAPPROPRIATE,
    });

    const [saved] = create.mock.calls[0] as [Record<string, unknown>];
    expect(saved.reportedUser).toBe(other);
  });

  it("can't report yourself as a user", async () => {
    const { service } = build();

    await expect(
      service.create(me.toString(), {
        targetType: ReportTargetType.USER,
        targetId: me.toString(),
        reason: ReportReason.OTHER,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('turns the duplicate-open-report index error into a friendly 409', async () => {
    const { service } = build({
      message,
      conversation: { _id: convId },
      create: jest.fn().mockRejectedValue(dupKey()),
    });

    await expect(
      service.create(me.toString(), {
        targetType: ReportTargetType.MESSAGE,
        targetId: msgId.toString(),
        reason: ReportReason.SPAM,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows any other storage error', async () => {
    const { service } = build({
      message,
      conversation: { _id: convId },
      create: jest.fn().mockRejectedValue(new Error('mongo down')),
    });

    await expect(
      service.create(me.toString(), {
        targetType: ReportTargetType.MESSAGE,
        targetId: msgId.toString(),
        reason: ReportReason.SPAM,
      }),
    ).rejects.toThrow('mongo down');
  });
});

describe('ReportService#resolve', () => {
  const reportId = oid().toString();
  const admin = oid().toString();
  const openReport = { reportedUser: other, status: ReportStatus.OPEN };
  const claimedDoc = (status: ReportStatus) => ({
    _id: reportId,
    status,
    targetType: ReportTargetType.USER,
    reason: ReportReason.SPAM,
    reporter: { _id: me, name: 'R' },
    reportedUser: { _id: other, name: 'X' },
    evidence: [],
    createdAt: new Date(),
  });

  it('404s for an unknown report', async () => {
    const { service } = build({ reportDoc: null });

    await expect(
      service.resolve(admin, reportId, { action: ReportResolution.DISMISS }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('409s when it was already resolved, without side effects', async () => {
    const { service, userService } = build({
      reportDoc: { ...openReport, status: ReportStatus.WARNED },
    });

    await expect(
      service.resolve(admin, reportId, { action: ReportResolution.SUSPEND }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userService.updateStatus).not.toHaveBeenCalled();
  });

  it('dismiss changes no account and sends no warning', async () => {
    const { service, userService, eventEmitter } = build({
      reportDoc: openReport,
      claimed: claimedDoc(ReportStatus.DISMISSED),
    });

    await service.resolve(admin, reportId, {
      action: ReportResolution.DISMISS,
    });

    expect(userService.updateStatus).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('warn emits a warning event to the reported user with the note', async () => {
    const { service, eventEmitter } = build({
      reportDoc: openReport,
      claimed: claimedDoc(ReportStatus.WARNED),
    });

    await service.resolve(admin, reportId, {
      action: ReportResolution.WARN,
      note: ' be kind ',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith('moderation.user_warned', {
      userId: other.toString(),
      note: 'be kind',
    });
  });

  it('suspend suspends the reported user BEFORE closing the report', async () => {
    const order: string[] = [];
    const { service, userService, reportModel } = build({
      reportDoc: openReport,
      claimed: claimedDoc(ReportStatus.SUSPENDED),
    });
    userService.updateStatus.mockImplementation(() => {
      order.push('suspend');
      return Promise.resolve({});
    });
    reportModel.findOneAndUpdate.mockImplementation(() => {
      order.push('claim');
      return chain(claimedDoc(ReportStatus.SUSPENDED));
    });

    await service.resolve(admin, reportId, {
      action: ReportResolution.SUSPEND,
    });

    expect(userService.updateStatus).toHaveBeenCalledWith(
      other.toString(),
      UserStatus.SUSPENDED,
    );
    expect(order).toEqual(['suspend', 'claim']);
  });

  it('keeps the report open if the suspension itself fails', async () => {
    const { service, userService, reportModel } = build({
      reportDoc: openReport,
    });
    userService.updateStatus.mockRejectedValue(new Error('mongo down'));

    await expect(
      service.resolve(admin, reportId, { action: ReportResolution.SUSPEND }),
    ).rejects.toThrow('mongo down');
    expect(reportModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("won't suspend an administrator", async () => {
    const { service, userService } = build({
      reportDoc: openReport,
      userFindOne: jest.fn().mockResolvedValue({ role: Roles.ADMIN }),
    });

    await expect(
      service.resolve(admin, reportId, { action: ReportResolution.SUSPEND }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userService.updateStatus).not.toHaveBeenCalled();
  });

  it('409s when another admin claimed it first (lost the race)', async () => {
    const { service } = build({ reportDoc: openReport, claimed: null });

    await expect(
      service.resolve(admin, reportId, { action: ReportResolution.DISMISS }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
