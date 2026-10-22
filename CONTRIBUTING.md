# Contributing to CampusConnect

Thanks for your interest in improving CampusConnect. This guide covers how to
report problems, propose changes and get a pull request merged.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** with the [bug report form](https://github.com/iamrehman16/CampusConnect/issues/new?template=bug_report.yml).
- **Suggest a feature** with the [feature request form](https://github.com/iamrehman16/CampusConnect/issues/new?template=feature_request.yml).
- **Ask a question or share an idea** in [Discussions](https://github.com/iamrehman16/CampusConnect/discussions) if enabled, otherwise open an issue.
- **Fix something.** Issues labelled `good first issue` or `help wanted` are a good place to start.
- **Report a vulnerability** privately, as described in [SECURITY.md](SECURITY.md). Never in a public issue.

For anything larger than a small fix, open an issue first so the approach can
be agreed before you spend time on it.

## Before you start: read the project rules

[`CLAUDE.md`](CLAUDE.md) is the project's engineering constitution. The short
version:

1. **One fix or one concern per commit.** Don't bundle a refactor or
   formatting pass with a bug fix.
2. **No `any`, no silent failures.** Every external call (MongoDB, Qdrant,
   Groq, Cloudinary, LlamaParse) needs explicit error handling. Use `unknown`
   plus a type guard instead of `any` or `@ts-ignore`.
3. **Explain the root cause before patching.** If a change only fixes a
   symptom, say so in the PR.
4. **Feature-based folders.** NestJS modules on the server, feature folders
   on the client. No generic `controllers/` or `components/` buckets.
5. **Thin controllers and gateways.** Business logic lives in services.
6. **Never commit secrets.** Only `.env.example` files are tracked.
7. **Respect the intentional decisions** in [`CLAUDE.md` §4](CLAUDE.md)
   (manual SSE, no Redis, split streaming hooks and others). Open an issue to
   discuss before changing them.

## Development setup

See [Getting started](README.md#getting-started) in the README. In short:

```bash
git clone https://github.com/<your-username>/CampusConnect.git
cd CampusConnect

cd server && cp .env.example .env && npm install && npm run start:dev
# in a second terminal
cd client && cp .env.example .env && npm install && npm run dev
```

`client/` and `server/` are independent projects. Run `npm` commands inside
the folder you are working on.

## Workflow

### 1. Fork and branch

External contributors: fork the repository, then clone your fork and add the
original as `upstream`:

```bash
git remote add upstream https://github.com/iamrehman16/CampusConnect.git
git fetch upstream
git checkout -b fix/short-description upstream/main
```

Collaborators with write access can branch directly in this repository.
Never push to `main`; it is protected.

Branch name prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `test/`.

### 2. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/) with the app
as the scope when the change is specific to one side:

```text
fix(client): connect the chat socket WebSocket-first
feat(server): notify contributors when their notes are cited
docs: add architecture decision for the ingestion queue
chore(server): bump @nestjs/* to 11.1
```

- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`.
- Scopes: `client`, `server`, or none for repo-wide changes.
- Subject in the imperative mood, no trailing period, about 72 characters max.
- Use the body to explain **why**, including the root cause for fixes.
- A change to an API shape that touches both apps should be one commit
  covering `client/` and `server/` together.

### 3. Check locally

Run the same checks CI runs before you push:

```bash
# client/
npm run lint
npm run build          # tsc -b + vite build

# server/
npx eslint "{src,apps,libs,test}/**/*.ts"   # npm run lint auto-fixes; CI does not
npm run build
npm test
```

Add or update tests for behaviour you change. Server tests live next to the
code as `*.spec.ts`.

### 4. Open a pull request

- Target `main`.
- Fill in the pull request template: what changed, why, how you tested it.
- Link the issue it closes (`Closes #123`).
- Keep PRs focused. Several small PRs are easier to review than one large one.
- Include screenshots or a short recording for UI changes, in light and dark
  mode and at mobile width (390 px) where relevant.
- If you add an environment variable, document it in the relevant
  `.env.example` and, for the server, in `render.yaml`.

### 5. CI and review

These checks are required on `main` and must pass before merge:

| Check | Runs |
| --- | --- |
| `client-typecheck-and-build` | `npm run build` in `client/` |
| `client-lint` | `npm run lint` in `client/` |
| `server-typecheck-and-build` | `npm run build` in `server/` |
| `server-lint` | `eslint` in `server/` (no auto-fix) |
| `server-test` | `npm test -- --ci` in `server/` |

A maintainer will review your PR. Address feedback with new commits rather than
force-pushing over reviewed history. The PR is merged once approved and green.

## Reporting bugs well

A good bug report includes:

- Steps to reproduce, starting from a fresh page load.
- What you expected and what happened instead.
- Browser and device, or Node version for server issues.
- Console or server logs, with secrets and personal data removed.

## Licensing of contributions

CampusConnect is licensed under the [GNU AGPL v3.0](LICENSE). By submitting a
contribution you agree that it is licensed under the same terms.
