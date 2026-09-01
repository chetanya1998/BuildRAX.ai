# BuildRAX MVP security baseline

## Data and identity

- Supabase PKCE sessions use secure cookies refreshed by Next.js `proxy.ts`.
- Every tenant table has RLS. Project access is derived from workspace membership, never a client-supplied owner ID.
- Guest migration is an authenticated, idempotent database function.
- Share tokens contain 256 bits of randomness, are stored as hashes and support expiry and revocation.

## AI boundary

- The OpenAI key is server-only and model output is requested with Structured Outputs.
- `store: false` is used for model calls.
- Prompts are length-limited and treated only as untrusted product requirements.
- Output passes strict syntax and referential-integrity validation before rendering.
- Prompt contents, emails, tokens and diagram content are excluded from product analytics.

## Browser and export boundary

- CSP, frame denial, MIME sniffing prevention and restrictive permissions headers are configured globally.
- User-visible text rejects HTML-like markup and is rendered as text, not raw HTML.
- Export filenames are normalized and bounded. Exports contain the diagram model or visible canvas only.
- IndexedDB stores draft content only; never auth sessions or provider keys.

## Release gates

Run schema fuzzing, negative RLS tests, dependency audit, secret scanning, Playwright flows and accessibility checks before production. No P0/P1 finding may remain open at release.
