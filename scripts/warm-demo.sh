#!/usr/bin/env bash
# Warm the deployed stack before a demo (BACKLOG.md I3). Render's free tier
# sleeps after ~15 min idle and takes ~30-60 s to wake; Atlas and Qdrant Cloud
# also have cold paths. Run this 5 minutes before presenting.
#
#   scripts/warm-demo.sh https://campusconnect-server-qrm5.onrender.com
#
# Exits non-zero if the API never answers or MongoDB is down.
set -euo pipefail

API="${1:?usage: warm-demo.sh <api-origin, no trailing slash, no /api>}"

echo "Waking the API (up to 90 s)..."
for i in $(seq 1 18); do
  if curl -fsS --max-time 10 "$API/api/health/live" >/dev/null 2>&1; then
    echo "  up after ~$((i * 5)) s"
    break
  fi
  [ "$i" -eq 18 ] && { echo "API did not answer."; exit 1; }
  sleep 5
done

echo "Dependency report (this also wakes Qdrant and the Mongo pool):"
code=$(curl -sS --max-time 30 -o /tmp/health.json -w '%{http_code}' "$API/api/health" || true)
cat /tmp/health.json; echo
[ "$code" = "200" ] || { echo "Health returned $code: MongoDB is unreachable."; exit 1; }

grep -q '"status":"ok"' /tmp/health.json \
  && echo "All dependencies up." \
  || echo "WARNING: degraded. Redis (uploads/ingestion) or Qdrant (AI answers) is down; fix before demoing."
