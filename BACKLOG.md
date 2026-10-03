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
- **H1 — Demo database + seed script** (`npm run seed:demo`, `campusconnect_demo`).

### Open follow-ups carried over (not scheduled)
- Audit every `@Prop({ type: Types.ObjectId })` (Mixed path, no casting):
  `Post.author`, `Message.sender`, etc. Fix with `SchemaTypes.ObjectId` + migration.
- Rating counters (E11) aren't transactional with the rating write; no recompute job.
- "Ask a human" (E14) doesn't exclude blocked / already-mentoring mentors.
- Reports: no rate limit, no reporter notification, no reporting from community posts.
- Seed data: re-run the seed close to the demo date so "This month" leaderboard isn't empty.
- `CLAUDE.md` §5 still says 9/10 server suites fail (A12); all 52 now pass. Review the
  advisory `test` CI job and make it required.

---

## Epic F — Google OAuth (code DONE 2026-10-03, live check pending)

Any Google account may sign in (no domain restriction). A Google email matching
an existing local account is linked only when Google reports it verified; otherwise
sign-in is refused. New Google users go through onboarding. Server: schema + user
lookup (F1), strategy, callback and one-time code exchange (F2). Client: button on
login/signup, callback page (F3). Credentials: `CLIENT_ID`, `CLIENT_SECRET`
(+ optional `GOOGLE_CALLBACK_URL`) in `server/.env`.

**Remaining:**
- Real end-to-end sign-in in a browser (new Google account, linking, denied consent).
- Google Cloud: redirect URI `http://localhost:3100/api/auth/google/callback` and the
  deployed `https://<server>/api/auth/google/callback`; publish the consent screen (or
  add test users); set `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`, `CLIENT_ID`,
  `CLIENT_SECRET` on the host.
- Shortcuts flagged: exchange codes are in-memory (single instance only; use Redis to
  scale); no OAuth `state` parameter (no sessions); email lookup is case-sensitive.

---

## Epic H — Demo readiness (H2, H3 open)

### H2 — Empty, loading and error states pass
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
