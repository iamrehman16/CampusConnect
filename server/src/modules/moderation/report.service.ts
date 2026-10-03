import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument, ReportEvidence } from './schema/report.schema';
import {
  Conversation,
  ConversationDocument,
} from '../chat/schema/conversation.schema';
import { Message, MessageDocument } from '../chat/schema/message.schema';
import { UserService } from '../user/user.service';
import { Roles } from '../user/enums/user-role.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';
import {
  DomainEvents,
  UserWarnedEvent,
} from '../../common/events/domain-events';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import {
  ReportResolution,
  ReportStatus,
  ReportTargetType,
} from './enums/report.enums';

/** Messages kept as context around a reported message / conversation. */
const MESSAGE_CONTEXT = 5;
const CONVERSATION_CONTEXT = 20;

const RESOLUTION_STATUS: Record<ReportResolution, ReportStatus> = {
  [ReportResolution.DISMISS]: ReportStatus.DISMISSED,
  [ReportResolution.WARN]: ReportStatus.WARNED,
  [ReportResolution.SUSPEND]: ReportStatus.SUSPENDED,
};

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

interface ResolvedTarget {
  reportedUser: Types.ObjectId;
  messageId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  evidence: ReportEvidence[];
}

type PartyRef = { _id: Types.ObjectId; name?: string; avatar?: string } | null;

export interface AdminReportDto {
  id: string;
  status: ReportStatus;
  targetType: ReportTargetType;
  reason: string;
  details?: string;
  reporter: { id: string; name: string; avatar?: string } | null;
  reportedUser: { id: string; name: string; avatar?: string } | null;
  conversationId?: string;
  messageId?: string;
  evidence: {
    messageId: string;
    senderId: string;
    content: string;
    sentAt: Date;
    wasDeleted: boolean;
  }[];
  resolutionNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

/** A lean report with its parties populated (the pagination helper's generic doesn't model `_id`). */
type LeanReport = Omit<Report, 'reporter' | 'reportedUser'> & {
  _id: Types.ObjectId;
  reporter: unknown;
  reportedUser: unknown;
};

const party = (p: PartyRef) =>
  p ? { id: p._id.toString(), name: p.name ?? '', avatar: p.avatar } : null;

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    private readonly userService: UserService,
    private readonly paginationService: PaginationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<{ id: string }> {
    const target = await this.resolveTarget(reporterId, dto);

    try {
      const report = await this.reportModel.create({
        reporter: new Types.ObjectId(reporterId),
        reportedUser: target.reportedUser,
        targetType: dto.targetType,
        targetKey: `${dto.targetType}:${dto.targetId}`,
        messageId: target.messageId,
        conversationId: target.conversationId,
        reason: dto.reason,
        details: dto.details?.trim() || undefined,
        evidence: target.evidence,
      });
      return { id: report._id.toString() };
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictException(
          "You've already reported this and it's still under review",
        );
      }
      throw err;
    }
  }

  /**
   * Works out who is being reported and snapshots the evidence. Only
   * participants can report a message or conversation, and a missing and a
   * not-yours target look identical (404) so ids can't be probed.
   */
  private async resolveTarget(
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<ResolvedTarget> {
    const targetId = new Types.ObjectId(dto.targetId);
    const me = new Types.ObjectId(reporterId);

    switch (dto.targetType) {
      case ReportTargetType.USER: {
        if (dto.targetId === reporterId) {
          throw new BadRequestException('You cannot report yourself');
        }
        await this.userService.findOne(dto.targetId); // 404 if unknown
        return { reportedUser: targetId, evidence: [] };
      }

      case ReportTargetType.MESSAGE: {
        const message = await this.messageModel
          .findById(targetId)
          .lean()
          .exec();
        const conversation = message
          ? await this.conversationModel
              .findOne({ _id: message.conversationId, participants: me })
              .select('_id')
              .lean()
              .exec()
          : null;
        if (!message || !conversation) {
          throw new NotFoundException('Message not found');
        }
        if (message.sender.equals(me)) {
          throw new BadRequestException("You can't report your own message");
        }
        const evidence = await this.snapshot(
          message.conversationId,
          MESSAGE_CONTEXT,
          message.createdAt,
        );
        return {
          reportedUser: message.sender,
          messageId: targetId,
          conversationId: message.conversationId,
          evidence,
        };
      }

      case ReportTargetType.CONVERSATION: {
        const conversation = await this.conversationModel
          .findOne({ _id: targetId, participants: me })
          .select('participants')
          .lean()
          .exec();
        const other = conversation?.participants.find((p) => !p.equals(me));
        if (!conversation || !other) {
          throw new NotFoundException('Conversation not found');
        }
        const evidence = await this.snapshot(
          conversation._id,
          CONVERSATION_CONTEXT,
        );
        return {
          reportedUser: other,
          conversationId: conversation._id,
          evidence,
        };
      }
    }
  }

  /**
   * The newest `limit` messages (soft-deleted ones included, flagged) up to
   * `upTo`, oldest first. Taken at report time, so the evidence is retained
   * even if the sender deletes the messages afterwards (BACKLOG.md E16).
   */
  private async snapshot(
    conversationId: Types.ObjectId,
    limit: number,
    upTo?: Date,
  ): Promise<ReportEvidence[]> {
    const rows = await this.messageModel
      .find({ conversationId, ...(upTo && { createdAt: { $lte: upTo } }) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('sender content createdAt isDeleted')
      .lean()
      .exec();

    return rows.reverse().map((m) => ({
      messageId: m._id,
      sender: m.sender,
      content: m.content,
      sentAt: m.createdAt,
      wasDeleted: m.isDeleted,
    }));
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  async list(dto: ReportQueryDto): Promise<PaginatedResult<AdminReportDto>> {
    const status = dto.status ?? ReportStatus.OPEN;
    const result = await this.paginationService.paginateWithPopulate(
      this.reportModel,
      dto,
      { build: () => ({ status }) },
      { build: () => ({ createdAt: -1 }) },
      [
        { path: 'reporter', select: 'name avatar' },
        { path: 'reportedUser', select: 'name avatar' },
      ],
    );

    return {
      ...result,
      // .lean() rows always carry _id; see LeanReport.
      data: (result.data as unknown as LeanReport[]).map((r) =>
        this.toAdminDto(r),
      ),
    };
  }

  /**
   * Dismiss, warn or suspend. A suspension is applied first (it's idempotent)
   * and the report is then claimed atomically from `open`, so two admins
   * can't both resolve it and a failed suspension leaves the report open to
   * retry rather than recorded as done.
   */
  async resolve(
    adminId: string,
    reportId: string,
    dto: ResolveReportDto,
  ): Promise<AdminReportDto> {
    const report = await this.reportModel
      .findById(reportId)
      .select('reportedUser status')
      .lean()
      .exec();
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== ReportStatus.OPEN) {
      throw new ConflictException('This report has already been resolved');
    }
    const reportedId = report.reportedUser.toString();

    if (dto.action === ReportResolution.SUSPEND) {
      const target = await this.userService.findOne(reportedId);
      if (target.role === Roles.ADMIN) {
        throw new BadRequestException("You can't suspend an administrator");
      }
      await this.userService.updateStatus(reportedId, UserStatus.SUSPENDED);
    }

    const claimed = await this.reportModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(reportId), status: ReportStatus.OPEN },
        {
          status: RESOLUTION_STATUS[dto.action],
          resolvedBy: new Types.ObjectId(adminId),
          resolvedAt: new Date(),
          resolutionNote: dto.note?.trim() || undefined,
        },
        { new: true },
      )
      .populate<{ reporter: PartyRef }>('reporter', 'name avatar')
      .populate<{ reportedUser: PartyRef }>('reportedUser', 'name avatar')
      .lean()
      .exec();
    if (!claimed) {
      throw new ConflictException('This report has already been resolved');
    }

    if (dto.action === ReportResolution.WARN) {
      this.eventEmitter.emit(DomainEvents.USER_WARNED, {
        userId: reportedId,
        note: dto.note?.trim() || undefined,
      } satisfies UserWarnedEvent);
    }

    return this.toAdminDto(claimed);
  }

  private toAdminDto(r: LeanReport): AdminReportDto {
    return {
      id: r._id.toString(),
      status: r.status,
      targetType: r.targetType,
      reason: r.reason,
      details: r.details,
      reporter: party(r.reporter as PartyRef),
      reportedUser: party(r.reportedUser as PartyRef),
      conversationId: r.conversationId?.toString(),
      messageId: r.messageId?.toString(),
      evidence: r.evidence.map((e) => ({
        messageId: e.messageId.toString(),
        senderId: e.sender.toString(),
        content: e.content,
        sentAt: e.sentAt,
        wasDeleted: e.wasDeleted,
      })),
      resolutionNote: r.resolutionNote,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
    };
  }
}
