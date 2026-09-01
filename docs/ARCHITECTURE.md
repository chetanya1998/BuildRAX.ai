# BuildRAX architecture

BuildRAX is a single Next.js App Router application deployed through Netlify. The browser owns transient canvas interaction and offline guest recovery. Route handlers own AI calls, authorization-sensitive mutations, redaction and validation. Supabase supplies PKCE authentication, PostgreSQL persistence, Row Level Security and immutable versions.

## Boundaries

- `src/lib/domain` is the canonical architecture language. Every input—manual, template, imported JSON or AI—is parsed through the same Zod schemas.
- `src/components/editor` is an interaction layer over that model. It never accepts unvalidated AI objects.
- `src/lib/ai` exposes a provider interface. Missing credentials select a deterministic mock provider; a configured server selects OpenAI.
- `src/lib/storage` stores the one guest draft in IndexedDB. Auth tokens never enter this database.
- `src/lib/supabase` creates cookie-based clients. Normal project access uses the user JWT and RLS; the service-role credential is reserved for future trusted background workers.
- `supabase/migrations` is the database source of truth. Diagram and document versions are immutable snapshots.

## Version flow

1. An edit increments the client model version and marks version-bound reviews/docs stale.
2. Autosave sends the current payload with `baseVersion`.
3. PostgreSQL locks the diagram row and rejects stale writes with a serialization conflict.
4. The new snapshot is inserted before `current_version` advances.
5. Offline changes remain local until the browser reconnects.

## Figma asset boundary

Semantic node glyphs are isolated from the architecture model. The current UI uses readable category codes; exact production SVGs will be ingested from the user-supplied export bundle and mapped by semantic type without changing schemas or editor behavior.
