# BuildRAX product, frontend, and beta-readiness audit

Date: 12 September 2026  
Branch inspected: `fresh-variant`  
Audit type: hands-on user journey, browser behavior, source review, automated checks, and release-readiness review

## Executive verdict

BuildRAX has a credible technical foundation, but it is not yet ready for a public beta of 100–200 simultaneous users.

The strongest part is the persistence design: Architecture IR 1.1, presentation separation, immutable versions, checksums, optimistic conflicts, idempotency, RLS, guest migration, history, restore, archive jobs, private assets, and document versions all exist in source. The weakest part is the promise made to the user. The interface presents several deterministic rules as AI, accepts inputs that its own downstream schema rejects, produces architecture documentation that is too generic for serious engineering decisions, and exposes mobile and canvas states that are inconsistent or hard to discover.

The correct beta decision is **no-go until the P0 and P1 items in this report are closed and verified in staging**. This is not a recommendation to redesign everything. It is a recommendation to make the core promise truthful and reliable before adding more surface area.

## What was tested

The audit treated BuildRAX as a product, not only as a repository. The following journeys were exercised:

1. Landing page to architecture creation.
2. Long-form utility-product prompt from the start page.
3. Multi-tenant template generation with 15 semantic components and 17 flows.
4. Blank-canvas drawing and annotation.
5. Component search, placement, dragging, resizing, style changes, and layer ordering.
6. Single selection, Shift multi-selection, marquee selection, keyboard nudging, undo, and redo.
7. Port-to-port connections and connector style editing.
8. Automatic layout on a canvas containing both semantic nodes and visual primitives.
9. AI change preview using a realistic cache-insertion request.
10. Architecture review, documentation generation, document editing, AI drafting, copy, and export.
11. Guest save gate, sign-in routing, local drafts, and dashboard navigation.
12. Desktop and mobile automated browser coverage.
13. Unit, type, lint, build, dependency, release-scan, and database-test entry points.

### Architecture scenarios used

#### Scenario A — production URL shortener

The intended system included an API gateway, authentication, URL service, database, cache, asynchronous analytics, rate limiting, observability, backups, and measurable capacity requirements. This scenario was used to test whether a detailed prompt becomes a useful semantic model.

Result: the start journey failed with the generic message `Request validation failed.` The input contract accepts a 3,000-character prompt, but the deterministic compiler copies that complete prompt into one functional-requirement field whose limit is 240 characters.

#### Scenario B — multi-tenant SaaS platform

The architecture used a template-backed 15-node, 17-flow system. It was inspected for hierarchy, edge readability, editing, review quality, documentation quality, and exports.

Result: generation succeeded and the canvas was editable. The result was structurally useful as a starting point, but line crossings, tiny labels, node-title truncation, generic review results, and weak architectural documentation prevented it from being decision-ready.

#### Scenario C — manual incident-support architecture

A blank canvas was used to add a backend service, relational database, shapes, text, a styled connector, and annotations. The connector was changed to curved, dashed, and bidirectional, then undo and redo were tested.

Result: basic creation, movement, resizing, styling, layer order, connector editing, undo, and redo worked. The connection gesture was hard to discover, feedback persisted beyond its relevant mode, and automatic layout placed content underneath bottom controls.

#### Scenario D — architecture change request

The command was: “Insert a Redis cache between the backend service and database, and keep the database as the source of truth.”

Result: the preview reported one added component, but did not show the component name, topology, new flows, removed flows, or whether “between” and “source of truth” were satisfied. Source inspection confirmed that the endpoint recognizes only cache, auth/identity, or queue keywords and otherwise adds observability. It never creates the required flows.

#### Scenario E — architecture handoff

The generated system was reviewed, documented, edited, copied, and exported as structured and visual formats.

Result: the mechanics mostly worked on desktop, but the result was closer to a formatted inventory than an implementation handoff. The document AI prompt is not sent to the server, so “AI draft” appends another complete deterministic document beneath a heading containing the prompt.

## What works today

The audit found meaningful working functionality. These capabilities should be preserved while the gaps are corrected:

- The landing page has a clear visual identity, skip navigation, semantic headings, templates, and a visible start path.
- Blank and template-based diagrams open successfully.
- Semantic nodes can be placed, moved, resized, renamed, styled, and reordered.
- Rectangle, circle, diamond, frame, line, arrow, text, freehand, eraser, and image controls are present; the removed ellipse control is not exposed.
- Text supports size, four font families, bold, italic, underline, and color.
- Arrow primitives support start, end, both-end, and no-head variants plus solid, dashed, and dotted textures.
- Connectors can be created by dragging between ports and can be edited for type, route, texture, direction, label, protocol, authentication, and encryption.
- Marquee and Shift multi-selection work on desktop, as do keyboard nudging, undo, redo, and front/back layer order.
- The component palette supports categories, search, local SVG art where supplied, click-to-place, drag-to-place, detach/dock, and keyboard access.
- The document workspace supports Markdown editing and preview, insertion tools, tables, code blocks, Mermaid source, canvas/node references, images, copy, download, and immutable cloud document versions.
- Guest browser recovery, serialized local writes, same-tab recovery, scoped account recovery, multi-tab conflict preservation, queued cloud saving, and idempotent replay are implemented.
- Architecture IR and presentation are separated, validated, checksummed, and materialized server-side.
- Auth return paths are sanitized and guest migration is designed to retain the local copy until checksum-confirmed readback.
- Database migrations define RLS, immutable version lineage, restore-as-new-head, private artifacts, archive jobs, and notification records.

## Complete journey assessment

| Journey stage | Current health | Evidence and user impact |
| --- | --- | --- |
| 1. Discover the product | Good | The landing page communicates the category and presents templates. The product value still needs a sharper statement about decisions, validation, and handoff—not only drawing. |
| 2. Describe a system | Critical | A valid long prompt can pass the request schema and then fail inside IR construction. Preference chips are flattened into `preferredStack`, so scale, cloud, tenancy, and sensitivity can be lost. |
| 3. Receive a first architecture | Partial | Template generation is fast and deterministic, but detailed prompts can be reduced to a nearest template. The user is not told what came from the request, what was inferred, and what remains unknown. |
| 4. Understand the canvas | Partial | Nodes and typed edges exist, but dense systems have crossings, truncation, tiny labels, weak visual grouping, and no first-class flow/story mode. |
| 5. Edit the architecture | Partial | Desktop movement and selection work. Mode feedback, placement cancellation, toolbar overlap, and per-keystroke history make the workflow feel less predictable than a mature canvas product. |
| 6. Connect components | Partial | Exact port-to-port drag works. Clicking a visible port simply selects the node, and there is no clear “connect from here” affordance, target highlighting, compatibility preview, or invalid-target explanation. |
| 7. Ask for an AI change | Critical | The endpoint is a four-way keyword rule and adds no connecting flows. The preview shows counts rather than the actual semantic/topological change. |
| 8. Review the architecture | Weak | Four deterministic rules check identity, datastore transport encryption, observability, and cache. Findings are not connected to highlighted nodes, ownership, evidence, status changes, or one-click remediation. |
| 9. Write and read documentation | Partial | Editing and formatting are useful. Generated content is generic, AI refinement ignores the prompt, and version/source/provenance are not explained clearly enough for an engineering handoff. |
| 10. Export or share | Partial | PNG, SVG, JSON, Mermaid, and Markdown are available. Scope language is contradictory, success feedback is weak, and exports lack a manifest, checksums, provenance, assumptions, warnings, and version bundle. |
| 11. Save or sign in | Partial, staging unverified | The guest save gate and safe return path are good. Real OAuth/email, private Storage upload, guest migration, and cloud conflict behavior were not exercised against a live staging environment. |
| 12. Return through dashboard | Weak | Local and saved cards open, but thumbnails are identical placeholders and there is no search, sort, rename, duplicate, archive, delete, owner, status, or last-review context. |
| 13. Use on mobile | Critical for claimed parity | The UI says mobile is light-edit only while drawing controls remain visible. Hidden text removes accessible names from top actions, and storage failure is misreported as a missing draft. |
| 14. Recover from failure | Partial | Local recovery and conflict logic are substantial. The unavailable-IndexedDB mobile path failed its browser test, and hosted database/archive recovery remains unverified. |

## Confirmed defects and gaps

Priority meanings:

- **P0** — breaks the core promise, risks data/security integrity, or blocks beta.
- **P1** — serious user friction or reliability/scale risk that must close before a 100–200-user beta.
- **P2** — important quality gap that can follow the first beta gate if clearly disclosed.

### P0 — must fix before beta

#### BRX-AUD-001 — valid long prompts fail in the compiler

The generation request accepts a 3,000-character prompt (`src/lib/domain/schema.ts:143`), while the IR allows 240 characters per functional requirement (`src/lib/architecture-ir/schema.ts:53`). The compiler assigns the whole prompt as one item (`src/lib/architecture-ir/compiler.ts:59`). A realistic detailed prompt therefore fails after request validation. The API then classifies the downstream Zod error as request validation (`src/lib/server/http.ts:22`) and returns a generic message.

Impact: the most valuable users—people describing non-trivial systems—are more likely to fail than users entering a short sentence.

Required correction:

- Convert a long prompt into several bounded requirements, or retain it only as the intent summary and derive separate requirements.
- Validate the complete generated IR contract before entering the provider path.
- Return a field-specific, user-actionable error without returning the raw Zod object.
- Add boundary tests at 239, 240, 241, and 3,000 characters.

#### BRX-AUD-002 — AI change is not an architecture-change engine

`/api/v1/ai/change-plans` chooses cache, identity, queue, or observability from keywords and places one fixed-position node (`src/app/api/v1/ai/change-plans/route.ts:14`). It always returns empty connector changes (`route.ts:24`).

Impact: commands such as “put a cache between service and database,” “remove the queue,” “encrypt this path,” or “split the service” are shown as AI previews but are not executed semantically. Applying the result can leave a disconnected node and reduce trust in the entire product.

Required correction:

- Rename the present control to “Quick add” until a real change planner exists, or implement an IR patch planner.
- Target both diagram and IR base versions.
- Validate node/flow references, compatibility, graph connectivity, and requirement satisfaction.
- Show exact added, changed, and removed nodes and flows before apply.
- Include deterministic tests for insert-between, replace, remove, split, reroute, and no-op commands.

#### BRX-AUD-003 — document AI refinement ignores the user’s prompt

The documentation endpoint has no prompt field and always calls the deterministic document formatter (`src/app/api/v1/ai/documentation/route.ts:10`). The editor submits only diagram/IR/presentation, prepends the prompt as a heading, and appends the full returned document (`src/components/editor/architecture-editor.tsx:1122`).

Impact: the user asks for an RFC section or a refinement and receives a duplicate full document. This is a broken core workflow and misleading product language.

Required correction:

- Separate “Generate baseline from IR” from “AI draft/refine selection.”
- Send the prompt, selected range/block IDs, document version, and pinned IR version.
- Return a bounded patch or block list, not another whole document.
- Preview the patch and preserve undo/version lineage.
- If no model provider is configured, disable AI wording and offer deterministic inserts honestly.

#### BRX-AUD-004 — production request protection is not distributed

The rate limiter uses a process-local `Map` and keys guests from forwarded IP plus a client-supplied session header (`src/lib/server/rate-limit.ts:4`). It has a development fallback secret and no expired-bucket cleanup.

Impact: limits reset per server instance, can be bypassed by rotating the guest header, and can consume unbounded process memory. This is unsuitable for a horizontally scaled 100–200-user beta.

Required correction:

- Use Redis, Upstash, or another atomic shared store.
- Key authenticated usage by user plus workspace; key guests by a server-issued signed identifier plus IP reputation.
- Enforce per-route, per-user, per-workspace, and global provider budgets.
- Add TTL-based storage, `Retry-After`, observability, and abuse tests across multiple app instances.

#### BRX-AUD-005 — generation receipt can use a known production fallback

The receipt-signing helper falls back to `local-development-receipt-only` when two environment variables are absent (`src/lib/server/generation-receipt.ts:16`).

Impact: a production environment with incomplete configuration could issue and accept receipts signed with a known key, weakening generation provenance.

Required correction:

- Fail production startup when `GENERATION_RECEIPT_SECRET` is missing.
- Keep development fallback behind an explicit non-production guard.
- Rotate any secret previously shared through chat or screenshots and keep the replacement only in server-managed secret storage.
- Add a deployment configuration test and key-rotation strategy.

#### BRX-AUD-006 — staging and load behavior are unproven

No executable k6, Artillery, or equivalent load suite was found. The local pgTAP command could not connect to Supabase at `127.0.0.1:54322`, so migrations and RLS were not re-executed during this audit.

Impact: source design is not evidence that 100–200 simultaneous users can save, generate, migrate, archive, or restore safely.

Required correction:

- Run all migrations and pgTAP tests in a clean staging clone.
- Load-test distributed and same-diagram saves, AI requests, document saves, dashboard listing, and history hydration.
- Measure p50/p95/p99, error rate, connection-pool use, provider concurrency, queue depth, retries, and recovery.
- Do not open beta until the acceptance numbers in the beta section pass.

### P1 — close before inviting users

#### BRX-AUD-007 — onboarding preferences are stored in the wrong field

The start page sends every selected preference as one comma-separated `preferredStack` value (`src/components/start/start-experience.tsx:107`). It does not populate `scale` or `cloudProvider`, and tenancy/sensitivity chips are not converted into their matching constraints.

Impact: “High scale,” “Multi-tenant,” and “Sensitive data” can appear as technologies while the IR still reports unknown traffic and unspecified sensitivity.

Required correction: define typed form state for product type, scale, cloud, tenancy, sensitivity, region/compliance, and stack. Show assumptions for inferred values and require confirmation of high-risk unknowns.

#### BRX-AUD-008 — AI preview hides the actual change

The modal shows only counts for components added, changed, and removed (`src/components/editor/architecture-editor.tsx:1363`). It omits names, flows, warnings by object, layout effects, IR diff, and requirement coverage.

Impact: users cannot review an architectural change responsibly before applying it.

Required correction: provide a side-by-side semantic diff, highlight affected nodes/edges on canvas, show validation results, and explain why the proposal satisfies the command.

#### BRX-AUD-009 — automatic layout ignores screen safe areas

ELK lays out semantic nodes and offsets them only against primitives (`src/lib/domain/layout.ts:26`). It does not know about the toolbar, AI bar, assumptions card, minimap, inspector, or document panel. In the observed mixed-canvas case, nodes were positioned beneath bottom controls.

Impact: a one-click cleanup can make a diagram harder to use and can appear to lose content.

Required correction: reserve viewport-safe regions, treat frames/primitives as layout constraints, route edges after placement, prevent label collisions, and fit only to the usable canvas rectangle.

#### BRX-AUD-010 — connector creation works but is poorly discoverable

The exact drag from a source port to a target port works. A click on a visible handle selects the node, and the UI does not explain the required drag, emphasize valid targets, or display compatibility before release.

Impact: users reasonably conclude that connectors are broken.

Required correction: support click-source/click-target as well as drag, show a rubber-band preview, highlight valid targets and ports, explain invalid targets, increase hit areas, and offer connector creation from the node action menu.

#### BRX-AUD-011 — editor modes and feedback are not one coherent state machine

The 1,374-line editor manages tool, panel, placement, draw draft, selected object, text editing, connector quick-insert, AI expansion, inspector, minimap, messages, and recovery as independent state variables. Messages such as eraser and component placement remain visible after changing tools or opening panels.

Impact: the cursor, active tool, banner, and next click can disagree. These are the exact failures users describe as “pointer not working” or “eraser stays on.”

Required correction: introduce an explicit interaction state machine with mutually exclusive modes, scoped notices with expiry, and defined entry/exit actions. Split canvas, panels, AI, documents, and persistence into testable controllers.

#### BRX-AUD-012 — inspector fields create a history snapshot per keystroke

Node and connector fields call `commit` on every `onChange` (`src/components/editor/architecture-editor.tsx:966` and `:1139`). Each commit stores the complete previous diagram and clears redo (`architecture-editor.tsx:478`).

Impact: typing a node description rapidly consumes the 50-entry undo history and creates needless serialization and version churn in a guest draft.

Required correction: edit locally, commit once on blur/Enter or after a bounded debounce, group related fields into one transaction, and label undo transactions.

#### BRX-AUD-013 — freehand has an avoidable high-frequency rendering path

Every coalesced pointer event clones the complete point array (`architecture-editor.tsx:898`). Every new preview rebuilds semantic and primitive React Flow nodes, maps all preview points, and reconciles rendered nodes using a nested `.find` (`architecture-editor.tsx:177` and `:561`).

Impact: latency and angular/pixelated strokes become more likely as the diagram and stroke grow, especially on lower-end hardware.

Required correction: collect points in a mutable buffer, render a lightweight overlay outside the React Flow node model, decimate/simplify points, commit once on pointer-up, and benchmark input-to-paint latency and dropped frames.

#### BRX-AUD-014 — undo and local recovery copy large full snapshots

Undo retains up to 50 complete `Diagram` values. Local recovery hashes IR, presentation, and the diagram and saves the full canvas plus document on an 800 ms interval (`src/components/editor/editor-recovery.tsx:89`). Guest images may still be base64 until migration.

Impact: large images, long documents, and many strokes can produce high memory, CPU, and IndexedDB pressure.

Required correction: use command/patch history, keep binary data out of diagram snapshots, hash only changed artifacts, add storage quotas, and test large but permitted documents and images.

#### BRX-AUD-015 — mobile action names disappear

At widths below 1,050px, `.topButton span` is hidden (`src/components/editor/editor.module.css:287`). Several icon-only top buttons have no `aria-label` (`architecture-editor.tsx:1261`). The mobile E2E test could not find Docs by role because the button became unnamed.

Impact: screen readers and voice/automation cannot identify important actions; keyboard and touch users lose orientation.

Required correction: add permanent accessible names to every icon-only action, retain tooltips, and run axe plus keyboard and screen-reader smoke tests at mobile widths.

#### BRX-AUD-016 — mobile promises and controls contradict each other

The editor says mobile is for pan, zoom, select, and label editing, but the drawing toolbar remains present (`architecture-editor.tsx:1275`). Top actions are partly hidden and the dense toolbar is horizontally scrollable.

Impact: users see controls that the product explicitly says are unsupported and cannot predict what will work.

Required correction: either make touch drawing/connecting a supported tested journey or hide unsupported controls and provide a focused mobile viewer/light editor.

#### BRX-AUD-017 — unavailable browser storage is reported as a missing draft on mobile

The app contains a specific storage-error state (`src/components/editor/draft-loader.tsx:88`), but the full browser suite observed “This local draft is not available” when IndexedDB opening threw a security error.

Impact: users may believe their work was deleted and are not offered the retry action promised by the recovery design.

Required correction: make storage initialization failures distinguishable from a valid “not found” result, preserve the thrown cause through the IndexedDB wrapper, and cover blocked/private-mode/browser-policy states.

#### BRX-AUD-018 — architecture review is too narrow and not actionable

The semantic reviewer contains four fixed checks (`src/lib/ai/provider.ts:54`). The UI renders rationale and recommendation but does not use `affectedObjects` to highlight the graph or `status` to manage workflow.

Impact: “Review” sounds like an architecture assessment but misses authorization boundaries, public exposure, secrets, retention, failure modes, cycles, single points of failure, capacity, cost, compliance, and operational ownership.

Required correction: clearly label deterministic policy checks, add a rule registry with evidence, severity confidence, standards mapping, suppress/accept states, owner, due date, and canvas navigation. Add model-assisted review only as a separately labeled proposal layer.

#### BRX-AUD-019 — generated documentation is not implementation-ready

The document generator produces component and flow lists plus repeated generic paragraphs (`src/lib/ai/provider.ts:89`). It does not derive API contracts, trust zones, data ownership, consistency, capacity, SLOs, RTO/RPO, failure behavior, deployment, cost, threat model, or decision consequences.

Impact: senior architects cannot use the output as an RFC, ADR set, review packet, or engineering handoff without substantial rewriting.

Required correction: generate structured sections from typed IR fields, mark unknowns explicitly, and never invent metrics. Add document templates for HLD, RFC, ADR, security review, capacity plan, and runbook.

#### BRX-AUD-020 — dashboard does not manage an architecture portfolio

Every project/draft card renders the same empty thumbnail element (`src/components/dashboard/dashboard-client.tsx:39` and `:45`). The dashboard has no search, sorting, rename, duplicate, archive, delete, owner, environment, last review, document status, or activity.

Impact: after a few projects, returning users cannot locate or govern their work efficiently.

Required correction: provide real generated previews, recent activity, project actions, filtering, ownership/access cues, health/review status, and safe deletion/archive flows.

#### BRX-AUD-021 — operational telemetry is optional and silent

Generation audit recording catches every error without reporting it (`src/lib/server/ai-runs.ts:17`). Sentry variables exist in `.env.example`, but no runtime Sentry integration was found. Turnstile variables also exist without an integration.

Impact: the app can serve results while silently losing the audit trail needed to understand failures, costs, abuse, and latency.

Required correction: keep generation available when telemetry fails, but emit a metric/log and alert. Add request correlation across browser, API, provider, database RPC, version, archive job, and notification delivery.

#### BRX-AUD-022 — browser and database release gates are inconsistent

The local `npm run release:check` runs scan, lint, typecheck, unit tests, and build, but not E2E or pgTAP (`package.json:18`). GitHub workflows do run Chromium and database jobs separately, but they do not run the mobile Playwright project.

Impact: a developer can see a successful local release check while the mobile journey or database is broken; CI can miss mobile regressions.

Required correction: introduce one aggregate beta command that runs unit, build, desktop E2E, mobile E2E, database tests, security checks, and load-smoke prerequisites, while keeping smaller commands for development speed.

### P2 — quality and maturity improvements

#### BRX-AUD-023 — export scope and confirmation are unclear

The panel says guest exports contain “only the diagram model and visible content,” while JSON, Mermaid, and Markdown are described as a validated semantic model. Download actions have no strong completion state and no version manifest.

Required correction: group visual exports and semantic exports, state exactly what each contains, and offer an architecture package with IR, presentation, document, checksums, version metadata, warnings, and assets.

#### BRX-AUD-024 — dense graph readability is below architecture-review quality

Observed complex diagrams included crossings, overlapping routes, tiny connector labels, truncated node titles, weak grouping, and low-contrast edges in light mode.

Required correction: add hierarchical frames/swimlanes, collapsible groups, focus mode, path highlighting, edge bundling/avoidance, label collision handling, semantic zoom, and scenario overlays.

#### BRX-AUD-025 — selection lacks productivity actions

Marquee selection works, but there is no visible selected count or align, distribute, group, lock, duplicate-as-group, style-as-group, or frame-selection action.

Required correction: show a contextual multi-selection bar and preserve selections while applying batch actions.

#### BRX-AUD-026 — component palette shortcut behavior can leak into search

The single-letter `N` shortcut opens/closes the palette (`architecture-editor.tsx:636`) while the palette search gains focus. In the observed journey, the opening key appeared in the search, and previous search text remained when reopening.

Required correction: use the documented Ctrl/Cmd+K command palette shortcut consistently, clear or preserve query deliberately, and prevent the initiating key event from becoming input.

#### BRX-AUD-027 — notifications are persistent global strings

The editor renders one clickable status string for many unrelated actions (`architecture-editor.tsx:1360`) without severity, expiry, ownership, or action scoping.

Required correction: use typed transient toasts for success, persistent banners for data-risk states, inline validation for field errors, and tool-mode hints attached to the active tool.

#### BRX-AUD-028 — canvas accessibility is incomplete

Nodes and ports have some labels, but complete keyboard creation, connection, reordering, group movement, and review-navigation paths are absent. Critical information is often encoded through color, and 10px labels are common.

Required correction: publish a keyboard model, add roving focus and connection dialogs, announce selection and operation results, meet contrast and text-size targets, trap/restore focus in modals, and automate axe checks.

#### BRX-AUD-029 — CSP still permits inline scripts

Production CSP includes `script-src 'self' 'unsafe-inline'` (`next.config.ts:21`).

Required correction: move toward nonces or hashes and verify that application dependencies work under the stricter policy. This is defense-in-depth rather than evidence of a current exploit.

## Frontend architecture gaps

The frontend’s main risk is not React Flow itself. The risk is that one large component coordinates almost every product concern.

`architecture-editor.tsx` is 1,374 lines and owns:

- graph rendering;
- tool modes;
- pointer/drawing behavior;
- node and connector editing;
- component palette behavior;
- AI changes;
- review;
- documentation;
- export;
- project switching;
- history and restore;
- sharing;
- local recovery;
- cloud saving; and
- global feedback.

This produces mode collisions and makes small changes risky. A healthier shape is:

1. `EditorShell` for routing, panels, and responsive layout.
2. `CanvasController` for the explicit interaction state machine.
3. `DiagramCommandBus` for undoable semantic and presentation commands.
4. `SelectionController` for single, multi, marquee, and keyboard selection.
5. `ConnectorController` for source/target/compatibility/preview state.
6. `DocumentWorkspace` with block/selection-aware commands.
7. `ReviewWorkspace` with finding lifecycle and canvas linking.
8. `PersistenceCoordinator` for local recovery and cloud version state.
9. `NotificationCenter` for typed, scoped feedback.

The important change is not folder structure. Every user action should become one explicit command with one undo boundary, one semantic/presentation classification, and one persistence result.

## Backend assessment

### Strong backend foundations

- IR and presentation have strict schemas and size limits.
- Server materialization prevents the browser from claiming an inconsistent diagram.
- Stable checksums provide integrity across database and Storage.
- Diagram and IR base versions support optimistic conflicts.
- Idempotency records prevent duplicate version creation.
- RLS derives access through workspace/project/diagram relationships.
- Browser clients are separated from service-role maintenance operations.
- Version history is immutable and restoration creates a new head.
- Guest migration is designed as an atomic, checksum-verified operation.
- Private image references replace persisted base64 data.
- Archive/rehydration, notification outbox, leases, retries, and release verification exist in migrations/source.

### Backend gaps before beta

1. **No staging proof.** The database suite did not run locally in this audit, and hosted migration/RLS/auth/Storage paths were not exercised.
2. **No distributed rate limiting or quota ledger.** The present process-local limiter is not safe across replicas.
3. **No production load evidence.** README targets exist, but there is no executable load suite or published result.
4. **No durable AI job control.** Synchronous generation has a 30-second route limit, but there is no shared queue, admission control, cancellation, or provider-capacity governor for bursts.
5. **No complete runtime observability.** There is no verified error tracking, distributed tracing, provider-cost dashboard, or alerting path.
6. **Known-key production fallback.** Generation receipt signing must fail closed in production.
7. **AI features are inconsistent.** Generation can use OpenAI, while review, change plans, and documentation are deterministic even when labeled AI.
8. **Audit insertion is best-effort without a failure signal.** This protects availability but can silently remove traceability.
9. **Operational dependencies remain unverified.** Supabase Storage, OAuth/email providers, Resend, archive scheduler, and hydration need staging evidence.
10. **No tested retention/deletion/privacy workflow for beta users.** Archival exists, but workspace export, account deletion, data erasure rules, and support access need product policies and tests.

## What a senior architect expects this product to do

BuildRAX should not compete only as a drawing tool. A senior architect already has draw.io, Excalidraw, Mermaid, and cloud-vendor diagrammers. The differentiated product should turn intent into an explainable, reviewable architecture decision system.

### Core job to be done

“Help me move from an incomplete system idea to a versioned architecture that my engineers, security team, and stakeholders can understand, challenge, and implement.”

### Product hypotheses worth testing

#### Hypothesis 1 — structured intent beats one large prompt

Users will get better first results when BuildRAX asks for product type, actors, critical journeys, scale, regions, data sensitivity, compliance, availability, latency, budget, existing systems, and preferred stack as typed inputs. Free text should add context, not carry the entire contract.

#### Hypothesis 2 — one semantic model should support several views

The same IR should produce context, container, component, deployment, data-flow, sequence, trust-boundary, and failure-mode views. Users should not manually redraw the same architecture for each audience.

#### Hypothesis 3 — scenarios make diagrams useful

Clicking “User signs in,” “Request succeeds,” “Database is unavailable,” or “Traffic spikes 10x” should animate/highlight the relevant path, assumptions, policies, queues, retries, and failure outcomes.

#### Hypothesis 4 — unknowns are more valuable than invented certainty

The tool should mark unknown traffic, RTO, RPO, consistency, data retention, owner, and cost rather than filling them with generic prose. A completeness score should be based on confirmed facts, not diagram density.

#### Hypothesis 5 — review findings must be part of work

A finding should have evidence, affected objects, severity, confidence, owner, status, decision, and resolution. Accepted risk and false-positive suppression should be versioned.

#### Hypothesis 6 — documents should be derived but editable

IR-backed sections should stay synchronized, while authored decisions remain stable. Users need to see which blocks are live, pinned, stale, AI-proposed, or manually written.

#### Hypothesis 7 — web SaaS first, companion skill later

For beta, BuildRAX should remain an online SaaS because collaboration, durable history, access control, reviews, exports, and shared views require a trusted service. A local IDE/Codex skill can later collect repository facts, propose IR patches, and keep BuildRAX close to the user’s code. The skill should be a companion to the canonical SaaS workspace, not a second source of truth.

### Capabilities needed for an architecture-grade beta

- Typed requirements and constraint intake.
- Provenance for user facts, inferred assumptions, imported evidence, and AI proposals.
- Multiple synchronized views from one IR.
- Scenario/path visualization.
- Trust zones, data classification, and policy validation.
- Capacity estimates with explicit formulas and assumptions.
- SLO, latency-budget, RTO, and RPO modeling.
- Failure-mode and blast-radius analysis.
- ADRs with status, alternatives, consequences, and linked objects.
- Version comparison and semantic diff.
- Comments, mentions, reviewer roles, and approval state.
- Imports from Mermaid/OpenAPI/Terraform/Kubernetes/cloud inventories where authorized.
- Export packages for engineering, security, and stakeholder audiences.
- Real project lifecycle and portfolio navigation.

## Beta architecture for 100–200 simultaneous users

### Request path

1. Browser authenticates through Supabase PKCE or receives a server-signed guest identity.
2. Edge/API gateway applies request size, origin, authentication, and distributed rate limits.
3. Application route validates the typed contract and creates a request ID.
4. Fast deterministic compilation executes inline.
5. Model-backed work enters a shared admission controller or queue when provider capacity is saturated.
6. The provider returns an IR proposal only.
7. The trusted server attaches provenance, validates, compiles, checksums, and stores the result.
8. Browser receives progress and a final immutable version reference.

### Scaling controls

- Shared Redis rate-limit and idempotency keys.
- Per-user and per-workspace generation quotas.
- Global provider concurrency ceiling and circuit breaker.
- Separate pools/queues for interactive generation, document refinement, review, and maintenance.
- Coalesced diagram autosaves; semantic edits and layout edits remain classified separately.
- Supabase connection pooling with measured limits.
- Backpressure instead of unbounded parallel provider calls.
- Bounded retry with jitter and the same idempotency key.
- Short-lived cached deterministic results keyed by normalized intent and template version where privacy policy permits.
- SSE progress for requests that cannot reliably complete in one 5–10-second response.

### Latency plan for a 5–10-second common path

- Keep validation, template retrieval, and deterministic baseline generation below 200 ms.
- Request compact IR, not prose or rendered diagrams, from the model.
- Pin a low-latency model for first drafts and reserve a larger model for explicit deep review.
- Stream or expose progress after 500–800 ms.
- Run independent validation and layout steps concurrently when safe.
- Reuse deterministic templates and catalog data without model calls.
- Cache only non-sensitive, normalized template work; never cross tenant boundaries.
- Do document and review expansion after the first useful canvas is visible.
- Measure each stage separately: queue, provider first token, provider completion, validation, compile, persistence, and client render.

### Beta acceptance targets

These are proposed release gates, not current measured results:

- 100 concurrent saves across different diagrams: under 500 ms p95, under 1% errors, zero lost or duplicate versions.
- 20 concurrent saves to the same diagram: one valid base wins; all stale callers receive deterministic conflicts; zero silent overwrites.
- 100 simultaneous first-draft requests: admission control remains bounded, no process crash, no database-pool exhaustion, and truthful queue status.
- Common deterministic/template draft: under 2 seconds p95.
- Common model-backed first draft: under 10 seconds p95, excluding explicitly queued overload periods.
- Browser local save: visual confirmation within 1 second for supported payload sizes.
- Cloud save: under 1 second p95 after the idle window.
- History list: under 500 ms p95 for 100 versions.
- Archived hydration: under 3 seconds p95 for permitted artifact sizes.
- Availability during a beta window: at least 99.5%, with an incident and rollback procedure.
- Zero cross-tenant reads/writes in pgTAP and API authorization tests.
- Zero known P0/P1 security defects.

## Recommended correction sequence

### Gate 0 — product truth and contract correctness

Estimated engineering effort: 2–4 focused days.

- Fix the long-prompt contract.
- Map onboarding preferences into typed IR constraints.
- Relabel deterministic actions or implement real prompt-aware AI behavior.
- Replace count-only change preview with a semantic/topological diff.
- Add truthful provider/mode labels in the UI.

Exit: a complex prompt creates a connected architecture, and every AI-labeled input demonstrably affects its result.

### Gate 1 — reliable editor interaction

Estimated engineering effort: 4–6 focused days.

- Introduce the interaction state machine.
- Correct mode-scoped feedback and cancellation.
- Add click-to-connect plus target highlighting.
- Make auto-layout viewport-safe and mixed-content aware.
- Group inspector editing into transactions.
- Move freehand preview off the React Flow node model.
- Add batch selection actions and keyboard coverage.

Exit: the architecture can be created and edited for 30 minutes without mode confusion, hidden objects, input lag, or unexpected undo behavior.

### Gate 2 — architect-grade review and documentation

Estimated engineering effort: 5–8 focused days.

- Separate deterministic baseline docs, AI drafting, and inline refinement.
- Add typed NFR, data, trust, failure, capacity, and decision sections.
- Make findings navigable, assignable, suppressible, and versioned.
- Add live/stale/pinned status to document embeds.
- Clarify export scopes and add an architecture package.

Exit: a reviewer can move from finding to affected path to documented decision and export a coherent handoff.

### Gate 3 — staging security and scale

Estimated engineering effort: 4–7 focused days plus environment access.

- Replace the in-memory limiter.
- Fail closed on missing production secrets.
- Integrate telemetry and abuse controls.
- Apply migrations to a clean staging environment.
- Exercise OAuth/email, private assets, guest migration, conflict recovery, history, archive, and restore.
- Add and run load/failure tests.

Exit: staging meets the beta acceptance targets with dashboards and rollback tested.

### Gate 4 — beta usability and operations

Estimated engineering effort: 3–5 focused days.

- Fix mobile accessible names and choose a truthful mobile scope.
- Add dashboard project management and real previews.
- Add feedback/report-problem flow and support diagnostics.
- Document data retention, deletion, support access, and incident response.
- Invite a small internal cohort before expanding to 100–200 users.

Exit: support can identify a request, recover work, revoke access, and explain product limitations without reading private architecture content.

## Verification results from this audit

| Check | Result | Interpretation |
| --- | --- | --- |
| `npm run release:scan` | Passed | Required migration/configuration/source scans passed. |
| `npm run lint` | Passed | No lint failures. |
| `npm run typecheck` | Passed | Type contracts compiled. |
| `npm test` | 80 passed | Unit/component/API fixtures passed. |
| `npm run build` | Passed | Production build completed with 24 routes. |
| `npm audit --omit=dev` | Passed, 0 production vulnerabilities | No known production dependency advisory was reported at audit time. |
| Full Playwright suite | 35 passed, 14 skipped, 3 failed | Desktop core journeys were substantially healthy; all three failures were in the mobile project. |
| Mobile sign-in journey | Failed | Test expects visible Sign in; responsive design moves it behind the menu. Test and intended mobile journey are misaligned. |
| Mobile document recovery journey | Failed | Docs action lost its accessible name when text was visually hidden. |
| Mobile unavailable-storage journey | Failed | Storage failure appeared as missing draft instead of an actionable storage error. |
| `npm run db:test` | Environment-blocked | No local Supabase database was reachable at `127.0.0.1:54322`; database behavior was not re-proven. |
| Load test | Not present/run | Capacity for 100–200 simultaneous users is unproven. |

## Release decision checklist

Do not call the beta ready until all of the following are true:

- [ ] Long detailed prompts create valid IR and connected diagrams.
- [ ] Every AI-labeled command is prompt-aware or honestly relabeled.
- [ ] Architecture-change preview shows exact nodes, flows, assumptions, and warnings.
- [ ] Document refinement changes only the requested scope and does not duplicate the document.
- [ ] Mobile navigation and editor controls retain accessible names.
- [ ] Blocked IndexedDB produces an actionable error and recovery path.
- [ ] Connector creation is discoverable without prior instruction.
- [ ] Auto-layout never places content beneath interface controls.
- [ ] Freehand meets an agreed frame/input-latency budget on low-end hardware.
- [ ] Distributed limits, quotas, and provider admission control are deployed.
- [ ] Production secrets fail closed and previously exposed secrets are rotated.
- [ ] Sentry/OpenTelemetry-equivalent monitoring and alerts are verified.
- [ ] Clean staging migrations and the complete pgTAP/RLS suite pass.
- [ ] OAuth/email, guest migration, assets, conflicts, history, archive, and restore pass end to end.
- [ ] 100-user save and generation load tests meet the published targets.
- [ ] No P0/P1 security or data-loss issue remains open.

## Evidence limits

- The audit did not alter or delete the user’s existing drafts.
- It used an isolated local draft for destructive interaction checks.
- A real external account was not used, so hosted OAuth, email, and private Storage behavior remain unverified rather than classified as broken.
- The local database was unavailable, so migrations were inspected in source but not executed during this audit.
- No production or staging environment was touched.
- Freehand was covered by browser automation and source inspection; precise frame timing still needs a dedicated performance trace on representative hardware.

## Final product recommendation

BuildRAX should position itself as an **architecture decision workspace**, not as an AI drawing canvas. Keep the deterministic compiler and semantic IR—they are valuable. Make deterministic behavior explicit, use AI only for bounded proposals and synthesis, and require every proposal to survive the same server-side semantic checks as a manual edit. The fastest path to a credible beta is to fix truthfulness, prompt contracts, connector/layout predictability, document refinement, and staging scale proof before expanding the component catalog or adding more visual tools.
