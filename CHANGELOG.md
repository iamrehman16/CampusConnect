# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Detailed history lives in `git log` and the "Done" section of
[`BACKLOG.md`](BACKLOG.md).

## [Unreleased]

### Added
- AGPL-3.0 license, root README, contributing guide, code of conduct,
  security policy, issue and pull request templates, CODEOWNERS, Dependabot
  configuration and `.editorconfig`.

## [1.0.0] - 2026-10-22

First release, presented at the Quaid-i-Azam University Final Year Project
open house.

### Added
- **Auth:** email/password sign-in with JWT access and rotating refresh
  tokens, Google sign-in, role-based access for Student, Contributor and
  Admin, multi-step onboarding.
- **Library:** signed Cloudinary uploads, search and filters, moderation
  workflow with approve/reject, infinite scroll.
- **Ask AI (RAG):** streaming answers over SSE, named threads with persisted
  history, cross-session memory, token budget, deduplicated citations to
  source resources, "ask a human" hand-off; answers survive leaving the page.
- **Ingestion pipeline:** LlamaParse → chunking → Gemini embeddings → Qdrant,
  through a durable in-process queue that resumes after restarts.
- **Messenger:** Socket.IO real-time chat with typing and unread indicators,
  reconnect and resync.
- **Community, mentorship and reputation:** posts, comments and upvotes,
  contributor applications, mentor directory, requests, ratings and
  endorsements, reputation ledger, tiers and leaderboard.
- **Notifications:** in-app notifications and opt-in Web Push per device.
- **Safety:** block, report and moderation queue.
- **Admin console:** moderation, user and role management, contributor
  applications, analytics charts.
- **PWA:** installable app with a read-only offline mode.
- **Operations:** fail-fast environment validation, `/api/health` and
  `/api/health/live`, Render blueprint gated on CI, demo seed script,
  smoke-test and demo runbooks.
- **CI:** required typecheck/build, lint and test checks for both apps.

[Unreleased]: https://github.com/iamrehman16/CampusConnect/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/iamrehman16/CampusConnect/releases/tag/v1.0.0
