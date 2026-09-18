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
  programmatically from retrieved context, not parsed out of the model's
  text output. Deduplication (by `resourceId`, via `AiChatService`'s
  private `buildCitations()`) was missing until BACKLOG.md A8 (2026-09-18)
  — see §8's former "reopened" note, now resolved.
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
- **`ConversationSchema` has a unique (partial) index on `participantsKey`**
  — a deterministic sorted-pair string, not the `participants` array
  itself — enforcing exactly one conversation per pair of users at the
  database level rather than in application logic. (A unique index
  directly on the `participants` array would be a MongoDB multikey index,
  enforcing uniqueness per array *element* across the whole collection,
  not per pair — see §8's A9 note for how this was found and fixed.)
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
- **Client and server `lint` are both clean** (BACKLOG.md A10/A11,
  2026-09-18) — neither `client-ci.yml` nor `server-ci.yml`'s `lint` job
  has `continue-on-error` anymore, but branch protection on `main` hasn't
  been updated yet to add either to `required_status_checks` (a manual
  GitHub admin step).
- **Still advisory, not yet gating:** `test` (server). It runs and reports
  on every PR so regressions are visible, but a failure doesn't block
  merge. This is temporary, not a policy choice — as of Sept 2026, 9/10
  server test suites fail on DI setup, predating the CI setup
  (`BACKLOG.md` A12). Once that job is clean, remove its
  `continue-on-error: true` to make it required.
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

## 7. Output Style: Caveman Mode
- Concise output strictly required. No conversational fluff, greetings, pleasantries, or post-task summaries.
- Omit unnecessary filler words (articles, prepositions, politeness).
- Provide minimal explanation for changes. Name file, action, reason in shortest form possible.
- Code blocks, tool calls, shell commands, and file edits MUST remain 100% complete, precise, and unaltered.
- Examples:
  - BAD: "I have updated the user service file to fix the null pointer exception when fetching the profile."
  - GOOD: "Fix null check in UserService.ts line 42."
 
---

## 8. Where things live

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

## 9. Known gaps as of last review (verified against code, Sept 2026)

- **`ERR_HTTP_HEADERS_SENT` guard** — fixed (BACKLOG.md A1). The SSE handler
  in `server/src/modules/ai/ai.controller.ts` now guards every
  `res.write()`/`res.end()` call with `res.writableEnded`, and
  `req.on('close')` unsubscribes the observable instead of just ending the
  response. Regression covered by `ai.controller.spec.ts`.
- **E11000 handling on `conversations`** — fixed (BACKLOG.md A2).
  `findOrCreateConversation` now catches the E11000 on the unique
  `participants` index and re-fetches/returns the winner, mirroring the
  existing `isDuplicateClientIdError` pattern (new
  `isDuplicateParticipantsError` helper). Regression covered in
  `chat.service.spec.ts`.
- **`participantsKey` migration** — implemented (BACKLOG.md A9,
  2026-09-18). It had never been started (confirmed via `git log -S` across
  the full 138-commit history, including the pre-monorepo merge). Turned
  out to matter more than "unclear status" suggested: the unique index it
  was presumably meant to fix — `{ participants: 1 }, { unique: true }` —
  is a MongoDB multikey index, meaning uniqueness was enforced per array
  *element* across the whole collection, not per pair. Verified
  empirically (Docker `mongo:7`): a user could only ever be in **one**
  conversation, system-wide, ever. `ConversationSchema` now has
  `participantsKey` (a deterministic sorted-pair string) with its own
  unique index (partial, to tolerate pre-existing docs missing the field);
  `ChatService.onModuleInit()` backfills it for any legacy documents. See
  `chat.service.ts`/`conversation.schema.ts`.
- **RAG citation dedup** — fixed (BACKLOG.md A8, 2026-09-18). Traced end to
  end: the §4 claim was false — `ai-chat.service.ts`'s citation
  construction was a plain `.map()` with no dedup step, and since
  `IngestionService` chunks each resource into multiple Qdrant points and
  `RetrievalService`'s `TOP_K=5` can return several chunks from the same
  document, duplicate citations (same `resourceId`, different pages) were
  a real, reproducible bug, not a hypothetical one. Now deduped by
  `resourceId` via a shared `buildCitations()` helper (keeps the
  highest-scoring chunk's page), used by both `getChatResponse` and
  `streamChatResponse`. Covered by `ai-chat.service.spec.ts`.