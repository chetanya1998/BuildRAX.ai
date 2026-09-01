# Day 2 — Authentication and persistence rollout

## Delivered application work

- Google, GitHub and email-link sign-in surfaces use Supabase PKCE.
- The callback exchanges the PKCE code for a session and the proxy refreshes that session.
- A save-gated local draft returns to `/draft/:id?migrate=1` after authentication, then migrates once with an idempotency key and redirects to its persisted canvas.
- Persisted canvases load the current immutable snapshot, autosave only after edits, and surface version conflicts rather than overwriting a newer server version.
- The dashboard lists RLS-authorized saved projects separately from browser-only drafts.
- Share links are cryptographically random, hash-only at rest, read-only, revocable, and created with a seven-day expiry from the canvas.

## Required Supabase configuration

Configure these in the **staging** Supabase project before end-to-end testing:

1. Enable Google and GitHub providers, entering each provider's client ID and client secret.
2. Enable email magic links. The Supabase development mailer is sufficient locally; configure SMTP/Resend before external testers.
3. Add exact redirect URLs:
   - `http://localhost:3000/auth/callback`
   - the Netlify deploy-preview callback URL pattern
   - `https://buildraxai.netlify.app/auth/callback` (or the final production domain)
4. Apply migrations through `202609020003_day2_auth_persistence.sql` only after the staging project and recovery point are confirmed.
5. Set a high-entropy `SHARE_TOKEN_PEPPER` only in server-side Netlify/Supabase worker configuration. It must not be public or committed.

## Acceptance test

1. Create a guest diagram in a clean browser profile.
2. Select **Save**, authenticate with each configured provider, and verify the same diagram opens at `/projects/:projectId/canvas`.
3. Refresh the project page and verify the dashboard lists the saved project and its canvas still loads.
4. Edit it in two tabs; save in one tab, then verify the other receives a conflict instead of overwriting the change.
5. Create a share link, open it in a signed-out private window, revoke it, then verify access is denied. Repeat with an expired link.

## Not applied remotely

This repository work and CI do not apply migrations to a hosted Supabase project. The staging environment confirmation and backup remain an explicit release gate.
