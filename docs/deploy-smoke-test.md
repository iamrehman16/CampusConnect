# Post-deploy smoke test

Run after every production deploy and again 5 minutes before a demo. About 10
minutes. Use the demo accounts (password in `server/scripts/seed-demo/README.md`).

## 0. Warm the stack
```bash
scripts/warm-demo.sh https://<render-service>.onrender.com
```
Render's free tier sleeps after ~15 minutes idle (30-60 s cold start); the script
also wakes Qdrant and the database pool, and prints the dependency report.
`GET /api/health` returns `ok`, `degraded` (Redis or Qdrant down: uploads or AI
broken, API still up) or `down` (MongoDB unreachable, HTTP 503).
`GET /api/health/live` is the cheap liveness probe Render uses.

## 1. Checklist (tick each, note failures)
| # | Check | Pass when |
|---|-------|-----------|
| 1 | Open the Vercel URL, hard refresh on `/login` | Page loads (no 404); no CORS errors in the console |
| 2 | Sign in with email and password | Lands on Home with the user's name |
| 3 | Sign out, **Continue with Google** | Returns signed in (needs `CLIENT_ID`/`CLIENT_SECRET`/`GOOGLE_CALLBACK_URL` on Render and the redirect URI in Google Cloud) |
| 4 | Library: open a resource | Detail page and file preview load |
| 5 | Upload a small PDF as a contributor | Appears as pending |
| 6 | Sign in as admin, approve it | Moves to approved; ingestion runs (check Render logs for the ingestion job) |
| 7 | Ask AI a question the library covers (e.g. Data Structures) | Streams an answer **with a citation** and its contributor; no endless "Thinking" |
| 8 | Ask AI, navigate away mid-answer, come back | The finished reply is in the thread |
| 9 | Messages: send a message between two accounts in two browsers | Arrives live; unread badge and notification update |
| 10 | Leave the tab open 1 h+ (or expire the token), then act | Session survives (silent token refresh) |
| 11 | Mobile (phone or 390 px): Home, Library, Ask AI, Messages | No horizontal scroll; composer usable |

## 2. If something fails
- **CORS error / blocked preflight:** `FRONTEND_URL` on Render must be the exact Vercel origin (no trailing slash).
- **`/api/api/...` in network calls:** `VITE_API_BASE_URL` on Vercel must be the server origin only, no `/api`.
- **Server won't boot / deploy fails:** the boot check lists every missing or malformed variable in the Render log.
- **AI errors immediately:** health shows `qdrant: down`: check `QDRANT_URL`/`QDRANT_API_KEY` and that the cluster isn't dormant; `degraded` + `redis: down` means uploads won't ingest.
- **First request very slow:** cold start; run the warm script earlier.
