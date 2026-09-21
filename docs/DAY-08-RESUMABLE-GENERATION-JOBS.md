# Day 08 / B07 — Resumable generation jobs

Implemented and application-verified locally on 22 September 2026.

## Branch brief

- Branch: `feat/b07-resumable-generation-jobs`
- Base: merged Day 07 / B06 on `main` (`cf26a12`).
- Purpose: make long generation durable, cancellable, retryable, and safe against duplicate or stale workers.
- Delivery state: individual planned-feature branch; not merged, deployed, or production-verified.

## User outcome

Authenticated generation requests now receive durable PostgreSQL job IDs and expose create, status, cancel, retry, and bounded-run APIs. Six immutable stage checkpoints preserve evidence, requirements, context, synthesis, validation, and layout. A lease owner plus run version prevents duplicate workers and cancelled requests from publishing stale results. Retry resumes from retained checkpoints.

A bounded internal worker processes at most two queued jobs per invocation so two worst-case 25-second provider attempts fit inside the 60-second route budget. Its Netlify schedule is present but disabled by default until database, application, and worker-secret verification is complete.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Durable jobs, immutable checkpoints, expiring leases, cancel/retry, stale-result rejection | [database migration](../supabase/migrations/202609210012_resumable_generation_jobs.sql) |
| Create/read/lease/checkpoint/complete/fail/cancel/retry adapter | [job store](../src/lib/generation-jobs/store.ts) |
| Resume-aware bounded stage runner | [generation pipeline](../src/lib/generation-jobs/pipeline.ts) |
| Authenticated bounded worker and disabled-by-default schedule | [worker route](../src/app/api/internal/generation-worker/route.ts), [scheduled entrypoint](../netlify/functions/generation-worker.ts) |

## Verification

- `npm run release:check` passed: release scan, lint, typecheck, 30 test files / 161 tests, and a production build with 26 generated pages.
- The targeted identity, route, pipeline, worker, scheduler, and receipt suites pass 22 tests without paid model calls.
- The migration includes 41 pgTAP assertions. Local Docker did not answer its container inspection, so database execution is not claimed locally; the isolated GitHub Supabase/RLS job is required before merge.

## Scope boundary

This branch supports authenticated accounts only. Signed guest identity, shared admission controls, provider concurrency/cost ceilings, proposal summaries, and the start-screen workflow remain O01/B08 work. Enabling the hosted schedule requires separate staging configuration and failure testing.
