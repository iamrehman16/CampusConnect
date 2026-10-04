# CampusConnect Backlog

PBIs, not tasks. Each is sized to be handed to Claude Code as a self-contained
prompt. One committed fix/feature per concern (see `CLAUDE.md` §3.2).
Effort scale: `3` = half a day to a day, `5` = one to two days, `8` = three-plus
days. Anything smaller goes straight into a commit.

Goal: a consumer-usable app for the FYP demo/defense (~Oct/Nov 2026). Finished
epics are summarized below; their detail lives in `git log`.

---

## Completed epics

- **A — Code health & CI gate.** Typecheck+build gate, lint clean on both apps,
  error-handling and `any` sweep.
- **B — Long-term memory chat (RAG).** Named threads, persisted history, auto
  titles, query contextualization, vector-backed cross-session memory, token budget.
- **C — AI chat UX polish.** Copy/like/dislike toolbar, composer, resource-card
  citations, code-block copy.
- **D — Design system & UI overhaul (D1–D10).** "Warm neutral" tokens, Lucide
  icons, 5-item app shell, and redesigns of Home, Library, Ask AI, Messages,
  Mentors, Profile, Community, landing, auth and onboarding.
- **E — Contributors, mentorship & messenger (E1–E16).** Messenger, reputation
  ledger and tiers, contributor applications, mentor directory/requests/ratings/
  endorsements/recommendations, contextual chat, AI attribution + "ask a human",
  impact panel + leaderboard, block/report/admin moderation.
- **G — Quick fixes & resilience (G1–G5).** Debug logs and dead theme removed,
  UI sweep, server boots with Qdrant down, password change requires current password.
- **F — Google OAuth sign-in (F1–F3).** Any Google account can sign in; a verified email links to
  an existing local account; one-time-code redirect, so no tokens in URLs. Verified end to end 2026-10-03.
- **H1 — Demo database + seed script** (`npm run seed:demo`, `campusconnect_demo`).

### Open follow-ups carried over (not scheduled)
- Google sign-in shortcuts: exchange codes are in memory (single instance only; use Redis to
  scale), no OAuth `state` parameter, case-sensitive email lookup. On the host, set
  `CLIENT_ID`, `CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, and register the
  deployed callback URL in Google Cloud.
- Audit every `@Prop({ type: Types.ObjectId })` (Mixed path, no casting):
  `Post.author`, `Message.sender`, etc. Fix with `SchemaTypes.ObjectId` + migration.
- Rating counters (E11) aren't transactional with the rating write; no recompute job.
- "Ask a human" (E14) doesn't exclude blocked / already-mentoring mentors.
- Reports: no rate limit, no reporter notification, no reporting from community posts.
- Seed data: re-run the seed close to the demo date so "This month" leaderboard isn't empty.
- ~~`CLAUDE.md` §5 stale CI notes~~ fixed 2026-10-04; all five checks are required.

---

## Epic D (continued) — D11 comes before H2/H3

### D11 — Coherent two-pane layout for Ask AI and Messages
**Status: DONE (5e917e3 shared list pane, 27745f2 rail collapse); noted 2026-10-04.**
**Effort:** 5
**Where:** `shared/components/layout/*`, `features/ai-chat/*`, `features/chat/*`
**Why:** Both screens put a thread/conversation list directly beside the app's
own sidebar: two left columns, with different widths, headers and styles.
**Decision (2026-10-03):** the list stays always visible on desktop (no
drawer); the app rail collapses to icons on these routes.
**Acceptance criteria:**
- On desktop, `/ai` and `/chat` show the app rail collapsed (icons only)
  regardless of the saved preference; other routes are unchanged.
- One shared list-pane (same width, header with title + "new" action, search,
  row style, active highlight) used by both screens.
- Mobile unchanged: one pane at a time.

## Roadmap (2026-10-03)

Reprioritized 2026-10-04: features are enough; remaining work is UX polish and
robustness. Offline scope decided: **read-only offline** (no write queue).

| # | Phase | PBIs | Why this order |
|---|-------|------|----------------|
| 0 | Demo blockers | **I4**, I1/I2 leftovers (Render env, fail-fast env check), **D12** | The AI is the demo's centerpiece and hangs on the deployed app; answers vanish on navigation |
| 1 | Visible polish | H2 verification, D11, **J1** skeleton audit, **J2** mobile pass | What the examiners see first |
| 2 | Robustness | **J3** read-only offline, **J4** realtime resilience, login 404→401, `@Prop` ObjectId audit | Graceful failure instead of broken screens |
| 3 | Close-out | I3 (health, gating, smoke), H3, CLAUDE.md §5 test gate | Walkthrough and screenshots last, on the final deployed build |

## Epic J — UX polish & robustness (new, 2026-10-04)

### J1 — Skeleton and perceived-performance audit
**Status: DONE 2026-10-04 (4f743d2).** Shared `ListSkeleton`/`MessagesSkeleton` replaced every
list/conversation spinner (Ask AI, Messages, mentorship, notifications, admin tabs). Optimistic
updates already existed for post upvote, AI feedback and messenger send; there is no resource
like/follow. Routes are already lazy-loaded. Visual check of skeleton/layout match still needs a
browser pass (with H2/J2).
**Effort:** 3
**Where:** every list/page in `client/src/features/*`
**Why:** 20 files use skeletons already; the gaps are lists that still show spinners,
blank frames or layout jumps.
**Acceptance criteria:**
- No primary list or page shows a bare spinner or blank area while loading; each skeleton
  matches the final layout (no jump on load).
- Optimistic updates for like, follow and message send, with rollback and a toast on failure.
- Route-level code splitting checked; no visible flash on navigation.

### J2 — Mobile pass (390px)
**Status: DONE 2026-10-04.** Every route audited at 390px in light and dark: no horizontal overflow anywhere. Fixed: 40px minimum touch targets on touch devices (theme-level), Ask AI header subtitle wrapping. Remaining sub-40px items are text links inside larger tappable cards and 39px text inputs (accepted). Not checked: the on-screen keyboard overlapping composers (needs a real device).
**Effort:** 5
**Where:** app shell, every route, `features/chat`, `features/ai-chat`
**Acceptance criteria:**
- Every route audited at 390px in both themes; no horizontal scroll, clipped text or overlaps.
- Bottom nav / shell respects safe-area insets; composers aren't covered by the on-screen keyboard.
- Tap targets ≥ 44px; two-pane screens (D11) show one pane at a time with a clear back action.
- Findings fixed or logged.

### J3 — Read-only offline mode
**Status: DONE 2026-10-04, verified in a production build with the service worker.** Cached screens (Library, Ask AI, Messages, Community, Home) render offline; composers lock; writes fail fast with one toast; uncached screens show the error state with Retry; routes load from the service worker even on a first visit. **Auth bugs found and fixed on the way (these affected production, not only offline):** (1) `POST /auth/refresh` was not `@Public()`, so the global JWT guard rejected every refresh: sessions ended when the 1 h access token expired; (2) the client refresh used a relative URL, so on Vercel it never reached the API (masked by the Vite dev proxy); (3) any network failure or 5xx on reload cleared the session and sent the user to the landing page. Known limit: two tabs refreshing at once can race on the rotated refresh token.
**Effort:** 5
**Where:** `vite.config.ts` (workbox), `shared/lib/queryPersister.ts`, `shared/hooks/useNetworkStatus.ts`
**Decision:** read-only. No write queue or sync engine.
**Acceptance criteria:**
- A persistent "You're offline" indicator; clears on reconnect.
- Previously viewed Home, Library, resource details, AI threads and conversations render from cache
  with a "last updated" hint.
- Write actions (upload, send, like, apply) are disabled offline with a reason, not failing silently.
- Uncached screens show a designed offline empty state, not an error or blank.
- Queries refetch automatically on reconnect.
- Verified with DevTools offline after warming the cache; no stale-cache leak across logout/user switch.

### J4 — Realtime resilience
**Status: DONE 2026-10-04, verified on the demo stack.** The socket now presents the freshest access token on every reconnect, and re-authenticates through the API (token refresh) when the server drops it, bounded to 3 attempts; the composer shows "Reconnecting…" and can't send while the socket is down; on reconnect, chat, unread counts and notifications are refetched (`useSocketResync`). Verified with Chrome offline/online: a message another user sent meanwhile appeared 0.6 s after reconnect; reconnect with an expired access token recovered via refresh. Not done: a visible "connected" indicator beyond the composer placeholder; deployed-origin socket CORS check (needs the live app).
**Effort:** 3
**Where:** Socket.IO client/gateway, `features/chat`
**Acceptance criteria:**
- Connection state is visible in Messages; sending while disconnected is blocked with a clear message.
- On reconnect, conversations and unread counts resync (no missed messages).
- Socket CORS/handshake verified on the deployed origin.

---

## Epic I — Deployment on the monorepo

**Finding (2026-10-03):** the monorepo has no deployments and no webhooks, while
`CampusConnect-Client` has Vercel deployments. Vercel (and, by the same logic,
Render) still builds from the archived repos, so nothing merged since the
migration has reached production: the Google sign-in, D4–D11, E11–E16, and the
`client/vercel.json` SPA-rewrite fix (which is why the deployed site still
returned 404 on `/auth/google/callback`). Wiring itself can't be seen from the
repo; I1 starts with checking both dashboards.

### I1 — Repoint Vercel and Render at the monorepo
**Effort:** 3
**Where:** Vercel project settings, Render service settings (manual; Claude Code
can't reach either dashboard), then `CLAUDE.md` §8
**Acceptance criteria:**
- Vercel: Git repository = `CampusConnect`, **Root Directory = `client`**, framework
  Vite, build `npm run build`, output `dist`.
- Render: Git repository = `CampusConnect`, **Root Directory = `server`**, build
  `npm ci && npm run build`, start `npm run start:prod`, health check path set.
- Old repos disconnected so a stray push can't deploy an old build.
- **Render build command must be `npm ci --include=dev && npm run build`.** Render sets
  `NODE_ENV=production`, so a plain `npm ci` skips devDependencies (`@types/*`); `tsc`
  then compiles `AuthenticatedRequest` into a runtime reference and the app crashes at
  boot with `ai_controller_1 is not defined` (reproduced 2026-10-03).
- Vercel: one project only (`campus-connect-client`, URL `campus-connect-client-two`);
  the duplicate `campus-connect-client-7cuw` was deleted 2026-10-03. Both were already
  linked to the monorepo with Root Directory `client`.
- Deployed `/auth/google/callback` and a hard refresh on `/login` load (no 404).
- Sign-in, Google sign-in, an upload and an AI answer verified on the deployed app.

**Found while going live (2026-10-03):**
- Vercel's `VITE_API_BASE_URL` still had a `/api` suffix from the old code, so every call
  went to `/api/api/...` (login included). **The client contract is: the server origin
  only, no `/api`** (axios, the AI stream and the Google button each append it). Fixed in
  Vercel production and preview, then redeployed.
- Render `FRONTEND_URL` does not match the Vercel origin: the CORS preflight from
  `campus-connect-client-two.vercel.app` gets no `Access-Control-Allow-Origin`, so the
  browser blocks every API call. Must be `https://campus-connect-client-two.vercel.app`.
- Render has no `CLIENT_ID` / `CLIENT_SECRET`, so `/api/auth/google` answers 503.
- Wrong-password login for an unknown email returns 404 ("User not found") instead of
  401, which also tells an attacker which emails have accounts (follow-up, not scheduled).

### I4 — AI chat hangs on "Thinking" on the deployed app (BUG, blocks the demo)
**Effort:** 5
**Where:** `server/src/modules/ai/ai.controller.ts` (SSE handler), the global exception filter,
`vector-store.service.ts`, Render env
**Evidence (Render logs, 2026-10-03 06:22):** `POST /api/ai/chat/stream` → Qdrant
`getCollections` fails with `ECONNRESET` → the service correctly raises its 503 ("AI assistant is
temporarily unavailable") → `GlobalHttpExceptionFilter` then throws
`ERR_HTTP_HEADERS_SENT`, because the SSE headers were already written. So the client never gets
an error event or an end of stream and waits indefinitely.
**Two causes, fix both:**
1. **Error after SSE headers must be sent as an SSE `error` event, then `res.end()`**, not through
   the global filter's `res.status()/json()`. The filter must skip responses where
   `res.headersSent` is true. This is the CLAUDE.md §9 `ERR_HTTP_HEADERS_SENT` guard reappearing
   on a path it didn't cover. Add a regression test.
2. **Why Qdrant resets from Render:** check `QDRANT_URL` (the cluster with the `_demo` collections is
   `f2ec13c1…eu-central-1-0.aws`, not `dc52239e…us-east4`), `QDRANT_API_KEY` for that cluster,
   `QDRANT_COLLECTION_SUFFIX=_demo`, and whether the cluster is dormant. Also set
   `REDIS_UPSTASH_URL` (the old Upstash database no longer exists).
**Acceptance criteria:**
- With Qdrant unreachable, the chat shows a readable error within seconds and the composer
  re-enables (never an endless "Thinking").
- With everything configured, a question about Data Structures answers with a citation on the
  deployed app.
- The client also times out a stream that sends nothing for a set period (for example 45 s) with
  a retry option, as a second line of defense.

### I2 — Environment contract and `render.yaml`
**Effort:** 3
**Where:** `render.yaml` (repo root), `server/.env.example`, `client/.env.example`, docs
**Why:** Production config lives only in two dashboards. The Google setup showed how
easy it is to miss a variable (`FRONTEND_URL`, `GOOGLE_CALLBACK_URL`).
**Acceptance criteria:**
- `render.yaml` blueprint for the server (root dir, build/start, health check,
  `NODE_ENV=production`), with secrets declared `sync: false`.
- One table (in `server/.env.example` or a doc) of every variable per environment:
  local / demo / production, marking which are required.
- Server fails fast at boot with a clear message when a required production
  variable is missing (instead of failing on first use).
- Google Cloud: production redirect URI registered; consent screen published.

### I3 — Deploy gating, health check and smoke test
**Status: code and docs DONE 2026-10-04; two dashboard steps remain.** `GET /api/health` is now a dependency
report (Mongo, Redis, Qdrant with latencies; `ok` / `degraded` (200) / `down` (503 only for Mongo); errors logged,
not leaked; 10 s cache) and `GET /api/health/live` is the cheap probe. `render.yaml` uses `/api/health/live` and
`autoDeployTrigger: checksPass`; `docs/deploy-smoke-test.md` is the checklist; `scripts/warm-demo.sh <api-origin>`
wakes the stack. **Manual:** in Render, set Health Check Path to `/api/health/live` and Auto-Deploy to "After CI
checks pass" (the blueprint only applies if synced). Vercel has no equivalent gate and deploys on push; since
pushes go straight to `main`, CI cannot block a Vercel deploy (accepted).
**Effort:** 3
**Where:** `.github/workflows/*`, a `GET /api/health` endpoint, Render/Vercel settings
**Acceptance criteria:**
- Render auto-deploys only after the CI checks pass (and Vercel likewise), so a red
  `main` never ships.
- `/api/health` reports app up plus Mongo, Redis and Qdrant reachability (Qdrant and
  Redis degrade, not fail, per G4).
- Written post-deploy smoke checklist: sign in, Google sign-in, upload, approve,
  ask AI with a citation, message over the socket.
- Cold-start note for Render's free tier, and a way to warm it before the demo.

---

## Epic D (continued) — D12

### D12 — An AI answer must survive leaving the page
**Effort:** 5–8 (design pass first)
**Where:** `ai.controller.ts` / `ai-chat.service.ts` (generation vs. connection), the client
streaming hooks (`useStreamMessage`, `useDrainQueue`, `useStreamRefs`), `useConversation`
**Status: DONE and verified locally 2026-10-04 (d17259c server, ff2b450 client).** Verified on the demo stack: dropping the stream mid-generation leaves a `generating` reply that completes server-side; a thread opened meanwhile shows the question + "Thinking" with the composer locked, then the reply; hard refresh keeps the answer.
Corrected diagnosis: the server already kept generating after a disconnect, but saved the
question and reply only at the very end, so nothing was visible meanwhile; and the client
hook was never aborted on unmount, so an abandoned stream committed a truncated reply to
the persisted cache that never refetched. Implemented: user message + `generating`
assistant placeholder saved first (`AiMessage.status`), filled or marked `failed` at the
end; 120 s generation cap; stale `generating` rows reported failed after 3 min; 409 on a
second send into a generating thread; `retryOfMessageId` replaces a failed exchange; the
client aborts on unmount without committing, polls a `generating` reply every 2 s, shows a
failed one with Retry. **Known limits:** the 409 check isn't atomic (two simultaneous sends
could both pass); a user who leaves loses live token streaming and sees the finished reply
instead.
**Problem (original report):** if you send a message, navigate away and come back, the reply is gone. The stream
is tied to the page: leaving unmounts it, the fetch is aborted, and the server unsubscribes on
`req.on('close')`, so the answer is never finished or saved.
**Direction (to confirm in the design pass):** decouple generation from the connection.
The server keeps generating after the client disconnects and **persists the full reply**; the
client, on returning (or refreshing, or reopening the tab), shows the saved reply and, if it
is still generating, picks it up. This also covers a refresh and a closed tab, which lifting
the stream into a global client store would not.
**Constraints:** keep CLAUDE.md §4 (manual `res.write()` SSE on POST, raw `fetch`, the split
hooks, rAF batching). Don't generate unbounded: a disconnected stream still needs a timeout
and the token budget (B9).
**Acceptance criteria:**
- Send, leave to another page, return: the thread shows the complete reply (or a live
  continuation), never a missing answer.
- Same after a hard refresh mid-answer.
- A thread with a reply still being generated shows it as "answering…" and updates when done
  (the existing refetch-on-mount for history ending in a user message is the starting point).
- No duplicate messages (`clientId` de-dup still holds).

### Findings from the 2026-10-04 verification pass (not yet scheduled)
- **Latency from this machine to Atlas is 200-700 ms per round trip** (4-8 s per request locally). Check
  that the Render service and the Atlas cluster are in the same region; otherwise the live demo will feel
  slow however polished the UI is. Also measure Render cold start and warm it before the demo (I3).
- Cold page load shows a full-screen "Checking authentication..." spinner until `/users/profile`
  returns; with slow links that's many seconds. Render the app shell (with skeletons) from the cached
  profile instead (the cache now exists, `userCache`).
- `mongoose.set('debug', true)` is on in `main.ts` for every environment; log noise and a small cost in prod.
- Seeded demo threads have "8 days ago" timestamps; re-seed close to the demo date (also leaderboard).

## Epic H — Demo readiness (H2 done, H3 open)

### H2 — Empty, loading and error states pass
**Status: DONE 2026-10-03; verified 2026-10-04.** Empty user (desktop + mobile) and stopped-API passes ran against the demo DB: every list shows a designed empty state or an inline error with Retry. Fixed from the pass: Library showed "0 resources" beside a load error; an uncached screen offline showed "No mentors yet" (false); a reload with the API down logged the user out (see J3). New shared
`InlineError` (message + Retry) and a flat `EmptyState` (title, message, next
action). Applied to Home widgets, Messages and Ask AI (lists, history, feed),
Community rail and comments, admin panels, both profile pages and tabs,
Mentorship lists, Settings and notifications. Fixed along the way: a failed
request used to render the *empty* state (Home widgets "Nothing has been
shared", Ask AI thread history showing the new-chat prompts) and Settings
showed a skeleton forever. Library, Leaderboard, Mentor directory and Resource
detail already had retries. **Still to do:** run the app as an empty user on the
demo DB and with the API stopped, and fix what that shows.
**Effort:** 5
**Where:** every page redesigned in D6–D10
**Why:** A usable app is mostly defined by the unhappy paths: first-run
empty states that tell you what to do, skeletons instead of spinners/blank,
and errors that say what happened and offer a retry.
**Acceptance criteria:**
- Every list/page has a designed empty state with a next action.
- Skeleton loaders matching final layout for all primary lists.
- Network/API errors show an inline retry, not a blank page or only a toast.
- Verified by running the app against an empty user in the demo DB and
  with the API stopped.

### H3 — Demo walkthrough + final visual QA
**Effort:** 3
**Where:** docs outside the repo (FYP docs) + fixes found
**Why:** The defense is a scripted story; the product should be tuned to it.
**Acceptance criteria:**
- Written walkthrough: sign in → home → find resource → ask AI → citation
  shows contributor → ask a human → mentorship → messenger → admin moderation.
- Every screen in the walkthrough screenshotted in both modes at desktop
  and 390px mobile; issues fixed or logged.
