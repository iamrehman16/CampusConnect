# CampusConnect — localhost demo script (open house, 22 Oct 2026)

## One-time setup (already done on Abdur's laptop, 2026-10-21)

Local Mongo, because venue Wi-Fi IPs aren't on the Atlas access list. A replica set is needed (the seed uses transactions):

```bash
docker run -d --name cc-mongo-local --restart unless-stopped -p 27018:27017 \
  -v cc_mongo_local:/data/db mongo:7 --replSet rs0 --bind_ip_all
docker exec cc-mongo-local mongosh --quiet --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

Then seed it with the "clean slate" command at the bottom. `--restart unless-stopped` plus Docker enabled at boot means it comes back after a reboot; data lives in the `cc_mongo_local` volume.

## Setup (10 min before)

1. `scripts/start-local-demo.sh` (from the repo root) — wait for "Nest application successfully started", then open http://localhost:5173
2. Three separate browser sessions (each account in **one** browser only — logging the same
   account in twice rotates its refresh token and logs the other one out):
   - **Window A — Chrome:** Ali Hassan (student) `ali.hassan@qau.example`
   - **Window B — Firefox / other Chrome profile:** Ayesha Siddiqui (contributor) `ayesha.siddiqui@qau.example`
   - **Window C — incognito:** Admin `admin@qau.example`
   - Password for all: `Demo@2026`
3. Log all three in before visitors arrive. Upload file: `docs/demo-assets/Page-Replacement-Algorithms.pdf`

Internet is still needed (Groq, Gemini, Qdrant, LlamaParse, Cloudinary). Only Mongo is local.

## Flow — do the upload FIRST (ingestion takes a few minutes), show other screens while it runs

| # | Say | Do |
|---|-----|----|
| 1 | "Seniors share notes. Ayesha is a contributor." | **B (Ayesha):** Library → Upload → pick the PDF. Title *Page Replacement Algorithms: FIFO, LRU and Optimal*, Operating Systems, CS-301, **Semester 5**, Notes → Submit. Shows as pending. |
| 2 | "Nothing goes public without moderation." | **C (Admin):** Admin → Resources → the new item is in the pending queue → open/preview → **Approve**. Mention: approval triggers the RAG pipeline in the background (parse → chunk → embed → Qdrant). |
| 3 | "Students in that semester are notified." | **A (Ali):** bell shows *new notes for your semester* (Ali is semester 5). Library → it's listed and downloadable. **B (Ayesha):** reputation went up / approval notification. |
| 4 | "Meanwhile — the existing library and AI." | **A:** Ask AI → new chat → *"Explain the Banker's algorithm safety check"* → streamed answer + citation card → click contributor → *Ask the author*. |
| 5 | "Real-time messenger." | **A ↔ B:** Messages → open Ali↔Ayesha thread, send from A, it appears live in B (typing/unread). |
| 6 | "Mentorship." | **A:** Mentors → request Ayesha as mentor. **B:** Mentors → Mentoring → request appears → accept. |
| 7 | "Community + reputation." | **A:** Community → reply/upvote a post → **B** gets notified. Leaderboard → tiers. Profile. |
| 8 | "Now the AI knows the new upload." | **A:** Ask AI → *"What is Belady's anomaly? Give the example from the notes."* → answer: FIFO 9 faults with 3 frames, 10 with 4 frames; citation = *Page Replacement Algorithms* by Ayesha. **B (Ayesha)** gets a "your notes were cited" notification. Follow-up: *"How many page faults do FIFO, LRU and Optimal give for 7,0,1,2,0,3,0,4,2,3,0,3,2 with 3 frames?"* → 10 / 9 / 7. |
| 9 | "Admin oversight." | **C:** Overview charts (uploads, users), Applications → approve the pending contributor application, Users → role management. |
| 10 | Extras if time | Dark mode toggle; Chrome DevTools phone view (responsive); go offline (DevTools → Network → Offline): cached screens still readable, composers lock with a reason; PWA install icon in address bar. |

## Know before you present

- Belady's anomaly and page replacement are general CS knowledge, so the AI answers them even **before** the upload, with unrelated citations. Don't run a "before" question to prove the AI doesn't know. The proof after approval is the **citation card naming the new PDF and Ayesha**, plus the exact numbers from the notes (9 vs 10 faults, 10 / 9 / 7).
- The AI shows up to 5 source cards, and some can be loosely related (e.g. Normalization under an OS question). If asked: retrieval returns top-5 chunks with no relevance cut-off. That's a known limitation, and a score threshold is the next step.

## If something goes wrong

- **AI doesn't cite the new upload yet:** ingestion still running. Server log shows "Ingestion complete" when ready. Meanwhile ask about seeded topics (deadlocks, linked lists, normalization, TCP congestion control, logistic regression).
- **Ingestion failed** (LlamaParse hiccup, server log says so): no UI button; API `PATCH /api/admin/resources/<id>/retry-ingestion` as admin, or just restart the server (it re-queues unfinished ingestions on boot).
- **Logged out unexpectedly:** same account was opened in a second browser. Log in again.
- **Server won't start / Mongo error:** `docker start cc-mongo-local`, rerun `scripts/start-local-demo.sh`.
- **Need a clean slate** (re-run the whole seed, ~10 min, wipes local demo data):
  ```bash
  cd ~/dev/fyp/CampusConnect/server
  DEMO_MONGO_URI="mongodb://localhost:27018/campusconnect_local_demo?directConnection=true" \
  QDRANT_COLLECTION_SUFFIX=_local_demo SEED_CLOUDINARY_TAG=campusconnect_local_demo \
  NODE_OPTIONS=--dns-result-order=ipv4first npm run seed:demo
  ```
