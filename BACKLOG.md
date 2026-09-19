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

Epics below are ordered by current priority — work top to bottom unless you
have a specific reason to jump ahead.

---

## Epic A — Code health & CI gate cleanup (DONE)

---

## Epic B — Long-term memory chat, RAG-integrated (DONE)

Replaced the single lifelong per-user session with a real Claude/ChatGPT-style
chat: multiple named threads with ownership checks (B1), thread CRUD API
(B2), full raw message history persisted per thread independent of the
context-window summary (B3), auto-generated thread titles (B4), query
contextualization so follow-up questions retrieve correctly (B5),
vector-backed cross-session memory recall in its own Qdrant collection (B6),
a frontend thread sidebar with per-conversation cache keys (B7), server-as-
source-of-truth history sync on thread open (B8), and a token budget on the
assembled Groq prompt with a documented drop order (B9). All nine shipped
2026-09-18/19 — see git log (`feat(ai):`/`feat(ai-chat):` commits) for
implementation detail; this summary replaces the earlier PBI-by-PBI
resolution notes now that the epic is closed.

---

## Epic C — AI Chat UX polish

**Decided 2026-09-19:** the dashboard and nav placement stay as they are —
AI Chat remains a nav item with a dashboard CTA widget, not the landing
surface. (This supersedes an earlier proposal, drafted the same day and
never started, to make chat the landing experience — reverted per direct
product direction before any code was touched.) Epic B made the chat
feature architecturally complete (threads, memory, RAG, streaming); what's
left is the surface-level UX work that makes it feel finished rather than
functional-but-rough.

### C1 — Message action toolbar: copy + like/dislike feedback
**Effort:** 5
**Where:** `client/src/features/ai-chat/components/MessageBubble.tsx` (new
toolbar), server `AiMessage` schema + `ConversationController` (new
feedback field/endpoint)
**Why:** Confirmed gap — `MessageBubble.tsx` has no action row at all
today (no copy-to-clipboard, no like/dislike), and there's no feedback or
rating concept anywhere in the server (`grep -rli feedback|rating`
across `server/src/modules` turns up nothing). Every mainstream AI chat UI
exposes this on assistant messages.
**Acceptance criteria:**
- A toolbar under each assistant message (hover-to-reveal on desktop,
  always-visible on mobile) with: copy button, thumbs-up, thumbs-down.
- `AiMessage` gains an optional `feedback: 'up' | 'down'` field; a small
  ownership-checked endpoint sets/clears it, following the existing
  `ConversationController` pattern.
- Selecting a thumb toggles it; clicking the same one again clears it. At
  most one active state per message.
- Copy button copies the message's raw text/markdown, with a brief visual
  confirmation (icon swap, not a toast that covers the message).
- No regenerate button in this PBI — scope is deliberately limited to
  copy + like/dislike. Regenerate touches streaming/resend logic and is
  a separate, larger PBI if wanted later.

**Status: DONE.** `AiMessage.feedback?: 'up' | 'down'` added; ownership-
checked `PATCH ai/conversations/:id/messages/:messageId/feedback` (`null`
clears via `$unset`, not a stored 'none'). `appendMessages` now returns
`{ userMessageId, assistantMessageId }` — a real gap this PBI surfaced:
the client previously had no way to know an assistant reply's persisted
id at all, since `appendMessages` runs *after* the SSE `done` event is
already flushed (deliberately, for perceived latency — see B8). Fixed by
adding a `message-saved` SSE event emitted once persistence completes;
`useStreamMessage` no longer returns early on `done` and now swaps the
bubble's client-generated id for the real one in place
(`ai-chat.cache.ts`'s `updateMessageId`), covering either arrival order
against `useDrainQueue`'s commit. `MessageBubble.tsx` gained
`MessageActionToolbar` (copy via Clipboard API with icon-swap
confirmation; thumbs toggle via `useSetMessageFeedback`, optimistic with
rollback on error), hover-reveal on desktop / always-visible on mobile.
Non-streaming `getChatResponse`/`ChatResponseDto` also carry the new
`messageId` for consistency. Server: 84/84 tests green, lint clean,
typecheck clean. Client: typecheck/build/lint clean.

### C2 — Composer (input bar) refinement
**Effort:** 3
**Where:** `client/src/features/ai-chat/components/ChatInput.tsx`
**Why:** Confirmed gaps in the current composer — no persistent
Enter-to-send/Shift+Enter-for-newline hint (the keyboard behavior exists
in `handleKeyDown` but is never surfaced to the user), and focus isn't
restored to the textarea after sending a message (only after a prefill,
via `ChatInput.tsx`'s existing `prefillValue` effect) — user has to
reclick to keep typing.
**Acceptance criteria:**
- Textarea regains focus automatically right after a message is sent.
- A subtle, low-emphasis hint communicates Enter-to-send /
  Shift+Enter-for-newline, matching the keyboard behavior that already
  exists.
- The disabled-during-streaming state reads clearly as "can't type right
  now," not just a color change — visual clarity only, no new behavior.

**Status: DONE.** Root cause of the disabled-state gap: `ChatInput`
already declared a `disabled` prop and used it to gate `handleSend`/
`canSend`, but never actually passed it to the `TextField` — so streaming
silently blocked sending without ever visibly locking the field. Wired
`disabled` onto the `TextField` (MUI's native disabled treatment) plus an
explicit opacity/background dip on `.Mui-disabled` so it doesn't read as
"muted but still a normal field." Added a low-emphasis "Enter to send ·
Shift+Enter for new line" caption (hidden on mobile, where the shortcut
doesn't apply) alongside the existing char counter. Focus restoration:
since a disabled input is force-blurred by the browser, refocusing right
at send would just get undone the moment streaming disables the field —
instead an effect watches `disabled` going true→false and refocuses once
the composer is usable again, plus an immediate `.focus()` call in
`handleSend` for the (non-streaming) case where the field never actually
disables. Client typecheck/build/lint clean. Not manually verified in a
running browser this session — worth a quick pass before considering the
composer visually final.

### C3 — Inline resource cards on citations
**Effort:** 3
**Where:** `client/src/features/ai-chat/components/CitationChip.tsx`,
`client/src/features/resources/components/ResourceCard.tsx`
**Why:** Confirmed gap, smaller than it first looks — citations already
deep-link to `/resources/:id` (`CitationChip.tsx`'s `CitationItem`,
`handleClick` → `navigate`). What's missing is that the citation list is
a bespoke, text-only row, not the richer `ResourceCard` used everywhere
else in the app (thumbnail, type/subject chips, contributor) —
inconsistent presentation of the same underlying resource. "Related
resources" beyond direct citations would need a new retrieval query with
no backend support today; that's separate net-new scope, deliberately
left out here.
**Acceptance criteria:**
- `CitationsChip`'s expanded list renders `ResourceCard` (or a compact
  variant, if the full card doesn't fit the chat column width) instead of
  the bespoke `CitationItem`.
- Existing click-through-to-`/resources/:id` behavior is preserved.
- No backend changes — client-only presentational PBI.

**Status: DONE.** Confirmed during implementation that reusing
`ResourceCard` verbatim isn't actually possible without a backend change:
`Citation` only carries `{title, pageNumber, semester, course,
resourceId}` from the retrieval response, not the `fileType`/
`uploadedBy`/`fileSize`/approval-status fields `ResourceCard` renders —
and fetching each cited resource's full record just for its card would
mean N extra requests per assistant message. Built a compact card in
`CitationChip.tsx` instead, borrowing `ResourceCard`'s visual language
(hover-lift `Card`/`CardActionArea`, icon badge, chip row) but built only
from what `Citation` actually has. Click-through to `/resources/:id`
preserved. No backend changes. Client typecheck/build/lint clean.

### C4 — Copy button on code blocks
**Effort:** 3
**Where:** `client/src/features/ai-chat/components/MarkdownMessage.tsx`
(`pre`/`code` renderers)
**Why:** Confirmed gap — the `pre`/`code` components in
`MarkdownMessage.tsx` render plain, no copy affordance. Every mainstream
AI chat UI has a copy button on code blocks specifically, distinct from
copying the whole message (C1).
**Acceptance criteria:**
- Each fenced code block gets a small copy button (hover-to-reveal on
  desktop, always-visible on mobile) that copies just that block's raw
  text.
- Visual confirmation on copy, consistent with C1's copy-button behavior.

**Status: DONE.** `pre`'s renderer in `MarkdownMessage.tsx` now wraps the
code block in a positioned container with a hover-reveal (always-visible
on mobile) copy button, matching C1's icon-swap confirmation pattern. The
raw text comes from a small `extractText` helper that flattens
react-markdown's `code` children (which can be split across several text
nodes) back into a plain string, rather than assuming a single string
child. Client typecheck/build/lint clean.

---

## Epic D — Design system & theme overhaul

Goal: replace the current look with two genuinely distinct, intentional
themes — not the same palette auto-inverted — that read as a considered
brand rather than a default MUI reskin. Confirmed via
`client/src/theme/palette.ts`: light and dark today share the same primary
(`#6C63FF`) and near-identical secondary (`#00D9A6`/`#00B894`) hues, varying
only background/text lightness. This is a design pass — sign off on
direction with real screens before rolling out broadly, and pick colors
deliberately different between light and dark rather than one hue at two
lightness values.

### D1 — Define the new palette & design tokens
**Effort:** 5
**Where:** `client/src/theme/palette.ts`, `typography.ts`, `components.ts`
**Why:** See epic goal — confirmed both modes share the same primary/
secondary hues today.
**Acceptance criteria:**
- New primary/accent colors per mode — light and dark are encouraged to
  use different hues, not just different lightness of the same hue.
- Typography scale/weights reviewed alongside the new colors for overall
  cohesion (`typography.ts` is separate from `palette.ts` today — confirm
  it still fits the new palette's mood, adjust if not).
- Rationale for the choice documented in this PBI's resolution (a short
  note, not a design doc) so the "why" survives past this session.
- Tokens only in this PBI — no component-level rollout yet (that's D2).

**Status: DONE.** Two distinct moods instead of one hue at two lightnesses:
light is "paper & ink" (warm clay/terracotta `#B5541F` primary on a warm
cream `#F6F1E9` background, cooled by a forest-teal `#2F6F62` secondary —
reads academic, like ink on a page) and dark is "midnight desk" (cool
indigo `#5266D6` primary on near-black blue-slate `#12141C`, warmed by an
amber `#F0A857` "desk lamp" secondary). The primary hue itself changes
between modes, not just its lightness. Semantic colors (error/warning/
success/info) were re-tuned to harmonize with each mood but deliberately
kept distinct from primary/secondary — an earlier draft reused the brand
hues for warning/success and made a "pending" chip indistinguishable from
a primary button, so that was reverted. Typography: added `Lora` (serif)
as a display face for `h1`-`h3` only, layered on top of `Inter`, which
stays the sole typeface for `h4`-`h6`/body/buttons/chips — gives page-level
headings a distinct voice without hurting density in the small, frequent
UI text (chat bubbles, chips, forms). Loaded via the existing Google Fonts
`<link>` in `index.html`; also fixed the stale `theme-color` meta tag
(was still `#6C63FF`). All new primary/secondary pairings checked against
WCAG contrast math (see D2) before finalizing — one shade (`dark` primary)
was darkened from `#5B6EE8` to `#5266D6` to clear 4.5:1 against white
button text.

**Follow-up (user feedback, live-checked in browser):** light mode's
first pass (`#F6F1E9` default / `#FFFCF7` paper) had a near-pure-white
paper surface that read as glare/eyestrain on screen despite being
"warm cream" on paper. Darkened both to matte tones — `#EFE8DA` default,
`#F7F2E7` paper — and stepped the primary down accordingly (`#B5541F` ->
`#A44C1B`) to hold >4.5:1 contrast for primary-colored text against the
now-darker paper. Dark mode was left untouched (no complaint there, and
its background was already near-black, not near-white). Not a full fix
for the accessibility gap discovered in the process: warning/success/info
text sitting on their own 12%-alpha chip backgrounds (e.g. status filter
chips in `ProfileResourcesTab`) computes to 2.4-4.4:1, below AA-normal-text
4.5:1 for several of them — pre-existing (same issue existed against the
old near-white paper), not introduced by this change, and out of scope for
a background-tone fix. Left as a known gap for D2's still-open manual
accessibility pass rather than silently patching each chip's alpha/weight
without the user in the loop on look.

**Follow-up #2 (user feedback):** dark mode still read as generic
navy-blue everywhere after D1/D2 — user's words: "the theme new theme we
implemented is just applied on light mode... the dark mode has navy color
all over it." Root-caused via a targeted read-only audit (see the general
inline audit note above D2): confirmed every shell/layout/feature
component (`AppLayout`, `Sidebar`, `BottomNav`, dashboard, resources,
messenger, contributors) already reads `background.default`/
`background.paper` from the theme correctly — no component bypasses the
theme. The bug was in the token itself: D1's dark-mode rewrite changed
`primary`/`secondary` (purple -> indigo, teal -> amber) but left
`background.default`/`background.paper`/`text.secondary`/`divider`
essentially untouched from the old palette — measured at ~226-228° hue,
~20% saturation before and after, i.e. still the same navy-blue-slate,
just 1-2% lighter. Since those four tokens are what every single surface,
caption, and border reads from app-wide, the primary/secondary changes
alone were invisible against the unchanged (and most visually dominant)
neutrals. Fixed by re-deriving the dark neutrals as warm-charcoal instead
of blue-slate: `background.default` `#12141C` -> `#181614`,
`background.paper` `#1B1E29` -> `#211E1C`, `text.secondary` `#A6ADBB` ->
`#ABA9A3`, `text.disabled` `#5B6272` -> `#726F67`, `divider`
`rgba(166,173,187,...)` -> `rgba(171,169,163,...)` — all now ~24-45° hue,
<10% saturation (matte charcoal, not navy). Contrast re-verified: text
pairs 7:1-16:1 (comfortably above AA), disabled-text contrast improved
from the old theme's 2.49:1 to ~3.6:1 (disabled text has no AA
requirement, but higher is still better). One pre-existing, not-newly-
introduced gap noted in passing: `primary.main` (indigo) used as text
color directly on `background.paper` computes to ~3.3:1 in dark mode
(was ~3.9:1 in the old theme, e.g. `MarkdownMessage`'s link color) — below
AA-normal-text 4.5:1, though it clears the 3:1 large-text/UI-component
threshold. Not fixed here (would mean auditing every dark-mode use of
primary-as-text-color individually, a bigger and more surgical job than a
token-level palette fix) — added to the same accessibility-audit gap list
above. Also fixed, same class of bug, found by the same audit: two
profile-tab skeleton cards (`ProfilePostsTab.tsx`, `ProfileResourcesTab.tsx`)
hardcoded a `rgba(255,255,255,...)` overlay that assumed a dark
background — nearly invisible in light mode, and not derived from the
theme in dark mode either. Removed in favor of the theme's own `MuiCard`
override, which both already correctly styles.

**Follow-up #3 (user steer):** the indigo dark-mode primary above was
itself replaced — user asked to keep one consistent signature brand color
(clay/terracotta) across both modes rather than switching hue for dark
mode, explicitly citing Claude's own UI as the reference point for that
choice. This reverses D1's original "light and dark are encouraged to use
different hues" framing for *primary* specifically (secondary still
differs in role — amber "desk lamp" accent stays as-is). Dark-mode
primary is now `#D98A5C` (main) / `#E8B08C` (light) / `#A44C1B` (dark,
== light mode's own primary) / dark contrastText `#1A1206` — brightened
and switched to dark-on-light button text instead of white-on-dark,
because at this lightness (~61% L) white text fails AA (2.7:1); dark text
clears 6.8:1. `action.hover/selected/focus` rgba updated to the new
primary's RGB to match.

### D2 — Apply the new theme across core surfaces + verify accessibility
**Effort:** 5
**Where:** `client/src/theme/components.ts`, spot-checked across
Dashboard/AI Chat/Resources/Messenger/Contributors, depends on D1
**Why:** A new palette is only as good as its application — MUI component
overrides (buttons, chips, cards) need re-checking against the new
tokens, and swapping the primary color can break contrast ratios that
happened to work with the old one. Some old hex values may be hardcoded
inline outside `palette.ts` (e.g. rgba variants of `#6C63FF` for
action states) rather than referencing the palette — find and fix those
too, not just the palette file itself.
**Acceptance criteria:**
- `componentOverrides` and any inline hardcoded old-palette colors
  updated to the new tokens (grep for the old hex/rgba values first).
- Manually verified in both light and dark mode across at least:
  Dashboard, AI Chat, Resources list, Messenger, Contributors.
- Text/background contrast checked (WCAG AA minimum) for both modes with
  the new colors.

**Status: DONE**, with one gap flagged below. `componentOverrides`
(`MuiButton` `containedPrimary`/`outlinedPrimary`) no longer hardcode
`#6C63FF`/`#938BFF`/`rgba(108,99,255,...)` — they now read
`theme.palette.primary.main/light` via `alpha()`, so a future palette
change won't require touching this file again. Grepped the whole client
`src/` for the old hex and its rgb-equivalent rgba (`rgba(108, 99, 255`,
`rgba(0, 217, 166`, `rgba(0, 184, 148`) — found and fixed two more
offenders outside the theme folder: `ProfileSettingsTab.tsx` (focus-ring
color + a save-button gradient that duplicated, and had drifted from,
`componentOverrides`' own `containedPrimary` — deleted the duplicate
rather than re-hardcoding it) and `ProfileResourcesTab.tsx` (status-filter
chips used bare hex that only *approximated* success/warning/error rather
than reading from the palette — now sourced from
`theme.palette.{success,warning,error}.main` via a `getStatusMeta(theme)`
helper). `useChartTheme.ts` was already palette-driven (its `#6C63FF`
occurrences were stale comments, not literals) — left as-is.
Contrast was verified numerically (WCAG relative-luminance formula, all
new primary/secondary/semantic-on-background and text-on-background pairs
computed directly) rather than with a browser contrast checker — all pairs
clear 4.3:1+, most 5:1+; see D1 note for the one adjustment that math
forced. **Not yet manually eyeballed in a running browser** across
Dashboard/AI Chat/Resources/Messenger/Contributors in both modes — only
confirmed the dev server boots and serves both fonts. That visual pass
(plus the still-open C2 composer check) is worth doing together before
calling the theme visually final.

---

## Epic E — Complete the messenger & contributors features

**Not fully audited yet** — this session found one concrete, confirmed gap
in passing while scoping other epics; it wasn't a deliberate audit of
either feature. Treat E1 as real and ready to execute, but don't assume
the epic is fully scoped — run a proper audit pass (same "verify against
current code, don't assume" discipline as the rest of this backlog) before
writing more PBIs here.

### E1 — Resolve real participant names/avatars in the messenger conversation list
**Effort:** 3
**Where:** `client/src/features/chat/components/ConversationListItem.tsx`
**Why:** Confirmed gap — the component falls back to
`otherParticipant?.name ?? otherParticipant?.email` directly, with an
existing comment flagging it: "Resolve participant name from id — wire
when user resolution is available." Verify first whether
`ConversationParticipant` (`chat-dto.ts`) is already populated with a
real `name` from the conversations endpoint (in which case this may
already be closed, or smaller than the comment implies) before scoping
a fix.
**Acceptance criteria:**
- Conversation list always shows a real display name (not a raw id or
  bare email fallback) for the other participant, with an avatar sourced
  the same way the rest of the app resolves user avatars.
- Verify: start a conversation with a user who has a display name and a
  profile photo set — both appear correctly in the list.

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

## Epic G — Remaining features hardening

Goal: a repo-wide cleanup pass, same spirit as Epic A, once Epics C-F have
landed and accumulated their own rough edges. The two items below are
concrete things spotted in passing while scoping other epics this
session — not a full audit. Re-run an Epic-A-style pass (types, lint, dead
code, error-handling gaps) once C-F are further along, since more will
turn up.

### G1 — Remove leftover debug console.log calls in the streaming client
**Effort:** 3
**Where:** `client/src/features/ai-chat/services/ai-chat.service.ts`
**Why:** Confirmed — `streamMessage`'s per-chunk yield and its catch
block still have `console.log("[GENERATOR RESUMED]", ...)` /
`console.log("[SERVICE CATCH]", ...)` left over from earlier
abort-handling debugging (the race-condition fixes documented in
`CLAUDE.md` §4's streaming-hooks note) — never removed once the fix
landed.
**Acceptance criteria:**
- Both `console.log` calls removed (or converted to a real, guarded debug
  log if genuinely still useful — your call, but don't leave ad hoc
  prints in production code).
- Streaming/abort behavior unaffected — this is a log-only cleanup.

### G2 — Remove unused `theme/theme.ts`
**Effort:** 3
**Where:** `client/src/theme/theme.ts`
**Why:** Confirmed — `useThemeMode.ts` builds the live theme via
`createAppTheme` from `theme/index.ts`; `theme/theme.ts` exports a
separate theme hardcoded to `getPalette('dark')` regardless of the
active mode, and nothing appears to import it. Verify zero import sites
before deleting (`grep -rn "from '@/theme/theme'"` or equivalent) —
don't delete on the strength of this note alone.
**Acceptance criteria:**
- Confirmed zero imports of `theme/theme.ts`'s export.
- File removed; `tsc -b`/`vite build` still clean.
