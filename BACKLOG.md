# CampusConnect Backlog

PBIs, not tasks. Each is sized to be handed to Claude Code as a self-contained
prompt — enough context to start cold, not a design doc. One committed
fix/feature per concern (see `CLAUDE.md` §3.2) — but related PBIs inside a
phase may be worked as one batch/branch, committed separately.

**Effort scale** (rough, solo-dev-with-Claude-Code calibrated):
- `3` — half a day to a day. One focused area, one commit, low ambiguity.
- `5` — one to two days. Touches a few files or one schema change.
- `8` — three-plus days / a small design pass first. Foundational or cross-cutting.

Nothing below `3` belongs here — smaller chores go straight into a commit,
not the backlog (or get bundled into a `3` sweep, e.g. G3).

---

## Roadmap (re-planned 2026-09-24)

**Goal:** a consumer-usable app for the FYP demo/defense (2–6 weeks out as of
2026-09-24), not just a feature-complete one. A UI review of every page
(desktop + mobile, logged-in) found the problems are mostly hierarchy and
consistency, not features — see Epic D's audit. Scope decision: **keep
everything** (E11–E16 and Epic F stay in).

Work top to bottom:

| # | Phase | PBIs | Why this order |
|---|-------|------|----------------|
| 0 | Quick fixes & resilience | G1–G4 ✅ | Cheap, unblocks a stable dev/demo env |
| 1 | Demo data | H1 ✅ | Redesigning against 4 resources and 1 mentor gives misleading screens |
| 2 | Design foundation | D4, D5 (+D3 folded in) | Tokens + app shell every page redesign builds on |
| 3 | Page redesigns | D6–D10 | In demo-walkthrough order |
| 4 | Integration features | E13, E14, E16 | The "resource → AI → human" story; safety before any public use |
| 5 | Mentorship depth | E11, E12, E15 | Builds on E10 + reputation |
| 6 | Google sign-in | F1–F3 | Independent; can slot in anywhere if needed |
| 7 | Demo polish | H2, H3 | States, walkthrough, final pass |

---

## Completed work (summaries — see git log for detail)

- **Epic A — Code health & CI gate** (DONE). Typecheck+build gate, lint
  clean both apps, error-handling/`any` sweep.
- **Epic B — Long-term memory chat, RAG-integrated** (DONE, 2026-09-18/19).
  Named threads with ownership (B1), thread CRUD (B2), persisted raw history
  (B3), auto titles (B4), query contextualization (B5), vector-backed
  cross-session memory (B6), thread sidebar (B7), server-as-source-of-truth
  sync (B8), Groq prompt token budget (B9).
- **Epic C — AI chat UX polish** (DONE). Copy + like/dislike toolbar (C1),
  composer refinement (C2), resource-card citations (C3), code-block copy (C4).
- **Epic D, D1/D2 — first theme pass** (DONE 2026-09-20, **superseded by
  D4**). Palette-driven component overrides, no hardcoded brand hex outside
  `theme/`, `getStatusMeta(theme)` for status colors. The "paper & ink" cream
  mood itself is being replaced — see D4.
- **Epic E, E1–E10 — messenger, reputation, mentorship foundations** (DONE
  2026-09-20). Messenger identity/avatars (E1), server-backed unread + badge
  (E2), presence + typing (E3), notifications module + bell (E4),
  contribution score ledger (E5), contributor applications (E6), tiers &
  badges (E7), mentor profile fields (E8), mentor directory (E9), mentorship
  request lifecycle (E10).

---

## Epic G — Quick fixes & resilience (DONE 2026-09-24)

**Status: DONE.** G1+G2 in one chore commit. G3 split into four commits:
mobile top bar (title was absolutely centered with a max-width narrower
than the right-side actions allowed; now a flex item), community
placeholder panel removed, duplicate profile CTA removed, and the email-as-
name root cause (registration seeded `name = email`, onboarding pre-filled
and accepted it; now unset at registration and required/trimmed at
onboarding — legacy accounts not migrated). G4 via a `RetryableInit`
helper: Qdrant collection bootstrap no longer blocks/aborts startup,
retries on first use, vector search surfaces a 503 with a readable
message; verified by booting with an unroutable `QDRANT_URL`. Also fixed
pre-existing server lint errors in `groq.service.spec.ts` found while
verifying.

### G1 — Remove leftover debug console.log calls in the streaming client
**Effort:** 3 (bundled with G2)
**Where:** `client/src/features/ai-chat/services/ai-chat.service.ts`
**Why:** `streamMessage` still has `console.log("[GENERATOR RESUMED]", ...)` /
`console.log("[SERVICE CATCH]", ...)` from earlier abort-handling debugging.
**Acceptance criteria:**
- Both calls removed (or converted to a guarded debug log if genuinely useful).
- Streaming/abort behavior unaffected — log-only cleanup.

### G2 — Remove unused `theme/theme.ts`
**Effort:** 3 (bundled with G1)
**Where:** `client/src/theme/theme.ts`
**Why:** Live theme comes from `createAppTheme` in `theme/index.ts`;
`theme/theme.ts` hardcodes `getPalette('dark')` and appears unimported.
**Acceptance criteria:**
- Zero import sites confirmed by grep before deleting.
- File removed; `tsc -b`/`vite build` clean.

### G3 — UI sloppiness sweep
**Effort:** 3
**Where:** `client/src/shared/components/layout/topbar/StandardBar.tsx`,
`client/src/features/community/pages/CommunityPage.tsx`,
`PostCard.tsx`/`CommentCard.tsx`, `ProfilePage` hero
**Why:** Found in the 2026-09-24 screenshot review — each is small, together
they make the app read as unfinished.
**Acceptance criteria:**
- Mobile (390px) top bar: PWA "Install" button no longer overlaps the
  centered "CampusConnect" title.
- Community right rail: remove the "A place to showcase popular topics or
  top contributors in the future." placeholder panel (or replace with real
  data — D9 will redesign the page anyway, so removal is fine).
- Community post author renders as `rahman@example.com` — determine whether
  the stored `name` is literally an email (data) or a display fallback
  (code); fix the code path so an email is never shown as a display name.
- Profile hero: "Change Avatar" is the primary CTA while "Edit Profile" is
  secondary — the avatar already has its own camera affordance; demote or
  remove the duplicate.

### G4 — Server must boot when Qdrant is unreachable
**Effort:** 3
**Where:** `server/src/modules/ai/services/vector-store.service.ts`,
`memory-store.service.ts` (`onModuleInit` → `ensureCollection`)
**Why:** Verified 2026-09-24: with the Qdrant Cloud cluster dormant, the
`getCollections()` call in `onModuleInit` times out
(`UND_ERR_CONNECT_TIMEOUT`) and Nest aborts bootstrap — **the whole API
goes down** (auth, resources, messenger) because one AI dependency is
asleep. Dormancy on inactivity is a known Qdrant Cloud behavior
(`CLAUDE.md` history), so this will happen during demos/after breaks.
**Acceptance criteria:**
- Collection bootstrap failure is logged with context and does not abort
  app startup; it's retried lazily (on first vector op) or with backoff.
- AI endpoints return a typed, user-facing "AI temporarily unavailable"
  error while Qdrant is down; non-AI features are unaffected.
- Keeps the `getCollections()` workaround intact (`CLAUDE.md` §4).
- Unit test covering "init fails → service still constructs → later call
  retries".

---

## Epic H — Demo readiness (H1 DONE; H2/H3 in Phase 7)

### H1 — Demo database + repeatable seed script
**Effort:** 5
**Where:** new `server/scripts/seed-demo.ts` (+ `npm run seed:demo`),
`server/.env.example`
**Why:** Current data: 4 resources, 1 mentor, community posts titled
"Test"/"Test Post" from ~5 months ago. Every redesigned screen will look
dead on this data, and design decisions made against empty states are
wrong for populated ones. **Decision (2026-09-24):** seed a *separate*
database on the same Atlas cluster; never write to the existing DB.
**Acceptance criteria:**
- Script refuses to run unless the target DB name is explicitly a demo DB
  (e.g. ends in `_demo`) — guard against seeding the real DB by accident.
- Idempotent: drop-and-recreate the demo DB's collections, deterministic
  content (fixed seed).
- Realistic QAU-flavored content: ~25 students across 3–4 departments and
  semesters, ~6 contributors/mentors with bios/expertise/capacity, ~30
  approved resources across courses/types, community posts with comments
  and upvotes, a few conversations, mentorships in each lifecycle state,
  reputation ledger entries consistent with scores/tiers, notifications.
- Resources: either real public-domain PDFs uploaded to a demo Cloudinary
  folder, or clearly-documented metadata-only entries (decide and document).
  RAG ingestion for seeded resources goes through the normal BullMQ path,
  not a bypass.
- Documented demo logins (student, contributor/mentor, admin) in a
  `server/scripts/README.md` — demo-only passwords, no real secrets.

**H1 status: DONE (2026-09-24).** `npm run seed:demo` (see
`server/scripts/seed-demo/README.md`) — seeded and fully ingested into
Atlas `campusconnect_demo` (20/20 resources in Qdrant `campus_resources_demo`).
Decision: real PDFs (generated from `data/resources.ts`) uploaded to
Cloudinary tagged `campusconnect_demo`, not metadata-only, so the AI
answers from real content. Prerequisite commits: `QDRANT_COLLECTION_SUFFIX`
and `BULL_PREFIX` env isolation. Found along the way:
- Local `mongo` container is standalone, so `PostService.createComment`
  (transactional) fails in local dev — use Atlas or run the container as a
  single-node replica set (`--replSet rs0` + `rs.initiate()`). Not changed:
  it's the developer's container.
- This machine's IPv6 route is flaky; Node `fetch` intermittently times out
  (was also the likely cause of the Qdrant boot failure G4 fixed).
  Workaround: `NODE_OPTIONS=--dns-result-order=ipv4first`.
- **Still to verify next session:** boot the app against the demo DB and
  eyeball every page (restart killed the shell before the check ran).

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

---

## Epic D — Design system & UI overhaul (Phases 2–3) — NEXT: D4

### Audit (2026-09-24, screenshots of every page, desktop + mobile, light)

The palette isn't the core problem — hierarchy and consistency are:
- **Beige-on-beige.** Canvas `#EFE8DA`, sidebar and cards `#F7F2E7` are
  near-identical; nothing separates layers, so every page reads flat.
- **Three visual languages at once.** Drop shadows *and* borders on cards,
  border radii from ~8px to ~24px (profile hero, rules card), pill buttons,
  gradient `contained` buttons, tinted stat "bubbles".
- **Navigation sprawl.** 7 primary + 4 secondary sidebar destinations
  (Profile, Notifications, Dark mode, Logout sit in nav); "Mentors" and
  "Mentorship" are separate top-level items for one feature.
- **Brand inconsistency.** App logo is the robot (`SmartToy`) icon; landing
  uses a graduation cap. Auth illustration is a stock unDraw figure in
  purple that clashes with the palette.
- **Dashboard shows platform vanity metrics** ("6 Students", "0 Posts this
  month") instead of what *this* student should do next.
- **Pages don't use their width.** Resources/Mentors are a left-aligned
  grid with a large empty canvas; Mentors has 6 filter controls for 1 result.
- **Dense metadata chips** on resource cards (type chip, semester chip,
  tier chip, download count, file size) compete with the title.

### Direction (decided 2026-09-24): "Warm neutral"

Terracotta stays the single brand accent, used sparingly (primary actions,
active nav, focus). Surfaces move off cream to neutral: light-grey canvas,
near-white cards/sidebar, clear 3-level surface stack. Flat: 1px borders,
shadows only for floating layers (menus, dialogs). No gradients. One radius
scale. Lucide icons. Dark mode = neutral charcoal with the same accent.
Serif display face (Lora) kept only for marketing/landing headings — in-app
headings go sans for density.

### D4 — Design tokens v2 ("warm neutral") + icon swap
**Effort:** 8
**Where:** `client/src/theme/*`, all `@mui/icons-material` import sites
**Why:** Foundation for every page redesign. Replaces the D1 cream palette.
**Acceptance criteria:**
- Tokens for: surface levels (canvas / surface / raised / overlay), text
  (primary/secondary/tertiary), border (subtle/default/strong), accent
  (brand + hover/pressed/subtle bg), semantic (success/warning/error/info
  + subtle bg), radius scale (e.g. 6/10/14 + full), spacing, elevation
  (overlay-only), in both modes, exported via the MUI theme (augment
  `Palette` types — no `any`).
- `componentOverrides` rewritten to the flat language: no gradients, no
  card shadows, consistent radius, button sizes/variants (primary, secondary,
  ghost, danger), inputs, chips (one neutral + one accent style), tabs,
  dialogs, menus, tooltips.
- WCAG AA verified numerically for text and accent pairs in both modes.
- **Folds in D3** (below): Lucide replaces `@mui/icons-material` everywhere;
  dependency removed.
- No page layouts changed yet beyond what the tokens imply.

(D3's original spec, kept for its acceptance criteria:)

#### D3 — Icon set overhaul (MUI icons -> Lucide) — folded into D4
**Effort:** 5
**Where:** all 53 files under `client/src` importing from
`@mui/icons-material` (136 individual icon imports, grepped and counted
2026-09-19 — re-verify before starting, this count will drift) — spans
chat, dashboard, admin, resources, messenger, contributors, onboarding.
**Why:** User feedback — MUI's stock Material icon set reads as "basic
corporate," undercutting the personality the new clay/terracotta +
serif-heading theme (D1/D2) is going for. Confirmed via `package.json`:
`@mui/icons-material` is the only icon dependency today, no `lucide-react`
or equivalent installed yet.
**Decision:** `lucide-react` — thin-line, consistent 24px grid, tree-
shakable, neutral-geometric style that pairs with the warm accent without
fighting it. Chosen by the user over Phosphor (more expressive but
inconsistent bundle cost across weights) and Tabler (utility/dashboard-
flavored) after a direct question in this session.
**Acceptance criteria:**
- `lucide-react` added as a dependency; `@mui/icons-material` usages
  replaced file-by-file with the closest Lucide equivalent (icon names do
  not map 1:1 — pick by visual/semantic match, not by string similarity).
- No `@mui/icons-material` imports remain anywhere in `client/src` when
  done (grep to confirm) — unless a specific icon has no reasonable
  Lucide equivalent, in which case document the exception inline instead
  of silently leaving old-library imports scattered around.
- Icon sizing/color (`sx={{ fontSize }}`, `color="..."` props MUI icons
  take directly) re-checked per usage — Lucide icons take `size`/`color`
  as plain props, not MUI's `sx`, so this isn't a mechanical find-replace.
- Spot-checked in both light and dark mode across the same five surfaces
  as D2 (Dashboard, AI Chat, Resources, Messenger, Contributors).
- `@mui/icons-material` removed from `package.json` once zero usages
  remain (don't leave a dead dependency installed "just in case").

### D5 — App shell & information architecture
**Effort:** 8
**Where:** `client/src/shared/components/layout/*`, `app/router.tsx`,
`app/routeConfig.ts`, `shared/constants/routes.ts`
**Why:** 11 nav destinations → 5. The shell is on every screen; it sets
the first impression more than any single page.
**Acceptance criteria:**
- Primary nav (sidebar desktop / bottom nav mobile): **Home, Library, Ask AI,
  Messages, Mentors**. Community reachable from Home + nav (decide: 6th item
  or tab inside Home — document the choice). Admin appears only for admins.
- Top bar (desktop and mobile): global search entry point, notifications
  bell with count, avatar menu → Profile, Settings, Theme toggle, Log out.
- Mentors + Mentorship merge into one section with tabs (Discover / My
  mentorships / Requests); old routes redirect.
- One brand mark used everywhere (logo + favicon + PWA icon + landing).
- Collapsible sidebar kept; mobile bottom nav badges (messages, requests).
- Page container component with consistent max-width, padding and header
  pattern (title, subtitle, actions) used by all pages.

### D6 — Home (personal dashboard)
**Effort:** 5
**Where:** `features/dashboard/*`, `dashboard` server module (`my-stats`)
**Acceptance criteria:**
- Replaces platform vanity stats with: Ask-AI entry, "Continue" (recent AI
  threads / recently viewed resources), resources for your department &
  semester, your active mentorships / pending requests, recent community
  activity. Platform-wide stats move to admin only.
- Greeting fixed (no italic accent-colored name fragment; first name only).

### D7 — Library + resource detail
**Effort:** 5
**Where:** `features/resources/*`
**Acceptance criteria:**
- Cards prioritize title → course → author; metadata demoted to one quiet
  line; type shown by icon/label, not a colored chip per type.
- Filters in a compact bar (search, course, type, semester) with active-
  filter chips + clear; list/grid toggle; sensible empty/no-results.
- Resource detail: preview, author card (links to profile; hooks for E13
  "Ask the author"), related resources, "Ask AI about this" entry.

### D8 — Ask AI + Messages
**Effort:** 5
**Where:** `features/ai-chat/*`, `features/chat/*`
**Acceptance criteria:**
- AI: thread list and conversation reflow to the new shell (no redundant
  back chevron on desktop), centered readable column (~720px), starter
  prompts personalized to the user's courses, citations styled per D4.
- Messages: same two-pane pattern as AI for consistency; bubbles, presence,
  typing, unread styled per D4; mobile single-pane navigation.
- Respects `CLAUDE.md` §4 streaming decisions (hooks split, rAF batching,
  raw fetch) — visual changes only.

### D9 — Mentors, Profile, Community
**Effort:** 5
**Where:** `features/contributors/*`, `features/mentorship/*`,
`features/user/*`, `features/community/*`
**Acceptance criteria:**
- Mentors: filters collapse into search + a filter popover; cards show
  avatar, name, tier, top expertise, capacity, one primary action.
- Profile: clean header (avatar, name, role/tier, department·semester,
  one Edit action), stats as a quiet inline row; tabs for Posts /
  Resources / Mentoring; settings move to the Settings page from D5.
- Community: feed column + useful right rail (trending tags / top
  contributors from real data), composer per D4.

### D10 — Landing + auth + onboarding
**Effort:** 5
**Where:** `features/auth/*`
**Acceptance criteria:**
- Landing page that explains the product in one screen (value prop,
  3 feature highlights with real product screenshots, CTA) — replaces the
  stock illustration.
- Sign in / sign up as focused forms (room for F3's Google button).
- Onboarding as a short stepper with progress; skippable optional steps.

---

## Epic E — Contributors, mentorship & the messenger (remaining: E11–E16)

Product vision (from the 2026-09-20 audit, still current): **find a
resource -> trust its author -> ask them -> get helped -> author earns
reputation -> more people contribute.** E1–E10 shipped the foundations
(see Completed work). Remaining PBIs, in roadmap order: **E13, E14, E16**
(Phase 4), then **E11, E12, E15** (Phase 5).

### E11 — Mentorship feedback & skill endorsements
**Effort:** 5
**Where:** `mentorship` module, `reputation` events, profile UI
**Why:** Closes the loop — mentors get credit, future mentees get social
proof, and quality is measurable.
**Acceptance criteria:**
- On `complete`, mentee can leave a 1-5 rating + short review (one per
  mentorship, immutable after a grace window); mentor average and count on
  the profile/directory card.
- Mentees can endorse specific expertise tags of a mentor they've worked
  with; endorsement counts shown next to tags.
- Completed mentorship + rating emit reputation events (E5).
- Abuse guard: only participants of a completed mentorship can rate/endorse.

### E12 — Recommended mentors (matching)
**Effort:** 5
**Where:** `mentorship`/`user` service (`GET mentors/recommended`),
`DashboardPage` widget, directory "For you" sort
**Why:** Interests, department, semester and expertise are collected at
onboarding and never used — free signal for matching.
**Acceptance criteria:**
- Deterministic, documented scoring function (interest/expertise overlap,
  same department, mentor semester > mentee's, capacity, rating) — pure and
  unit-tested; no ML.
- Dashboard "Recommended mentors" widget (replaces the bare
  `availableMentors` count with a real open-mentor count) and a "For you"
  sort in E9.
- Graceful cold start when a student has no interests set.

---
### Integration (roadmap Phase 4)

### E13 — Contextual chat: "Ask the contributor"
**Effort:** 5
**Where:** `message.schema.ts` (+ optional `context`/`kind`), chat DTOs,
`ResourceDetailPage`, `PostCard`, `MessageBubble`
**Why:** The natural moment to ask for help is while looking at a specific
resource or post. Context makes the conversation useful from message one.
**Acceptance criteria:**
- Message gains a typed `kind` (`text | resource | post`) and `context`
  ref; validated server-side; renders as a rich card in the feed (reuses
  existing resource card styling), click-through to the item.
- "Ask the author" on resource detail and post detail: starts (or reuses)
  the conversation and pre-attaches the item; if the author is a mentor with
  capacity it can offer "Request mentorship" (E10) instead of a plain DM.
- Doesn't break idempotent `clientId` de-dup (CLAUDE.md §4).

### E14 — Contributor attribution + AI "ask a human" handoff
**Effort:** 5
**Where:** `ai-chat.service.ts` `buildCitations()` + `Citation` type,
`CitationChip.tsx`, C1 feedback flow, `MessageBubble.tsx` (AI)
**Why:** Ties the RAG assistant to the people behind its sources — the
strongest integration in the epic. Also gives contributors credit when their
material powers answers.
**Acceptance criteria:**
- `Citation` carries uploader `{id, name, avatar, tier}` (resolved in one
  batched lookup per response — no N+1); citation card shows the contributor.
- When the assistant's retrieval is weak (top score under a documented
  threshold) or the user thumbs-downs (C1 `feedback: 'down'`), an inline
  "Ask a human" card suggests up to 3 mentors matched on the cited/related
  subject/course (E12 scoring reuse) with a one-click request (E10).
- Each distinct resource citation emits a debounced "cited by AI" reputation
  event to its uploader (E5) — deduped per (resource, day) to prevent gaming.
- Does not change the "Groq is instructed not to cite inline" decision
  (CLAUDE.md §4) — citations remain programmatic.

### E15 — Contributor impact dashboard & leaderboard
**Effort:** 5
**Where:** `dashboard` module (extend `my-stats`), `DashboardPage`,
`ContributorsPage`
**Why:** Contributors should see the effect of their work: it's the
retention lever for the supply side.
**Acceptance criteria:**
- "My impact" panel for contributors: score + history sparkline (E5
  ledger), downloads, AI citations, active/completed mentees, average
  rating, next-tier progress.
- Public leaderboard (top contributors this month / all time), opt-out
  respected; reuses existing top-contributors aggregation where possible.
- Follows the dataviz conventions already used in admin charts (Recharts).

---
### Safety (roadmap Phase 4)

### E16 — Block, report & chat moderation
**Effort:** 5
**Where:** `chat` module (block list, report schema), admin dashboard tab,
gateway guard
**Why:** Open messaging between strangers (especially once mentorship makes
contact easier) is an abuse vector; needed before any wider rollout.
**Acceptance criteria:**
- User can block/unblock; blocked pairs cannot send messages or (E10)
  request mentorship; enforced in the gateway/service, not only the UI.
- Report a message/conversation/mentor with a reason; admin queue to
  review, warn, or suspend (reusing `UserStatus`).
- Reported message content is retained for review even if the sender
  soft-deletes it.

---

## Epic F — Google OAuth authentication

Goal: let students sign in with their Google account instead of only
email/password. Independent of the other epics — can be picked up any
time; sequencing among F1-F3 matters (F1 is the schema foundation).

Current state (verified against code): `server/src/modules/auth/` has only
`local.strategy.ts` and `jwt.strategy.ts` (passport-local + passport-jwt,
already listed in `CLAUDE.md` §2). No `passport-google-oauth20` dependency,
no Google strategy, no callback route. `UserSchema`
(`server/src/modules/user/schemas/user.schema.ts:18-19`) has `password`
as `required: true` — that has to change before a passwordless OAuth user
can be created.

### F1 — User schema + config for OAuth-created accounts
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

### F2 — Google OAuth strategy + callback endpoints
**Effort:** 5
**Where:** `server/src/modules/auth/` (new `google.strategy.ts`,
controller routes), depends on F1
**Why:** The actual OAuth flow — this is the PBI that makes "Sign in with
Google" work end to end on the server.
**Acceptance criteria:**
- `passport-google-oauth20` strategy validates the Google profile, calls
  F1's `findOrCreateGoogleUser`, and issues the same access/refresh token
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

### F3 — Frontend "Sign in with Google" flow
**Effort:** 3
**Where:** `client/src/features/auth/` (or wherever login/signup UI
lives), `client/src/app/providers/AuthProvider.tsx`, depends on F2
**Why:** The visible half — a button plus handling F2's redirect-back so
the user actually lands authenticated in the app.
**Acceptance criteria:**
- "Continue with Google" button on the existing login/register screen,
  linking to the server's `GET /auth/google`.
- A callback/landing route that receives F2's redirect, stores tokens via
  the existing `tokenStorage` utility, and populates `AuthProvider` the
  same way a normal login does (reuse `login`/`fetchProfile`, don't fork
  a second auth-bootstrap path).
- Error case (user denies consent, or F2 redirects with an error) shows a
  clear message on the login screen instead of a blank/broken redirect
  target.

---
