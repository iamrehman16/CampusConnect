# CampusConnect — Project Constitution

This file is the persistent context for any AI assistant (Gemini CLI, Claude, etc.)
working in this repo. Read this before touching code. It is NOT a backlog —
open bugs and next tasks live in `BACKLOG.md` (or GitHub Projects), not here.

---

## 1. What this project is

CampusConnect is a full-stack university platform (Final Year Project, QAU,
supervised by Dr. Ghazanfar) with a long-term ambition of becoming a
multi-tenant B2B SaaS. It combines:
- A resource-sharing / social platform for students (feed, contributors, chat)
- An AI assistant with RAG over uploaded academic resources
- A real-time messenger
- An admin dashboard for moderation and user management

Repo layout: this is a **true monorepo** — `client/` and `server/` are two
independent projects (separate `package.json`, lockfile, `node_modules` each)
co-located in a single git repository. Cross-cutting changes (e.g. API shape
changes touching both sides) can now be committed atomically in one commit
that touches both `client/` and `server/`.

Migrated from two independent repos (`CampusConnect-Client`,
`CampusConnect-Server`) in September 2026, preserving full commit history
under the `client/` and `server/` prefixes. The original repos remain on
GitHub, untouched, as read-only archives.

---

## 2. Stack

**Backend:** NestJS, TypeScript, MongoDB (Mongoose), BullMQ + Redis (async jobs),
Socket.IO (real-time), Groq (LLM inference), Qdrant Cloud (vector store),
Gemini `gemini-embedding-001` (embeddings, 3072 dim), LlamaParse (document parsing),
Cloudinary (file storage, signed upload flow).

**Backend (auth/infra additions):** `@nestjs/passport` with `passport-jwt` /
`passport-local` strategies, `@nestjs/event-emitter` (used for the
`@OnEvent` ingestion trigger on resource approval), `@nestjs/mapped-types`,
`argon2` and `bcrypt` for password hashing.

**Frontend:** React, Vite, MUI, Zustand (UI state), TanStack Query (server state),
`vite-plugin-pwa` + IndexedDB (`idb-keyval`) for offline/PWA support, Recharts (admin charts),
`react-hook-form` (forms), `react-hot-toast` (notifications), `date-fns` (date handling).

---

## 3. Non-negotiable conventions

- **Feature-based folder structure** mirroring NestJS modules. Don't flatten
  into generic `controllers/` / `services/` folders.
- **Separation of concerns** — services do one thing; don't let controllers
  or gateways accumulate business logic.
- **Senior-level patterns over shortcuts**, even under FYP deadline pressure.
  Prefer explicit, typed, testable code over quick hacks — flag shortcuts
  taken for time reasons rather than silently leaving them.
- **One fix / one concern per commit.** Don't bundle unrelated changes.
- **No `any`, no silent failures.** Every external call (Qdrant, Groq,
  Cloudinary, LlamaParse) needs explicit error handling, not a bare try/catch
  that swallows the error.
- **Explain before you patch.** When fixing a bug, state the root cause first.
  Don't apply a fix that only makes a symptom disappear.

---

## 4. Intentional decisions — do NOT "helpfully" refactor these

These look unconventional but were deliberate. An AI assistant scanning the
code cold might flag them as anti-patterns — they are not.

- **SSE via manual `res.write()`**, not `@Sse()` decorator, on
  `@Post('chat/stream')`. Chosen specifically to support POST request bodies,
  which Nest's `@Sse()` doesn't support cleanly.
- **Frontend streaming client uses raw `fetch`**, not axios — axios doesn't
  handle streaming response bodies well.
- **MongoDB ObjectIds are converted to UUIDs via MD5 hashing** before being
  used as Qdrant point IDs. Qdrant requires UUID or integer point IDs.
- **Groq is explicitly instructed not to cite inline.** Citations are built
  programmatically from retrieved context with deduplication, not parsed out
  of the model's text output.
- **Chat context uses a 6-exchange sliding window** with single-call summary
  compression via an 8B model, rather than sending full history.
- **`getCollections()` workaround** exists in `VectorStoreService` for a
  Qdrant client quirk — don't remove without checking why it's there.
- **Streaming hooks are split into `useStreamRefs`, `useDrainQueue`, and
  `useStreamMessage`** as a deliberate SoC refactor after race-condition bugs.
  Don't recombine them for "simplicity."
- **Streaming updates are throttled via `requestAnimationFrame` and manual
  batching inside `useDrainQueue.ts`**, not `flushSync`. This replaced an
  earlier `flushSync`-based fix for React 18 batching lag/jitter — if you see
  references to `flushSync` elsewhere (docs, old notes), they're stale.
- **Chat message de-duplication** relies on catching MongoDB's `E11000`
  duplicate-key error (`isDuplicateClientIdError` in `ChatService`) rather
  than a pre-check query — this is intentional, not a missed validation step.
- **`ConversationSchema` has a unique index on `participants`**, enforcing
  exactly one conversation per pair of users at the database level rather
  than in application logic.
- **`DocumentParserService` polls LlamaParse with retry logic and streams
  `FormData` directly**, deliberately avoiding temp file storage during
  ingestion. Don't "simplify" this into a synchronous single-call pattern —
  LlamaParse's API is async and requires polling for job completion.

---

## 5. Working style (apply by default)

- The developer (Abdur) prefers **detailed prompts with full root-cause
  context** over blind auto-fixes — when suggesting a fix, explain the why,
  not just the diff.
- Work **one committed fix at a time.** Don't chain multiple unrelated fixes
  in one pass without checkpoints.
- Currently prioritizing **code health over new features** — repo-wide audit
  (types, lint, dead code, error-handling gaps) before shipping anything new.
- Before starting a session, sanity-check the environment: Qdrant Cloud
  cluster can go dormant on inactivity; MongoDB connection and Socket.IO CORS
  handshake are known past failure points after time away from the project.

---

## 6. Where things live

- **Backlog / active tasks:** `BACKLOG.md` in repo root (or GitHub Projects
  board, if adopted — check both).
- **FYP docs** (SDD, SPMP, test doc, UML): kept separately, not in this file.
- **This file itself:** update only when an architectural decision or
  convention actually changes — not for day-to-day task tracking.

---

## 7. Known gaps as of last review (verify against current code, don't assume)

- MongoDB `participantsKey` schema migration for the messenger.
- `ERR_HTTP_HEADERS_SENT` guard in the SSE error handler.
- E11000 duplicate key handling on `conversations` collection — fix was
  designed at one point; confirm whether it was applied.

> Note: RAG citation pipeline issue is resolved as of this writing — remove
> this note once confirmed stable across sessions.