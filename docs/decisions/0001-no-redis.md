# 0001 — No Redis: in-process ingestion queue backed by Mongo

Status: accepted 2026-10-08 (BACKLOG.md I5). Supersedes the BullMQ + Redis setup.

## Context
Redis was used for exactly one thing: the BullMQ queue behind RAG ingestion
(one job type, `ingest-resource`, enqueued when an admin approves a resource;
parse → chunk → embed → Qdrant upsert; 3 attempts, 5 s exponential backoff).
Presence (`PresenceService`) and the Google sign-in exchange codes were already
in-memory. The deployment is one Render instance.

Cost of keeping it: a managed Redis account (Upstash) with its own secret, a
health check and a failure mode (the old Upstash database vanished once and
uploads silently stopped ingesting), a local Redis container for development,
and a shared-prefix hazard between dev and demo environments, all for a
low-volume job.

## Decision
Run ingestion in-process (`IngestionQueueService`, concurrency 2, same retry
policy) and make Mongo the source of truth for job state:
`Resource.ingestionStatus` (`pending | processing | done | failed`),
`ingestionAttempts`, `ingestionError`. The queue is memory-only; on boot,
resources left `pending` or `processing` are re-queued. An admin can retry
`failed` ones (`PATCH /admin/resources/:id/retry-ingestion`).

## Consequences
- One fewer service, secret and health check; nothing to provision for dev.
- A restart, deploy or free-tier sleep cannot lose work: state is in Mongo and
  recovery runs at boot. In-flight work is repeated, so ingestion must stay
  idempotent (it is: Qdrant point ids are derived from `resourceId` + chunk index).
- Retry timing is lost on restart (attempt counters restart from the persisted status, delays do not).
- Resources approved before this change have no `ingestionStatus` and are not recovered.

## When Redis (or another shared queue) should come back
Bring it back, behind the same `enqueue()` / `retryFailed()` surface, when any of these holds:
1. **More than one server instance.** Boot recovery re-queues work another instance is already
   running, and each instance has its own memory-only queue. This is the trigger that matters:
   multi-tenant SaaS, horizontal scaling, or Render running two instances during a deploy.
2. **Work no longer fits an approval-time job:** high volume, long-running or CPU-heavy jobs that
   need rate limiting, priorities, delayed or repeatable (cron) jobs, or a worker process separate
   from the API so ingestion cannot starve request handling.
3. **Several job types or fan-out,** where hand-written retry and recovery per type becomes a
   second queue library. Prefer adopting BullMQ then.
4. **A second Redis-shaped need appears,** such as the Socket.IO adapter for multi-instance
   presence, shared Google exchange codes (`GoogleExchangeService`) or rate limiting. These are
   the same single-instance limit and are best fixed together.
5. **Job observability becomes a requirement** (dashboards, per-job history) beyond the status fields.

Until then, do not add Redis for convenience. If it returns, keep `ingestionStatus` in Mongo as
the user-visible state and make the queue only the transport.
