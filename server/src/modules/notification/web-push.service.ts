import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import webPushConfig from './config/web-push.config';
import {
  PushSubscription,
  PushSubscriptionDocument,
} from './schema/push-subscription.schema';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { NotificationDto } from './dto/notification.dto';

/**
 * The server POSTs to whatever endpoint a client registers, so only the
 * browsers' real push services are accepted (no SSRF via a crafted URL).
 */
const PUSH_SERVICE_HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome, Edge, Opera, Samsung
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^web\.push\.apple\.com$/, // Safari (macOS, iOS 16.4+ installed PWAs)
  /\.notify\.windows\.com$/, // legacy Edge
];

/** The push service no longer knows this subscription: forget it. */
const GONE_STATUSES = new Set([404, 410]);
const SEND_CONCURRENCY = 20;
const PUSH_TTL_SECONDS = 60 * 60 * 24;

/** What the service worker (`client/public/push-sw.js`) receives. */
export interface PushPayload {
  title: string;
  body: string;
  link: string;
  /** Same tag replaces the earlier OS notification (grouped threads). */
  tag: string;
}

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let host: string;
  try {
    host = new URL(endpoint).hostname;
  } catch {
    return false;
  }
  return PUSH_SERVICE_HOSTS.some((pattern) => pattern.test(host));
}

export function toPushPayload(n: NotificationDto): PushPayload {
  return {
    title: n.count > 1 ? `${n.title} (${n.count})` : n.title,
    body: n.body,
    link: n.link,
    tag: `${n.type}:${n.link}`,
  };
}

/**
 * OS-level notifications through the Web Push protocol (VAPID), so a user
 * hears about a message or new notes with the app closed. A best-effort
 * extra channel: the notification row is already stored and socket-pushed.
 */
@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);

  constructor(
    @InjectModel(PushSubscription.name)
    private readonly subscriptionModel: Model<PushSubscriptionDocument>,
    @Inject(webPushConfig.KEY)
    private readonly config: ConfigType<typeof webPushConfig>,
  ) {}

  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.warn(
        'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT not set: web push is disabled, notifications stay in-app',
      );
      return;
    }
    webpush.setVapidDetails(
      this.config.subject!,
      this.config.publicKey!,
      this.config.privateKey!,
    );
  }

  /** Null when push is not configured; the client then hides the toggle. */
  publicKey(): { publicKey: string | null } {
    return {
      publicKey: this.config.enabled ? this.config.publicKey! : null,
    };
  }

  /**
   * Keyed by endpoint: the same browser signing in as someone else moves
   * the subscription to the new user rather than notifying both.
   */
  async subscribe(userId: string, dto: PushSubscriptionDto): Promise<void> {
    if (!isAllowedPushEndpoint(dto.endpoint)) {
      throw new BadRequestException('Unsupported push service endpoint');
    }
    await this.subscriptionModel
      .updateOne(
        { endpoint: dto.endpoint },
        {
          $set: {
            user: new Types.ObjectId(userId),
            p256dh: dto.keys.p256dh,
            auth: dto.keys.auth,
          },
        },
        { upsert: true },
      )
      .exec();
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subscriptionModel
      .deleteOne({ endpoint, user: new Types.ObjectId(userId) })
      .exec();
  }

  /** Never rejects: failures are logged here, per subscription. */
  async send(
    entries: ReadonlyArray<{ userId: string; notification: NotificationDto }>,
  ): Promise<void> {
    if (!this.config.enabled || entries.length === 0) return;

    let subscriptions: Array<PushSubscription & { _id: Types.ObjectId }>;
    try {
      subscriptions = await this.subscriptionModel
        .find({
          user: { $in: entries.map((e) => new Types.ObjectId(e.userId)) },
        })
        .lean()
        .exec();
    } catch (err) {
      this.logger.error(
        `Failed to load push subscriptions for ${entries.length} user(s)`,
        err instanceof Error ? err.stack : String(err),
      );
      return;
    }

    const byUser = new Map(entries.map((e) => [e.userId, e.notification]));
    const jobs = subscriptions.flatMap((sub) => {
      const notification = byUser.get(sub.user.toString());
      return notification ? [{ sub, notification }] : [];
    });

    for (let i = 0; i < jobs.length; i += SEND_CONCURRENCY) {
      await Promise.all(
        jobs
          .slice(i, i + SEND_CONCURRENCY)
          .map(({ sub, notification }) => this.deliver(sub, notification)),
      );
    }
  }

  private async deliver(
    sub: PushSubscription & { _id: Types.ObjectId },
    notification: NotificationDto,
  ): Promise<void> {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(toPushPayload(notification)),
        { TTL: PUSH_TTL_SECONDS },
      );
    } catch (err) {
      if (
        err instanceof webpush.WebPushError &&
        GONE_STATUSES.has(err.statusCode)
      ) {
        await this.prune(sub._id);
        return;
      }
      this.logger.warn(
        `Web push for user ${sub.user.toString()} failed${err instanceof webpush.WebPushError ? ` (HTTP ${err.statusCode})` : ''}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async prune(id: Types.ObjectId): Promise<void> {
    try {
      await this.subscriptionModel.deleteOne({ _id: id }).exec();
    } catch (err) {
      this.logger.warn(
        `Could not delete expired push subscription ${id.toString()}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
