# Demo walkthrough (BACKLOG.md H3)

Script for the defense, in the order the story is told. Run `scripts/warm-demo.sh
https://campusconnect-server-qrm5.onrender.com` 5 minutes before, and re-seed close to the
date so timestamps read "today" instead of "12 days ago" (`server/scripts/seed-demo/README.md`).

App: https://campus-connect-client-two.vercel.app. Logins (password `Demo@2026`):
student `ali.hassan@qau.example`, mentor `ayesha.siddiqui@qau.example`, admin `admin@qau.example`.

Screenshots: `~/dev/fyp/demo-screenshots/<NN>-<screen>-<desktop|mobile>-<light|dark>.png`
(desktop 1440x900, mobile 390x844 at 2x), captured against the deployed build on 2026-10-08.
On mobile the Ask AI thread list is behind the hamburger in the header; admin sections are scrollable tabs.

| # | Step (say) | Do | Screen files |
|---|-----------|-----|--------------|
| 1 | "A student signs in and lands on a personalised home." | Sign in as Ali | `01-home` |
| 2 | "Seniors share notes, slides and past papers." | Library → open *Linked Lists, Stacks and Queues* | `02-library`, `03-resource` |
| 3 | "Ask the assistant; it answers from the library and shows the source." | Ask AI → open the *Banker's Algorithm Safety Check* thread, or ask a new question about deadlocks | `04-ask-ai`, `05-ai-thread` |
| 4 | "The source card shows who contributed it, and I can ask a human." | On a citation: contributor name → *Ask the author* / *Ask a human* | `03-resource`, `05-ai-thread` |
| 5 | "Mentors who took the course." | Mentors directory → *My mentors* → *Mentoring* (requests, active, completed) | `06-mentors`, `07-my-mentors`, `08-mentoring` |
| 6 | "Real-time messenger." | Messages: open a thread, send a message (second browser as Ayesha shows it arrive live) | `09-messages` |
| 7 | "Community and reputation." | Community feed, then the leaderboard and profile tier | `10-community`, `11-leaderboard`, `12-profile` |
| 8 | "Moderation." | Sign in as admin: Overview, approve the pending resource, review the contributor application | `20-admin`, `21-admin-resources`, `22-admin-applications`, `23-admin-users` |

Notes for the presenter:
- Approving a resource starts ingestion in the background; the AI can cite it once the
  server log shows "Ingestion complete" (usually a few minutes). Approve it before the demo
  if you want to ask about it live.
- If the first request hangs, the free Render instance was asleep; wait ~30-60 s.
- Offline: with the app open, turning the network off keeps cached screens readable
  (read-only offline); composers lock with a reason.
