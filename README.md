# BuildRAX

BuildRAX is a visual workspace for planning software systems before they become expensive to build or difficult to change.

A user can begin with a sentence such as:

> Build a multi-tenant support platform with login, an API, background jobs, a database, file storage, and monitoring.

BuildRAX turns that idea into a structured architecture, displays it on an editable canvas, checks it for common risks, and keeps the diagram, documentation, reviews, and exports connected to the same underlying model.

The goal is not only to draw boxes and arrows. BuildRAX helps a team explain what every part does, how information moves, where security belongs, which assumptions need proof, what changed between versions, and how engineers should implement the design.

This repository contains the current MVP on the `fresh-variant` branch.

## Contents

1. [The problem](#the-problem)
2. [Current delivery status](#current-delivery-status)
3. [Complete user journey](#complete-user-journey)
4. [Product functionality](#product-functionality)
5. [Architecture IR](#architecture-ir)
6. [System design](#system-design)
7. [Saving and history](#saving-and-history)
8. [Authentication and permissions](#authentication-and-permissions)
9. [AI and safety](#ai-and-safety)
10. [Security and privacy](#security-and-privacy)
11. [Performance and scale](#performance-and-scale)
12. [Setup and configuration](#setup-and-configuration)
13. [Testing](#testing)
14. [Project structure](#project-structure)
15. [API guide](#api-guide)
16. [Known limitations](#known-limitations)
17. [Jira-ready roadmap](#jira-ready-roadmap)
18. [Definition of done](#definition-of-done)

## The problem

Architecture work is often split across whiteboards, documents, review comments, tickets, AI chats, and local files. That creates three recurring problems.

### A diagram may look right but say very little

A rectangle called “API” does not explain who calls it, which protocol it uses, whether the connection is encrypted, or which data it may access.

BuildRAX uses semantic components. A component has a known role such as API Gateway, Backend Service, Message Queue, Relational Database, Identity Provider, or Hosted LLM. The product can reason about the design instead of only displaying it.

### The diagram and document quickly disagree

If a database is removed from a canvas but the document still describes it, the team no longer knows which version is correct.

BuildRAX derives reviews, structured documentation, Mermaid diagrams, and machine-readable exports from Architecture IR, the shared source of truth. Meaningful changes can make version-bound material stale; harmless visual changes do not.

### AI output can sound convincing but still be wrong

AI can invent component names, produce broken links, or suggest a risky path such as a public browser writing directly to a private database.

BuildRAX treats AI output as a proposal. Trusted server code validates it, adds its origin, compiles it, and rejects invalid output before it can enter saved project state.

## Current delivery status

Status meanings:

- **Implemented**: available in `fresh-variant` with code or browser coverage.
- **Configuration required**: code exists, but staging services or private credentials are needed for a complete live test.
- **Planned**: next-phase work that must not be presented as finished.

### Product and canvas

| Area | Status | Available now |
| --- | --- | --- |
| Landing and onboarding | Implemented | Responsive landing page, templates, sandbox, themes, motion, and working calls to action. |
| Guest creation | Implemented | Create and edit a browser-only draft without signing in. |
| First-draft generation | Implemented | Deterministic no-key generation and optional OpenAI generation produce validated IR and a diagram. |
| Component catalog | Implemented | 30 types across eight meaningful categories. |
| Component palette | Implemented | Search, filters, counts, click/drag placement, keyboard use, local SVGs, docking, detaching, and connector quick insert. |
| Canvas interaction | Implemented | Selection, area and multi-selection, group movement, resizing, pan, zoom, fit view, undo/redo, auto layout, and collapsible mini-map. |
| Drawing | Implemented | Rectangle, circle, diamond, frame, line, arrow, text, freehand, eraser, and images. Ellipse creation is intentionally removed. |
| Text | Implemented | Direct editing, font choices, size, bold, italic, underline, and color. |
| Node styles | Implemented | Card/tinted/outline, corner choices, accent/fill, depth, and layer order. |
| Connectors | Implemented | Handles, typed links, three routes, three line textures, direction, protocol, authentication, and encryption. |
| Templates | Implemented | Eight templates, including a 15-node multi-tenant SaaS system. |
| Review | Implemented | Deterministic findings tied to a version. |
| Documents | Implemented | Edit/preview, split view, Markdown, tables, code, Mermaid, embeds, node links, images, slash commands, copy, download, and AI drafting. |
| Export | Implemented | JSON, Mermaid, Markdown, PNG, and SVG. |
| Project switching | Implemented | Return to Projects from the editor and open another saved project. |
| Sharing | Implemented | Expiring, revocable, read-only links stored as protected hashes. |

### Backend and release

| Area | Status | Available now or remaining work |
| --- | --- | --- |
| Supabase schema and RLS | Implemented in migrations | Tenant access, immutable history, protected functions, and permission tests are in source. |
| Hosted database rollout | Configuration required | Apply migrations to confirmed staging after a recovery point. A code push does not apply them. |
| Authentication | Implemented; setup required | PKCE, callback, refresh, sign-in surfaces, and return-to-draft exist. Providers need Supabase configuration. |
| Guest migration | Implemented | Assets upload first; project, diagram, IR, and lineage save together; local data remains until checksum-confirmed readback. |
| IR persistence | Implemented in code and migration | IR versions, artifacts, idempotency, AI links, history, and restore. |
| Private images | Implemented; setup required | Scoped uploads, checksums, private references, and authorized reads. Buckets/policies need staging deployment. |
| Archive and notices | Implemented; setup required | Day-23 notices, email outbox, day-30 archive, hydration, and restore. Scheduler/Resend need validation. |
| CI | Implemented | Type, lint, unit, build, browser, migration, and RLS jobs. |
| Production load proof | Planned | Concurrency protection exists, but 100/1,000-user tests remain. |
| Production release | Planned | Source status does not prove a production deployment or migration. |

### Work completed by phase

#### Day 1 — database authorization

Initial Supabase schema, workspace ownership, Row Level Security, protected saves, cross-workspace denial, safe soft deletion, and database CI were delivered.

**Why it matters:** guessing an ID or changing a payload must not reveal another customer's work.

#### Day 2 — authentication and persistence

Google, GitHub, and email-link surfaces; PKCE callback; cookie sessions; guest migration; immutable diagram history; multi-tab conflict detection; dashboard; and share links were delivered.

**Why it matters:** signup should not lose a guest design, and two tabs should not silently overwrite one another.

#### Day 3 — validated AI generation

Deterministic generation, optional OpenAI Structured Outputs, strict validation, semantic checks, one repair attempt, timeouts, and privacy-safe AI run metadata were delivered.

**Why it matters:** development does not require paid AI, and model output cannot directly change saved data.

#### Architecture IR and canvas phase

IR 1.1, IR 1.0 migration, presentation contracts, stable checksums, deterministic compilation, atomic persistence, history, restore, archive jobs, notices, private assets, improved canvas interactions, rich documents, templates, and local SVGs were delivered in source.

Still requiring environment proof: staging migration/backfill, private Storage, live OAuth, Resend, scheduler, archive hydration, and production-like load/failure tests.

## Complete user journey

### Anonymous creation

1. Open the landing page and select **Start building**.
2. Describe a system on `/start` or select a template.
3. The server creates Architecture IR.
4. Validation checks types, IDs, ports, links, and safety rules.
5. Deterministic code compiles the canvas.
6. Edit without an account.
7. Keep the complete snapshot in browser IndexedDB.

Example: “Create a mobile ordering system with login, API gateway, order service, database, queue, worker, and monitoring.” The result becomes structured components, flows, assumptions, security information, and presentation—not merely an AI conversation.

### Guest signs in and saves

1. Select **Save**.
2. BuildRAX remembers the draft and opens sign-in.
3. Return to the same draft after PKCE authentication.
4. Upload local images to private Storage.
5. Run one retry-safe migration transaction.
6. Create project, diagram version, IR version, and lineage.
7. Read the saved snapshot back and compare checksums.
8. Remove the browser copy only after verification.

**Significance:** duplicate requests, failed callbacks, or interrupted uploads should not lose work or create duplicate projects.

### Authenticated editing

1. Open a project from the dashboard.
2. Load its current immutable snapshot.
3. Moving/styling changes presentation.
4. Adding/removing/changing a semantic component changes IR.
5. Autosave waits for editing to settle.
6. Saves include starting diagram and IR versions.
7. If another tab saved first, show a conflict instead of overwriting it.

### AI-assisted change

1. Ask for a change, such as “Add asynchronous invoice processing.”
2. AI proposes an IR change, never direct database or canvas mutation.
3. The server validates the proposed components and flows.
4. The user reviews the plan.
5. Apply creates one semantic version; cancel creates none.

### Review, documentation, and export

1. Run a review against the current IR.
2. Draft documentation from the same version.
3. Reference selected nodes or embed canvas information.
4. Export structured formats from IR and visual formats from presentation.

Moving an API Gateway does not invalidate a security review. Removing the Identity Provider does.

### History and restore

1. Open history and choose a version.
2. Hydrate archived content through the authenticated server if needed.
3. Verify checksums.
4. Restore as a new current version.
5. Keep the original historical version unchanged.

## Product functionality

### Templates

1. **Multi-tenant SaaS:** 15 components covering identity, API, database, cache, jobs, files, secrets, source, and monitoring.
2. **AI/RAG:** retrieval, vectors, source files, orchestration, and inference.
3. **Ecommerce:** orders, inventory, events, and transactions.
4. **Event-driven:** producer, broker, consumers, and telemetry.
5. **Realtime collaboration:** WebSockets, presence, sync, and durable state.
6. **Data pipeline:** ingestion, processing, lake, and analytics.
7. **Microservices:** gateway, services, queue, database, and monitoring.
8. **Mobile backend:** client, identity, API, service, data, and background notifications.

Templates are provider-neutral. “Relational Database” does not force AWS, Supabase, or Google Cloud; a provider may be recorded later.

### Component catalog

- **Client:** User, Web Browser, Mobile App, External Client.
- **Networking:** DNS, CDN, Load Balancer, API Gateway.
- **Compute:** Frontend App, Backend Service, Microservice, Serverless Function, Kubernetes Cluster.
- **Data:** Relational Database, Document Database, Cache, Vector Database, Object Storage.
- **Messaging:** Message Queue, Event Broker, Pub/Sub Topic, Event Stream.
- **AI/ML:** Hosted LLM, Embedding Model, AI Agent, Retrieval Service.
- **Security:** Identity Provider, Secrets Manager.
- **DevOps:** Source Repository, Observability.

Each of the 30 items has a stable type, readable name, category, description, suggested protocols, and local icon/fallback. No external Figma link is shown in the product.

### Palette and placement

Search remains pinned; filters and counts explain results; empty search has a recovery state. Click enters placement mode, while the drag grip allows direct placement. Keyboard focus plus Enter places an item; Escape closes/cancels. The palette docks or detaches and saves its floating position for the session. Mobile uses a full-height drawer.

### Canvas navigation and selection

Pointer selects and moves. Dragging across empty space selects an area. Shift, Command, or Control adds objects. Groups move while keeping relative positions. Hand pans. Users can zoom, fit the view, undo, redo, auto-layout, and hide/show the mini-map. Snap-to-grid is disabled and removed from the bottom bar.

### Nodes, drawing, and layers

Semantic nodes resize and support card, tinted, and outline styles; corner choices; accent/fill colors; depth; name/description; technology/provider; and front/back layer controls.

Manual objects include rectangle, circle, diamond, frame, line, arrow, text, freehand, and image. Ellipse creation is absent, though legacy saved content remains readable. The eraser stays enabled until another tool is chosen and uses an eraser cursor. Freehand shows its drawing state.

Text supports direct editing, font choices, size, bold, italic, underline, and color.

### Connectors and arrows

Manual arrows annotate. Semantic connectors describe real relationships.

Manual arrows support start, end, both-end, or no arrowhead plus solid, dashed, or dotted texture. Semantic connectors attach to node handles and record straight/curved/orthogonal routing, texture, one/two-way direction, type, label, protocol, authentication, and encryption.

Example: Browser → API Gateway can say “Authenticated API,” use HTTPS and OAuth, and require TLS 1.3.

### Documentation

The editor provides document view and document-plus-canvas split view. Supported features include Markdown headings, emphasis, inline code, quotes, lists, checklists, editable tables, fenced code, Mermaid, live canvas summaries, node links, images, `/` commands, edit/preview, clipboard copy, Markdown download, and AI drafting.

Document buttons have accessible names and explanatory tooltips. They perform a local action or bounded server request rather than acting as decorative controls.

### Reviews, exports, and sharing

Reviews inspect architecture meaning and can flag missing controls, isolated nodes, unsuitable links, or uncertain assumptions.

- JSON exports structured data.
- Mermaid exports a text diagram.
- Markdown exports an implementation document.
- PNG exports the current view.
- SVG exports a scalable current view.

Share links are read-only, random, expiring, revocable, and stored as protected hashes.

## Architecture IR

IR means “intermediate representation”: the structured source of truth between an idea and the visible canvas.

**IR owns meaning:** intent, requirements, constraints, semantic components, typed ports, flows, security, resilience, assumptions, decisions, origin, and catalog/compiler versions.

**Presentation owns appearance:** positions, sizes, theme, viewport, connector appearance, labels, frames, manual shapes, text, strokes, images, and layer order.

If a database moves, presentation changes. If it becomes a queue, meaning changes and BuildRAX creates a new IR version.

```ts
type ArchitectureSnapshot = {
  schemaVersion: "1.0.0";
  diagramId: string;
  diagramVersion: number;
  irVersion: number;
  ir: ArchitectureIR;
  presentation: ArchitecturePresentation;
  materializedDiagram: Diagram;
  checksums: { ir: string; presentation: string; diagram: string };
};
```

The materialized diagram supports the canvas and visual exports, but the server produces it from IR plus presentation and rejects inconsistent client payloads.

## System design

```text
Browser
  ├─ pages, canvas, and local recovery
  └─ authenticated requests
       ↓
Next.js server routes
  ├─ request checks and authorization
  ├─ deterministic/OpenAI generation
  ├─ IR validation and compilation
  └─ protected database operations
       ↓
Supabase
  ├─ PKCE authentication
  ├─ PostgreSQL and Row Level Security
  ├─ immutable history and idempotency
  └─ private artifact/image storage
```

Main choices: Next.js/React for app and server routes; React Flow for canvas; Zod for contracts; Supabase for auth/database/RLS/Storage; Dexie for IndexedDB; ELK for layout; Mermaid for diagrams; OpenAI Responses API for optional proposals; Vitest, Playwright, and pgTAP for tests; and Netlify for hosting/maintenance.

## Saving and history

Guest drafts live in IndexedDB and never contain auth sessions or provider keys. Browser storage is recovery storage, not a permanent account backup.

Authenticated changes are grouped after roughly five seconds of idle time, with a maximum interval during continuous editing. Layout-only saves reuse IR; semantic saves create diagram and IR versions.

Each save includes its base versions. PostgreSQL locks the diagram; stale callers receive `409` with current version information. Idempotency keys make retry safe: same key/content returns the first result; same key/different content returns `409`.

IR, presentation, and diagram use SHA-256 over stable key-sorted JSON. PostgreSQL recalculates important hashes.

At day 23, owners receive a deduplicated in-app notice and generic email job. At day 30, eligible non-current artifacts move to encrypted private Storage. Current heads stay hot; metadata stays in PostgreSQL; restoration creates a new head. The MVP does not hard-delete history.

## Authentication and permissions

Sign-in surfaces support Google, GitHub, and email links. Real use needs provider setup and exact callback URLs in Supabase. Sessions use PKCE and secure cookies refreshed by the Next.js proxy.

```text
user → workspace membership → project → diagram/document/review/artifact
```

The browser cannot choose its owner. RLS protects tenant data even during direct Supabase requests. Tests cover owners, non-members, cross-workspace denial, immutable artifacts, ID mismatch, stale saves, and retries.

The service-role key is limited to trusted server/workers. Never place it in browser code, `NEXT_PUBLIC_*`, source, screenshots, tickets, or prompts.

## AI and safety

The deterministic provider works with no key and produces repeatable architectures. The OpenAI provider activates only with a server key and produces structured IR proposals, never direct database writes.

```text
request → size/text/rate checks → intent route → proposal
        → schema and semantic validation → at most one repair
        → deterministic compile → checksums/receipt → response or safe failure
```

Guardrails:

- prompts are untrusted requirements;
- types are allowlisted;
- IDs, ports, endpoints, and compatibility are checked;
- AI cannot assign trusted origin or mutate state;
- a second invalid result fails closed;
- calls use `store: false`;
- raw prompts/output are not kept in normal analytics or `ai_runs`; and
- audits retain only safe operational metadata.

The desired common generation experience is 5–10 seconds, though live latency depends on the provider. Deterministic routing, small contracts, no-model template paths, one repair maximum, strict timeouts, and local compilation reduce delay and cost.

## Security and privacy

- Text is bounded and rendered safely; unknown types and broken references are rejected.
- Markdown is allowlisted; generated HTML is not stored.
- Browser headers restrict content, frames, MIME behavior, and permissions.
- Export names are normalized.
- Persisted images use server-scoped private paths and verified checksums.
- Raw private paths and permanent signed URLs are not exposed.
- Share tokens use strong randomness, expiry, revocation, and hash-only storage.

Current limits: IR 256 KB, snapshot JSON 1 MB, 20 images, and 25 MB total images.

Secrets belong only in `.env.local`, protected deployment settings, GitHub secrets, or provider dashboards. Rotate anything pasted into chat, tickets, screenshots, or commits; deleting the text later is insufficient.

## Performance and scale

Current protections include row locks per diagram, pooled connections across diagrams, idempotent retries with backoff/jitter, autosave grouping, rate windows, leased archive batches with `SKIP LOCKED`, AI timeouts, and deterministic fallback.

Targets still needing staging measurement:

- persistence adds under 300 ms at p95;
- 100 concurrent saves complete under 500 ms at p95;
- 1,000 distributed saves lose no versions/create no duplicates;
- pools remain available;
- common AI drafts take about 5–10 seconds; and
- archived history adds roughly 1–3 seconds.

Before claiming readiness, seed realistic data, test same/distributed diagrams, measure API/database/provider/Storage separately, tune limits, inject failures, and publish p50/p95/p99/error/recovery results.

## Setup and configuration

Requirements: Node.js 20.9+ (CI uses 22), npm, and optionally Docker Desktop plus Supabase CLI.

```bash
git clone https://github.com/chetanya1998/BuildRAX.ai.git
cd BuildRAX.ai
git switch fresh-variant
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No key is required for landing, templates, guest canvas, deterministic review/doc generation, or exports.

```bash
cp .env.example .env.local
```

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public with RLS | Browser client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Trusted workers/artifacts. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Server | Live AI and pinned model. |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Split | Anonymous abuse protection. |
| `RATE_LIMIT_HMAC_SECRET` | Server | Privacy-safe rate fingerprints. |
| `SHARE_TOKEN_PEPPER` | Server | Share hash protection. |
| `GENERATION_RECEIPT_SECRET` | Server | Signed guest receipts. |
| `ARCHIVE_WORKER_SECRET` | Server | Maintenance authentication. |
| `RESEND_API_KEY`, `ARCHIVE_NOTICE_FROM_EMAIL` | Server | Archive emails. |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | Optional monitoring. |

Google/GitHub/SMTP credentials belong in Supabase/provider settings. Use separate development, staging, and production values.

Database migrations run in order:

1. `202608290001_initial_schema.sql`
2. `202609010002_day1_authorization_hardening.sql`
3. `202609020003_day2_auth_persistence.sql`
4. `202609030004_day3_ai_generation.sql`
5. `202609060005_architecture_ir_persistence.sql`

```bash
npx supabase start
npm run db:reset
npm run db:test
```

If local Docker space is limited, use GitHub's isolated database job. Before staging, confirm the environment, create a recovery point, protect credentials, deploy migrations before dependent app code, and run two-user smoke tests. Use forward-only corrective migrations instead of destructive shared-environment rollback.

## Testing

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

These check TypeScript contracts, common correctness issues, units/APIs, production compilation, and browser journeys. `npm run db:test` checks migrations, RLS, immutable history, checksums, idempotency, and conflicts.

Coverage includes IR migration, checksum/compiler determinism, semantic versus visual changes, AI repair/failure, catalog/icon/ellipse regressions, canvas placement/selection/movement/resizing/connections, documents, guest migration, multi-tab conflict, tenant denial, history, archive, and accessibility.

GitHub Actions runs quality, Chromium browser, and isolated Supabase jobs on `fresh-variant` pushes and pull requests.

## Project structure

```text
src/app/                  Pages and API routes
src/components/editor/    Canvas, palette, nodes, documents
src/lib/ai/               Provider boundary and generation
src/lib/architecture-ir/  IR, migration, validation, compiler, snapshots
src/lib/domain/           Diagram, catalog, templates, exports, layout
src/lib/server/           Server-only helpers and receipts
src/lib/storage/          IndexedDB and asset references
src/lib/supabase/         Database access
supabase/migrations/      Database changes
supabase/tests/database/  pgTAP security/persistence tests
tests/e2e/                Playwright journeys
docs/                     Architecture and rollout notes
netlify/functions/        Scheduled maintenance
public/icons/             Local SVGs and attribution
```

`src/lib/domain` and `src/lib/architecture-ir` define trusted meaning. The editor displays and edits those contracts; it does not invent a second model.

## API guide

| Method and route | Purpose |
| --- | --- |
| `POST /api/v1/ai/generations` | Create validated IR, presentation, diagram, findings, and metadata. |
| `POST /api/v1/ai/change-plans` | Propose a version-bound change. |
| `POST /api/v1/ai/reviews` | Review current architecture. |
| `POST /api/v1/ai/documentation` | Generate Markdown from IR. |
| `POST /api/v1/architecture/compile` | Validate and compile IR. |
| `PUT /api/v1/diagrams/:id` | Atomically save IR and presentation. |
| `GET /api/v1/diagrams/:id/versions` | List versions. |
| `GET /api/v1/diagrams/:id/versions/:version` | Read/verify a snapshot. |
| `POST /api/v1/diagrams/:id/versions/:version/restore` | Restore as a new head. |
| `POST /api/v1/guest-migrations` | Migrate a guest snapshot. |
| `POST /api/v1/assets/upload-url` | Request private upload. |
| `GET /api/v1/assets/content` | Read an authorized asset. |
| `POST /api/v1/share-links` | Create/revoke sharing. |
| `POST /api/v1/exports` | Produce exports. |
| `GET /api/v1/notifications` | List notices. |
| `PATCH /api/v1/notifications/:id` | Mark notice read. |
| `POST /api/internal/architecture-maintenance` | Run maintenance. |

## Known limitations

1. Hosted staging migration/backfill still needs explicit proof.
2. Real OAuth/email requires provider and callback setup.
3. Live AI requires a server key and staging evaluation.
4. Deterministic generation covers trusted archetypes, not every request.
5. Documents are an MVP Markdown editor, not realtime Google Docs.
6. Realtime multi-user canvas editing is not implemented; conflicts are detected instead.
7. Scale targets are not yet production-certified.
8. Email/archive scheduling needs Resend, sender, secrets, and clock tests.
9. Archive recovery needs deployed private Storage policies.
10. Guest drafts depend on browser storage before migration.
11. Wider mobile/device visual regression remains.
12. No Jira export or ticket IDs exist in this repository. Proposed keys below must be mapped to the real Jira project.

## Jira-ready roadmap

This breakdown is grounded in remaining work. Replace `BRX` with the real Jira key. These are proposed identifiers, not claims about existing Jira records.

### BRX-E1 — Staging persistence

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-101 | Rotate shared Supabase secrets and set staging values. | Removes leaked-access risk. | Old values fail; replacements are protected. |
| BRX-102 | Back up staging and apply migrations. | Activates persistence safely. | All migrations recorded without destructive loss. |
| BRX-103 | Backfill legacy diagrams into IR/artifacts. | Keeps old projects readable. | Zero unlinked versions/checksum mismatches. |
| BRX-104 | Run real two-user permission tests. | Proves isolation. | Owners succeed; unrelated users fail. |
| BRX-105 | Smoke-test save, conflict, history, restore. | Proves app/database agreement. | All critical journeys pass. |

### BRX-E2 — Private assets and archive

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-201 | Configure private buckets/policies. | Keeps content private. | Unauthorized reads fail. |
| BRX-202 | Test upload failure/retry/migration/readback. | Prevents image loss. | Local draft stays until verified. |
| BRX-203 | Configure worker secret and schedule. | Automates maintenance. | Calls authenticate; leases do not overlap. |
| BRX-204 | Configure Resend/sender. | Warns owners. | Day-23 notice/email deduplicate. |
| BRX-205 | Test day-30 archive/hydrate/restore. | Preserves history. | Head stays hot; cold version verifies/restores. |

### BRX-E3 — Authentication readiness

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-301 | Configure Google, GitHub, email. | Enables sign-in. | Every provider completes PKCE. |
| BRX-302 | Register local/preview/staging/production callbacks. | Prevents redirect failures. | Only approved callbacks work. |
| BRX-303 | Test guest save through all providers. | Protects onboarding. | One draft becomes one project. |
| BRX-304 | Test expiry/revoked membership. | Prevents stale access. | Protected access is denied. |

### BRX-E4 — Canvas and documents

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-401 | Desktop/tablet/mobile/light/dark visual regression. | Prevents UI breakage. | Approved snapshots pass. |
| BRX-402 | Stress-test 100+ nodes, links, strokes, images. | Measures large designs. | Meets interaction latency budget. |
| BRX-403 | Keyboard/screen-reader acceptance. | Improves accessibility. | Focus, labels, state, shortcuts pass. |
| BRX-404 | Durable document versions/conflicts. | Makes docs first-class. | Immutable saves and stale-write denial. |
| BRX-405 | Live embedded canvas frames. | Improves documents. | Regions remain linked to source. |
| BRX-406 | Safe JSON/Mermaid import. | Brings existing work in. | Valid round-trip; invalid input explains errors. |

### BRX-E5 — AI quality, speed, and cost

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-501 | Build an evaluation set. | Makes quality measurable. | Release reports validity, repair, quality, latency. |
| BRX-502 | Add privacy-safe intent cache. | Reduces time/cost. | Safe equivalent requests reuse output. |
| BRX-503 | Add progress without exposing invalid partial IR. | Improves perceived speed. | Only validated final IR enters canvas. |
| BRX-504 | Queue generation for bursts. | Controls overload. | Durable status, cancel, retry, timeout. |
| BRX-505 | Tune for 5–10-second common paths. | Lowers latency/tokens. | Staging p95 and quality pass. |
| BRX-506 | Add circuit breaker/fallback. | Handles provider failure. | Circuit opens; deterministic path remains. |

### BRX-E6 — Load, monitoring, and release safety

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-601 | Add privacy-safe correlation logs. | Speeds diagnosis. | API, DB, AI, version, job share an ID. |
| BRX-602 | Add health dashboards/alerts. | Makes failures visible. | Latency, conflicts, archive, email monitored. |
| BRX-603 | Run 100 concurrent saves. | Proves beta behavior. | p95 met; no loss/duplicates. |
| BRX-604 | Run 1,000-user and AI bursts. | Finds resource limits. | No silent loss/pool exhaustion. |
| BRX-605 | Inject DB/Storage/AI/email/worker failures. | Proves recovery. | Bounded, safe, visible retries. |
| BRX-606 | Add dependency/secret/security gates. | Reduces release risk. | No committed secret or P0/P1. |

### BRX-E7 — Beta and production

| Ticket | Work | Impact | Acceptance |
| --- | --- | --- | --- |
| BRX-701 | Write rollout/recovery runbooks. | Makes releases repeatable. | Another person can deploy/recover. |
| BRX-702 | Run privacy-safe invited beta. | Finds real usability issues. | Useful metrics without project content. |
| BRX-703 | Close P0/P1 and record accepted debt. | Protects launch. | Release review signed off. |
| BRX-704 | Deploy database, app, then scheduler. | Avoids incompatible rollout. | Every stage passes smoke tests. |
| BRX-705 | Monitor launch and test restore. | Proves operations. | Alerts, backup, restore, contacts verified. |

Recommended order: E1 persistence → E3 authentication → E2 assets/archive → E4 and E5 → E6 → E7.

## Definition of done

Do not call BuildRAX production-ready until:

- staging migration/backfill has zero missing links or checksum errors;
- real tenant isolation tests pass;
- guest migration passes through every enabled provider;
- images survive migration/readback;
- conflicts never silently overwrite work;
- restore creates a new head without rewriting history;
- day-23 notice and day-30 archive/hydration pass;
- 100- and 1,000-user tests meet limits;
- AI quality, safety, latency, and cost pass evaluation;
- accessibility and viewport checks pass;
- exposed secrets are rotated and none are committed;
- no P0/P1 security issue remains;
- backup/recovery runbooks are exercised; and
- rollout follows database → application → scheduler.

## Additional documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system boundaries.
- [`docs/ARCHITECTURE-IR.md`](docs/ARCHITECTURE-IR.md) — IR and immutable persistence.
- [`docs/SECURITY.md`](docs/SECURITY.md) — security baseline.
- [`docs/DAY-1-SUPABASE-ROLLOUT.md`](docs/DAY-1-SUPABASE-ROLLOUT.md) — database authorization.
- [`docs/DAY-2-AUTH-PERSISTENCE.md`](docs/DAY-2-AUTH-PERSISTENCE.md) — auth and saving.
- [`docs/DAY-3-AI-GENERATION.md`](docs/DAY-3-AI-GENERATION.md) — AI generation.
- [`docs/LANDING-DESIGN.md`](docs/LANDING-DESIGN.md) — landing design and motion.

## Repository rule

Work continues on `fresh-variant`. A code push does not apply hosted migrations, change production, or merge into `main`. Those are separate reviewed actions.
