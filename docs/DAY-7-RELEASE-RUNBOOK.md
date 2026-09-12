# Day 7 — Staging rollout and recovery runbook

This runbook turns the Architecture IR work into a repeatable staging release.
It deliberately separates database, application, and scheduler activation. A
source-code push is not proof that any of these steps happened.

## People and prerequisites

Assign one release owner and one verifier. Before starting, confirm:

- the Supabase secret previously shared in chat has been rotated;
- server secrets exist only in protected staging configuration;
- a recoverable database backup was created and its timestamp was recorded;
- private `architecture-assets` and `architecture-version-archive` buckets exist;
- `ARCHIVE_MAINTENANCE_ENABLED` is `false`;
- the current application remains available during the migration window.

Never paste keys into commands, tickets, screenshots, or this document.

## 1. Establish the source release

Record the exact commit SHA from `fresh-variant`. Run:

```bash
npm ci
npm run release:check
npm audit --omit=dev --audit-level=high
npm run test:e2e -- --project=chromium
```

The release stops if lint, types, unit tests, build, tracked-secret scanning,
migration ordering, or the high-severity production dependency audit fails.
Never silence a dependency finding without an owner and recorded resolution.

## 2. Validate migrations in isolation

Use a fresh local or CI Supabase stack:

```bash
supabase start
supabase test db
supabase stop --no-backup
```

All pgTAP assertions must pass. This proves the migration syntax, RLS,
immutability, idempotency, document history, archive retries, and verification
functions against a disposable database.

## 3. Back up and migrate staging

Keep the scheduler disabled. Create and verify the staging backup, then apply
the migrations using the approved deployment workflow. Do not automatically
run destructive rollback SQL if a migration fails. Stop application writes if
needed and use a forward-only corrective migration.

The database migrations backfill existing diagram versions with
`legacy-migration` provenance. They do not automatically discard compatibility
payloads.

## 4. Prove the backfill

Run the following as the Supabase service role in the SQL editor or approved
administrative job:

```sql
select * from public.verify_architecture_persistence();
```

Release requires:

- `ready = true`;
- `unlinked_diagram_versions = 0`;
- `orphan_ir_versions = 0`;
- `current_heads_missing = 0`;
- all checksum and invalid-snapshot counts equal zero.

Record the counts and `verification_token` in the restricted release record.
Do not put project payloads in that record.

## 5. Smoke-test staging before cleanup

With two real test accounts in different workspaces, verify:

1. Each owner can open, edit, save, and restore their own diagram.
2. A stale tab receives a conflict and cannot overwrite the newer head.
3. The unrelated account cannot read the project, history, document, assets, or
   notifications.
4. A guest draft with an image and document survives signup and checksum
   verification.
5. JSON/Mermaid/Markdown derive from IR; PNG/SVG match the canvas.

If any authorization or checksum check fails, stop the release and keep the
compatibility payloads.

## 6. Finalize compatibility payloads

Only after the backup and smoke tests are confirmed, call:

```sql
select public.finalize_legacy_architecture_payloads(
  'BACKUP_CONFIRMED',
  '<verification_token from step 4>'
);
```

The function refuses to run if the graph changed after verification or any
integrity check is failing. It removes only duplicate `diagram_versions.payload`
data; immutable artifact blobs, checksums, lineage, and metadata remain.

Run `verify_architecture_persistence()` again. `ready` must remain true and
`legacy_payload_rows` must be zero.

## 7. Deploy the application

Deploy the recorded commit. Keep archive maintenance disabled. Run the same
two-account save, document, history, and restore smoke tests against the new
application. Confirm private assets cannot be accessed without authorization.

## 8. Activate maintenance last

Configure `ARCHIVE_WORKER_SECRET`, Resend credentials, and sender verification.
Set `ARCHIVE_MAINTENANCE_ENABLED=true` only after database and application smoke
tests pass. Invoke one maintenance run manually and inspect its privacy-safe
`requestId` and `health` counters before relying on the hourly schedule.

Alert on failed archive jobs, exhausted notification jobs, expired leases,
unreadable artifacts, or a growing oldest-job age.

## Recovery

- **Migration failure:** stop writes, preserve logs and backup, fix forward in a
  new migration, and rerun the verification report.
- **Application failure:** disable the scheduler and return application traffic
  to the last compatible release. Do not revert applied schema destructively.
- **Archive failure:** keep the scheduler disabled. Hot copies remain readable;
  repair Storage/credentials, then resume retries.
- **Integrity failure:** do not finalize payloads. Isolate affected versions,
  retain both representations, and restore from the verified backup.
- **Suspected credential exposure:** disable the affected integration, rotate the
  secret, invalidate the old value, and record the incident without the secret.

## Release evidence

The release record should contain only commit SHA, migration IDs, backup time,
verification counts/token, test summaries, smoke-test pass/fail, scheduler
activation time, health counters, named approvers, and accepted non-critical
debt. No prompt, document, diagram, email address, token, or secret belongs in
release evidence.
