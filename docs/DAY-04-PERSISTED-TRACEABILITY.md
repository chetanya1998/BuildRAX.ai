# Day 04 / B03 — Persisted architecture traceability

Implemented and application-verified locally on 21 September 2026. Database/RLS validation passed in PR CI; the local Docker daemon remained unresponsive.

## Branch brief

- Branch: `feat/b03-persist-traceability`
- Base: merged Day 03 / B02 on `main`
- Purpose: attach Evidence IR and Requirement IR to the existing immutable architecture-version graph without replacing saving, recovery, or history.
- Delivery state: planned feature PR; not merged, deployed, or production-verified.

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
- `npm test` — pass: 21 files and 106 tests.
- `npm run build` — pass; 24 static pages generated.
- `npm run release:scan` — pass; 191 files and 11 uniquely timestamped migrations.
- `npm run db:test` — pass in GitHub Supabase CI: all 21 new structural, access-control, round-trip, replay, and immutability assertions passed. The local Docker daemon became unresponsive before pgTAP execution, so this result is not claimed as a local run.

## Remaining verification

B03's PR Supabase migration/RLS gate passed. A staging save/read/restore check under two workspaces remains required before staging or production status is claimed.
