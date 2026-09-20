import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, QueryFilter, Types } from 'mongoose';
import { Mentorship, MentorshipDocument } from './schema/mentorship.schema';
import {
  MentorshipAction,
  MentorshipRole,
  MentorshipStatus,
  TRANSITIONS,
  resolveTransition,
} from './mentorship.state';
import { MAX_PENDING_REQUESTS_PER_MENTEE } from './mentorship.constants';
import { CreateMentorshipDto } from './dto/create-mentorship.dto';
import { MentorshipQueryDto, MentorshipView } from './dto/mentorship-query.dto';
import { MentorshipDto, MentorshipPartyDto } from './dto/mentorship.dto';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/enums/user-status.enum';
import { DEFAULT_MAX_ACTIVE_MENTEES } from '../user/user.constants';
import { ChatService } from '../chat/chat.service';
import {
  DomainEvents,
  MentorshipAcceptedEvent,
  MentorshipCompletedEvent,
  MentorshipDeclinedEvent,
  MentorshipRequestedEvent,
} from '../../common/events/domain-events';
import { populatedId } from '../../common/utils/populated-id';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';

const PARTY_SELECT = 'name avatar tier department semester';
const PARTIES_POPULATE = [
  { path: 'mentor', select: PARTY_SELECT },
  { path: 'mentee', select: PARTY_SELECT },
];

interface PopulatedParty {
  _id: Types.ObjectId;
  name?: string;
  avatar?: string;
  tier: MentorshipPartyDto['tier'];
  department?: string;
  semester?: number;
}

type MentorshipRecord = Omit<Mentorship, 'mentor' | 'mentee'> & {
  _id: Types.ObjectId;
  mentor: PopulatedParty;
  mentee: PopulatedParty;
};

const toParty = (p: PopulatedParty): MentorshipPartyDto => ({
  id: p._id.toString(),
  name: p.name ?? '',
  avatar: p.avatar,
  tier: p.tier,
  department: p.department,
  semester: p.semester,
});

const toDto = (m: MentorshipRecord): MentorshipDto => ({
  id: m._id.toString(),
  status: m.status,
  topic: m.topic,
  introMessage: m.introMessage,
  declineReason: m.declineReason,
  conversationId: m.conversationId ? m.conversationId.toString() : null,
  mentor: toParty(m.mentor),
  mentee: toParty(m.mentee),
  respondedAt: m.respondedAt,
  completedAt: m.completedAt,
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
});

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

@Injectable()
export class MentorshipService {
  private readonly logger = new Logger(MentorshipService.name);

  constructor(
    @InjectModel(Mentorship.name)
    private readonly mentorshipModel: Model<MentorshipDocument>,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
    private readonly paginationService: PaginationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Request ───────────────────────────────────────────────────────────────

  async request(menteeId: string, dto: CreateMentorshipDto) {
    if (dto.mentorId === menteeId) {
      throw new BadRequestException(
        'You cannot request mentorship from yourself',
      );
    }

    const mentor = await this.userService.findOne(dto.mentorId);
    if (!mentor.isOpenToMentor || mentor.accountStatus !== UserStatus.ACTIVE) {
      throw new BadRequestException('This person is not open to mentoring');
    }

    // Advisory only — the authoritative capacity check is the atomic slot
    // reservation on accept. This just saves a doomed request.
    const max = mentor.maxActiveMentees ?? DEFAULT_MAX_ACTIVE_MENTEES;
    if ((mentor.activeMenteeCount ?? 0) >= max) {
      throw new ConflictException(
        'This mentor has no free slots right now — try again later',
      );
    }

    const waiting = await this.mentorshipModel
      .countDocuments({
        mentee: new Types.ObjectId(menteeId),
        status: MentorshipStatus.PENDING,
      })
      .exec();
    if (waiting >= MAX_PENDING_REQUESTS_PER_MENTEE) {
      throw new ConflictException(
        `You can have at most ${MAX_PENDING_REQUESTS_PER_MENTEE} requests waiting at once`,
      );
    }

    let created: MentorshipDocument;
    try {
      created = await this.mentorshipModel.create({
        mentor: new Types.ObjectId(dto.mentorId),
        mentee: new Types.ObjectId(menteeId),
        topic: dto.topic.trim(),
        introMessage: dto.introMessage.trim(),
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        // Unique partial index on (mentor, mentee) over open statuses.
        throw new ConflictException(
          'You already have an open request or mentorship with this person',
        );
      }
      throw err;
    }

    this.eventEmitter.emit(DomainEvents.MENTORSHIP_REQUESTED, {
      mentorshipId: created.id,
      mentorId: dto.mentorId,
      menteeId,
      topic: created.topic,
    } satisfies MentorshipRequestedEvent);

    return { id: created.id, status: created.status };
  }

  // ─── Transitions ───────────────────────────────────────────────────────────

  async accept(id: string, mentorId: string): Promise<MentorshipDto> {
    // 1. Reserve a slot atomically. Done first so the capacity check and the
    //    counter update are one write; released on any later failure.
    const reserved = await this.userService.reserveMenteeSlot(mentorId);
    if (!reserved) {
      throw new ConflictException(
        'You are at your mentee limit — complete a mentorship or raise your limit first',
      );
    }

    // 2. Claim the request (atomic pending -> active; enforces who/what).
    let claimed: MentorshipDocument;
    try {
      claimed = await this.claim(id, mentorId, MentorshipAction.ACCEPT);
    } catch (err) {
      await this.userService.releaseMenteeSlot(mentorId);
      throw err;
    }

    // 3. Open the DM thread and post the mentee's intro as its first message.
    //    Idempotent (deterministic clientId), so a rolled-back accept can be
    //    retried without duplicating the message.
    const menteeId = claimed.mentee.toString();
    let conversationId: string;
    try {
      conversationId = await this.openConversation(claimed, mentorId, menteeId);
    } catch (err) {
      this.logger.error(
        `Accept ${id}: could not open conversation; rolling back to pending`,
        err instanceof Error ? err.stack : String(err),
      );
      await this.mentorshipModel
        .updateOne(
          { _id: claimed._id, status: MentorshipStatus.ACTIVE },
          { status: MentorshipStatus.PENDING, respondedAt: null },
        )
        .exec();
      await this.userService.releaseMenteeSlot(mentorId);
      throw err;
    }

    this.eventEmitter.emit(DomainEvents.MENTORSHIP_ACCEPTED, {
      mentorshipId: id,
      mentorId,
      menteeId,
      conversationId,
    } satisfies MentorshipAcceptedEvent);

    return this.getOne(id);
  }

  async decline(
    id: string,
    mentorId: string,
    reason?: string,
  ): Promise<MentorshipDto> {
    const claimed = await this.claim(id, mentorId, MentorshipAction.DECLINE, {
      declineReason: reason?.trim() || undefined,
    });

    this.eventEmitter.emit(DomainEvents.MENTORSHIP_DECLINED, {
      mentorshipId: id,
      mentorId,
      menteeId: claimed.mentee.toString(),
      reason: claimed.declineReason,
    } satisfies MentorshipDeclinedEvent);

    return this.getOne(id);
  }

  async cancel(id: string, menteeId: string): Promise<MentorshipDto> {
    await this.claim(id, menteeId, MentorshipAction.CANCEL);
    return this.getOne(id);
  }

  async complete(id: string, actorId: string): Promise<MentorshipDto> {
    const claimed = await this.claim(id, actorId, MentorshipAction.COMPLETE, {
      completedAt: new Date(),
      completedBy: new Types.ObjectId(actorId),
    });

    const mentorId = claimed.mentor.toString();
    await this.userService.releaseMenteeSlot(mentorId);

    this.eventEmitter.emit(DomainEvents.MENTORSHIP_COMPLETED, {
      mentorshipId: id,
      mentorId,
      menteeId: claimed.mentee.toString(),
      completedBy: actorId,
    } satisfies MentorshipCompletedEvent);

    return this.getOne(id);
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async list(
    userId: string,
    dto: MentorshipQueryDto,
  ): Promise<PaginatedResult<MentorshipDto>> {
    const me = new Types.ObjectId(userId);
    const side = dto.as === MentorshipView.AS_MENTOR ? 'mentor' : 'mentee';

    const result = await this.paginationService.paginateWithPopulate(
      this.mentorshipModel,
      dto,
      {
        build: () => ({
          [side]: me,
          ...(dto.status?.length && { status: { $in: dto.status } }),
        }),
      },
      { build: () => ({ createdAt: -1 }) },
      PARTIES_POPULATE,
    );

    return {
      ...result,
      data: result.data.map((m) => toDto(m as unknown as MentorshipRecord)),
    };
  }

  async pendingCount(mentorId: string): Promise<{ count: number }> {
    const count = await this.mentorshipModel
      .countDocuments({
        mentor: new Types.ObjectId(mentorId),
        status: MentorshipStatus.PENDING,
      })
      .exec();
    return { count };
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private async getOne(id: string): Promise<MentorshipDto> {
    const doc = await this.mentorshipModel
      .findById(id)
      .populate(PARTIES_POPULATE)
      .lean()
      .exec();
    if (!doc) throw new NotFoundException('Mentorship not found');
    return toDto(doc as unknown as MentorshipRecord);
  }

  /**
   * Apply a transition as ONE atomic update whose filter comes from the
   * transition table (right status AND right party), so races resolve in the
   * database: of two concurrent accepts/cancels exactly one matches.
   */
  private async claim(
    id: string,
    actorId: string,
    action: MentorshipAction,
    extra: Partial<Mentorship> = {},
  ): Promise<MentorshipDocument> {
    const rule = TRANSITIONS[action];
    const actor = new Types.ObjectId(actorId);
    const actorFilter: QueryFilter<MentorshipDocument> =
      rule.roles.length === 1
        ? { [rule.roles[0]]: actor }
        : { $or: rule.roles.map((role) => ({ [role]: actor })) };

    const updated = await this.mentorshipModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          status: { $in: rule.from },
          ...actorFilter,
        },
        { ...extra, status: rule.to, respondedAt: new Date() },
        { new: true },
      )
      .exec();
    if (updated) return updated;

    // Nothing matched — work out why, so the caller gets the right error.
    const existing = await this.mentorshipModel.findById(id).lean().exec();
    const role: MentorshipRole | null = !existing
      ? null
      : existing.mentor.equals(actor)
        ? 'mentor'
        : existing.mentee.equals(actor)
          ? 'mentee'
          : null;

    // Not found, or not a party: indistinguishable on purpose (no probing).
    if (!existing || !role) throw new NotFoundException('Mentorship not found');

    const verdict = resolveTransition(existing.status, action, role);
    if (!verdict.ok && verdict.reason === 'wrong_role') {
      throw new ForbiddenException(
        `Only the ${rule.roles.join(' or ')} can ${action} this`,
      );
    }
    throw new ConflictException(
      `Cannot ${action}: this mentorship is ${existing.status}`,
    );
  }

  private async openConversation(
    mentorship: MentorshipDocument,
    mentorId: string,
    menteeId: string,
  ): Promise<string> {
    const conversation = await this.chatService.findOrCreateConversation(
      mentorId,
      { participantId: menteeId },
    );
    const conversationId = populatedId(conversation?._id);
    if (!conversationId) {
      throw new Error('Conversation could not be resolved');
    }

    await this.chatService.createMessageIdempotent(
      {
        conversationId,
        content: `Hi! I'd like your help with ${mentorship.topic}.\n\n${mentorship.introMessage}`,
        clientId: `mentorship-intro-${mentorship.id}`,
      },
      menteeId,
    );
    // The mentor already read this in their inbox — don't badge it unread.
    await this.chatService.markSeen(conversationId, mentorId);

    await this.mentorshipModel
      .updateOne(
        { _id: mentorship._id },
        { conversationId: new Types.ObjectId(conversationId) },
      )
      .exec();
    return conversationId;
  }
}
