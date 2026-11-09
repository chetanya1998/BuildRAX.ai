# Day 16 local database verification and shared persistence fixes

Original checkpoint: 8 November 2026 on `feat/g03-scenario-playback-core`.
P01 continuation: 9 November on `feat/p01-presentation-objects`, shared fix
cherry-picked as `4f6170e`. Production testing is explicitly excluded by the user.
No production migrations, account creation or records were performed.

## Defects reproduced and corrected

1. A semantic update through `save_architecture_snapshot` failed because its
   `diagram_id` output parameter conflicted with unqualified columns in the
   review/document stale-marking queries. The forward migration qualifies both
   queries without changing the RPC signature, authorization or immutable history.
2. `read_shared_diagram` read `diagram_versions.payload`, which is cleared after
   linking canonical artifacts. It now reads the linked materialized-diagram blob,
   retaining the legacy payload fallback and all token/expiry/revocation/project
   deletion checks. It does not return private traceability artifacts.

Migration: `202610300015_snapshot_save_and_share.sql`. Existing migrations remain
unchanged. No tables, indexes, permissions or RLS policies are added/relaxed.
Rollback requires a forward replacement of the affected functions after review;
reverting application code does not require deleting version data. Restoring the
old functions reintroduces the reproduced failures, so prefer a forward fix.

## Reproduction environment

The existing local Supabase DB has migration drift. It was not reset or changed.
Tests use a disposable container with no published ports. The bootstrap copies
only auth/storage schema definitions from the local Supabase DB (never rows),
then applies every repository migration atomically. A migration fingerprint
rejects stale test databases on repeat runs. Fixture transactions roll back.
Neither helper reads application environment variables or remote credentials.

```sh
docker run --rm --name buildrax-day16-acceptance \
  -e POSTGRES_PASSWORD=day16-local-test-only -e POSTGRES_DB=postgres \
  -d public.ecr.aws/supabase/postgres:17.6.1.167
# Wait until PostgreSQL is ready; local source supabase_db_buildrax-mvp must exist.
node scripts/day16-db-check.mjs
DAY16_DATABASE_TESTS=1 npm test -- src/lib/architecture-ir/presentation.persistence.test.ts
# On the separate G03 branch, use scenarios.persistence.test.ts instead.
# Only remove the disposable container created for this check:
docker stop buildrax-day16-acceptance
```

The password above is an intentionally disposable local fixture, not a service
credential. The helper requires Docker and a running local Supabase schema source.
Normal `npm test` skips the opt-in database test; SQL tests also run through the
existing Supabase CI job. Use the explicit opt-in command before claiming the
scenario/database integration passed.

## Historical G03 results (8 November)

- All 15 repository migrations applied successfully to a fresh disposable DB.
- 173 pgTAP assertions passed, including semantic version advancement, stale
  review/document marking, canonical shared readback, invalid/expired/revoked
  tokens, deleted projects, and existing tenant-isolation checks.
- The real G03 snapshot integration passed nine assertions: owner migration and
  version save, semantic/presentation readback, immutable previous version,
  current shared diagram, invalid token and outsider access denial.
- Lint, typecheck, release scan and 240 unit tests passed. One opt-in DB test was
  skipped in the ordinary unit command and passed separately as described above.
- Production Webpack build passed, including TypeScript and all 27 static pages.
- 18 changed Chromium/mobile WebKit browser checks passed: sign-in navigation,
  local recovery/storage errors, background/switch/close cancellation and stale
  scenario definitions after reload. These are focused results, not a claim that
  the entire mobile suite or hosted session journey has passed.

## P01 results (9 November)

All 15 migrations and 173 SQL assertions passed again against a fresh disposable
local database. P01's actual snapshots passed 11 SQL assertions, including all
five object types, owner saves, immutable old versions, exact readback, canonical
sharing, invalid tokens, denied anonymous writes and outsider isolation. Moving
a group changes the diagram/presentation while preserving semantic checksum and
IR version. The additional two assertions extend the shared helper; the earlier
G03 nine-assertion result above is historical, not a new G03 run.

## Remaining gates

Browser authentication against Supabase, actual hosted shares, private-evidence
integration, current-base CI, merge and deployment remain separate. Only local
fixtures/SQL roles were used here. `audit-artifacts/` was not modified.
