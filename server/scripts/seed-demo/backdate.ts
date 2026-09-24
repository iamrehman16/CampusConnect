import { Connection, Types } from 'mongoose';
import type { Rng } from './rng';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Rewrites timestamps after documents were created through the services
 * (which stamp "now"), so the demo has a believable history. Writes go
 * straight to the collections to bypass Mongoose's automatic timestamps.
 */
export class Backdater {
  private readonly now = Date.now();

  constructor(private readonly conn: Connection) {}

  private col(model: string) {
    return this.conn.model(model).collection;
  }

  private at(msAgo: number): Date {
    return new Date(this.now - msAgo);
  }

  private postTime(daysAgo: number): number {
    return this.now - daysAgo * DAY;
  }

  async user(id: string, monthsAgo: number, rng: Rng): Promise<void> {
    const createdAt = this.at(monthsAgo * 30 * DAY + rng.int(0, 20) * HOUR);
    await this.col('User').updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          createdAt,
          updatedAt: createdAt,
          lastSeenAt: this.at(rng.int(1, 72) * HOUR),
        },
      },
    );
  }

  async application(id: string, daysAgo: number): Promise<void> {
    const createdAt = this.at(daysAgo * DAY);
    const doc = await this.col('ContributorApplication').findOne({
      _id: new Types.ObjectId(id),
    });
    await this.col('ContributorApplication').updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          createdAt,
          updatedAt: createdAt,
          ...(doc?.reviewedAt
            ? { reviewedAt: new Date(createdAt.getTime() + DAY) }
            : {}),
        },
      },
    );
  }

  async resource(id: string, daysAgo: number, rng: Rng): Promise<void> {
    const createdAt = this.at(daysAgo * DAY + rng.int(0, 10) * HOUR);
    await this.col('Resource').updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { createdAt, updatedAt: createdAt } },
    );
  }

  async post(id: string, daysAgo: number): Promise<void> {
    const createdAt = new Date(this.postTime(daysAgo));
    await this.col('Post').updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { createdAt, updatedAt: createdAt } },
    );
  }

  async comment(
    id: string,
    postDaysAgo: number,
    hoursAfter: number,
  ): Promise<void> {
    const t = Math.min(
      this.postTime(postDaysAgo) + hoursAfter * HOUR,
      this.now - MIN,
    );
    await this.col('Comment').updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { createdAt: new Date(t), updatedAt: new Date(t) } },
    );
  }

  async message(
    id: string,
    conversationId: string,
    minutesAgo: number,
  ): Promise<void> {
    const createdAt = this.at(minutesAgo * MIN);
    await this.col('Message').updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { createdAt, updatedAt: createdAt } },
    );
    void conversationId; // lastMessage pointers are recomputed in derived()
  }

  async mentorship(
    id: string,
    daysAgo: number,
    outcome: 'pending' | 'active' | 'completed' | 'declined',
  ): Promise<void> {
    const createdAt = this.at(daysAgo * DAY);
    const respondedAt =
      outcome === 'pending' ? null : new Date(createdAt.getTime() + 6 * HOUR);
    const completedAt =
      outcome === 'completed'
        ? new Date(createdAt.getTime() + daysAgo * 0.7 * DAY)
        : null;
    await this.col('Mentorship').updateOne(
      { _id: new Types.ObjectId(id) },
      {
        $set: {
          createdAt,
          updatedAt: completedAt ?? respondedAt ?? createdAt,
          respondedAt,
          completedAt,
        },
      },
    );
  }

  /** The intro message MentorshipService.accept() posts into the new DM. */
  async introMessage(
    conversationId: string,
    mentorshipDaysAgo: number,
  ): Promise<void> {
    const t = this.at(mentorshipDaysAgo * DAY - 6 * HOUR);
    await this.col('Message').updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        clientId: { $not: /^seed-/ },
      },
      { $set: { createdAt: t, updatedAt: t } },
    );
  }

  async downloads(resourceIds: string[], rng: Rng): Promise<void> {
    for (const id of resourceIds) {
      await this.col('Resource').updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { downloads: rng.int(4, 140) } },
      );
    }
  }

  /** Timestamps that depend on other documents' (already backdated) times. */
  async derived(rng: Rng): Promise<void> {
    // Seen receipts shortly after the message they acknowledge.
    await this.col('Message').updateMany({ seenAt: { $ne: null } }, [
      { $set: { seenAt: { $add: ['$createdAt', 3 * MIN] } } },
    ]);

    // Conversation list ordering and previews follow the latest message.
    for (const conv of await this.col('Conversation').find().toArray()) {
      const [last] = await this.col('Message')
        .find({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();
      if (!last) continue;
      await this.col('Conversation').updateOne(
        { _id: conv._id },
        {
          $set: {
            lastMessage: last._id,
            lastMessageAt: last.createdAt,
            createdAt: last.createdAt,
            updatedAt: last.createdAt,
          },
        },
      );
    }

    // Reputation ledger rows line up with what earned them.
    const events = await this.col('ReputationEvent').find().toArray();
    for (const e of events) {
      const [sourceId] = String(e.sourceId).split(':');
      const source =
        (await this.col('Resource').findOne({
          _id: new Types.ObjectId(sourceId),
        })) ??
        (await this.col('Post').findOne({ _id: new Types.ObjectId(sourceId) }));
      if (!source) continue;
      const t = Math.min(
        (source.createdAt as Date).getTime() + rng.int(2, 30) * HOUR,
        this.now - MIN,
      );
      await this.col('ReputationEvent').updateOne(
        { _id: e._id },
        { $set: { createdAt: new Date(t) } },
      );
    }

    // Notifications: anchor to the entity in their link when there is one;
    // anything older than two days has been read.
    const hex = /[a-f0-9]{24}/;
    for (const n of await this.col('Notification').find().toArray()) {
      const ref = String(n.link ?? '').match(hex)?.[0];
      let t = this.now - rng.int(1, 240) * HOUR;
      if (ref) {
        const oid = new Types.ObjectId(ref);
        const anchor =
          (await this.col('Resource').findOne({ _id: oid })) ??
          (await this.col('Mentorship').findOne({ _id: oid })) ??
          (await this.col('Conversation').findOne({ _id: oid }));
        const when = (anchor?.updatedAt ?? anchor?.createdAt) as
          | Date
          | undefined;
        if (when) t = Math.min(when.getTime() + HOUR, this.now - MIN);
      }
      const createdAt = new Date(t);
      const isRead = t < this.now - 2 * DAY;
      await this.col('Notification').updateOne(
        { _id: n._id },
        {
          $set: {
            createdAt,
            updatedAt: createdAt,
            isRead,
            readAt: isRead ? new Date(t + HOUR) : null,
          },
        },
      );
    }
  }
}
