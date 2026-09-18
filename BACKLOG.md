# CampusConnect Backlog

PBIs, not tasks. Each is sized to be handed to Claude Code as a self-contained
prompt — enough context to start cold, not a design doc. Work one at a time,
one committed fix/feature per PBI (see `CLAUDE.md` §3.2). Pick the top unstarted
item in whichever epic you're focused on; don't jump epics mid-PBI.

**Effort scale** (rough, solo-dev-with-Claude-Code calibrated):
- `3` — half a day to a day. One focused area, one commit, low ambiguity.
- `5` — one to two days. Touches a few files or one schema change.
- `8` — three-plus days / a small design pass first. Foundational or cross-cutting.

Nothing below `3` belongs here — smaller chores go straight into a commit,
not the backlog.

---

## Epic A — Code health & CI gate cleanup

Goal: get `lint` and `test` CI jobs (currently advisory, see `CLAUDE.md` §5)
clean enough to flip to required. Do these before or interleaved with Epic B —
shipping memory features on top of ~200 known lint errors and a broken test
suite just grows the pile.

### A1 — Fix SSE stream header-sent crash risk — DONE (2026-09-18)
**Effort:** 3
**Where:** `server/src/modules/ai/ai.controller.ts` (`chat/stream` handler)
**Why:** The `error` callback and `req.on('close')` handler both call
`res.write()`/`res.end()` unconditionally. If the client disconnects and then
the observable errors (or `complete` already ended the response), Node throws
`ERR_HTTP_HEADERS_SENT`. Confirmed still open — see `CLAUDE.md` §8.
**Acceptance criteria:**
- Guard every `res.write`/`res.end` call in the stream handler with a
  `res.writableEnded` / `res.headersSent` check.
- Unsubscribe the observable on `req.on('close')` instead of just ending the
  response, so a late `next`/`error` after disconnect is a no-op, not a crash.
- Add a test (or manual repro note in the PR) showing a mid-stream disconnect
  no longer throws.

**Resolved:** `ai.controller.ts`'s `stream` handler now captures the
`Subscription` and unsubscribes it in `req.on('close')`, and every
`res.write`/`res.end` call across `next`/`error`/`complete`/`close` is
guarded with `res.writableEnded`. New `ai.controller.spec.ts` covers three
regression cases: late emission after disconnect, `close` firing after
`complete`, and error arriving after disconnect — none write to or re-end
the response. `CLAUDE.md` §8 updated to reflect the fix.

### A2 — Fix conversation-creation race condition (E11000 unhandled) — DONE (2026-09-18)
**Effort:** 3
**Where:** `server/src/modules/chat/chat.service.ts#findOrCreateConversation`
**Why:** Check-then-create with no try/catch around `.create()`. Two
concurrent "start conversation" requests for the same pair both pass the
`findOne` check; the second `.create()` throws unhandled on the unique
`participants` index. Confirmed still open — see `CLAUDE.md` §8. Note the
existing `isDuplicateClientIdError` pattern in the same file for messages —
mirror that approach (catch E11000, re-fetch, return the winner) rather than
adding a pre-check query, per the intentional-decisions convention in §4.
**Acceptance criteria:**
- Concurrent `findOrCreateConversation` calls for the same pair never throw;
  both resolve to the same conversation document.
- Add a test that fires two concurrent creates and asserts one result.

**Resolved:** `findOrCreateConversation` now wraps `.create()` in a
try/catch; on E11000 (new `isDuplicateParticipantsError` helper, mirroring
`isDuplicateClientIdError`) it re-queries by the sorted `participants` pair
and returns the winner instead of throwing. New test in
`chat.service.spec.ts` fires two concurrent calls against a mocked model
that rejects the second `create()` with E11000 and asserts both resolve to
the same document. `CLAUDE.md` §8 updated to reflect the fix.

### A3 — Harden GroqService external calls — DONE (2026-09-18)
**Effort:** 5
**Where:** `server/src/modules/ai/services/groq.service.ts`
**Why:** New finding — `generateResponse`, `summarize`, and `generateStream`
all call `groq.chat.completions.create` with zero error handling: no
try/catch, no timeout, no rate-limit (429) handling. A Groq outage or
rate-limit currently surfaces as an unhandled rejection, violating the
no-silent-failures / explicit-error-handling rule in `CLAUDE.md` §3.3.
**Acceptance criteria:**
- Each Groq call site has explicit error handling: typed error surfaced to
  the caller (not swallowed), with enough log context to debug (which call,
  which user/session, what Groq returned).
- Add a timeout so a hung Groq request doesn't hang the SSE stream forever.
- 429/5xx from Groq degrades gracefully (e.g. a user-facing "try again"
  event on the stream) instead of an unhandled rejection.

**Resolved:** Each of `generateResponse`/`summarize`/`generateStream` now
wraps its `create()` call in try/catch, logs via Nest's `Logger` with
operation + status context, and rethrows a typed `GroqServiceError`
(`operation`, `retryable` derived from 429/5xx). All three calls pass a
configurable `GROQ_TIMEOUT_MS` (default 30s, documented in
`.env.example`). In `ai-chat.service.ts#streamChatResponse`, the
`generateStream()` call moved inside the observable's executor so a
Groq failure there reaches `observer.error()` — which the A1 fix already
turns into a graceful SSE `error` event — instead of rejecting after
headers are flushed. Covered by `groq.service.spec.ts` (5 cases:
success + timeout param, 429 retryable, 400 non-retryable, generic
failure, 5xx retryable on the stream path).

### A4 — Retrieval empty-result signal + drop debug logging — DONE (2026-09-18)
**Effort:** 3
**Where:** `server/src/modules/ai/services/retrieval.service.ts`
**Why:** New findings — line ~25-28 has a leftover `console.log` dumping raw
Qdrant scores on every query (dead debug code). Separately, the hardcoded
`SCORE_THRESHOLD = 0.6` has no fallback: when nothing clears it,
`buildMessages` silently sends no RAG context and the user has no way to
know retrieval came up empty vs. wasn't attempted.
**Acceptance criteria:**
- Remove the debug `console.log` (or replace with a proper log-level call if
  the score visibility is actually useful — your call, but it can't be a
  bare `console.log` in a service per §3.3).
- `RetrievalService` returns an explicit "no results cleared threshold"
  signal (not just an empty array indistinguishable from "no documents
  exist at all"), and `AiChatService`/the frontend surface that distinction
  to the user (e.g. "no matching resources found" vs. silence).

**Resolved:** `retrieve()` now returns `{ context, status }` with
`status: 'ok' | 'no-matches' | 'below-threshold'` — `no-matches` when the
vector search itself returned nothing, `below-threshold` when candidates
existed but none cleared `SCORE_THRESHOLD` (now logged at debug level, not
dumped raw). `AiChatService` surfaces `retrievalStatus` on both the REST
`ChatResponse` and the streaming `citations` SSE event; the client threads
it through `citationsRef`'s existing per-hook wiring
(`useStreamRefs`/`useDrainQueue`/`useStreamMessage`, kept split per §4) and
`MessageBubble` shows a short notice instead of silence when citations are
empty and retrieval was attempted. Covered by `retrieval.service.spec.ts`
(3 cases: ok, no-matches, below-threshold). No client test runner exists;
verified via `tsc -b` + `eslint` only.

### A5 — Fix React correctness bugs (sync setState + ref-access-in-render) — DONE (2026-09-18)
**Effort:** 3
**Where:** `client/src/app/providers/AuthProvider.tsx`,
`ChatSocketProvider.tsx`, `client/src/features/ai-chat/components/ChatInput.tsx`
**Why:** Already documented in the old audit (kept here, restructured as a
PBI): synchronous `setState` inside `useEffect` in both providers causes
cascading renders; `ChatInput` does ref access + `setTimeout` during a
render-phase conditional instead of an effect. Same category of bug across
three files — one PBI, one pass.
**Acceptance criteria:**
- `AuthProvider`/`ChatSocketProvider`: state that can be computed on first
  render is initialized in `useState`'s initializer, not set synchronously
  inside an effect.
- `ChatInput`: the prefill-and-focus logic moves into a proper `useEffect`
  keyed on `prefillValue`, not inline in the render body.
- No new ESLint `react-hooks/*` violations introduced; ideally the ones in
  these three files disappear.

**Resolved:** `AuthProvider`'s `isLoading` is now computed in `useState`'s
initializer from `tokenStorage.getAccessToken()` instead of always starting
`true` and being synchronously cleared in the effect for the no-token case
(eliminated a guaranteed extra render/paint on every load with no stored
token). `ChatSocketProvider`'s redundant no-token `setIsConnected(false)`
(and its `eslint-disable`) is removed — it was always a no-op against the
`useState` default / the previous effect's cleanup; the one remaining
`setIsConnected(socket.connected)` stays, since `chatSocketService.connect()`
is a real side effect that can't be precomputed. `ChatInput.tsx` was already
fixed — its prefill-and-focus logic is a proper `useEffect` keyed on
`prefillValue` with a ref guard, no `setTimeout`/render-phase ref access —
the backlog description predated that fix; no change made there.

### A6 — Fix floating promises in chat.gateway.ts and ai-chat.service.ts — DONE (2026-09-18)
**Effort:** 3
**Where:** `server/src/modules/chat/chat.gateway.ts`,
`server/src/modules/ai/services/ai-chat.service.ts`
**Why:** Documented in the old audit. Un-awaited/un-caught promises in
socket event handlers and the streaming flow mean a rejection disappears
silently instead of being logged or surfaced — same root issue as A3, just
in call sites that aren't Groq itself.
**Acceptance criteria:**
- Every promise-returning call in these two files is either `await`ed inside
  a try/catch, or explicitly `.catch()`-handled with a log statement.
- `no-floating-promises` (if enabled) or an equivalent manual check passes
  for both files.

**Resolved:** `socket.join()` is typed `Promise<void> | void` (a real
promise on cluster/Redis adapters) but was called unawaited in both
`handleConnection` and `handleJoinConversation`. Both now `await` it —
`handleConnection`'s existing try/catch already disconnects on failure,
and `handleJoinConversation` was made `async` with its own try/catch that
emits `chat_error` instead of rejecting silently. In
`ai-chat.service.ts#streamChatResponse`, the async IIFE inside the
Observable executor is legitimately unawaited (the executor itself must
stay synchronous) — prefixed with `void` plus a comment, since its own
try/catch already routes every failure to `observer.error()`. New
`chat.gateway.spec.ts` covers both join-failure paths and the success
path.

### A7 — Type-safety pass: remove `any` from AI/user/resource services — DONE (2026-09-18)
**Effort:** 5
**Where:** `server/src/modules/ai/services/retrieval.service.ts`,
`embedding.service.ts`, `server/src/modules/user/user.service.ts`,
`server/src/modules/user/schemas/user.schema.ts`,
`server/src/modules/resource/resource.service.ts`
**Why:** Widespread `any` typing flagged in the original audit and visible
directly in the server lint output (`no-unsafe-member-access`,
`no-unsafe-assignment`, `no-unsafe-return` — e.g.
`user.schema.ts:10-11`, `user.service.ts:52,205`). Violates the no-`any`
rule in `CLAUDE.md` §3.3.
**Acceptance criteria:**
- No `any` remains in the five files above; replace with real types,
  Mongoose-generated document types, or `unknown` + a narrowing guard where
  the shape genuinely isn't known ahead of time.
- Server lint error count drops measurably (track before/after count in the
  PR description).

**Resolved:** Lint on `{src,apps,libs,test}/**/*.ts`: 171 -> 136 errors
(200 -> 165 total problems), 0 new warnings. `user.schema.ts`'s
`toJSON.transform` ret typed as `Record<string, unknown>`.
`embedding.service.ts`'s `taskType: '...' as any` replaced with the
Google SDK's own `TaskType` enum (also a real correctness fix — a
typo'd string previously type-checked silently as `any`).
`retrieval.service.ts`'s `any` traced to `VectorSearchResultDto.payload:
Record<string, any>` — added a `ResourceChunkPayload` interface matching
what `IngestionService` actually writes to Qdrant; `vector-store.service.ts`
needed one documented `as unknown as ResourceChunkPayload` boundary cast
(Qdrant's client only types payload as an untyped record — the one place
the shape is genuinely unverifiable at compile time). `user.service.ts`:
dropped an unused `format` import, replaced `catch (error: any)` with a
typed `isDuplicateKeyError` guard mirroring `chat.service.ts`'s existing
pattern, gave `aggregate()` an explicit `<DailyCountDto>` param.
`resource.service.ts`: both `aggregate()` calls got explicit type params
via new facet-result interfaces instead of letting `any` flow through
`getStats()`/`getAnalytics()`.

### A8 — Trace and fix RAG citation deduplication end-to-end — DONE (2026-09-18)
**Effort:** 3
**Where:** `server/src/modules/ai/services/ai-chat.service.ts`,
`retrieval.service.ts`
**Why:** `CLAUDE.md` §4 claims citations are built "with deduplication," but
citation construction is a plain `.map()` over retrieved context with no
`Set`/`filter` dedup step anywhere in either file (reopened in §8 this
session). Either the same document chunk can appear as a duplicate citation
today, or dedup happens somewhere not yet found — this PBI is the
investigation *and* the fix.
**Acceptance criteria:**
- Trace the actual citation path and determine ground truth: is there a
  duplicate-citation bug right now or not?
- If yes: dedupe by source document (not by chunk) before returning
  citations to the client.
- Update `CLAUDE.md` §4/§8 to reflect what's actually true once confirmed —
  either restore the "resolved" note with evidence, or document the fix.

**Resolved:** Ground truth was a real bug, not a stale claim. `IngestionService`
chunks each resource into multiple Qdrant points (same `resourceId`,
different `pageNumber`); `RetrievalService`'s `TOP_K=5` search can return
several chunks from the same highly-relevant document, and citation
construction in both `getChatResponse` and `streamChatResponse` was a
plain `.map()` with no dedup step — duplicate citations for the same
resource were reproducible, not hypothetical. Added a shared
`buildCitations()` helper on `AiChatService` that dedupes by `resourceId`
(keeping the highest-scoring chunk's page, since `context` is ordered by
descending score). Covered by `ai-chat.service.spec.ts` (both the REST and
SSE paths). `CLAUDE.md` §4/§8 updated.

### A9 — Resolve `participantsKey` migration status — DONE (2026-09-18)
**Effort:** 3
**Where:** messenger conversation schema (`server/src/modules/chat/schema/`)
**Why:** `CLAUDE.md` lists this as a known gap but no `participantsKey`
occurrence exists anywhere in `server/src` — status is genuinely unknown
(never started, renamed, or scrapped). Needs a decision, not just code.
**Acceptance criteria:**
- Determine what this migration was originally for (check git history /
  old commit messages around the `ConversationSchema` unique index work).
- Either implement it if still needed, or remove the stale reference from
  `CLAUDE.md` §8 with a one-line note on why it's no longer applicable.

**Resolved:** Never started (confirmed via `git log -S "participantsKey"`
across the full 138-commit history, including the pre-monorepo merge —
zero occurrences). But investigating *why* it might have been planned
surfaced a severe live bug: the existing `{ participants: 1 }, { unique:
true }` index is a MongoDB multikey index — a unique constraint on an
array field is enforced per array *element* across the whole collection,
not per array/pair. **Verified empirically** against a real MongoDB 7
instance (throwaway Docker container): after `[A,B]` is inserted,
inserting `[A,C]` (A reused with a *different* partner) also fails
E11000 — meaning a user could only ever be part of **one conversation,
system-wide, ever**, not "one conversation per pair" as intended. Fixed
by adding `participantsKey` (deterministic `"<id1>_<id2>"` string) with
its own unique (partial) index, updating `findOrCreateConversation`/
`isDuplicateParticipantsError` to use it, and adding an idempotent
`ChatService.onModuleInit()` backfill for any pre-existing documents
missing the field (mirrors `VectorStoreService.ensureCollection()`'s
existing pattern — no migration framework exists in this project). New
tests in `chat.service.spec.ts` cover the backfill. `CLAUDE.md` §4/§8
updated.

### A10 — Clean client lint to zero, promote `client-ci` lint job to required
**Effort:** 8
**Where:** `client/` (~60 errors as of Sept 2026, `npm run lint`)
**Why:** Blocks flipping `lint` from advisory to required per `CLAUDE.md` §5.
Includes real bugs beyond A5 (e.g. `no-explicit-any` in
`FileTypeBarChart.tsx`, `ApprovalDonut.tsx`; react-refresh violations in
`router.tsx`, `ChatSocketProvider.tsx`, `AuthProvider.tsx` from exporting
non-component values alongside components).
**Acceptance criteria:**
- `npm run lint` in `client/` exits 0.
- `.github/workflows/client-ci.yml`'s `lint` job has `continue-on-error`
  removed and is added to `main`'s required status checks.
- Do this in logical sub-commits (per-directory or per-rule), not one giant
  commit — still one *concern* per commit even if it takes several.

### A11 — Clean server lint to zero, promote `server-ci` lint job to required
**Status:** DONE (2026-09-18)
**Effort:** 8
**Where:** `server/` (178 problems / 143 errors at session start — the
BACKLOG note's "~127 errors" was stale; A7 had already cut it from the
original ~200/171, but 178/143 was the real starting count for this PBI)
**Why:** Same as A10, server side. Substantially overlaps with A7's `any`
cleanup — do A7 first, then mop up whatever lint errors remain.
**Acceptance criteria:**
- Direct `eslint` invocation (not `npm run lint`, which has `--fix` baked
  in — see the note in `server-ci.yml`) exits 0.
- `.github/workflows/server-ci.yml`'s `lint` job has `continue-on-error`
  removed and is added to `main`'s required status checks.

**Resolved:** `npx eslint "{src,apps,libs,test}/**/*.ts"` now exits 0
(from 178 problems / 143 errors). Worked in ~8 sub-commits by
module/rule-type. Most fixes were mechanical `any` → real-type/`unknown`
narrowing (JWT payloads, socket.io `Socket.data`, Mongoose aggregate
results, exception response bodies), but a few were genuine bugs the
lint noise had been masking:
- `auth.controller.ts`'s `signout()` was `async` with no `await` — it
  called `authService.signout()` and discarded the promise, so a
  failure to invalidate the refresh token on signout was silently
  swallowed and the client always got a 200 regardless.
- Three `session.endSession()` calls in `post.service.ts`'s
  transactional methods (`createComment`, `deleteComment`,
  `adminDeleteComment`) ran in a `finally` block without `await` — the
  method could return/rethrow before the session was actually released
  back to the driver's pool.
- `post.service.ts`'s `updatePost`/`deletePost`/`updateComment`/
  `deleteComment` took `userRole: string` and compared it against the
  `Roles` enum — every real caller passes `req.user.role` (typed
  `Roles`), so the `string` param was a type hole with no legitimate
  string use case. Narrowed to `userRole: Roles`.
- `main.ts`'s `bootstrap()` floating promise had no failure handling —
  a startup crash before `app.listen()` would previously fail silently.
- New shared `AppSocket` type (`server/src/modules/chat/types/app-socket.d.ts`)
  replaces untyped `Socket` across the chat gateway/guard/filter, narrowing
  `socket.data` to `{ userId?: string }` instead of `any`.
`.github/workflows/server-ci.yml`'s `lint` job no longer has
`continue-on-error`. Branch protection on `main` still needs a manual
update (GitHub admin action, not done here) to add the server `lint`
check to `required_status_checks` — currently only
`client-typecheck-and-build`/`server-typecheck-and-build` are required.

### A12 — Fix server test suite DI setup, promote `server-ci` test job to required
**Effort:** 5
**Where:** `server/test/`, `server/src/**/*.spec.ts`
**Why:** 9 of 10 test suites currently fail at `TestingModuleBuilder.compile`
— provider resolution errors, not assertion failures. Something structural
(missing mock providers, a module import gap) broke across nearly the whole
suite, likely from a dependency or module wiring change that predates CI.
**Acceptance criteria:**
- `npm test` in `server/` passes for all existing suites (or a suite is
  deliberately deleted with a reason, not silently left broken).
- `.github/workflows/server-ci.yml`'s `test` job has `continue-on-error`
  removed and is added to `main`'s required status checks.

### A13 — Messenger: reconcile failed messages by clientId instead of generic toast
**Effort:** 3
**Where:** `client/src/features/messenger/` (or wherever the messenger chat
UI lives), `server/src/modules/chat/`
**Why:** Carried over from the original audit. When a message send fails,
the UI currently shows a generic error toast instead of reconciling the
specific failed message — the optimistic message stays stuck in "sending"
state instead of rolling back or offering retry. This is the messenger
(peer-to-peer) chat module, not the AI chat covered in Epic B.
**Acceptance criteria:**
- A failed send event is matched back to its optimistic message via
  `clientId` and that specific message is marked failed (with a retry
  affordance), not just a toast disconnected from which message failed.
- Works alongside the existing `isDuplicateClientIdError` dedup pattern
  (`CLAUDE.md` §4) without fighting it — a retried send reuses or
  regenerates `clientId` deliberately, not accidentally.

---

## Epic B — Long-term memory chat (RAG-integrated)

Goal: replace the current single lifelong per-user session with a real
Claude.ai/ChatGPT-style chat experience — multiple named threads, full
history retained, cross-session recall, and RAG retrieval that actually
understands follow-up questions. This is the epic that has to land *before*
the RAG-first UI redesign (Epic C) — a redesign built on a one-thread-forever
data model would just get thrown away.

Sequencing matters here more than in Epic A — B1 and B2 are the foundation
everything else sits on; do them first and in order.

### B1 — Design & migrate the conversation-thread data model
**Effort:** 8
**Where:** `server/src/modules/ai/` (new `AiConversation`/`AiMessage`
schemas, replacing or supplementing `conversation-session.schema.ts`)
**Why:** `ConversationSession` has a unique index on `userId` — one document
per user, ever (`conversation-session.schema.ts:9`). There is no thread
concept: a user cannot have multiple named conversations. Everything else in
this epic depends on this changing first.
**Acceptance criteria:**
- New schema(s) support many threads per user: `AiConversation` (id, userId,
  title, createdAt, updatedAt, summaryBuffer) and `AiMessage` (conversationId,
  role, content, createdAt) or equivalent — your call on exact shape, but it
  must support N threads per user and full message history per thread.
- Migration path for existing singleton `ConversationSession` docs: each
  becomes one `AiConversation` for its user (don't just drop existing state).
- Ownership is enforced at the query level (a user can only read/write their
  own threads) — this is new; the old model never needed it.
- `getOrCreateSession`/`clearSession` equivalents are reworked around
  `conversationId` instead of `userId` alone.

### B2 — Thread CRUD API (create / list / rename / delete)
**Effort:** 5
**Where:** `server/src/modules/ai/` controller + service, depends on B1
**Why:** Once threads exist as a data model, you need endpoints to manage
them — this is the server-side counterpart to the sidebar UI in B7.
**Acceptance criteria:**
- Endpoints: create thread, list a user's threads (sorted by
  `updatedAt`), rename, delete. All auth-guarded and ownership-checked.
- `chat/stream` and `chat` endpoints accept a `conversationId` and operate
  on that thread's history instead of the old singleton session.
- Deleting a thread removes its messages too (no orphaned `AiMessage` docs).

### B3 — Persist full raw message history per thread
**Effort:** 5
**Where:** `server/src/modules/ai/services/conversation.service.ts`
**Why:** Today, once the 6-exchange sliding window fills, the oldest 3
exchanges are `splice()`d out and folded into `summaryBuffer` — the raw text
is gone forever (`conversation.service.ts`, `RECENT_LIMIT`/
`SUMMARIZE_BATCH` logic). That's fine for *context-window* purposes but
wrong for a "long-term memory" product feature: a user should be able to
scroll up and see what they actually said, not a lossy AI-generated summary
of it.
**Acceptance criteria:**
- Every message is persisted to `AiMessage` (from B1) in full, independent
  of what the sliding-window/summary logic keeps "in context" for the next
  Groq call.
- The sliding-window + summarization mechanism (`CLAUDE.md` §4, don't
  refactor its *purpose*) continues to bound what's sent to Groq per
  request — this PBI adds persistence alongside it, it doesn't replace it.
- A thread's full history is retrievable via the API for the frontend to
  render on scroll-back (paginated, not one giant payload).

### B4 — Auto-generate conversation titles
**Effort:** 3
**Where:** server `AiConversation` creation flow, depends on B1/B2
**Why:** ChatGPT/Claude-style sidebars show a short generated title per
thread, not "New chat" forever. Cheap single-call feature once B1 exists.
**Acceptance criteria:**
- After the first exchange in a new thread, one cheap LLM call (same 8B
  model already used for summary compression, per `CLAUDE.md` §4) generates
  a short title, saved onto the `AiConversation` doc.
- Title generation failure doesn't block or error the chat response — it's
  a nice-to-have side effect, not on the critical path (explicit error
  handling, not silent, but non-fatal — falls back to a default like the
  first few words of the user's message).

### B5 — Contextualize follow-up queries before RAG retrieval
**Effort:** 5
**Where:** `server/src/modules/ai/services/retrieval.service.ts:17`,
`ai-chat.service.ts`
**Why:** Confirmed gap — `retrieval.service.ts` embeds only the raw
current-turn message, ignoring `summaryBuffer`/`recentMessages` entirely. A
follow-up like "what about chapter 3" has no antecedent when embedded alone,
so retrieval quality degrades on multi-turn conversations — directly
relevant to "long-term memory that seamlessly integrates into the RAG
knowledge base."
**Acceptance criteria:**
- Before embedding, the query is rewritten/expanded using recent
  conversation context (either a cheap LLM rewrite step, or a simpler
  heuristic — your call, but naive raw-query embedding on turn 2+ isn't
  acceptable).
- Measurable improvement: pick 3-5 realistic multi-turn test conversations
  and confirm retrieval returns relevant chunks on follow-ups where it
  previously wouldn't (document before/after in the PR).

### B6 — Vector-backed cross-session long-term memory
**Effort:** 8
**Where:** new service alongside `VectorStoreService`, `RetrievalService`,
`AiChatService`
**Why:** This is the centerpiece of the epic — the actual "long-term memory"
part, as opposed to B1-B5 which are the plumbing it needs to sit on. Right
now recall is exactly one rolling summary string plus 6 exchanges; nothing
survives across sessions except that summary. Claude.ai/ChatGPT's "memory"
retrieves relevant facts from *past conversations*, not just the current
one.
**Acceptance criteria:**
- Key facts/summaries from completed or aging threads get embedded and
  stored in a separate Qdrant collection (or namespaced within the existing
  one — your call, but don't conflate it with document-RAG vectors) keyed
  by user.
- At query time, this cross-session memory is retrieved alongside
  document-RAG context (respecting the existing `SCORE_THRESHOLD`-style
  relevance gate from A4) and injected into `buildMessages` distinctly from
  document citations — a memory recall isn't a document citation, don't
  conflate them in the UI either.
- Respect the MongoDB-ObjectId-to-UUID conversion convention (`CLAUDE.md`
  §4) for any new Qdrant point IDs.
- Explicit error handling on this new external-call path per §3.3 — a
  memory-store failure degrades to "no memory recall this turn," not a
  broken chat response.

### B7 — Frontend: conversation history sidebar
**Effort:** 8
**Where:** `client/src/features/ai-chat/`, depends on B1/B2
**Why:** No thread-list UI exists at all today — `ai-chat.cache.ts` has one
fixed query key for the whole app, one global conversation. This is the
visible, "inspired by Claude/ChatGPT" part of the epic.
**Acceptance criteria:**
- Sidebar listing the user's threads (title, recency), matching the
  existing streaming-hook architecture (`useStreamRefs`/`useDrainQueue`/
  `useStreamMessage` — don't recombine them, per `CLAUDE.md` §4).
- Create new thread, switch threads, rename, delete — wired to B2's API.
- TanStack Query cache keyed per-`conversationId`, not the single global key
  in `ai-chat.cache.ts` today.

### B8 — Sync client history with server on load (single source of truth)
**Effort:** 5
**Where:** `client/src/features/ai-chat/hooks/useChatPageInit.ts` (or
equivalent), depends on B2/B3
**Why:** Confirmed gap — the client never fetches server-side history on
mount; it relies solely on the IndexedDB-persisted TanStack Query cache. The
server's `summaryBuffer`/thread state and what the client displays are two
unsynced stores today: clear browser storage or switch devices and you see
an empty chat while the server-side memory silently keeps influencing
answers.
**Acceptance criteria:**
- On opening a thread, the client fetches history from the server (B3's
  paginated endpoint) as the source of truth; IndexedDB/query-cache
  persistence becomes an offline-read cache layered on top of that, not the
  primary store.
- Verify: clear browser storage, reload, open an existing thread — full
  history reappears from the server, not just from cache.

### B9 — Token-budget hardening for the assembled context
**Effort:** 5
**Where:** `server/src/modules/ai/services/groq.service.ts#buildMessages`,
depends on B5/B6
**Why:** Once B5 (query rewriting) and B6 (cross-session memory) both add
more content into the same `buildMessages` call that already assembles
`[system, summary?, ragContext?, recentMessages, query]`, there's a real
risk of exceeding Groq's context window on a long thread with a lot of
recalled memory — this wasn't a concern in the old fixed 6-exchange design
but becomes one once memory is unbounded input.
**Acceptance criteria:**
- Token-count the assembled message array before sending; if over budget,
  drop lowest-priority content first (long-term memory recall before
  document RAG context before recent exchanges — your call on priority
  order, but document the reasoning).
- No silent truncation — if content gets dropped, that's a debug-loggable
  event per §3.3, not invisible.

---

## Epic C — RAG-first UI redesign

**Blocked on Epic B.** Don't start scoping this precisely until B7/B8 ship —
sizing a redesign against a data model and sidebar UX that doesn't exist yet
is guessing, not planning. These three are placeholders to hold the shape of
the epic, not ready-to-execute PBIs. Re-scope each with real effort numbers
once Epic B is functional.

### C1 — Redesign navigation/IA around chat as the primary surface
**Where:** `client/src/app/router.tsx`, top-level layout
**Why:** Once long-term memory/threads work (Epic B), chat stops being "one
feature among several" and becomes the thing CampusConnect is about —
navigation and the landing experience should reflect that instead of
treating AI chat as a side tab.

### C2 — Surface resource discovery inline in chat (not a separate feed)
**Where:** `client/src/features/ai-chat/`, `client/src/features/resource/`
**Why:** If chat is primary, resource browsing/contributor feed should show
up as part of the chat experience (inline resource cards from citations,
"related resources" surfaced conversationally) rather than a separate page
users have to leave chat to visit.

### C3 — Persistent chat-first responsive layout
**Where:** client top-level layout/theme
**Why:** Desktop layout akin to Claude.ai/ChatGPT (persistent sidebar +
main chat pane) rather than the current tab-based structure; needs a mobile
equivalent too. Depends entirely on what B7's sidebar ends up looking like.

---

## Epic D — Google OAuth authentication

Goal: let students sign in with their Google account instead of only
email/password. Independent of Epics A-C — can be picked up any time,
sequencing among D1-D3 matters (D1 is the schema foundation).

Current state (verified against code): `server/src/modules/auth/` has only
`local.strategy.ts` and `jwt.strategy.ts` (passport-local + passport-jwt,
already listed in `CLAUDE.md` §2). No `passport-google-oauth20` dependency,
no Google strategy, no callback route. `UserSchema`
(`server/src/modules/user/schemas/user.schema.ts:18-19`) has `password`
as `required: true` — that has to change before a passwordless OAuth user
can be created.

### D1 — User schema + config for OAuth-created accounts
**Effort:** 3
**Where:** `server/src/modules/user/schemas/user.schema.ts`,
`server/src/modules/user/user.service.ts`, `server/.env.example`
**Why:** A Google-authenticated user has no password to hash, but
`password` is currently `required: true` on `UserSchema`. Need a schema
shape that supports both local and OAuth-created accounts before any
strategy code can create one.
**Acceptance criteria:**
- `password` becomes optional on `UserSchema` (`required: false` /
  conditional), with `authProvider: 'local' | 'google'` (default
  `'local'`) and `googleId?: string` (unique, sparse index) added.
- `UserService` gains a `findOrCreateGoogleUser` (or equivalent) that
  looks up by `googleId` first, then by `email` for account-linking
  (existing local account + same email signs in via Google without a
  duplicate user doc — document the linking decision, don't silently
  merge without one), then creates if neither matches.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`
  documented in `.env.example` (shape only, no real values, per
  `CLAUDE.md` §3.7).
- Existing local-signup flow (`AuthService#register`) unaffected — a
  regression here breaks the only auth path that currently works.

### D2 — Google OAuth strategy + callback endpoints
**Effort:** 5
**Where:** `server/src/modules/auth/` (new `google.strategy.ts`,
controller routes), depends on D1
**Why:** The actual OAuth flow — this is the PBI that makes "Sign in with
Google" work end to end on the server.
**Acceptance criteria:**
- `passport-google-oauth20` strategy validates the Google profile, calls
  D1's `findOrCreateGoogleUser`, and issues the same access/refresh token
  pair `AuthService#login` already issues for local login — one token
  contract for both auth methods, not a parallel one.
- `GET /auth/google` (kicks off consent screen) and
  `GET /auth/google/callback` (handles the redirect) routes, both marked
  `@Public()` per the existing `public.decorator.ts` pattern.
- Callback redirects to a client URL with tokens (or a short-lived
  exchange code — your call, but don't put long-lived tokens in a query
  string if avoidable) rather than returning raw JSON to a browser
  redirect.
- Explicit error handling on the Google API call per `CLAUDE.md` §3.3 (a
  Google outage or a user who denies consent degrades to a clear
  redirect-with-error, not an unhandled exception).

### D3 — Frontend "Sign in with Google" flow
**Effort:** 3
**Where:** `client/src/features/auth/` (or wherever login/signup UI
lives), `client/src/app/providers/AuthProvider.tsx`, depends on D2
**Why:** The visible half — a button plus handling D2's redirect-back so
the user actually lands authenticated in the app.
**Acceptance criteria:**
- "Continue with Google" button on the existing login/register screen,
  linking to the server's `GET /auth/google`.
- A callback/landing route that receives D2's redirect, stores tokens via
  the existing `tokenStorage` utility, and populates `AuthProvider` the
  same way a normal login does (reuse `login`/`fetchProfile`, don't fork
  a second auth-bootstrap path).
- Error case (user denies consent, or D2 redirects with an error) shows a
  clear message on the login screen instead of a blank/broken redirect
  target.
