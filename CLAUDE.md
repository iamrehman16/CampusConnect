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

## 3. Non-negotiable principles

Each one says how it's enforced. "CI-gated" means a PR is mechanically
blocked; anything else relies on review discipline — treat it as equally
binding, just not (yet) machine-checked.

1. **Every PR into `main` must pass CI.** *(CI-gated: `client-ci` /
   `server-ci`, required checks on `main`.)* Typecheck+build is a hard gate
   today. Lint and server tests run and report on every PR but don't block
   yet — see §5 for why and what flips them on.
2. **One fix / one concern per commit.** *(Review discipline.)* Don't bundle
   an unrelated refactor, formatting pass, or second bug fix into the same
   commit as the thing you set out to fix.
3. **No `any`, no silent failures.** *(Review discipline; partially
   CI-visible via lint.)* Every external call (Qdrant, Groq, Cloudinary,
   LlamaParse, Mongo) needs explicit error handling — log with enough
   context to debug it, then rethrow or surface a typed error. A bare
   `catch {}` that swallows the error is a bug, not a fix. If a type is
   genuinely unknown, use `unknown` plus a narrowing guard, not `any` or
   `@ts-ignore`.
4. **Explain root cause before patching.** *(Review discipline.)* State why
   a bug happens before changing code. If time pressure means you're only
   fixing the symptom, say so explicitly in the commit/PR — don't let a
   symptom-fix pass as a root-cause fix.
5. **Feature-based folder structure**, mirroring NestJS modules on the
   backend and feature folders on the frontend. Don't flatten into generic
   `controllers/` / `services/` / `components/` buckets.
6. **Separation of concerns.** Controllers and gateways stay thin; business
   logic lives in services. If a controller method is doing more than
   parsing input, calling a service, and shaping the response, move logic
   out.
7. **Never commit secrets.** `.env` files are gitignored; `.env.example`
   documents shape only, never real values, for both `client/` and
   `server/`.
8. **Don't refactor the decisions in §4 without discussing first** — they
   read as anti-patterns out of context but are deliberate.

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

## 5. CI & merge gate

Two workflows in `.github/workflows/`, one per app (`client-ci.yml`,
`server-ci.yml`), both triggered on every push/PR to `main` — no path
filters, deliberately: a path-filtered required check that never fires for
a PR outside that path leaves the PR stuck "pending" forever.

- **Hard gate (required status check):** `client-typecheck-and-build` and
  `server-typecheck-and-build`. Build already fails on a type error
  (`tsc -b` / `tsc -p tsconfig.build.json`), so this is typecheck+build in
  one step. Branch protection on `main` requires both, blocks force-push and
  branch deletion.
- **Advisory, not yet gating:** `lint` (both apps) and `test` (server).
  These run and report on every PR so regressions are visible, but a
  failure doesn't block merge. This is temporary, not a policy choice — as
  of Sept 2026 there's pre-existing debt (~60 client lint errors, ~127
  server lint errors, 9/10 server test suites failing on DI setup) that
  predates the CI setup. Each gets a `BACKLOG.md` cleanup PBI; once a
  workflow's job is clean, remove its `continue-on-error: true` to make it
  required.
- Don't add more required checks casually — each one is a thing that can
  block you at 2am before the open house. Promote a check to required only
  once it's actually green.

---

## 6. Working style (apply by default)

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

## 7. Where things live

- **Backlog / active tasks:** `BACKLOG.md` in repo root (or GitHub Projects
  board, if adopted — check both).
- **CI:** `.github/workflows/client-ci.yml`, `server-ci.yml`. Branch
  protection rules live on GitHub, not in this repo — check
  `gh api repos/iamrehman16/CampusConnect/branches/main/protection` if you
  need to see current required checks.
- **FYP docs** (SDD, SPMP, test doc, UML): kept separately, not in this file.
- **This file itself:** update only when an architectural decision or
  convention actually changes — not for day-to-day task tracking.

---

## 8. Known gaps as of last review (verified against code, Sept 2026)

- **`ERR_HTTP_HEADERS_SENT` guard missing** — confirmed. In
  `server/src/modules/ai/ai.controller.ts`, the SSE handler's `error`
  callback and the `req.on('close')` handler both call `res.write()` /
  `res.end()` with no `res.headersSent` check. A late error arriving after
  the client disconnects (or after `complete` already called `res.end()`)
  will throw.
- **E11000 handling missing on `conversations`** — confirmed. In
  `server/src/modules/chat/chat.service.ts#findOrCreateConversation`, the
  check-then-create (`findOne` then `.create()`) has no try/catch. Two
  concurrent "start conversation" requests for the same pair can both pass
  the `findOne` check, then the second `.create()` throws unhandled on the
  unique `participants` index (§4). Note this is a different code path from
  the message-level `isDuplicateClientIdError` dedup, which does exist and
  works as intended.
- **`participantsKey` migration** — status unclear. No occurrences of
  `participantsKey` found anywhere in `server/src`. Either never started or
  the field was renamed; don't assume either way — check with the
  developer before treating this as done or as a live task.
- **RAG citation dedup — reopened.** §4 claims citations are built "with
  deduplication," but `ai-chat.service.ts`'s citation construction is a
  plain `.map()` over retrieved context, and no dedup step (`Set`, `filter`,
  etc.) exists there or in `retrieval.service.ts`. Either the claim in §4 is
  stale or the dedup lives somewhere not yet found — needs a real look, not
  covered by this pass. Don't remove this note until someone traces the
  actual citation path end to end.