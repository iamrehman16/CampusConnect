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
- `CLAUDE.md` §5 still says 9/10 server suites fail (A12); all 52 now pass. Review the
  advisory `test` CI job and make it required.

---

## Epic D (continued) — D11 comes before H2/H3

### D11 — Coherent two-pane layout for Ask AI and Messages
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

| # | Phase | PBIs | Why this order |
|---|-------|------|----------------|
| 1 | Deploy on the monorepo | **I1–I3** | The demo runs on the deployed app, which is still wired to the two archived repos |
| 2 | Demo readiness | H2 verification, H3 | Walkthrough and screenshots must be taken on the deployed build |
| 3 | Local self-hosted stack | J1, then J2–J4 | Developer experience and resilience; must not change what the demo runs on |

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
- Deployed `/auth/google/callback` and a hard refresh on `/login` load (no 404).
- Sign-in, Google sign-in, an upload and an AI answer verified on the deployed app.

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

## Epic J — Local self-hosted dev stack

**Goal:** develop with no dependency on Atlas, Qdrant Cloud, Gemini or LlamaParse,
with low latency, while the deployed app stays fully hosted. **Groq stays cloud
for the LLM in both** (no GPU on the dev machine: 15 GB RAM, 8 cores).

**Plan and constraints (agreed direction, 2026-10-03):**
- **Feasible on this machine** but RAM is tight (about 7 GB free with the IDE and
  browser open). Rough budget: Mongo 0.5 GB, Redis 0.1, Qdrant 0.5, embedding server
  1–2, Docling 3–4 GB while parsing. So Docling is an optional compose profile,
  started only when testing ingestion.
- **Embeddings change the vector space.** The code hard-codes 3072 dimensions
  (`VECTOR_SIZE` in `vector-store.service.ts`), which is Gemini's. A local model
  (e.g. bge-m3 at 1024, nomic-embed-text at 768) needs its own collection and
  dimension, and **local and production must never share a collection.** Local relevance
  scores also differ, so the 0.6 cutoff + 0.05 margin (tuned for Gemini) must be
  re-tuned per provider, not copied.
- **The demo must run on the deployed stack** (Gemini + LlamaParse + Qdrant Cloud),
  which is what was tuned and tested. The local stack is for development.
- Parser output must keep per-page text, since citations show page numbers.

### J1 — Local infrastructure compose (Mongo, Redis, Qdrant)
**Effort:** 3
**Where:** `docker-compose.yml` (repo root), `server/.env.local.example`, `package.json` scripts
**Why:** Local dev currently mixes Atlas and a standalone Mongo container (which cannot
run `createComment`'s transaction) and uses cloud Qdrant, which goes dormant.
**Acceptance criteria:**
- One command starts Mongo as a **single-node replica set** (transactions work),
  Redis and Qdrant (no API key), with named volumes.
- `.env.local.example` lists exactly the variables for this mode; Atlas is used only
  for production and the demo database.
- `npm run seed:demo` works against the local Mongo.
- Documented in the README: start, stop, reset.

### J2 — Parser provider abstraction + Docling
**Effort:** 5 (start with a half-day spike)
**Where:** `server/src/modules/ai/services/document-parser.service.ts`, compose profile
**Why:** LlamaParse is a paid, rate-limited cloud call; Docling (`docling-serve`) runs
locally on CPU.
**Spike first:** run Docling CPU on 5 seed PDFs; record time per page, peak RAM and output
quality (tables, headings) against LlamaParse. Stop here if it needs more than about 4 GB
or takes more than a few seconds per page.
**Acceptance criteria:**
- A `DocumentParser` interface (`parse(url, resourceId) → ParsedDocument` with per-page
  text) selected by `PARSER_PROVIDER=llamaparse|docling`; default `llamaparse`.
- The existing LlamaParse implementation is unchanged in behavior (CLAUDE.md §4:
  polling and in-memory `FormData` stay).
- Docling implementation with explicit error handling and a timeout; unit tests with a
  mocked HTTP layer.

### J3 — Embedding provider abstraction + configurable dimension
**Effort:** 5 (+3 to re-tune retrieval)
**Where:** `embedding.service.ts`, `vector-store.service.ts`, `memory-store.service.ts`,
compose profile (a CPU embedding server such as Text Embeddings Inference, or Ollama)
**Acceptance criteria:**
- `EMBEDDING_PROVIDER=gemini|local`, `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`;
  default stays Gemini 3072.
- The Qdrant collection name includes the provider, model and dimension, so a mismatch
  can never write wrong-sized vectors into an existing collection (the server refuses to
  start rather than corrupt it).
- A script to re-ingest all approved resources into a new collection.
- A small labelled question set (about 20) measuring recall per provider, and the retrieval
  cutoff tuned per provider from it (also closes the old "evaluation set" note from E14).

### J4 — Local run-through and documentation
**Effort:** 3
**Acceptance criteria:**
- Fresh clone to a working local app (seed, upload, ingest, ask with a citation) in one
  documented path, with the RAM budget and which compose profiles to start.
- A note of known differences from production (relevance scores, parse quality).

---

## Epic H — Demo readiness (H2, H3 open)

### H2 — Empty, loading and error states pass
**Status: code DONE 2026-10-03, manual verification pending.** New shared
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
