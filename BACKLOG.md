# CampusConnect Backlog

PBIs, not tasks. One committed fix/feature per concern (see `CLAUDE.md` §3.2).
Effort scale: `3` = half a day to a day, `5` = one to two days, `8` = three-plus
days. Anything smaller goes straight into a commit. Detail of finished work lives in `git log`.

Goal: a consumer-usable app for the FYP demo/defense (~Oct/Nov 2026).
Last cleaned: 2026-10-08. Code health, features and UX polish are done; what remains is
verification on the deployed app, manual dashboard steps, and the FYP documents.

---

## Remaining to complete the FYP

### R1 — Before the demo (manual, ~half a day)
1. **Re-seed the demo DB close to the date** (`cd server && DEMO_MONGO_URI=… npm run seed:demo`, see
   `server/scripts/seed-demo/README.md`). Timestamps read "12 days ago", the leaderboard's "This month" is thin, and the old
   seeded AI threads show the question under the answer (tied `createdAt`; fixed for new messages in `d5cbeab`). It wipes the
   `_demo` Qdrant collections and Cloudinary files, so run it deliberately; it waits for ingestion (5–15 min).
2. **Render dashboard:** delete `REDIS_UPSTASH_URL` (ignored now); Health Check Path `/api/health/live`; Auto-Deploy "After CI checks pass"
   (the blueprint only applies if synced); confirm Render and the Atlas cluster share a region (local-to-Atlas was 200–700 ms/query).
3. **Google Cloud:** production redirect URI registered and consent screen published (I2); set `CLIENT_ID`, `CLIENT_SECRET`,
   `GOOGLE_CALLBACK_URL`, `FRONTEND_URL` on Render.
4. **Run `docs/deploy-smoke-test.md` end to end on the deployed app** and `scripts/warm-demo.sh <api-origin>` 5 minutes before the demo.
5. **Real-phone pass of `docs/demo-walkthrough.md`** with a second account for the live messenger: ask a human, mentorship
   request, send a message, approve a resource (none of these click-throughs were done; they'd write to demo data), plus one fresh AI
   question confirming the citation shows its contributor. Also check on a phone: the J5 landing "Get started" button (my fix is a
   best guess), PWA install on Android and the iOS "Add to Home Screen" dialog, Lighthouse "Installable", and the on-screen keyboard vs composers (J2).
6. **I5 live check:** approve a resource and watch it ingest (log "Ingestion complete", then a citation); optionally kill the server
   mid-ingestion and confirm it resumes after restart.

### R2 — FYP documents (outside this repo; status not tracked here)
SDD, SPMP, test document, UML (`CLAUDE.md` §8), screenshots for the report (`~/dev/fyp/demo-screenshots/`, refresh after the re-seed),
and the architecture decisions in `docs/decisions/0001-no-redis.md`. Add the test document's evidence from `npm test` (475 server tests) and CI.

### R3 — Code items, optional (none block the demo)
- **`@Prop({ type: Types.ObjectId })` audit (skipped 2026-10-08).** 9 paths load as `Mixed` (no casting): `Post.author`, `Comment.author/postId`,
  `Message.sender/conversationId`, `AiMessage.conversationId`, `Conversation.lastMessage`, `ReputationEvent.user`, `Notification.user`
  (Resource and the moderation/mentorship/application schemas weren't checked). Switching to `SchemaTypes.ObjectId` is safe only if no
  documents store strings: `fyp-db` has none, the demo/prod DB hasn't been checked (needs the Render `MONGO_URI`; count script was a scratch file).
- Admin-UI "Retry ingestion" button (endpoint exists: `PATCH /admin/resources/:id/retry-ingestion`); resources approved before I5 have no `ingestionStatus`.
- "Ask a human" (E14) doesn't exclude blocked / already-mentoring mentors; rating counters (E11) aren't transactional, no recompute job.
- Reports: no rate limit, no reporter notification, no reporting from community posts.
- Google sign-in: exchange codes in memory (single instance), no OAuth `state`, case-sensitive email lookup.
- D12: the 409 "already generating" check isn't atomic; a user who leaves loses live token streaming (sees the finished reply instead).
- J3/J4: two tabs refreshing at once can race on the rotated refresh token; no visible "connected" indicator beyond the composer; socket CORS not checked on the deployed origin.
- Mongoose `findOneAndUpdate({ new: true })` deprecation warning (use `returnDocument: 'after'`); Qdrant client 1.17 vs server 1.19 version warning.

### When to revisit
Redis returns only if the app goes multi-instance, gets heavy/scheduled jobs, or several job types: see `docs/decisions/0001-no-redis.md`.

---

## Done (record only)

- **A — Code health & CI gate.** Typecheck+build, lint, tests are required checks on `main`; `any`/error-handling sweep done; 475 server tests pass.
- **B — Long-term memory chat (RAG).** Named threads, persisted history, auto titles, query contextualization, vector-backed cross-session memory, token budget.
- **C — AI chat UX polish.** Copy/like/dislike toolbar, composer, resource-card citations (deduped by resource), code-block copy.
- **D1–D11 — Design system & UI overhaul.** Warm-neutral tokens, Lucide icons, 5-item shell; Home, Library, Ask AI, Messages, Mentors, Profile, Community, landing, auth, onboarding redesigned; shared two-pane list layout.
- **D12 — AI answers survive leaving the page.** Reply persisted server-side as a `generating` placeholder, completed or marked failed; client aborts on unmount, polls, offers Retry.
- **E1–E16 — Contributors, mentorship & messenger.** Messenger, reputation ledger/tiers, applications, mentor directory/requests/ratings/endorsements, contextual chat, AI "ask a human", leaderboard, block/report/moderation.
- **F1–F3 — Google OAuth sign-in.** Links a verified email to an existing account; one-time-code redirect (no tokens in URLs); verified end to end 2026-10-03.
- **G1–G5 — Quick fixes & resilience.** Debug logs/dead theme removed, UI sweep, server boots with Qdrant down, password change needs current password.
- **H1 — Demo database + seed script** (`npm run seed:demo` → `campusconnect_demo`). **H2 — Empty/loading/error states pass**: shared `InlineError`/`EmptyState`, every list verified empty and with the API down.
- **H3 — Demo walkthrough + QA** (2026-10-08): `docs/demo-walkthrough.md`, 64 screenshots (desktop/mobile × light/dark), fixed admin tabs/cards on mobile and AI message ordering; remaining click-throughs are R1.5.
- **I1–I4 — Deployment.** Vercel/Render on the monorepo, env contract + fail-fast boot validation + `render.yaml`, deep `/api/health` + `/health/live` + smoke checklist + warm script, SSE error path fixed (no endless "Thinking").
- **I5 — Redis removed.** In-process ingestion queue with durable `Resource.ingestionStatus`, boot recovery, admin retry endpoint; decision in `docs/decisions/0001-no-redis.md`.
- **J1–J5 — UX polish & robustness.** Skeleton audit, 390px mobile pass, read-only offline mode (+ three auth/refresh bugs), socket reconnect/resync, Ask AI header/landing CTA fixes and discoverable PWA install (iOS guidance).
- **Also shipped:** cold-load shell from the cached profile (no "Checking authentication…" screen), login unknown email answers 401 not 404, Mongoose debug logging opt-in.
