# Netlify environment for buildraxai.netlify.app

This is the exact configuration production needs. The list of required variables lives in
[`src/lib/config/runtime-requirements.ts`](../src/lib/config/runtime-requirements.ts). Three
checks enforce it:

- **Build gate:** `npm run config:check` runs before `next build` (see `netlify.toml`). A
  **production** build fails when a required variable is missing or too short. Deploy previews and
  branch deploys only warn.
- **Startup log:** `src/instrumentation.ts` lists the missing variables in the function logs once
  per server instance.
- **Health probe:** `GET /api/health` returns `200 {"status":"ok"}` or `503 {"status":"degraded"}`.
  The response shows each capability as a boolean and never shows variable names or values.

## Why production was broken

Production had none of the required server values. Every guest request failed with
`503 Request identity signing is not configured` (`RATE_LIMIT_HMAC_SECRET`). Saving, history and
sharing failed with `503 Persistence is not configured` (no Supabase variables). As a result, only
the local canvas, templates and exports worked.

## Required for production

Set these in **Site configuration → Environment variables**, deploy context **Production**. Give
each one the scopes **Builds** and **Functions**. Builds is needed because `NEXT_PUBLIC_*` values
are inlined at build time and because the build gate reads every variable.

| Variable | Secret | Value | Unlocks |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | No | `https://<project-ref>.supabase.co`. The repository's project is `https://fkbriswggxmdlxbxpqlj.supabase.co`. | Sign-in, saving, shared rate limits |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No (protected by RLS) | Supabase → Project Settings → API Keys → publishable key (`sb_publishable_…`) | Sign-in, saved projects |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase → Project Settings → API Keys → secret key (`sb_secret_…`) | Guest generation (rate limits, jobs), migrations, private assets |
| `RATE_LIMIT_HMAC_SECRET` | **Yes**, at least 32 characters | Generate a new random value | Every guest request: generate, review, guest session |
| `GENERATION_RECEIPT_SECRET` | **Yes**, at least 32 characters | Generate a new random value, different from the one above | Generation receipts and guest-to-account migration |
| `SHARE_TOKEN_PEPPER` | **Yes**, at least 32 characters | Generate a new random value | Share links |

Generate each secret separately:

```bash
openssl rand -base64 48
```

Changing `RATE_LIMIT_HMAC_SECRET` later invalidates existing guest sessions, which is harmless.
Changing `SHARE_TOKEN_PEPPER` breaks every existing share link.

## Keep these explicit

| Variable | Production value | Why |
| --- | --- | --- |
| `GENERATION_WORKER_ENABLED` | `false` | The browser drives generation jobs through `/api/v1/generation-jobs/:id/run`. The every-minute scheduled worker stays off until it has been verified. |
| `ARCHIVE_MAINTENANCE_ENABLED` | `false` | Day-30 archiving stays off until the release runbook's database checks pass. |

## Optional

| Variable | Default | Effect |
| --- | --- | --- |
| `OPENAI_API_KEY` | unset | Enables model generation. Without it, the deterministic generator is used, which matches requests to the 8 templates. |
| `OPENAI_MODEL` | `gpt-5.4-mini-2026-03-17` | Pinned model for model generation. |
| `AI_PROVIDER_REQUEST_LIMIT` / `AI_PROVIDER_COST_LIMIT` | `100` / `100` | Site-wide limits per window for the AI provider. |
| `GENERATION_QUEUE_CAPACITY`, `GENERATION_PROVIDER_CONCURRENCY`, `GENERATION_PROVIDER_COST_CAPACITY` | see `.env.example` | Admission-control tuning. |
| `BUILDRAX_SKIP_CONFIG_CHECK` | unset | Set to `true` only to force a production deploy past the build gate in an emergency. |

Only required once the matching switch is `true` (the build gate enforces this):

| Variable | Required when |
| --- | --- |
| `GENERATION_WORKER_SECRET` (at least 32 characters) | `GENERATION_WORKER_ENABLED=true` |
| `ARCHIVE_WORKER_SECRET` (at least 32 characters), `RESEND_API_KEY`, `ARCHIVE_NOTICE_FROM_EMAIL` | `ARCHIVE_MAINTENANCE_ENABLED=true` |

Leave `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_SENTRY_DSN` unset.
They appear in `.env.example`, but no code reads them yet.

## Setting them with the Netlify CLI

```bash
netlify env:set RATE_LIMIT_HMAC_SECRET "$(openssl rand -base64 48)" --context production --scope builds functions --secret
```

Repeat for each secret. Leave out `--secret` for the two `NEXT_PUBLIC_*` values. Use separate
Supabase credentials for the **Deploy Previews** context, or leave previews without them; a preview
then deploys with a warning and serves only local features.

## Supabase side (outside Netlify)

1. Apply every file in `supabase/migrations/` to the project in order. Take a backup first. See
   [`DAY-7-RELEASE-RUNBOOK.md`](DAY-7-RELEASE-RUNBOOK.md). Shared rate limiting calls the
   `consume_shared_rate_limits` RPC, so guest generation still returns 503 until the migrations run.
2. Authentication → URL Configuration: set Site URL to `https://buildraxai.netlify.app` and add
   `https://buildraxai.netlify.app/auth/callback` to the redirect allow list.
3. Enable the Google and GitHub providers, and the email provider for magic links, with their
   client IDs and secrets.

## Verify after deploying

```bash
curl -s https://buildraxai.netlify.app/api/health
```

Expect `"status":"ok"` with `guestAccess`, `accounts` and `shareLinks` all `true`. Then open
`/start`, generate a diagram as a guest, sign in, and save.
