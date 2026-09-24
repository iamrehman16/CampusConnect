# Demo database seed (BACKLOG.md H1)

Builds a realistic, repeatable CampusConnect dataset in a **separate demo
database**: 27 users, 23 resources (20 approved, 2 pending, 1 rejected) with
real lecture-note PDFs, community posts with comments and upvotes, DMs,
mentorships in every lifecycle state, contributor applications, and the
reputation and notifications those actions produce.

Everything goes through the real services, so scores, tiers and
notifications come from the same code as the app. Approved resources are
ingested through the normal BullMQ → LlamaParse → Gemini → Qdrant pipeline,
so the AI assistant can answer from them.

## Run

```bash
cd server
DEMO_MONGO_URI="mongodb+srv://<user>:<pass>@<cluster>/campusconnect_demo?appName=Cluster0" \
  npm run seed:demo
```

- **The database name must end in `_demo`.** The script drops that whole
  database and refuses to run against anything else.
- Uses the local Redis (`REDIS_LOCAL_URL`) and the Qdrant, Cloudinary,
  LlamaParse, Gemini and Groq credentials from `server/.env`.
- It is idempotent. Every run drops the demo DB, deletes the demo Qdrant
  collections (`*_demo`), deletes Cloudinary files tagged
  `campusconnect_demo`, clears the demo queue, and seeds from scratch.
- By default it waits until every approved resource is ingested (about
  5–15 minutes, depending on LlamaParse). It retries failed jobs up to 3
  rounds. `--no-wait` skips the wait, and the jobs are then processed by
  any server started with the same `BULL_PREFIX`.
- Use a replica-set MongoDB such as Atlas. Commenting uses a transaction,
  which a standalone `mongod` rejects.
- If Node's network calls time out intermittently on your machine while
  curl works (broken IPv6), prefix the command with
  `NODE_OPTIONS=--dns-result-order=ipv4first`.
- Expect `NotificationGateway.push … reading 'to'` errors in the log. A
  standalone app context has no Socket.IO server to push to. The
  notifications are still saved before the push.

## Run the app against the demo DB

The demo uses its own Qdrant collections and BullMQ prefix, so it never
reads or writes dev data:

```bash
cd server
MONGO_URI_Local="$DEMO_MONGO_URI" QDRANT_COLLECTION_SUFFIX=_demo BULL_PREFIX=bull_demo \
  npm run start:dev
```

## Demo logins

All accounts share the password **`Demo@2026`**. These are demo-only
credentials on `.example` addresses, which can never receive mail.

| Role | Email | Why use it |
|------|-------|------------|
| Student (main persona) | `ali.hassan@qau.example` | Active, pending and completed mentorships, unread DMs, notifications |
| Contributor / mentor | `ayesha.siddiqui@qau.example` | DSA notes author, 2 pending mentee requests, 1 active mentee |
| Contributor / mentor | `fatima.zahra@qau.example` | ML notes author |
| Contributor (via application) | `usman.tariq@qau.example` | Promoted through the E6 application flow |
| Admin | `admin@qau.example` | 2 pending resources, 1 pending contributor application |

The other students are listed in `data/users.ts`.

## Editing content

- `data/resources.ts` holds the study material. It is rendered to PDF by
  `pdf.ts`, using DejaVu Sans so maths symbols survive parsing. Keep it
  factually correct, because the AI answers from it.
- `data/community.ts` holds the posts, DMs, mentorships and applications.
  `daysAgo`/`minutesAgo` drive the backdating in `backdate.ts`.
- The random choices (download counts, jitter) use a fixed seed in
  `rng.ts`, so every run produces the same data.
