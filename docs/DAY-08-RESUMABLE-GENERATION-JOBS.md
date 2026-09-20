# Day 08 / B07 — Resumable generation jobs

Implemented and verified locally on 20 September 2026.

## Branch brief

- Branch: `feat/m1-b06-b08-generation-platform`
- Base: Day 07 work in the same dependency-ordered branch.
- Purpose: make long generation durable, cancellable, retryable, and safe against duplicate or stale workers.
- Delivery state: local implementation; not merged, pushed, deployed, or production-verified.

## User outcome

Generation requests now receive durable PostgreSQL job IDs and expose create, status, cancel, retry, and bounded-run APIs. Seven immutable stage checkpoints preserve evidence, requirements, context, proposals, synthesis, validation, and layout. A lease owner plus run version prevents duplicate workers and cancelled requests from publishing stale results. Retry resumes from retained checkpoints.

A bounded internal worker processes at most two queued jobs per invocation so two worst-case 25-second provider attempts fit inside the 60-second route budget. Its Netlify schedule is present but disabled by default until database, application, and worker-secret verification is complete.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Durable jobs, immutable checkpoints, expiring leases, cancel/retry, stale-result rejection | [database migration](../supabase/migrations/202609200012_generation_jobs_and_admission.sql) |
| Create/read/lease/checkpoint/complete/fail/cancel/retry adapter | [job store](../src/lib/generation-jobs/store.ts) |
| Resume-aware bounded stage runner | [generation pipeline](../src/lib/generation-jobs/pipeline.ts) |
| Authenticated bounded worker and disabled-by-default schedule | [worker route](../src/app/api/internal/generation-worker/route.ts), [scheduled entrypoint](../netlify/functions/generation-worker.ts) |

## Verification

- Pipeline tests prove all stages and checkpoint-only resume.
- Worker tests prove authentication, bounded queue reads, deferred capacity, and disabled scheduling.
- Database reset succeeds; all five pgTAP files and 108 assertions pass.

## Scope boundary

The immediate UI nudge and scheduled worker share the same lease-protected pipeline. Enabling the hosted schedule requires separate staging configuration and failure testing.
