# Day 1 — Supabase authorization rollout

## Scope

This rollout applies the initial schema followed by the Day 1 authorization-hardening migration:

1. `202608290001_initial_schema.sql`
2. `202609010002_day1_authorization_hardening.sql`

The hardening migration closes cross-workspace review/document writes, limits function execution to authenticated callers, hides soft-deleted project data, validates diagram payload identity, and serializes duplicate guest-draft migrations.

## Required before staging apply

- A Supabase staging project distinct from production.
- A user with permission to link and migrate that project.
- A database password or approved Supabase CLI login flow.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured only in the staging host environment.
- A recovery point/backup confirmed in the Supabase dashboard.

Never put `SUPABASE_SERVICE_ROLE_KEY` or database credentials in the repository, browser, client environment variables, issue tracker, or prompt.

## Validation without local Docker

The repository CI now runs the Supabase stack and this pgTAP suite on a GitHub-hosted Ubuntu runner. It does **not** connect to, read from, or change the hosted Supabase project. This is the default route when a developer machine cannot spare Docker disk space.

After the `fresh-variant` branch is committed and pushed, the **Supabase migration and RLS tests** job will:

1. Start an isolated local Supabase stack on the GitHub runner.
2. Apply every migration from this repository.
3. Run `supabase/tests/database/001_day1_rls.sql`.
4. Stop the stack without a backup.

This gives us migration and RLS coverage without using any local storage or hosted-project credentials.

## Optional local validation

Docker Desktop must be running first.

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

Use this only when local Docker has sufficient free space. It is not required for Day 1 once the GitHub database job is running.

The pgTAP suite at `supabase/tests/database/001_day1_rls.sql` verifies:

- RLS is enabled on key tenant tables.
- A workspace owner can save a diagram version.
- The diagram RPC rejects an unrelated payload ID.
- A non-member cannot read or update another project.
- A non-member cannot create reviews or documents for another workspace.
- A non-member cannot save another workspace diagram.

## Staging rollout

Run this only against a project explicitly confirmed as **staging**. Do not link or push this migration to production while this initial rollout is under review.

### Option A — Supabase Dashboard (no Docker required)

1. Confirm the project environment is staging and create a backup/recovery point.
2. Open **SQL Editor** in the Supabase Dashboard.
3. Apply the two migrations in chronological order from the files listed above.
4. Run the authenticated smoke test below.

### Option B — approved CI deployment (recommended after Day 1)

Add a separate, manually dispatched deployment workflow after the database job is green. Store these as encrypted GitHub repository/environment secrets, never as workflow values:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

The deployment workflow must require a staging environment approval before it runs `supabase db push`. It should remain separate from normal pull-request CI so a code push never deploys a database change automatically.

### CLI rollout

After local tests pass and the project is explicitly linked to staging:

```bash
npx supabase db push
npx supabase test db --linked
```

Run the web application’s authenticated smoke test immediately afterward:

1. Sign in as User A and create a project/diagram.
2. Sign in as User B and confirm the guessed project UUID cannot be read or changed.
3. Save the same diagram twice from base version 1 and confirm the second save returns `409`.
4. Migrate the same guest draft twice and confirm it returns the original project and diagram.
5. Create, expire, and revoke a share link; verify access ends each time.

## Rollback rule

Do not run a destructive rollback against a shared staging or production database. If an issue is found after applying the Day 1 migration:

1. Disable affected routes at the application layer.
2. Add a forward-only corrective migration.
3. Re-run pgTAP and the negative authorization matrix.
4. Record the incident and migration IDs in the release notes.
