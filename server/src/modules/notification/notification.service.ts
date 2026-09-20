import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schema/notification.schema';
import { NotificationType } from './enums/notification-type.enum';
import {
  NotificationPayloads,
  notificationBuilders,
} from './notification.registry';
import { NotificationDto } from './dto/notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  PaginatedResult,
  PaginationService,
} from '../../common/services/pagination.service';

type NotificationRecord = Notification & { _id: Types.ObjectId };

function toDto(doc: NotificationRecord): NotificationDto {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    link: doc.link,
    count: doc.count,
    isRead: doc.isRead,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly paginationService: PaginationService,
  ) {}

  /**
   * Create a notification, or — when the type's builder supplies a
   * `dedupeKey` — bump the user's existing unread one for that key.
   */
  async record<T extends NotificationType>(
    userId: string,
    type: T,
    payload: NotificationPayloads[T],
  ): Promise<NotificationDto> {
    const { dedupeKey, ...content } = notificationBuilders[type](payload);
    const user = new Types.ObjectId(userId);

    if (!dedupeKey) {
      const created = await this.notificationModel.create({
        user,
        type,
        ...content,
      });
      return toDto(created.toObject());
    }

    const filter = { user, dedupeKey, isRead: false };
    const update = { $set: { type, ...content }, $inc: { count: 1 } };

    try {
      const doc = await this.notificationModel
        .findOneAndUpdate(filter, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
        .lean()
        .exec();
      return toDto(doc);
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
      // Lost an upsert race on the unique unread-per-key index — the winner's
      // row exists now, so a plain update (no upsert) will hit it.
      const doc = await this.notificationModel
        .findOneAndUpdate(filter, update, { new: true })
        .lean()
        .exec();
      if (!doc) throw err;
      return toDto(doc);
    }
  }

  async list(
    userId: string,
    dto: NotificationQueryDto,
  ): Promise<PaginatedResult<NotificationDto>> {
    const user = new Types.ObjectId(userId);
    const result = await this.paginationService.paginate(
      this.notificationModel,
      dto,
      {
        build: () => ({ user, ...(dto.unreadOnly && { isRead: false }) }),
      },
      { build: () => ({ createdAt: -1 }) },
    );

    return {
      ...result,
      data: result.data.map((doc) => toDto(doc as NotificationRecord)),
    };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationModel
      .countDocuments({ user: new Types.ObjectId(userId), isRead: false })
      .exec();
    return { count };
  }

  /** Ownership-checked: the filter includes the caller's id. */
  async markRead(userId: string, id: string): Promise<NotificationDto> {
    const doc = await this.notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
        { isRead: true, readAt: new Date() },
        { new: true },
      )
      .lean()
      .exec();

    if (!doc) throw new NotFoundException('Notification not found');
    return toDto(doc);
  }

  /** Clears the user's grouped unread notification for a key, if any. */
  async markReadByDedupeKey(
    userId: string,
    dedupeKey: string,
  ): Promise<number> {
    const res = await this.notificationModel
      .updateMany(
        { user: new Types.ObjectId(userId), dedupeKey, isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();
    return res.modifiedCount;
  }

  async markAllRead(userId: string): Promise<{ modified: number }> {
    const res = await this.notificationModel
      .updateMany(
        { user: new Types.ObjectId(userId), isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();
    return { modified: res.modifiedCount };
  }
}
