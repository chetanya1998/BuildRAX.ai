# BuildRAX architecture intelligence — executable delivery plan

Planning baseline: 13 September 2026. Branch: `fresh-variant`.

This document breaks the supplied Detailed Codex Implementation Specification into 34 bounded implementation chunks. It plans work; it does not mark any new capability implemented. The attachment provides desired behavior; current source, tests and migrations establish actual status.

## Delivery principles

- Extend existing IR, compiler, providers, React Flow, ELK, document history, persistence and RLS. Do not create competing models or rewrite the app.
- AI interprets ambiguity; deterministic code parses, validates, calculates, lays out, compares and commits.
- Evidence, requirements, architecture and presentation stay distinct, with immutable version links.
- Source text/files are untrusted content. They cannot change tool permissions or instructions.
- A suggestion does not prove a fact. Unknown remains unknown.
- User-approved changes follow validation → comparison → preview → apply → immutable version.
- No repository checkout, package script, uploaded executable or macro is executed during ingestion.

## Existing work to retain

The repository includes recovery-writer and cloud-save coordinator modules, sanitized auth return paths, signed-in creation, complete guest migration, conflict recovery, canvas interaction fixes, document/version infrastructure and release notes. Progress records and the September 12 audit differ on some completion details; B00 must reconcile them against the current implementation.

Retain these systems and add regression checks at integration boundaries. Do not restart the earlier Day 1–4 plan. Current staging/pgTAP claims must be checked independently; tests recorded in a handoff are not a new passing run.

Existing reference documents:
- [User journey progress](USER-JOURNEY-PROGRESS.md)
- [Product and beta audit](PRODUCT-AND-BETA-AUDIT-2026-09-12.md)
- [Two-week beta plan](TWO-WEEK-BETA-EXECUTION-PLAN.md)

Those documents remain intact. This plan covers the larger intelligence specification and supersedes their scheduling only for this expanded scope.

## Session and token discipline

1. Ask for one chunk by ID, for example: `Implement B01 only using docs/ARCHITECTURE-INTELLIGENCE-EXECUTION-PLAN.md.`
2. Read that chunk, its dependency handoffs and only relevant source. Confirm git status before edits.
3. Verify prerequisites rather than assuming previously discussed work exists.
4. Implement one complete behavior and focused tests. Reuse existing modules and test fixtures.
5. If a chunk has separate independently shippable changes, split it into suffixes (B07a/B07b), record the boundary, and finish the active suffix. Never report an incomplete parent as done.
6. Finish with changed behavior, test evidence, unresolved risk and the exact next command.
7. Update a compact progress section in this document during implementation. Do not reread the full original attachment on every session.
8. Run focused tests plus required repository checks; run broad E2E/DB checks when a migration or milestone warrants them. Do not suppress required security checks to save tokens.
9. Commit/push/deploy follow the user's explicit instructions for that session; completing a chunk does not automatically authorize a production rollout.

A token estimate cannot be guaranteed. Smaller scopes and stored handoffs reduce repeated exploration. The application's AI context budgets are separate from implementation-session token usage.

## Scheduling

This is a multi-milestone expansion, not a credible seven-day delivery for one implementer. Use one chunk as the default daily work package, or complete two genuinely small chunks in a day. Worker deployment, parsing and live integration chunks may need several sessions. At one chunk per working day, 34 chunks represent about seven working weeks before external delays; this is a scheduling model, not a delivery promise.

Do not wait for every milestone to demonstrate value:
- Core private demo: B00–B08, F01–F03, R01–R02, C01–C02 and D01–D02, with their prerequisites.
- Public core beta additionally requires O01, applicable F04/O03 checks, passing database/staging validation and no critical defects. GitHub/document features stay hidden until their own gates pass.
- Document-input release: add I01–I02.
- Repository release: add H01–H04 and shared-view privacy checks.
- Full specified release: complete all chunks.

O01 must be pulled forward before public traffic. Baseline request IDs, timing and configuration validation start in B06/B07; O03 verifies end-to-end operations rather than introducing monitoring at the end.

## Daywise implementation schedule

This schedule covers all 34 chunks exactly once, in dependency order. Day numbers are working packages, not calendar dates. Use one day per implementation session where practical; extend a day into smaller named sessions if its acceptance checks are unfinished. Do not advance dependent work just to keep the calendar moving.

At five working days per week, this is six full weeks plus four working days, before contingency or external setup delays. It is not a guaranteed estimate. Parser integration, resumable workers, database migrations, repository sync, and the final test gate are the most likely to need additional sessions.

O01 is scheduled on Day 9, immediately after the gateway and jobs, so shared limits exist before broader generation traffic.

| Day | Chunk | Focus | Required daily result |
| --- | --- | --- | --- |
| 1 | B00 | Verify current implementation | Confirm working features, open defects, test baseline, and staging gaps. |
| 2 | B01 | Fix long prompts and creation inputs | Accept supported long descriptions; retain input; preserve separate scale, cloud, tenancy, sensitivity, and stack fields. |
| 3 | B02 | Define Evidence and Requirement IR | Validate structured requirements, evidence locations, stable IDs, uncertainty, and provenance. |
| 4 | B03 | Persist evidence and requirements | Link new artifacts to existing immutable versions; preserve old snapshots and tenant isolation. |
| 5 | B04 | Build context reduction and token budgets | Produce task-specific, traceable ContextPacks within configurable budgets. |
| 6 | B05 | Build rules and reusable patterns | Convert existing templates and add tested proposal-only rules without direct mutation. |
| 7 | B06 | Unify AI access | Centralize task contracts, validation, cancellation, timeouts, usage metrics, and configuration checks. |
| 8 | B07 | Implement resumable generation jobs | Persist real stage progress; support cancel/retry; recover without repeating completed stages. |
| 9 | O01 | Add shared limits and concurrency control | Enforce signed guest identities, shared limits, bounded provider capacity, queue admission, and Retry-After. |
| 10 | B08 | Connect the generation experience | Run input through requirements, rules, optional AI, validation, layout, and saving with truthful progress. |
| 11 | F01 | Correct canvas interaction states | Make pointer, pan, connect, place, text, drawing, shortcuts, and mode feedback mutually consistent. |
| 12 | F02 | Improve layout and readability | Keep nodes clear of controls; preserve manual placement; improve labels, grouping, and edge routing. |
| 13 | F03 | Improve drawing and edit performance | Buffer freehand input, reduce unnecessary renders, and group field edits into undoable transactions. |
| 14 | G01 | Build the graph engine | Test traversal, dependencies, bounded paths, cycles, orphans, and impact calculations without AI. |
| 15 | G02 | Implement Explore and route tracing | Add upstream/downstream focus, route probe, evidence inspector, unified search, and reset. |
| 16 | G03 | Add scenarios and flow playback | Save validated scenarios; provide play, pause, step, restart, and exit without model calls. |
| 17 | G04 | Add structural failure simulation | Show affected dependents and scenarios with evidence-aware alternate paths and explicit unknowns. |
| 18 | R01 | Improve validation and findings | Add version-aware rules, stable findings, coverage, and categorical architecture health. |
| 19 | R02 | Build actionable Review mode | Focus affected objects; show evidence; persist risk acceptance/ignore and verified resolution. |
| 20 | C01 | Build semantic operations and comparison | Validate six operation types and create one semantic diff engine with separate visual differences. |
| 21 | C02 | Implement safe architecture changes | Show Before/Delta/After; reject stale previews; explicitly apply one validated version. |
| 22 | C03 | Improve history and shared comparison | Open/compare/restore versions safely and reuse the comparison model in read-only journeys. |
| 23 | D01 | Improve generated and editable documents | Derive useful sections from IR and evidence while preserving user edits and section freshness. |
| 24 | D02 | Implement scoped AI refinement | Preview selected-text patches and audience explanations without replacing unrelated content. |
| 25 | I01 | Build the document parser boundary | Parse local PDF/DOCX/Markdown fixtures with source locations, private caching, limits, and clear failures. |
| 26 | I02 | Connect document upload to generation | Show real upload/parse/extraction stages and resume synthesis without another upload or parse. |
| 27 | H01 | Build repository fixture analysis | Extract routes, services, data stores, jobs, and dependencies deterministically without executing source. |
| 28 | H02 | Connect the GitHub App | Authorize read-only repository access separately from login; select repo/branch and pin the commit. |
| 29 | H03 | Generate from repository evidence | Show scan summary, compile grouped architecture, and expose permitted commit-pinned evidence. |
| 30 | H04 | Implement incremental sync and drift | Reparse changed files; preview changes; apply approved updates while retaining last-good architecture. |
| 31 | V01 | Add architecture views | Derive System, Data Flow, Sequence, Deployment, Security, and Failure views from one IR. |
| 32 | O02 | Improve dashboard and read-only sharing | Add real thumbnails, search/sort, available health/source information, and permission-safe actions. |
| 33 | F04 | Finish frontend navigation and recovery | Preserve workspace context; finish error/loading states, keyboard accessibility, and supported responsive behavior. |
| 34 | O03 | Complete integrated release validation | Run beta:check, all end-to-end scenarios, database/security checks, measured load tests, and staging recovery drills. |

### Weekly outcomes

- **Week 1 / Days 1–5:** reliable inputs, evidence/requirement contracts, persistence links, and context budgets.
- **Week 2 / Days 6–10:** reusable architecture knowledge and bounded, resumable generation.
- **Week 3 / Days 11–15:** predictable canvas editing, better layout/performance, graph exploration.
- **Week 4 / Days 16–20:** scenario playback, structural failure analysis, review findings, semantic operations/diff.
- **Week 5 / Days 21–25:** approved changes, history, useful documents, and document-parser foundation.
- **Week 6 / Days 26–30:** document generation, repository evidence, GitHub connection, incremental sync.
- **Week 7 / Days 31–34:** derived views, dashboard, frontend-wide corrections, final release proof.

### Daily execution and handoff

1. Read the day's chunk card below and the latest dependency handoff.
2. Implement its listed behavior using existing infrastructure.
3. Run focused unit/contract tests; add browser checks for UI changes and database/RLS tests for persistence changes.
4. Fix failures introduced by the day's work before marking it complete.
5. Record changed files, actual tests/results, known limits, and the next day in the handoff.
6. Keep production deployment separate from completing local work.

Days 10, 15, 22, 26, and 30 are integration checkpoints: also exercise the full journey completed at that milestone. Day 34 is the complete release gate. Missing credentials or an unavailable database test environment must be recorded as unverified, never passed.

### External preparation

- Before **Day 4**: have an isolated database test path available; hosted staging changes require the designated environment and recovery point.
- Before **Day 9**: prepare the staging Redis-compatible service. Local development uses the adapter's controlled test setup.
- Before **Day 25**: confirm a runtime capable of hosting the isolated document parser and private source storage. Local fixture development can proceed before deployment.
- Before **Day 28**: create/configure the GitHub App, approved callback URL and protected installation credentials.
- Before **Day 34**: prepare staging provider credentials, representative datasets, monitoring and a backup/restore path.

### Commands for future sessions

Start with: `Implement Day 1 (B00) only from docs/ARCHITECTURE-INTELLIGENCE-EXECUTION-PLAN.md.`

For a later day: `Implement Day 12 (F02) only. Read its dependency handoff, run focused checks, and update progress.`

A partially finished day should be resumed with: `Continue Day 12 from the recorded handoff.`

## Chunk cards

Each card defines its input dependencies, implementation scope and executable exit condition. All statuses start as **Not started** until verified work is recorded.

## Milestone 1 — Reliable structured generation

### B00 — Verify the current baseline

**Depends on:** None.  
**Status:** Verified locally on 16 September 2026. See [Day 01 baseline verification](DAY-01-BASELINE-VERIFICATION.md). Production verification is not claimed.

**Implement:** Read current progress, inspect the audit findings, and run focused reproductions. Record each existing capability as verified, regression, incomplete, or staging-unverified. Resolve conflicting progress notes from source and tests.

**Done when:** A baseline checklist links each retained subsystem and open defect to code/tests; no completed recovery or persistence system is scheduled for replacement.

### B01 — Fix long descriptions and structured input

**Depends on:** B00.  
**Status:** Implemented and verified locally on 16 September 2026 in `feat/b01-structured-input`. See [Day 02 structured input](DAY-02-STRUCTURED-INPUT.md). Merge, deployment, and production verification are not claimed.

**Implement:** Separate raw description from bounded requirement fields. Preserve input on errors. Pass cloud, stack, scale, tenancy, and sensitivity as separate optional values. Report the failing stage.

**Done when:** Boundary tests at 239/240/241/3,000 characters pass; unsupported inputs explain the problem; no invented requirement fills an unknown.

### B02 — Define Evidence IR and Requirement IR

**Depends on:** B01.  
**Status:** Implemented and verified locally on 16 September 2026 in `feat/b02-evidence-requirement-ir`. See [Day 03 Evidence IR and Requirement IR](DAY-03-EVIDENCE-REQUIREMENT-IR.md). Persistence, deployment, and production verification are not claimed.

**Implement:** Add versioned Zod contracts, stable IDs, evidence locations, verification labels, unknowns, and confidence bounds. Keep existing catalog types. Explicit user statements remain user-provided; detected code evidence is verified only within detector scope.

**Done when:** Contracts reject AI-labelled verified facts and broken references. Fixtures cover missing values, conflicts, confidence bounds, and long requirement extraction.

### B03 — Persist and link the new representations

**Depends on:** B02.  
**Status:** Merged to `main` on 21 September 2026 from `feat/b03-persist-traceability`; application and database/RLS CI passed. See [Day 04 persisted traceability](DAY-04-PERSISTED-TRACEABILITY.md).

**Implement:** Extend the existing artifact/version graph with immutable evidence and requirement references. Migrate older IR through adapters without inventing evidence. Add component/flow references and presentation override metadata only where needed.

**Done when:** Save/load/checksum round trips and RLS tests pass; old snapshots remain readable; semantic references survive a new version.

### B04 — Build the Context Compiler and budget manager

**Depends on:** B02.  
**Status:** Merged to `main` on 21 September 2026 from `feat/b04-context-compiler`; application and CI checks passed. See [Day 05 Context Compiler](DAY-05-CONTEXT-COMPILER.md).

**Implement:** Normalize and deduplicate text; preserve sections, tables, code and source locations. Rank context by task. Add configurable input/output budgets and omitted-reference metadata. Budget rules include prompt/schema overhead.

**Done when:** Verbose and dense fixtures remain traceable; budgets are respected without silently dropping mandatory constraints. Start with the specification's task budgets as configurable defaults.

### B05 — Create rule and pattern registries

**Depends on:** B02.  
**Status:** Merged to `main` on 21 September 2026 from `feat/b05-rule-pattern-registries`; application and CI checks passed. See [Day 06 rule and pattern registries](DAY-06-RULE-PATTERN-REGISTRIES.md).

**Implement:** Convert existing templates into versioned pattern definitions. Implement proposal-only rules for files, jobs, repeated reads, public APIs, critical external dependencies, queues, sensitive data and static delivery. Expand toward the 12 requested patterns after migrating existing ones.

**Done when:** Rules do not mutate IR; match/no-match/conflicting matches are tested; existing templates still compile and explicit constraints take precedence.

### B06 — Consolidate the AI gateway

**Depends on:** B04.  
**Status:** Merged to `main` on 21 September 2026 from `feat/b06-controlled-ai-gateway`; application and CI checks passed. See [Day 07 controlled AI gateway](DAY-07-CONTROLLED-AI-GATEWAY.md).

**Implement:** Wrap the existing provider behind task contracts. Centralize structured output, timeouts, bounded retry, cancellation, token/cost metadata and request IDs. Add production configuration validation and deterministic no-key behavior.

**Done when:** No route creates a competing provider client; invalid output fails safely; missing production signing secrets fail closed; tests make no paid calls.

### B07 — Add resumable generation jobs

**Depends on:** B03, B06.  
**Status:** Merged to `main` on 22 September 2026 from `feat/b07-resumable-generation-jobs`; application and database/RLS CI passed. See [Day 08 resumable generation jobs](DAY-08-RESUMABLE-GENERATION-JOBS.md).

**Implement:** Use durable PostgreSQL jobs and stage artifacts with leases. Add create/status/cancel/retry APIs. Choose polling first for current hosting; run long work in a bounded worker. Retain valid prior stages and reject stale completions.

**Done when:** Failure after parsing, requirements, synthesis or layout resumes only necessary work. Duplicate workers/cancelled requests cannot publish a second or stale result.

### B08 — Connect the staged prompt pipeline

**Depends on:** B03–B07.  
**Status:** Implemented and application/browser/database CI verified in PR #20 on `feat/b08-complete-generation-workflow`; explicit merge approval is pending. See [Day 10 complete generation workflow](DAY-10-COMPLETE-GENERATION-WORKFLOW.md).

**Implement:** Route prompt/existing architecture through evidence, requirements, context, patterns, rules, optional ambiguity resolution, validation and compilation. Add actual progress, cancel, retry and first-result facts/assumptions/unknowns.

**Done when:** Describe → generate → inspect → save → reload passes. Deterministic paths use zero calls; normal model paths target at most two successful reasoning calls, with repairs counted separately.

## Milestone 2 — Predictable canvas and understanding

### F01 — Unify interaction states and feedback

**Depends on:** B00.  
**Status:** Implemented and locally verified on 26 September 2026 in
`feat/f01-canvas-interaction-states`; see
[Day 11 canvas interaction states](DAY-11-CANVAS-INTERACTION-STATES.md).

**Implement:** Refactor existing editor handlers incrementally into explicit modes and transient tool states. Specify cursor, keyboard ownership, entry/exit cleanup, Escape and pointer cancellation. Separate temporary hints, inline validation, toasts and persistent recovery errors.

**Done when:** One exclusive tool interaction is active; search/text inputs own their keys; changing tools clears stale hints; existing drawing and selection regressions pass.

### F02 — Fix layout and canvas readability

**Depends on:** F01.  
**Status:** Not started.

**Implement:** Pass a measured usable canvas rectangle into existing ELK layout. Preserve manual positions, place new nodes deterministically, and handle group boundaries, labels, routing and panel resize. Keep layout changes undoable.

**Done when:** 15-node and dense fixtures avoid fixed controls at supported desktop/tablet widths; reopen preserves overrides; auto-layout does not modify semantic checksums.

### F03 — Reduce drawing and editing overhead

**Depends on:** F01.  
**Status:** Not started.

**Implement:** Buffer freehand points in a lightweight overlay and commit on pointer-up. Use bounded point reduction, memoized selectors and asset references. Group inspector edits on blur/Enter/debounce. Retain snapshot undo until command migration is justified.

**Done when:** Drawing does not rebuild all semantic nodes per sample; one stroke/field edit is one undo step; image-heavy edits do not repeatedly copy binary payloads.

### G01 — Implement the deterministic graph engine

**Depends on:** B03.  
**Status:** Not started.

**Implement:** Build a typed TypeScript adjacency engine over IR. Provide directed incoming/outgoing, upstream/downstream, dependencies, shortest path, bounded all-path search, cycles, orphans, connected components and impact analysis. Define dependency direction independently of visual arrow direction.

**Done when:** Linear, branching, cyclic, disconnected and bidirectional fixtures pass. All-path queries have depth/path/time limits and report truncation; output contains IDs, never coordinates.

### G02 — Add Explore, route probe and architecture search

**Depends on:** G01, F01.  
**Status:** Not started.

**Implement:** Add read-only Explore interactions, evidence/requirement inspector, upstream/downstream highlighting, reset focus, source/target route probe and unified Cmd/Ctrl+K search. Unknown protocol/security fields remain Unknown.

**Done when:** Explore cannot mutate; search focuses the right object; route results show supported facts and boundaries; all operations make zero AI calls.

## Milestone 3 — Scenarios, review and approved changes

### G03 — Add scenarios and flow playback

**Depends on:** G01, G02.  
**Status:** Not started.

**Implement:** Persist scenario IDs, ordered steps and references in existing versioned IR. Seed scenarios from known patterns. Add picker, play/pause/next/previous/restart/exit, finite pulses and reduced-motion support.

**Done when:** Playback follows valid flow IDs without AI calls; removing a referenced flow marks the scenario invalid; exit clears highlighting. Manual scenario construction is a later enhancement.

### G04 — Add failure impact analysis

**Depends on:** G01, G03.  
**Status:** Not started.

**Implement:** Simulate a selected component's unavailability in temporary state. Calculate dependents, affected scenarios, reachable alternatives and documented resilience gaps. Clearly label the result as structural impact, not measured capacity or outage prediction.

**Done when:** Known failure/alternate-path fixtures pass; traffic direction is not mistaken for dependency direction; no unverified failover is promised; saved architecture stays unchanged.

### R01 — Expand validation, findings and health

**Depends on:** B05, G01.  
**Status:** Not started.

**Implement:** Extend current review checks through a separate validation registry and typed, version-bound findings. Cover authentication, rate limits, timeouts/retries, DLQ strategy, encryption, redundancy, monitoring and graph gaps. Add categorical health and coverage.

**Done when:** Missing evidence yields Unknown/not documented rather than a verified vulnerability claim. Historical findings remain; unchanged finding IDs persist across reviews; resolve requires re-evaluation.

### R02 — Build actionable Review mode

**Depends on:** R01, F01.  
**Status:** Not started.

**Implement:** Group findings by severity/category/component. Focus affected nodes/flows and show evidence, rationale and recommendation. Persist accept-risk/ignore status; recheck for resolution. Add review freshness and honest coverage labels.

**Done when:** Finding interactions are accessible; state is authorized and survives reload; visual-only edits do not mark reviews stale; no unsupported numerical score appears.

### C01 — Implement semantic operations and diff

**Depends on:** B03, G01.  
**Status:** Not started.

**Implement:** Support ADD/REMOVE/UPDATE node and edge operations. Resolve temporary IDs and apply to cloned IR; validate before returning. Build one IR diff and separate presentation diff for future change/history/sync consumers.

**Done when:** Insert-between, remove, update, reroute as edge operations, invalid references, no-op and stale-base tests pass. Future split/merge operations remain excluded.

### C02 — Add Before/Delta/After and safe apply

**Depends on:** C01, B06, F02.  
**Status:** Not started.

**Implement:** Retrieve scoped context for change requests; use deterministic supported commands or gateway proposals. Preview named changes with labels/icons, then explicitly apply through existing atomic save. Bind preview to diagram/IR versions and local revision.

**Done when:** Add Redis between service and database previews exact edges; intervening edits invalidate preview; cancel saves nothing; repeated apply creates one version. Redis is not made the source of truth implicitly.

### C03 — Reuse comparison in history and sharing

**Depends on:** C02.  
**Status:** Not started.

**Implement:** Add compare/open/restore to existing history with author/source metadata when available. Preserve work before restore and create a new head. Use a minimal read-only share shell with Explore/flow/route/docs only as permitted.

**Done when:** Hot/archive comparisons pass; restore is idempotent and conflict-safe; viewers cannot mutate; private repo evidence is excluded unless separately authorized.

## Milestone 4 — Useful documentation and document input

### D01 — Compile useful version-aware documents

**Depends on:** B03, R01, G03.  
**Status:** Not started.

**Implement:** Inspect existing document-save implementation first. Extend it with deterministic sections from requirements, IR, findings, scenarios and decisions; track derived/user-authored/AI-proposed origins and source hashes. Refresh only selected derived sections.

**Done when:** Opening never regenerates user text; unknowns are explicit; semantic changes mark affected derived sections stale; existing immutable document save/recovery remains functional.

### D02 — Implement scoped refinement and explanation

**Depends on:** D01, B06, G02.  
**Status:** Not started.

**Implement:** Send selected block, instruction, source revision and relevant ContextPack. Return bounded document patches with insert/replace/cancel preview. Add cached audience-specific explanation without changing facts; default component inspector remains deterministic.

**Done when:** Prompt reaches the gateway; stale patches fail; cancelling preserves text; no whole-document append masquerades as refinement; normal component selection makes zero AI calls.

### I01 — Add document parser service and fixtures

**Depends on:** B03, B07.  
**Status:** Not started.

**Implement:** Define DocumentParser/ParsedDocument boundaries and a Docling adapter outside Next.js. Support PDF/DOCX plus lightweight Markdown parsing. Preserve pages, sections, tables/code and cache by tenant-scoped content hash plus parser version.

**Done when:** Local fixtures parse with locations; malformed/encrypted/unsupported files return specific errors; quotas/timeouts apply; filenames/archive paths cannot escape isolation; parse uses zero model calls.

### I02 — Connect upload to resumable generation

**Depends on:** I01, B08.  
**Status:** Not started.

**Implement:** Add Upload document entry, private source upload and genuine parse/extract/generate progress. Convert sections into Evidence and Requirement IR using the shared pipeline. Retain parse output on downstream failure.

**Done when:** Upload → requirements → architecture passes; repeat content reuses authorized cache; failed synthesis never reuploads/reparses; original source is absent from analytics.

## Milestone 5 — Repository evidence and synchronization

### H01 — Add repository fixture analysis

**Depends on:** B03, B04.  
**Status:** Not started.

**Implement:** Create inventory/filtering and Tree-sitter detector interfaces before live access. Initial detector set: Next.js, Express, FastAPI, PostgreSQL/Prisma/Supabase, Redis, queue workers and Docker configuration. Build an evidence graph with commit/file/line references.

**Done when:** Fixture scans make zero AI calls and execute no repository code; generated/vendor/binary files are skipped; dependency declarations are distinguished from observed runtime usage.

### H02 — Connect the read-only GitHub App

**Depends on:** H01, B07.  
**Status:** Not started.

**Implement:** Separate GitHub sign-in from repository authorization. Add installation, permitted repo/branch selection and commit resolution; request Metadata/Contents read only. Keep tokens server-side and fetch immutable commit content through bounded jobs.

**Done when:** Unauthorized repos and revoked installations fail safely; secrets never reach browser/logs; repo/size/file/time limits apply; no write permission is requested.

### H03 — Generate architecture from repository evidence

**Depends on:** H02, B08.  
**Status:** Not started.

**Implement:** Show measured scan results before Generate. Feed the evidence graph into shared context/rules/patterns; use at most one normal abstraction call. Link grouped components to multiple evidence items and commit-pinned source links.

**Done when:** Repository fixture → evidence → architecture → inspector passes; suggested components are labelled; existing verified architecture survives failed abstraction.

### H04 — Add incremental sync and drift approval

**Depends on:** H03, C02.  
**Status:** Not started.

**Implement:** Store repo/branch/commit/parser/evidence/architecture versions. Scan only changed files and remove deleted evidence; invalidate broader analysis on parser/config changes. Produce drift through shared operations/diff. Provide apply/ignore/review individually with revalidation.

**Done when:** Rename/delete/change fixtures update evidence; apply uses base-version checks; ignore records its baseline; partial approval validates the whole result; failed sync preserves last-good architecture.

## Milestone 6 — Views and operational readiness

### V01 — Add derived architecture views

**Depends on:** G03, G04, R02.  
**Status:** Not started.

**Implement:** Build a View Compiler over the same IR for System, Data Flow, Sequence, Deployment, Security and Failure. Sequence requires a scenario; other unavailable facts show insufficient information. Store presentation overrides by view.

**Done when:** One semantic change updates all projections; view switching does not create semantic versions; each view has independent visual overrides without duplicate semantic graphs.

### O01 — Add distributed limits and admission control

**Depends on:** B06, B07.  
**Status:** Implemented and application/database CI verified on 22 September 2026 in `feat/o01-shared-limits-concurrency` (PR #19); hosted multi-instance load remains an O03 release-gate check. See [Day 09 shared admission control](DAY-09-SHARED-ADMISSION-CONTROL.md).

**Implement:** Replace process-local limits with a Redis-compatible adapter and signed guest identities. Add user/workspace/route/provider limits, provider concurrency leases, queue capacity, cost ceilings and Retry-After. Meter actual usage through the gateway.

**Done when:** Two API instances share limits; worker crashes release capacity by lease expiry; exhaustion queues/rejects honestly; missing limiter fails closed for costly public routes.

### O02 — Improve dashboard and read-only sharing

**Depends on:** C03, H03, R02.  
**Status:** Not started.

**Implement:** Extend existing dashboard cards with real thumbnails, search/sort, available health, source commit and findings. Expose Open/History/Share and Sync only when applicable. Keep private repository details out of public share output.

**Done when:** Cards represent real data; search/sort work; missing analysis shows Unknown; public shares expose no private source paths, evidence excerpts or installation metadata.

### F04 — Finish cross-screen frontend reliability

**Depends on:** F01, G02, R02, D02, I02, H03.  
**Status:** Not started.

**Implement:** Preserve zoom, selection, mode and inspector through workspace navigation. Add route error/loading boundaries and recovery actions. Complete keyboard names/focus, contrast, reduced motion and mobile read/explore behavior; do not expand into full mobile authoring.

**Done when:** Canvas → Docs → Review → Canvas preserves context; panel failures leave architecture intact; storage errors are not reported as missing drafts; supported responsive and keyboard journeys pass.

### O03 — Run integrated beta and performance gates

**Depends on:** O01, O02, F04, H04, V01.  
**Status:** Not started.

**Implement:** Add beta:check for lint/type/unit/build/desktop/responsive/database/configuration checks. Run the nine specification E2Es plus recovery/security scenarios. Measure queue wait separately from model execution. Validate staging, telemetry alerts and recovery runbook.

**Done when:** Publish test results and measured p95 for deterministic/model generation, route probe and saves. No release on missing DB checks, critical defects or unverified tenant isolation.

## Interface decisions to lock during the relevant chunk

- Reuse current Architecture IR semantic types and versioned migrations; conceptual type names in the specification are examples, not instructions to replace the catalog.
- Evidence references must resolve within an authorized versioned source set. A source deletion during sync removes current evidence while old version evidence remains readable to authorized users.
- Cache identity includes tenant/access scope, content hash and parser/compiler/prompt version as appropriate; identical private content across tenants is not a reason to bypass authorization.
- B07 uses durable job IDs and polling first. API routes submit/status/cancel/retry; long parsing and analysis execute in a worker, not in a browser request. Worker hosting selection is a separate deployment decision; implement a local worker and stable job contract first.
- Document and repository ingestion initially require authentication. Guest prompt creation and local editing remain supported.
- Document parsing adapter: Docling outside Next.js for PDF/DOCX, lightweight Markdown adapter. OCR, maximum file/page limits and parser deployment sizing must be explicitly documented and tested in I01 before live uploads are enabled.
- Repository access: read-only GitHub App, commit-pinned fetches, server-only tokens, no repository execution. GitHub sign-in is not repository permission.
- Start repository detectors with TypeScript/JavaScript Next.js/Express and Python FastAPI. Other listed frameworks are detector extensions after fixture coverage.
- Graph all-path enumeration is bounded, cycle-aware and cancellable; show incomplete results when limits apply. Structural failure analysis is not proof of capacity, actual uptime or operational failover.
- Alternative-route existence alone cannot prove recovery. Explain missing topology, redundancy or failover evidence.
- Diff is a shared domain output used by AI changes, history and repository drift. Do not create three diff engines.
- Derived views share one semantic source and maintain view-specific presentation overrides.
- Display confidence in detail panels, not on every node. Status labels must distinguish user input, observed evidence, inference and AI suggestions.
- Keep existing limits until a chunk deliberately changes them with validation, storage and abuse-control tests.
- Production configuration fails closed only for enabled features that need the secret; no-key deterministic development remains usable.

## End-to-end acceptance inventory

1. Prompt → requirements → architecture → inspect → save → reload.
2. PDF/DOCX/Markdown → parse → evidence → requirements → architecture; fail synthesis and resume without reparsing.
3. Explore → upstream/downstream → route probe → reset, with zero model calls.
4. Scenario → play/pause/next/previous/restart/exit, with reduced-motion behavior.
5. Failure simulation → affected dependents/scenarios → alternate-path evidence → exit, without changing saved IR.
6. Change instruction → operations → Before/Delta/After → explicit apply → one version.
7. History → compare → restore → new head, including stale-base and archived-read failures.
8. Share → read-only Explore/docs/flow/route → revoked/expired access, without private repo evidence leakage.
9. Repository fixture → deterministic evidence → abstraction → source inspector.
10. Changed/deleted/renamed repository file → drift → selected update → version; invalid analysis leaves last-good architecture.
11. Guest/account recovery, interrupted migration, two-tab conflict, expired session and Storage failure continue to pass from the existing reliability suite.

## Performance and AI-use verification

Use measured results, not labels:
- deterministic architecture: target <2 seconds p95;
- model architecture: target <10 seconds p95 excluding queue wait, which is separately visible;
- normal graph route probe: target <100 ms with declared graph size;
- local recovery indicator: <1 second after a confirmed write;
- cloud save: target about <1 second p95 after debounce, measured separately from uploads;
- component selection, graph queries and playback: zero AI calls;
- prompt/document normal reasoning path: 1–2 calls where needed; deterministic paths can use zero;
- repository scan/detection: zero calls; one normal abstraction call, optional explicit deeper review;
- bounded repair/retry calls and actual token costs are included in telemetry, not hidden from counts.

Keep load tests separate from routine chunk checks. O03 must record workload, dataset size, concurrency, environment, queue wait, p50/p95/p99 and failures before a capacity claim.

## Deferred items

Do not include billing, profile customization, realtime cursors, advanced comments, full mobile authoring, SDK/CLI, marketplace, multi-agent UI, enterprise administration or advanced notification center.

Also defer universal framework support, full mobile drawing, Terraform/Kubernetes/OpenAPI/Mermaid ingestion, advanced capacity prediction, arbitrary graph split/merge operations and manual scenario building until the corresponding first-release behavior is proven. Existing Mermaid rendering/export remains supported.

## Handoff template

```text
Chunk:
Status: not started / active / complete / blocked
Base commit:
Behavior delivered:
Files changed:
Tests run and results:
Database/environment status:
Known limitation:
Next chunk:
Read next:
```

## Initial progress

Plan created; implementation has not started under these new chunk IDs.
First request: Implement B00 only.
Then: Implement B01 only.
