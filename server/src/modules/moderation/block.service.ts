import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserBlock, UserBlockDocument } from './schema/user-block.schema';
import { UserService } from '../user/user.service';

export interface BlockedUserDto {
  id: string;
  name: string;
  avatar?: string;
  blockedAt: Date;
}

/** Deliberately neutral: it must not reveal which side blocked. */
const BLOCKED_MESSAGE = "You can't contact this user";

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

@Injectable()
export class BlockService {
  constructor(
    @InjectModel(UserBlock.name)
    private readonly blockModel: Model<UserBlockDocument>,
    private readonly userService: UserService,
  ) {}

  /** Idempotent: blocking someone you already blocked succeeds. */
  async block(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    // 404s for a user that doesn't exist.
    await this.userService.findOne(blockedId);

    try {
      await this.blockModel.create({
        blocker: new Types.ObjectId(blockerId),
        blocked: new Types.ObjectId(blockedId),
      });
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    await this.blockModel
      .deleteOne({
        blocker: new Types.ObjectId(blockerId),
        blocked: new Types.ObjectId(blockedId),
      })
      .exec();
  }

  async listBlocked(blockerId: string): Promise<BlockedUserDto[]> {
    const rows = await this.blockModel
      .find({ blocker: new Types.ObjectId(blockerId) })
      .sort({ createdAt: -1 })
      .populate<{
        blocked: { _id: Types.ObjectId; name?: string; avatar?: string } | null;
      }>({ path: 'blocked', select: 'name avatar' })
      .lean()
      .exec();

    return rows.flatMap((row) =>
      row.blocked
        ? [
            {
              id: row.blocked._id.toString(),
              name: row.blocked.name ?? '',
              avatar: row.blocked.avatar,
              blockedAt: row.createdAt,
            },
          ]
        : [],
    );
  }

  /** Everyone the user has blocked or who has blocked them, as id strings. */
  async blockedIdsFor(userId: string): Promise<Set<string>> {
    const me = new Types.ObjectId(userId);
    const rows = await this.blockModel
      .find({ $or: [{ blocker: me }, { blocked: me }] })
      .select('blocker blocked')
      .lean()
      .exec();
    return new Set(
      rows.map((r) =>
        r.blocker.equals(me) ? r.blocked.toString() : r.blocker.toString(),
      ),
    );
  }

  /** True when either user has blocked the other. */
  async isBlockedEitherWay(a: string, b: string): Promise<boolean> {
    const [x, y] = [new Types.ObjectId(a), new Types.ObjectId(b)];
    const hit = await this.blockModel
      .exists({
        $or: [
          { blocker: x, blocked: y },
          { blocker: y, blocked: x },
        ],
      })
      .exec();
    return hit !== null;
  }

  /**
   * The single gate for "may these two users contact each other" — called by
   * chat (conversation start + every message) and mentorship requests, so
   * enforcement lives server-side, not only in the UI.
   */
  async assertCanContact(a: string, b: string): Promise<void> {
    if (await this.isBlockedEitherWay(a, b)) {
      throw new ForbiddenException(BLOCKED_MESSAGE);
    }
  }
}
