# 0002 — Repository visibility: private product repo, public showcase

Status: **proposed** 2026-10-22. Not merged; see `docs/strategy/saas-business-model.md` for the business context.

## Context
v1 shipped at the FYP open house (2026-10-22) and the repo was just polished for public visitors
(AGPL-3.0, README, contributing guide). The goal is now a commercial multi-tenant SaaS for
universities and departments, cheap enough for students.

The question: keep `iamrehman16/CampusConnect` public, or make it private?

Facts that shape the answer:
- **Public → private is reversible; private → public is not.** Once code is public, every clone keeps it
  forever under the license it was published with. v1 is already public under AGPL-3.0, so that version
  stays available to anyone who cloned it, whatever is decided now.
- **The repo publishes its own attack surface.** `BACKLOG.md` R3 lists known open weaknesses (no OAuth
  `state`, in-memory single-instance exchange codes, case-sensitive email lookup, non-atomic "already
  generating" check, refresh-token race across tabs, no rate limit on reports). `docs/` lists demo
  logins and a shared password. That's fine for a demo, but a problem once real students' data is on the platform.
- **Strategy documents don't belong in public.** Pricing, target customers and runbooks
  (`render.yaml` service names, demo setup) are useful to competitors and add nothing for users.
- **AGPL protects in theory, not in practice, in this market.** AGPL stops a competitor from running a
  closed fork *if* you can find and enforce against them. A local clone that ignores the license is
  realistically not something a solo founder can litigate.
- **The code is not the moat.** The moat is university relationships, each campus's contributed
  resource library, the reputation and mentor network, trust and operations. Hiding code slows copycats but
  doesn't create value; open code builds trust with IT departments and helps hiring and your portfolio.
- **GitHub plan limits.** On a free personal account, branch protection and required status checks are
  not available on private repos. The CI merge gate in `CLAUDE.md` §5 would silently stop being
  enforced. GitHub Pro (free via the GitHub Student Developer Pack while you are eligible) restores
  it. Private repos also consume Actions minutes (free plan quota applies); this repo's five CI jobs
  cost roughly 15–20 runner-minutes per push.
- **Sole copyright holder.** All 100% of the code is yours, so you can relicense, dual-license, or
  keep future work closed. External contributions under AGPL would end that unless contributors sign a CLA.

## Options considered

| Option | For | Against |
| --- | --- | --- |
| **A. Stay fully public (AGPL)** | Portfolio, trust, free contributors, self-hostable for universities | Known gaps and strategy public; outside PRs complicate dual-licensing; easy to clone |
| **B. Fully private** | Simplest; hides gaps and plans | Loses portfolio/credibility value; v1 is already public anyway |
| **C. Private product repo + public showcase** | Keeps credibility and portfolio; protects ongoing work, roadmap and security notes; keeps the open-sourcing option for later | Two repos to keep straight; showcase needs occasional refresh |
| **D. Open core (public community edition, private enterprise modules)** | Common SaaS pattern; universities can audit and self-host | Too early: needs a stable plugin/module boundary and maintenance capacity a solo founder doesn't have yet |

## Decision (proposed)
**Option C now, revisit D after the first paying institution.**

1. Make `iamrehman16/CampusConnect` **private**. All SaaS work (multi-tenancy, billing, tenant admin) happens here.
2. Create a public **`CampusConnect-v1`** showcase repo from the `v1.0.0` tag:
   - Keep the code, README, screenshots, LICENSE (AGPL-3.0), CHANGELOG and architecture decisions.
   - Remove `BACKLOG.md`, `docs/open-house-demo.md`, `docs/demo-walkthrough.md` (demo logins), `GEMINI.md`/`CLAUDE.md`
     (or a trimmed copy), and the scratch files in `server/` (`test-chat.html`, `*.txt`, `tsconfig.build.tsbuildinfo`).
   - Start it with fresh history (single "v1.0.0" commit) so internal notes in old commits are not republished.
   - Archive it (read-only) and pin it on your profile. Add a line: "Active development continues privately; contact for pilots."
3. Before flipping visibility:
   - Get **GitHub Pro** (Student Developer Pack) so branch protection and required checks keep working on the private repo.
   - Run a secret scanner (e.g. `gitleaks detect`) on the **full** history. A pattern scan on the
     50 commits available in a shallow clone found nothing, but the full history (138+ commits, including the
     pre-monorepo merge) was not checked.
   - Rotate the demo account password; it is published in `docs/`.
   - Confirm Vercel and Render still deploy from the private repo (both support it; reauthorise the GitHub app if prompted).
4. Don't accept outside PRs on the private repo. If you later open up (option D), add a CLA first
   so dual-licensing (AGPL community + commercial license) stays possible.

## Consequences
- The CI merge gate keeps working only if the account has GitHub Pro or the repo moves to an organisation on a paid plan.
- The public v1 remains AGPL forever; anyone may self-host it. That's acceptable: it's the
  FYP version, without multi-tenancy, billing or the hardening the SaaS will need.
- `CONTRIBUTING.md`, issue templates and `SECURITY.md` move to the showcase repo (or are kept for collaborators).

## When to revisit
- First paying university asks for source access or self-hosting → consider option D or a source-available
  escrow clause in the contract.
- A co-founder or open-source community forms → re-evaluate public development with a CLA.
