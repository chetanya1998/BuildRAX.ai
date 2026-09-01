# BuildRAX MVP

Fresh-variant implementation of an AI-assisted semantic architecture canvas.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. No API key is required for the landing page, onboarding, templates, guest drafts, canvas, review, documentation or exports; deterministic fixtures are used when OpenAI is not configured.

## Environment timing

Copy `.env.example` to `.env.local` and add credentials only when the matching integration is being tested:

- Live AI: `OPENAI_API_KEY` and optional `OPENAI_MODEL`.
- Supabase persistence/auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; trusted workers only may receive `SUPABASE_SERVICE_ROLE_KEY`.
- Public anonymous AI: Turnstile keys and `RATE_LIMIT_HMAC_SECRET`.
- Share links: `SHARE_TOKEN_PEPPER`.
- Google/GitHub credentials and production SMTP are configured in the Supabase dashboard, not in browser environment variables.

Use separate projects and credentials for development, staging and production. Runtime secrets belong in scoped Netlify environment variables and must not be added to `netlify.toml`.

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

## Backend setup

Install the Supabase CLI, start a local project, and apply `supabase/migrations`. Configure OAuth redirects for localhost, Netlify deploy previews and the production domain. See `docs/ARCHITECTURE.md` and `docs/SECURITY.md` for system boundaries and release gates.

## Figma exports

The exact light/dark screen references and semantic SVG icons remain an explicit visual-fidelity input. Place the approved files under `public/figma/` with a source manifest before final visual acceptance. The editor currently uses text category codes so no substitute icon art is committed.
