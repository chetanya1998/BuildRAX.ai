# Day 04 / B03 — Persisted architecture traceability

Implemented on 20 September 2026; application checks pass locally and database execution is environment-blocked.

## Branch brief

- Branch: `feat/m1-b03-b05-foundations`
- Base: Day 03 commit `e5934a3` from `feat/b02-evidence-requirement-ir`
- Purpose: attach Evidence IR and Requirement IR to the existing immutable architecture-version graph without replacing saving, recovery, or history.
- Delivery state: local implementation only; not merged, pushed, deployed, or production-verified.

## User outcome

Evidence, requirements, and their component/flow references now travel with generated architecture snapshots, browser recovery, queued cloud saves, authenticated saves, guest migration, restore, and readback. Evidence and Requirement IR use separate content-addressed artifact blobs linked to a diagram version. Legacy snapshots remain readable and migrate without fabricated traceability.

The database extension keeps browser sessions read-only on traceability links, uses the existing workspace membership checks, rejects checksum or replay mismatches, and prevents link updates or deletes.

## Implementation evidence

| Area | Evidence |
| --- | --- |
| Snapshot v1.1 checksums, semantic references, and legacy adapter | [snapshot contract](../src/lib/architecture-ir/snapshot.ts) |
| Guest recovery and cloud retry propagation | [draft storage](../src/lib/storage/drafts.ts) and [cloud save hook](../src/components/editor/use-cloud-save.ts) |
| Save, migration, restore, and readback paths | [diagram save route](../src/app/api/v1/diagrams/[id]/route.ts), [guest migration route](../src/app/api/v1/guest-migrations/route.ts), and [artifact reader](../src/lib/supabase/architecture-artifacts.ts) |
| Immutable artifact links and tenant-aware RPCs | [traceability migration](../supabase/migrations/202609200011_traceability_artifacts.sql) |
| Checksum, legacy, reference, recovery, and cloud-save fixtures | [snapshot tests](../src/lib/architecture-ir/snapshot.test.ts), [draft tests](../src/lib/storage/drafts.test.ts), and [cloud-save test](../src/components/editor/use-cloud-save.test.tsx) |

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — pass: 23 files and 120 tests.
- `npm run build` — pass; 24 static pages generated.
- `npm run release:scan` — pass; 207 files and 11 uniquely timestamped migrations.
- `npm run db:test` — **Environment blocked**. The Supabase CLI connected attempt failed because local PostgreSQL at `127.0.0.1:54322` was not running. The 12 new pgTAP assertions are present but are not claimed as passed.

## Remaining verification

B03 must not be marked database-verified until local Supabase is running and `npm run db:test` passes, followed by a staging save/read/restore check under two workspaces. No production status is claimed.
