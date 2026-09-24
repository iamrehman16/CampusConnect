/**
 * Seeds the demo database (BACKLOG.md H1). See ./README.md.
 *
 * Everything goes through the real services (register → onboarding →
 * resource create/approve → posts/upvotes → applications → mentorship
 * lifecycle → chat) so reputation, tiers, notifications and RAG ingestion
 * are produced by the same code paths the app uses. Only timestamps and
 * download counts are patched afterwards, since services stamp "now".
 */
import 'reflect-metadata';
import mongoose from 'mongoose';
import { QdrantClient } from '@qdrant/js-client-rest';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Queue } from 'bullmq';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEMO_DB_SUFFIX = '_demo';
const CLOUDINARY_DEMO_TAG = 'campusconnect_demo';
const INGESTION_TIMEOUT_MS = 25 * 60 * 1000;

const log = (msg: string) => console.log(`[seed] ${msg}`);

// ── Environment & guard ─────────────────────────────────────────────────────

function demoDbName(uri: string): string {
  const { pathname } = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:'));
  return decodeURIComponent(pathname.replace(/^\//, ''));
}

function configureEnvironment(): string {
  const uri = process.env.DEMO_MONGO_URI;
  if (!uri) {
    throw new Error(
      'DEMO_MONGO_URI is not set. Point it at a database whose name ends in "_demo" (see scripts/seed-demo/README.md).',
    );
  }
  const dbName = demoDbName(uri);
  if (!dbName.endsWith(DEMO_DB_SUFFIX)) {
    throw new Error(
      `Refusing to seed "${dbName || '(no database in URI)'}": the target database name must end in "${DEMO_DB_SUFFIX}". This script drops the whole database.`,
    );
  }

  // AppModule reads MONGO_URI in production and MONGO_URI_Local otherwise;
  // pin both so the app context can only ever open the demo DB. process.env
  // takes precedence over .env in ConfigModule.
  process.env.MONGO_URI = uri;
  process.env.MONGO_URI_Local = uri;
  process.env.QDRANT_COLLECTION_SUFFIX ||= '_demo';
  process.env.BULL_PREFIX ||= 'bull_demo';
  return dbName;
}

// ── Reset (before the app context exists) ───────────────────────────────────

async function resetExternalState(uri: string): Promise<void> {
  const conn = await mongoose.createConnection(uri).asPromise();
  await conn.dropDatabase();
  await conn.close();
  log('dropped demo database');

  const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
  });
  const { collections } = await qdrant.getCollections();
  const suffix = process.env.QDRANT_COLLECTION_SUFFIX ?? '';
  for (const base of ['campus_resources', 'campus_memory']) {
    const name = `${base}${suffix}`;
    if (collections.some((c) => c.name === name)) {
      await qdrant.deleteCollection(name);
      log(`deleted Qdrant collection ${name}`);
    }
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  for (const resourceType of ['image', 'raw'] as const) {
    await cloudinary.api.delete_resources_by_tag(CLOUDINARY_DEMO_TAG, {
      resource_type: resourceType,
    });
  }
  log('deleted previous demo files from Cloudinary');

  const queue = new Queue('rag-ingestion', {
    connection: { url: process.env.REDIS_LOCAL_URL },
    prefix: process.env.BULL_PREFIX,
  });
  await queue.obliterate({ force: true });
  await queue.close();
  log('cleared demo ingestion queue');
}

function uploadPdf(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw',
  userId: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        tags: [`user_${userId}`, CLOUDINARY_DEMO_TAG],
      },
      (err, res) => {
        if (err || !res) {
          reject(err instanceof Error ? err : new Error(JSON.stringify(err)));
          return;
        }
        resolve(res);
      },
    );
    stream.end(buffer);
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const dbName = configureEnvironment();
  const uri = process.env.DEMO_MONGO_URI as string;
  const wait = !process.argv.includes('--no-wait');
  log(`target database: ${dbName}`);

  await resetExternalState(uri);

  // Imported only after the environment is pinned above.
  const { NestFactory } = await import('@nestjs/core');
  const { getConnectionToken } = await import('@nestjs/mongoose');
  const { getQueueToken } = await import('@nestjs/bullmq');
  const { AppModule } = await import('../../src/app.module');
  const { UserService } = await import('../../src/modules/user/user.service');
  const { ResourceService } =
    await import('../../src/modules/resource/resource.service');
  const { PostService } = await import('../../src/modules/post/post.service');
  const { ChatService } = await import('../../src/modules/chat/chat.service');
  const { MentorshipService } =
    await import('../../src/modules/mentorship/mentorship.service');
  const { ContributorApplicationService } =
    await import('../../src/modules/contributor-application/contributor-application.service');
  const { ReputationService } =
    await import('../../src/modules/reputation/reputation.service');
  const { Roles } = await import('../../src/modules/user/enums/user-role.enum');
  const { USERS, DEMO_PASSWORD } = await import('./data/users');
  const { RESOURCES } = await import('./data/resources');
  const { POSTS, CONVERSATIONS, MENTORSHIPS, APPLICATIONS } =
    await import('./data/community');
  const { renderResourcePdf } = await import('./pdf');
  const { createRng } = await import('./rng');
  const { Backdater } = await import('./backdate');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const users = app.get(UserService);
    const resources = app.get(ResourceService);
    const posts = app.get(PostService);
    const chat = app.get(ChatService);
    const mentorships = app.get(MentorshipService);
    const applications = app.get(ContributorApplicationService);
    const reputation = app.get(ReputationService);
    const connection = app.get<mongoose.Connection>(getConnectionToken());
    const rng = createRng(20260924);
    const back = new Backdater(connection);

    // ── Users ──
    const ids = new Map<string, string>();
    const names = new Map<string, string>();
    const id = (key: string): string => {
      const v = ids.get(key);
      if (!v) throw new Error(`Unknown seed user "${key}"`);
      return v;
    };

    for (const u of USERS) {
      const created = await users.createUser({
        email: u.email,
        password: DEMO_PASSWORD,
        name: u.name,
      });
      const userId = created._id.toString();
      ids.set(u.key, userId);
      names.set(u.key, u.name);

      await users.completeOnboarding(userId, {
        name: u.name,
        department: u.department,
        semester: u.semester,
        academicInfo: u.academicInfo,
        interests: u.interests,
        expertise: u.expertise,
        isOpenToMentor: Boolean(u.mentor),
        avatar: u.avatar,
      });
      if (u.mentor) {
        await users.updateProfile(userId, {
          isOpenToMentor: true,
          mentorBio: u.mentor.bio,
          mentorTopics: u.mentor.topics,
          maxActiveMentees: u.mentor.maxActiveMentees,
        });
      }
      if (u.role === 'admin') await users.updateRole(userId, Roles.ADMIN);
      if (u.role === 'contributor' && u.promotedVia === 'admin') {
        await users.updateRole(userId, Roles.CONTRIBUTOR);
      }
      await back.user(userId, u.joinedMonthsAgo, rng);
    }
    log(`created ${USERS.length} users`);
    const adminId = id('admin');

    // ── Contributor applications (E6) ──
    for (const a of APPLICATIONS) {
      const app_ = await applications.apply(id(a.applicant), {
        reason: a.reason,
        sampleUrl: a.sampleUrl,
      });
      const appId = String(app_._id);
      if (a.outcome === 'approved') await applications.approve(appId, adminId);
      if (a.outcome === 'rejected') {
        await applications.reject(appId, adminId, 'Not enough activity yet.');
      }
      await back.application(appId, a.daysAgo);
    }
    log(`created ${APPLICATIONS.length} contributor applications`);

    // ── Resources (upload → create → approve/reject → RAG ingestion) ──
    const approvedIds: string[] = [];
    for (const [i, r] of RESOURCES.entries()) {
      const uploaderId = id(r.uploader);
      const signature = resources.generateUploadSignature(
        'application/pdf',
        uploaderId,
      );
      const pdf = await renderResourcePdf(r, names.get(r.uploader) ?? '');
      const uploaded = await uploadPdf(
        pdf,
        signature.folder,
        signature.cloudinaryResourceType,
        uploaderId,
      );
      const created = await resources.create(
        {
          title: r.title,
          description: r.description,
          subject: r.subject,
          course: r.course,
          semester: r.semester,
          resourceType: r.resourceType,
          tags: r.tags,
          publicId: uploaded.public_id,
          secureUrl: uploaded.secure_url,
          cloudinarySignature: uploaded.signature,
          version: uploaded.version,
          format: uploaded.format ?? 'pdf',
          bytes: uploaded.bytes,
          originalName: `${r.key}.pdf`,
          cloudinaryResourceType: signature.cloudinaryResourceType,
        },
        uploaderId,
      );
      if (!created) throw new Error(`Resource "${r.key}" was not created`);
      const resourceId = created._id.toString();

      if (r.status === 'approved') {
        await resources.approve(resourceId);
        approvedIds.push(resourceId);
      } else if (r.status === 'rejected') {
        await resources.reject(resourceId, r.rejectionReason ?? 'Rejected');
      }
      // Newest first in RESOURCES order → spread over the last ~80 days.
      const daysAgo = r.status === 'pending' ? 1 + (i % 2) : 3 + i * 4;
      await back.resource(resourceId, daysAgo, rng);
      log(`resource ${i + 1}/${RESOURCES.length}: ${r.title} [${r.status}]`);
    }

    // ── Community ──
    for (const p of POSTS) {
      const post = await posts.createPost(
        { title: p.title, content: p.content },
        id(p.author),
      );
      const postId = String(post._id);
      for (const c of p.comments) {
        const comment = await posts.createComment(
          postId,
          { content: c.content },
          id(c.author),
        );
        await back.comment(String(comment._id), p.daysAgo, c.hoursAfterPost);
      }
      for (const voter of p.upvoters) {
        await posts.togglePostUpvote(postId, id(voter));
      }
      await back.post(postId, p.daysAgo);
    }
    log(`created ${POSTS.length} posts`);

    // ── Mentorships (E10) — accepted ones open their DM thread ──
    for (const m of MENTORSHIPS) {
      const mentorId = id(m.mentor);
      const menteeId = id(m.mentee);
      const requested = await mentorships.request(menteeId, {
        mentorId,
        topic: m.topic,
        introMessage: m.intro,
      });
      let conversationId: string | null = null;
      if (m.outcome === 'active' || m.outcome === 'completed') {
        const accepted = await mentorships.accept(requested.id, mentorId);
        conversationId = accepted.conversationId;
      }
      if (m.outcome === 'declined') {
        await mentorships.decline(requested.id, mentorId, m.declineReason);
      }
      if (conversationId && m.followUps) {
        await sendThread(
          chat,
          back,
          conversationId,
          m.followUps,
          m.unseenTail,
          id,
          [menteeId, mentorId],
        );
      }
      if (m.outcome === 'completed') {
        await mentorships.complete(requested.id, mentorId);
      }
      await back.mentorship(requested.id, m.daysAgo, m.outcome);
      if (conversationId) await back.introMessage(conversationId, m.daysAgo);
    }
    log(`created ${MENTORSHIPS.length} mentorships`);

    // ── Plain DMs ──
    for (const c of CONVERSATIONS) {
      const [a, b] = c.between.map(id);
      const conv = await chat.findOrCreateConversation(a, { participantId: b });
      if (!conv)
        throw new Error(`Conversation ${c.between.join('/')} not created`);
      await sendThread(
        chat,
        back,
        String(conv._id),
        c.messages,
        c.unseenTail,
        id,
        [a, b],
      );
    }
    log(`created ${CONVERSATIONS.length} conversations`);

    // Async @OnEvent listeners (reputation, notifications) run off the
    // request path; let them settle before rewriting their timestamps.
    await new Promise((r) => setTimeout(r, 4000));
    await reputation.recomputeAllScores();
    await back.downloads(approvedIds, rng);
    await back.derived(rng);
    log('backdated timestamps, reputation and notifications');

    if (wait) {
      const queue = app.get<Queue>(getQueueToken('rag-ingestion'));
      await waitForIngestion(queue, approvedIds.length);
    } else {
      log(
        'skipping ingestion wait (--no-wait): jobs stay queued under BULL_PREFIX until a server with the same prefix runs',
      );
    }

    log('done ✓  demo logins: see scripts/seed-demo/README.md');
  } finally {
    await app.close();
  }

  async function sendThread(
    chatService: InstanceType<typeof ChatService>,
    back: InstanceType<typeof Backdater>,
    conversationId: string,
    messages: { from: string; content: string; minutesAgo: number }[],
    unseenTail: number | undefined,
    resolve: (key: string) => string,
    participants: string[],
  ): Promise<void> {
    const seenUpTo = messages.length - (unseenTail ?? 0);
    for (const [i, msg] of messages.entries()) {
      const senderId = resolve(msg.from);
      const created = await chatService.createMessageIdempotent(
        {
          conversationId,
          content: msg.content,
          clientId: `seed-${conversationId}-${i}`,
        },
        senderId,
      );
      if (!created)
        throw new Error(`Message ${i} in ${conversationId} not created`);
      await back.message(String(created._id), conversationId, msg.minutesAgo);
      if (i === seenUpTo - 1) {
        for (const p of participants)
          await chatService.markSeen(conversationId, p);
      }
    }
  }
}

/**
 * Polls the demo ingestion queue until it drains. Jobs that exhaust their
 * own BullMQ attempts (3, exponential backoff — ResourceService.approve)
 * are retried for up to MAX_RETRY_ROUNDS extra rounds: on a flaky network
 * a single CDN/Gemini timeout would otherwise leave that resource out of
 * the RAG index for the whole demo.
 */
async function waitForIngestion(queue: Queue, expected: number): Promise<void> {
  const MAX_RETRY_ROUNDS = 3;
  log(`waiting for RAG ingestion of ${expected} resources…`);
  const started = Date.now();
  let retryRounds = 0;
  for (;;) {
    const c = await queue.getJobCounts(
      'waiting',
      'active',
      'delayed',
      'completed',
      'failed',
    );
    const pending = (c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0);
    const failed = c.failed ?? 0;
    log(
      `ingestion: ${c.completed ?? 0} done, ${pending} pending, ${failed} failed`,
    );
    if (pending === 0) {
      if (failed === 0) return;
      if (retryRounds >= MAX_RETRY_ROUNDS) {
        throw new Error(
          `${failed} ingestion job(s) still failing after ${MAX_RETRY_ROUNDS} retry rounds — check the logs above`,
        );
      }
      retryRounds++;
      log(
        `retrying ${failed} failed job(s) (round ${retryRounds}/${MAX_RETRY_ROUNDS})`,
      );
      for (const job of await queue.getFailed()) await job.retry();
    }
    if (Date.now() - started > INGESTION_TIMEOUT_MS) {
      throw new Error('Timed out waiting for ingestion');
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
}

main().catch((err: unknown) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
