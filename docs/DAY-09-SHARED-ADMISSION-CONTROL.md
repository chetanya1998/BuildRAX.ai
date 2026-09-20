# Day 09 / O01 — Shared limits and concurrency

Implemented and verified locally on 20 September 2026.

## Branch brief

- Branch: `feat/m1-b06-b08-generation-platform`
- Base: Day 08 work in the same dependency-ordered branch.
- Purpose: share request, queue, concurrency, and cost admission across application instances.
- Delivery state: local implementation; not merged, pushed, deployed, or production-verified.

## User outcome

Guests receive expiring HMAC-signed identities; authenticated users receive privacy-safe subject keys. Database-backed TTL windows apply per route and subject, while job creation atomically applies rate and queue admission. Provider leases enforce shared concurrency and reserved-cost ceilings, expire after worker failure, and return queued work honestly. Rejections carry `Retry-After`. Costly production routes fail closed when shared storage or signing configuration is unavailable.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Signed guest identity and authenticated subject resolution | [request identity](../src/lib/server/request-identity.ts) |
| Shared route limiter with local-only fallback | [rate limiting](../src/lib/server/rate-limit.ts) |
| Atomic TTL windows, queue capacity, concurrency and cost leases | [database migration](../supabase/migrations/202609200012_generation_jobs_and_admission.sql) |
| Cross-session admission, lease, cancellation, retry, and capacity tests | [database tests](../supabase/tests/database/005_generation_jobs_and_admission.sql) |

## Verification

- Signed-token validity, tampering, and expiry tests pass.
- Database tests prove shared-window rejection, idempotent admission, single-worker leasing, stale-completion rejection, and capacity queuing.
- A clean local database reset and all 108 database assertions pass.

## Scope boundary

PostgreSQL is the shared TTL/lease adapter for this deployment shape. Multi-instance hosted load and crash recovery still require staging evidence before public traffic.
