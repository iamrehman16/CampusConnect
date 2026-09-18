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

## Epic A — Code health & CI gate cleanup (DONE)

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

### B1 — Design & migrate the conversation-thread data model — DONE (2026-09-18)
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

**Resolved:** Added `AiConversation` (thread doc: `userId`, `title`,
`summaryBuffer`, `recentMessages`) and `AiMessage` (`conversationId`,
`role`, `content`, `createdAt` — schema only, unwired until B3 persists
full raw history). `ConversationService.getOrCreateConversation(userId,
conversationId?)` replaces `getOrCreateSession`: a passed `conversationId`
is looked up scoped to `userId` and throws `NotFoundException` if it
doesn't belong to that user (new — the singleton model had no ownership
check to get wrong). `clearConversation(userId, conversationId)` is the
`clearSession` equivalent, same ownership check. Legacy
`ConversationSession` docs are migrated on `ConversationService`'s
`onModuleInit` — each becomes one `AiConversation`, idempotently (tracked
via a `migratedAt` marker so re-running on every boot is safe), and the
legacy docs are kept, not deleted, so the migration is auditable.
`AiController`'s `chat`/`chat/stream`/`clearSession` routes don't send a
`conversationId` yet (no client UI for threads), so
`getOrCreateConversation` falls back to the user's most-recently-updated
thread when none is given — preserves today's one-thread-per-user
behavior on the new data model until B2 wires real thread selection
through from the client. Covered by `conversation.service.spec.ts`
(ownership enforcement, fallback/create, migration idempotency).

### B2 — Thread CRUD API (create / list / rename / delete) — DONE (2026-09-18)
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

**Resolved:** Added `ConversationController` (`ai/conversations` —
`POST`/`GET`/`PATCH :id`/`DELETE :id`), all routed through
`ConversationService`'s existing ownership-scoped methods
(`createConversation`, `listConversations`, `renameConversation`,
`deleteConversation`); auth is enforced by the global `JwtAuthGuard`
already applied to every route (`AuthModule`'s `APP_GUARD`), matching the
rest of this module — no per-route `@UseGuards` needed. `deleteConversation`
also runs `messageModel.deleteMany({ conversationId })` — currently a
no-op since B3 hasn't wired message persistence into `AiMessage` yet, but
means the delete path is already correct once B3 lands, instead of leaving
an orphan-cleanup gap to rediscover later. `ChatMessageDto` gained an
optional `conversationId` (`@IsMongoId()`), threaded through
`AiChatService.getChatResponse`/`streamChatResponse` into
`getOrCreateConversation` — omitting it still falls back to the user's
most-recently-updated thread (the B1 bridge), so existing callers are
unaffected. Both the REST response and the SSE `citations` event now
include `conversationId`, so a caller that didn't specify one learns which
thread it landed in. Covered by `conversation.controller.spec.ts` and
extended `conversation.service.spec.ts`/`ai-chat.service.spec.ts`.

### B3 — Persist full raw message history per thread — DONE (2026-09-18)
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

**Resolved:** `ConversationService#appendMessages` now inserts both
messages into `AiMessage` via `insertMany`, unconditionally — separate
from `maybeCompressSummary`'s splice, which still only governs
`recentMessages`/`summaryBuffer` (the Groq context bound, CLAUDE.md §4,
untouched). Added `getMessages(userId, conversationId, dto)`
(ownership-checked, paginated via the existing `PaginationService`,
newest page first — same convention as the chat module's
`GetMessagesDto`/`getMessages`), exposed as
`GET ai/conversations/:id/messages`. The B1 legacy-session migration now
also seeds `AiMessage` from each session's surviving `recentMessages` —
text already folded into `summaryBuffer` before this fix stays
unrecoverable (that's the bug this PBI closes going forward, not
something to invent for the past), but a migrated thread's still-present
raw messages no longer start life in `AiMessage` empty. Covered by
extended `conversation.service.spec.ts`/`conversation.controller.spec.ts`.

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
