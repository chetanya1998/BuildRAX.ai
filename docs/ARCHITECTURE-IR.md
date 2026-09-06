# BuildRAX Architecture IR and immutable persistence

Architecture IR is the versioned, provider-neutral contract between requirement
understanding and the saved canvas diagram. It prevents an AI provider from
writing project state directly.

## Request path

1. The request boundary enforces size, text-safety and rate limits.
2. The deterministic intent router selects a trusted architecture archetype.
3. `ArchitectureIR` records intent, requirements, constraints, components,
   flows, security, resilience, assumptions, decisions and provenance.
4. The deterministic validator rejects invalid IDs, missing endpoints, unknown
   catalog types and category mismatches. It also reports topology and security
   warnings such as direct client-to-database access, orphan nodes, missing event
   consumers and unencrypted sensitive flows.
5. The compiler converts only valid IR into the canonical `Diagram` schema.
6. The server splits semantic IR from presentation state, materializes the
canonical diagram, verifies all three canonical SHA-256 checksums, and saves
the snapshot in one database transaction.

Local guest images may remain as data URLs for offline recovery. Before an
authenticated save or guest migration, the client hashes each image and uploads
it to a server-assigned private `architecture-assets` path scoped by workspace
and diagram. The server downloads and verifies new content once, records the
verified checksum in `architecture_assets`, and rejects missing, oversized,
cross-workspace or altered references. Persisted diagrams contain opaque asset
references; an authenticated read endpoint issues only a short-lived redirect.

## Stored snapshot

`ArchitectureSnapshot` is the only complete local/API save envelope. IR owns
semantic components, flows, ports, requirements, constraints, assumptions and
decisions. Presentation owns positions, dimensions, connector appearance,
node card variant, accent/fill colors, corner radius, depth, primitives, images,
theme, viewport and layer order. The materialized diagram is
compiled server-side for canvas compatibility and visual exports.

The database stores content-addressed artifacts in `artifact_blobs`, immutable
semantic lineage in `architecture_ir_versions`, and an immutable three-way link
for every `diagram_versions` row in `diagram_version_artifacts`. A layout-only
save creates a diagram checkpoint but reuses the IR version. A semantic change
creates both versions. The old mutation RPCs are revoked after the migration so
new unlinked diagram versions cannot be created.

All checksums use recursively key-sorted, whitespace-free JSON in both the web
runtime and PostgreSQL. PostgreSQL recalculates artifact and request checksums;
browser-supplied hashes are never trusted as proof of integrity.

The normal no-key generation path now uses this pipeline. The dedicated
`POST /api/v1/architecture/compile` endpoint exposes IR, validation findings and
the compiled diagram for contract testing and future server workers. It has a
10-second execution ceiling, although the deterministic path normally completes
locally in milliseconds.

## AI boundary

AI is an optional requirement-understanding adapter. The OpenAI adapter proposes
Architecture IR rather than a diagram, must emit the provider proposal schema,
and passes the same deterministic validator before compilation. The server adds
trusted provenance; the model cannot provide it. AI cannot mutate diagrams,
database rows or document versions. Repair is bounded to one proposal and hard
validation errors never become warnings.

Generation receipts are HMAC signed by the server and bind the request ID to the
IR and materialized diagram checksums. Guest migration verifies the receipt,
uploads private assets first, then atomically creates project, diagram, IR and
lineage records. The AI-run link is committed in the same migration transaction.
The route then reads the saved snapshot through the normal hydration path and
compares all three checksums. IndexedDB data is removed only after that confirmed
read succeeds.

Reviews and documentation are pinned to both an immutable IR version and their
originating diagram version. Their content derives from IR, so moving or styling
nodes does not make them stale. JSON, Mermaid and Markdown exports also derive
from IR; PNG and SVG remain presentation exports.

## History, restore, and archival

- `GET /api/v1/diagrams/:id/versions` returns safe metadata only.
- `GET /api/v1/diagrams/:id/versions/:version` authenticates, hydrates cold
  artifacts server-side, and verifies checksums before returning a snapshot.
- Restore changes provenance to `restore` and commits a new head. It never edits
  the source version.
- At day 23, owners receive a deduplicated in-app notice and a generic email
  outbox job containing no project data.
- At day 30, non-current, unshared hot artifacts are leased with `SKIP LOCKED`,
  canonicalized, compressed, uploaded to private Storage, verified, and then
  removed from the hot JSON column. Current or content-shared head artifacts are
  excluded.
- The scheduled Netlify worker calls the authenticated internal maintenance
  route hourly. Failed archive and email jobs retry with exponential backoff.

Required server-only deployment values are `SUPABASE_SERVICE_ROLE_KEY`,
`GENERATION_RECEIPT_SECRET`, `ARCHIVE_WORKER_SECRET`, and—when email delivery is
enabled—`RESEND_API_KEY` plus `ARCHIVE_NOTICE_FROM_EMAIL`. Never place them in
client-prefixed variables or `netlify.toml`.

## Operational rules

- Never persist raw prompts in analytics or normal application logs.
- Keep `schemaVersion` mandatory and migrate IR explicitly when it changes.
- Use idempotency keys before persisting compiled diagrams.
- Cache only normalized, privacy-safe intent fingerprints; never cache sessions.
- Run compile/validation without provider credentials to keep the fast path
  available during provider outages and traffic spikes.
- Record template version, validation codes and duration—not prompt content—for
  observability.
- Enforce the 256 KB IR boundary, combined 1 MB JSON snapshot boundary, 20-image
  and 25 MB image-set boundaries before persistence.
- Keep five-second idle autosave coalescing, stable idempotency keys for offline
  retries, and per-user/workspace persistence rate windows to prevent write
  amplification during traffic spikes.
- Apply database migrations before application deployment. Enable the scheduled
  worker only after the application can read both hot and archived artifacts.
- Alert when archive checksum failures, exhausted leases, notification retries,
  save conflicts, or hydration failures rise above their normal baseline.

## Verification gates

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` on every
change. With Docker available, run `npm run db:test`; it resets the local stack
and exercises tenant isolation, immutable history, canonical checksums,
idempotency, layout-only IR reuse, pinned reviews/docs, archival exclusion, and
stale-write conflicts. Release only after backfill counts show zero unlinked
diagram versions and zero checksum mismatches.
