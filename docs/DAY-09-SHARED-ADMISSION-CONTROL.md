# Day 09 / O01 — Shared limits and concurrency

Implemented and verified on 22 September 2026.

## Branch brief

- Branch: `feat/o01-shared-limits-concurrency`
- Base: Day 08 / B07 merged on `main`.
- Purpose: share request, queue, concurrency, and cost admission across application instances.
- Delivery state: pull request #19 was merged to `main` with application, browser, migration, RLS, security, and deploy-preview checks passing; not production-verified.

## User outcome

Guests receive an expiring HMAC-signed, HttpOnly identity cookie and authenticated users retain stable privacy-safe subject keys. PostgreSQL-backed windows apply atomically across route, subject, workspace, and provider scopes. Durable job creation combines rate and queue admission in one transaction. Provider leases reserve shared concurrency and estimated cost, expire after worker failure, and release on completion, failure, or cancellation. Rejections include `Retry-After`, and production fails closed when shared storage or signing configuration is unavailable.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Signed guest and authenticated identity resolution | [request identity](../src/lib/server/request-identity.ts) and [guest session route](../src/app/api/v1/guest-session/route.ts) |
| Atomic shared route, subject, workspace, and provider limits | [rate limiting](../src/lib/server/rate-limit.ts) |
| Queue, concurrency, expiring lease, and cost admission | [database migration](../supabase/migrations/202609220013_shared_admission_control.sql) |
| Cross-session admission and capacity assertions | [database tests](../supabase/tests/database/006_shared_admission_control.sql) |

## Verification

- Signed-token validity, tampering, expiry, cookie issuance, and authenticated precedence pass.
- Atomic multi-scope rejection, idempotent admission, bounded queueing, concurrency/cost deferral, capacity release, and actual usage metering pass in clean database CI.
- `release:check` passes: 228-file scan, 13 unique migrations, lint, typecheck, 32 test files / 166 tests, and a 27-page production build.
- GitHub quality, browser, Supabase migration/RLS, GitGuardian, Netlify header/redirect, and deploy-preview checks pass.

## Scope boundary

PostgreSQL is the shared TTL and lease adapter for the current deployment shape. Hosted multi-instance load and crash-recovery evidence remain staging release-gate work under O03.
