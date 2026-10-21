#!/usr/bin/env bash
# Starts the localhost open-house demo: local Mongo (cc-mongo-local, seeded) + API on :3100 + client on :5173.
# Usage: scripts/start-local-demo.sh   (Ctrl+C stops API and client; Mongo keeps running)
# Guide: docs/open-house-demo.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

docker start cc-mongo-local >/dev/null
echo "mongo: cc-mongo-local on :27018"

cd "$ROOT/server"
MONGO_URI_Local="mongodb://localhost:27018/campusconnect_local_demo?directConnection=true" \
QDRANT_COLLECTION_SUFFIX=_local_demo \
NODE_OPTIONS=--dns-result-order=ipv4first \
  npm run start:dev &
SERVER_PID=$!

cd "$ROOT/client"
npx vite --port 5173 --strictPort &
CLIENT_PID=$!

trap 'kill $SERVER_PID $CLIENT_PID 2>/dev/null' EXIT INT TERM
echo "open http://localhost:5173 once the server logs 'Nest application successfully started'"
wait
