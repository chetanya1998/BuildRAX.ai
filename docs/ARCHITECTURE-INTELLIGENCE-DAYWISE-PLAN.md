# BuildRAX — daywise execution plan in plain English

Prepared 14 September 2026 from the supplied Detailed Codex Implementation Specification.

## Scope and timing

This plan follows dependencies and complete user journeys, rather than the attachment's ticket order. It covers the expanded architecture-intelligence scope, including documents, exploration, simulation, repository evidence and synchronization.

Plan for **34 working days, about seven working weeks, plus 5–10 working days of contingency**. This is a planning allowance, not a delivery guarantee. It assumes one experienced full-stack implementer using focused sessions, with product review and a working test environment. Parsing, repository analysis, migrations and integration tests may take longer. Two engineers can overlap truly independent work after agreeing on shared contracts, but the dependency chain still matters.

The earlier two-week plan remains an option for a smaller beta stabilization release. Completing this entire attachment safely in two weeks is not a credible commitment. The full schedule below preserves all major requested capabilities and gives an earlier core milestone at Day 25, subject to a separate release gate and disabled unfinished features.

Each day has **A and B sessions**. A session is a bounded outcome, usually a few hours, not an automatic promise of completion. Finish its acceptance check before advancing. If it is larger than expected, split it into A1/A2 or B1/B2 and record the remaining work. No day is complete merely because the calendar moved on.

## Language used here

- **Evidence:** where a fact came from, such as a prompt, document page or source file.
- **Requirements:** what the system must do and the limits it must respect.
- **Architecture:** the components and meaningful connections of the system.
- **Presentation:** positions, sizes, colors and other visual choices.
- **IR:** the structured record used to store each of those things. A screen should not become a competing source of truth.
- **Frontend:** what users see and interact with. **Backend:** processing, storage, permissions and external services behind it.
- **Deterministic:** ordinary software returns the same calculation for the same input, without an AI call.

## Execution rules

1. Work on fresh-variant and preserve existing changes. Inspect current code before assuming an earlier feature is missing.
2. Extend existing saving, recovery, IR, providers, layout, documents and history. Keep one implementation of each shared responsibility.
3. Complete one session at a time. Read its card, prerequisite handoff and relevant files instead of the entire attachment every time.
4. Preserve stable object IDs and old version readability. Renaming a component must not break evidence, scenarios or history.
5. Every new UI chunk includes keyboard labels, honest loading/error states and navigation preservation. Day 33 completes cross-product verification; accessibility is not postponed until then.
6. Every backend chunk includes its relevant authorization, validation and retry checks. Database changes require database tests when introduced.
7. All model tasks use the shared gateway. Parsing, selection, layout, paths, playback, comparison and failure propagation use zero model calls.
8. Architecture-changing proposals follow validate → compare → preview → user approval → new version. Cancel and stale responses cannot overwrite current work.
9. Store a small handoff after every session: changed behavior, files, tests and results, unresolved work, environment blockers and next command. Do not record an unrun test as passed.
10. Plans and local tests do not authorize production deployment, private-repository access or paid service provisioning. Those setup steps are listed early so they do not block the final day.

## Delivery map

| Working days | User-visible outcome |
| --- | --- |
| 1–5 | Detailed input becomes traceable requirements that save safely. |
| 6–10 | Fast, bounded generation with real progress, cancellation and retry. |
| 11–14 | Predictable, readable and responsive canvas editing. |
| 15–20 | Explore paths, play journeys, inspect failures and act on reviews. |
| 21–25 | Preview changes, compare history and write version-aware documents. |
| 26–27 | Upload documents and resume failed generation without re-uploading. |
| 28–31 | Analyze authorized repositories, show source evidence and review drift. |
| 32–34 | Multiple views, useful dashboard/sharing and measured release readiness. |

## Day 1 — Establish what already works

**User outcome:** A dependable starting point without repeating completed work.

**Session 1A — what and how:** Check the current branch, earlier progress, and the most serious audit failures. Create a retained-features checklist and choose three reusable test architectures.

**Session 1B — what and how:** Reproduce long-input failure, canvas interactions, document refinement, save/reopen and mobile errors. Record working, broken and unverified paths in a new progress log.

**Why / user impact:** Prevents spending time rebuilding saving, login, or history that already exist.

**Feasibility and reuse:** Use the current tests, source and isolated browser drafts. Database availability and live credentials are recorded separately.

**Done when:** Each scheduled fix has a confirmed starting state; the original drafts and current version history remain readable.

## Day 2 — Separate user facts from assumptions

**Progress:** B01 structured-input groundwork is implemented and locally verified on branch `feat/b01-structured-input`; see [Day 02 structured input](DAY-02-STRUCTURED-INPUT.md). The Evidence IR and Requirement IR records described below remain Day 03 / B02 work.

**User outcome:** BuildRAX can explain what the user asked for and where each fact came from.

**Session 2A — what and how:** Add the small records for evidence and requirements: stable IDs, source locations, user-provided facts, inferred suggestions and explicit unknowns.

**Session 2B — what and how:** Connect plain text and structured form choices to these records. Add a simple review panel for requirements and unresolved questions.

**Why / user impact:** Users can correct a misunderstanding before it becomes a diagram. Missing availability or traffic remains unknown.

**Feasibility and reuse:** Extend existing schema validation and catalog types; keep the current Architecture IR as the system model.

**Done when:** Long requirements become bounded items with source references; AI suggestions cannot label themselves verified; missing optional values are accepted.

## Day 3 — Make detailed descriptions work

**Progress:** The detailed-input outcome was completed in Day 02 / B01. Day 03 follows the authoritative execution sequence by implementing B02 Evidence IR and Requirement IR contracts on branch `feat/b02-evidence-requirement-ir`; see [Day 03 Evidence IR and Requirement IR](DAY-03-EVIDENCE-REQUIREMENT-IR.md).

**User outcome:** A thoughtful product description can reliably become an architecture request.

**Session 3A — what and how:** Fix long-input conversion using Day 2 requirements. Keep the original description separately; correctly map scale, cloud, tenancy, sensitivity, technology preferences and restrictions.

**Session 3B — what and how:** Connect the start form, show field-specific errors and preserve input after failure. Test short, boundary-length and maximum supported descriptions.

**Why / user impact:** Users stop seeing vague validation errors and their choices affect the generated system.

**Feasibility and reuse:** The current generation form and compiler already exist. Replace the broken conversion at their boundary.

**Done when:** Supported 3,000-character descriptions work; explicit single tenancy overrides a template assumption; invalid inputs explain what needs correction.

## Day 4 — Save the new information safely

**Progress:** B03 is implemented and application-verified on branch `feat/b03-persist-traceability`; database/RLS validation is pending CI because the local Docker daemon is unresponsive. See [Day 04 persisted traceability](DAY-04-PERSISTED-TRACEABILITY.md).

**User outcome:** Evidence and requirements survive editing, signup and reopening.

**Session 4A — what and how:** Link evidence and requirement artifacts to the existing immutable version graph. Add a compatible reader for old projects and migrations for the new references.

**Session 4B — what and how:** Carry the records through guest recovery, authenticated saving, migration and readback. Run database permission, checksum and replay tests.

**Why / user impact:** Users do not lose the explanation behind an architecture when they save or move between devices.

**Feasibility and reuse:** Reuse existing artifact storage, RLS, checksums and idempotency. Do not create a second saving system.

**Done when:** Old and new snapshots load; references cannot cross workspaces; migration/retry preserves evidence and requirements without duplicate versions.

## Day 5 — Send only useful information to AI

**Progress:** B04 is implemented and locally verified on branch `feat/b04-context-compiler`; see [Day 05 Context Compiler](DAY-05-CONTEXT-COMPILER.md).

**User outcome:** Lower AI cost while retaining the facts needed for each task.

**Session 5A — what and how:** Build the shared input router and context preparation for prompt/existing-project input. Remove duplicates and repeated noise while keeping headings, tables, code and source references.

**Session 5B — what and how:** Add configurable context limits per task. Rank relevant facts, preserve mandatory restrictions, and record what was omitted when a budget is reached.

**Why / user impact:** Responses become more focused; users can trace retained facts and see if more information is needed.

**Feasibility and reuse:** Most reduction is ordinary text processing. Future document/repository adapters will feed this same boundary.

**Done when:** Verbose and dense fixtures retain important facts; budgets include instructions and schema overhead; no mandatory constraint disappears silently.

## Day 6 — Turn existing knowledge into reusable building blocks

**Progress:** B05 was merged to `main` on 21 September 2026 from `feat/b05-rule-pattern-registries`; see [Day 06 rule and pattern registries](DAY-06-RULE-PATTERN-REGISTRIES.md).

**User outcome:** Reliable starting designs do not need a model to rediscover common patterns.

**Session 6A — what and how:** Convert existing templates into versioned patterns with required/optional components, known risks and questions. Add proposal-only rules for uploads, background jobs, public APIs and sensitive data.

**Session 6B — what and how:** Add the remaining specified starting patterns and reliability rules. Handle conflicting suggestions and explain why a pattern was selected.

**Why / user impact:** Users get consistent architecture suggestions and can understand their reasons.

**Feasibility and reuse:** Reuse the existing template catalog and compiler. Rules return suggestions for later validation, not immediate edits.

**Done when:** All 12 specified pattern families have fixtures; rules have match/no-match tests; explicit user restrictions win over pattern defaults.

## Day 7 — Put AI requests through one controlled service

**Progress:** B06 was merged to `main` on 21 September 2026 from `feat/b06-controlled-ai-gateway`; see [Day 07 controlled AI gateway](DAY-07-CONTROLLED-AI-GATEWAY.md).

**User outcome:** All AI features follow the same rules for output, cost and errors.

**Session 7A — what and how:** Wrap the existing provider in one task gateway for extraction, synthesis, changes, review, refinement and explanation. Define a structured response for each task.

**Session 7B — what and how:** Add bounded timeouts/retries, cancellation metadata, usage/timing records and production configuration checks. Keep deterministic development usable without a model key.

**Why / user impact:** Failures become explainable and one broken AI response cannot directly change user work.

**Feasibility and reuse:** Reuse the current provider adapter and server validation; routes call the gateway instead of creating independent clients.

**Done when:** Invalid outputs fail safely; enabled production features reject missing secrets; request IDs and actual model usage are recorded without private content.

## Day 8 — Resume long work from the failed step

**Progress:** B07 was merged to `main` on 22 September 2026 from `feat/b07-resumable-generation-jobs`; application and database/RLS CI passed. See [Day 08 resumable generation jobs](DAY-08-RESUMABLE-GENERATION-JOBS.md).

**User outcome:** A failed final step does not force the user to start again.

**Session 8A — what and how:** Add durable jobs with actual stage status and links to completed results. Use a bounded worker for long tasks and status polling initially.

**Session 8B — what and how:** Implement cancel, retry and abandoned-request handling. Retain successful evidence, requirements and architecture stages; reject old completions after a newer request starts.

**Why / user impact:** Users can cancel work and retry a failed stage without uploading or processing everything again.

**Feasibility and reuse:** Use PostgreSQL job records and existing artifact storage. Polling works without requiring a particular streaming host.

**Done when:** Worker interruption, duplicate delivery, cancellation and synthesis/layout failure resume safely and never publish a stale result.

## Day 9 — Protect the service when users arrive together

**Progress:** O01 was merged to `main` on 22 September 2026 from `feat/o01-shared-limits-concurrency`; application and database/RLS CI passed. Hosted multi-instance load remains an O03 release-gate check. See [Day 09 shared admission control](DAY-09-SHARED-ADMISSION-CONTROL.md).

**User outcome:** Traffic is shared fairly and excess work queues visibly.

**Session 9A — what and how:** Replace process-local rate limits with shared TTL-backed limits. Issue signed guest identities; apply limits by user, workspace, route and provider.

**Session 9B — what and how:** Add provider concurrency leases, queue capacity, cost ceilings and Retry-After. Show queued status and expiry/retry messages.

**Why / user impact:** One heavy user cannot consume all capacity; the app remains responsive during bursts.

**Feasibility and reuse:** Use a Redis-compatible adapter with deterministic tests and a staging service for multi-instance checks.

**Done when:** Two server instances share limits; crashed workers release capacity; exhausted capacity queues or rejects honestly; costly public requests fail safely if protection is unavailable.

## Day 10 — Complete the new prompt-to-canvas journey

**Progress:** B08 is implemented and application/browser/database CI verified on branch `feat/b08-complete-generation-workflow` in PR #20; explicit merge approval is pending. See [Day 10 complete generation workflow](DAY-10-COMPLETE-GENERATION-WORKFLOW.md).

**User outcome:** The user sees real progress and receives an explainable first architecture.

**Session 10A — what and how:** Connect input, evidence, requirements, context, patterns, rules and optional AI through the shared job pipeline. Validate and compile before publishing.

**Session 10B — what and how:** Build actual progress, cancel/retry and a concise first-result panel showing facts, assumptions and unknowns. Test generate → inspect → save → reload.

**Why / user impact:** Users understand both waiting time and the basis of the result.

**Feasibility and reuse:** All services come from Days 2–9; the current canvas and save path consume the resulting architecture.

**Done when:** Progress represents completed server stages; deterministic paths use zero model calls; normal model paths use at most two reasoning calls plus separately counted bounded repairs.

## Day 11 — Make tool behavior predictable

**Progress:** F01 is implemented and locally verified on branch
`feat/f01-canvas-interaction-states`; see
[Day 11 canvas interaction states](DAY-11-CANVAS-INTERACTION-STATES.md).

**User outcome:** The active tool, cursor and next click always agree.

**Session 11A — what and how:** Incrementally extract one interaction controller for select, pan, place, connect, text, shapes, freehand and eraser. Define Escape and pointer-cancel cleanup.

**Session 11B — what and how:** Replace global message strings with scoped tool hints, short success messages and persistent save-risk warnings. Resolve competing keyboard shortcuts and input focus.

**Why / user impact:** Users stop accidentally drawing, erasing or placing when they intend to select.

**Feasibility and reuse:** Reuse current React Flow handlers and working controls; migrate one interaction at a time behind existing tests.

**Done when:** Only one exclusive interaction is active; switching tools clears old hints; keyboard shortcuts do not type into search or steal document input.

## Day 12 — Make selection and connections easy

**User outcome:** Users can organize and connect a group of components confidently.

**Session 12A — what and how:** Improve single/Shift/marquee selection, resize hit areas, selection count and group movement. Preserve working front/back layer behavior.

**Session 12B — what and how:** Add click-source/click-target connection alongside port dragging, valid-target highlighting, live preview and a useful reason for rejected targets.

**Why / user impact:** Connection creation becomes discoverable and selected nodes remain controllable.

**Feasibility and reuse:** Use the existing selection model, handles and compatibility checks. Keep decorative arrows distinct from semantic connections.

**Done when:** Movement, resize, multi-selection, connector style, cancellation and undo pass the same browser journey; target choices use real compatibility data.

## Day 13 — Arrange diagrams without hiding user work

**User outcome:** Automatic layout improves a diagram and respects manual placement.

**Session 13A — what and how:** Pass usable canvas bounds and panel sizes to the existing layout compiler. Track manual position overrides and place new components without moving unrelated work.

**Session 13B — what and how:** Improve group boundaries, labels and edge routing. Recalculate the usable area after panel changes and test light/dark, desktop and tablet.

**Why / user impact:** Nodes stay visible, labels remain readable and user-arranged layouts survive semantic edits.

**Feasibility and reuse:** Extend ELK and Presentation IR; layout remains deterministic and does not change architecture meaning.

**Done when:** A 15-node mixed diagram avoids fixed controls; saved manual positions survive reload; layout-only changes leave semantic checksums unchanged.

## Day 14 — Make drawing, typing and saving feel smooth

**User outcome:** Repeated small actions do not make the whole canvas slow.

**Session 14A — what and how:** Move freehand preview into a lightweight overlay with a point buffer and bounded simplification. Commit once when the stroke ends; handle interrupted gestures.

**Session 14B — what and how:** Group field edits into one undo action. Reduce whole-diagram copying and repeated image payloads; retain safe existing snapshot undo where replacement is unnecessary.

**Why / user impact:** The pen follows the pointer and undo reverses a meaningful action instead of one character.

**Feasibility and reuse:** Use existing drawing events, asset references and save coalescing; migrate history incrementally.

**Done when:** One stroke/field edit equals one undo step; drawing does not rebuild all nodes per sample; large permitted drafts remain recoverable while saving.

## Day 15 — Teach software to navigate the architecture

**User outcome:** Dependency and path calculations work instantly without AI.

**Session 15A — what and how:** Build a TypeScript graph index over Architecture IR with incoming/outgoing links, upstream/downstream, connected groups, cycles and orphans.

**Session 15B — what and how:** Add shortest paths, bounded alternative paths, critical nodes and failure dependencies. Define request direction separately from dependency direction.

**Why / user impact:** Exploration and failure analysis become fast, repeatable and inexpensive.

**Feasibility and reuse:** Graph traversal is ordinary software; no new Python service or model call is needed.

**Done when:** Linear, branching, cyclic, disconnected and bidirectional fixtures pass; path searches have limits and report incomplete results; outputs contain object IDs.

## Day 16 — Let users explore without accidental edits

**User outcome:** A component explains its purpose, connections, requirements and source.

**Session 16A — what and how:** Add Explore mode and its information panel. Show upstream/downstream focus, dependencies, provenance and Reset focus while disabling mutation.

**Session 16B — what and how:** Add From/To route tracing and reuse one command palette for components, technologies, flows and available evidence. Show hops and only known security/protocol facts.

**Why / user impact:** Architects can answer 'what depends on this?' and nontechnical users can understand a component.

**Feasibility and reuse:** Use Day 15 graph results and existing inspector/search controls; no AI call is needed for selection or path tracing.

**Done when:** Explore cannot mutate; route probe targets under 100 ms on a declared normal-size fixture; unknown fields remain unknown; focus/reset work by keyboard.

## Day 17 — Play a real system journey

**User outcome:** Users can follow an upload, login or checkout one step at a time.

**Session 17A — what and how:** Add versioned scenarios with ordered steps and requirement/evidence references. Seed validated scenarios from existing patterns and expose a scenario picker.

**Session 17B — what and how:** Implement Play, Pause, Next, Previous, Restart and Exit, dim unrelated content, and use one finite pulse with reduced-motion support.

**Why / user impact:** A complex architecture becomes a understandable story rather than a collection of boxes.

**Feasibility and reuse:** Playback follows saved flow IDs and uses the graph engine; AI may propose a scenario once but never drives playback.

**Done when:** Controls preserve correct step order; changed/deleted flows invalidate affected scenarios clearly; exit restores the prior view; playback makes zero model calls.

## Day 18 — Show what may be affected by a failure

**User outcome:** Users can inspect structural impact without changing the saved design.

**Session 18A — what and how:** Calculate direct/transitive dependents, affected scenarios and alternate routes for a selected failed component. Bound calculation work and handle cycles.

**Session 18B — what and how:** Add Simulate mode with clear affected-object highlights, resilience evidence and unknown failover details; provide Exit simulation.

**Why / user impact:** Users spot missing redundancy and understand the possible reach of a failure.

**Feasibility and reuse:** Use graph traversal plus recorded resilience information. This estimates structural dependency impact, not real runtime availability or load capacity.

**Done when:** Known dependency fixtures produce correct impact; an alternate path is not presented as proven failover; simulation changes no saved architecture.

## Day 19 — Check the design against explicit rules

**User outcome:** Review results say what was checked and what remains unknown.

**Session 19A — what and how:** Extend the existing reviewer into a separate validation registry covering authentication, rate limits, timeouts, retries, dead-letter strategy, encryption, redundancy and monitoring.

**Session 19B — what and how:** Add stable version-aware findings and categorical health. Re-evaluate resolution while retaining earlier findings and accepted/ignored decisions.

**Why / user impact:** Users receive consistent advice with evidence instead of an unexplained score.

**Feasibility and reuse:** Reuse current review records and permission patterns; distinguish architecture suggestions from validation of an existing architecture.

**Done when:** Each rule has pass/fail/insufficient-evidence fixtures; absent information is not called a verified vulnerability; health can be Unknown.

## Day 20 — Make Review a usable workflow

**User outcome:** Users can inspect a concern and record a decision.

**Session 20A — what and how:** Build Review mode with severity/category/component filters, affected-object focus and readable evidence, rationale and recommendations.

**Session 20B — what and how:** Connect accept-risk, ignore and recheck actions to authorized persistence. Show the architecture version and review freshness.

**Why / user impact:** Review becomes a record of decisions instead of a list users read once and forget.

**Feasibility and reuse:** Use Day 19 findings and existing database version relationships. Owner/due-date administration stays outside the initial scope.

**Done when:** Finding decisions survive reload; resolving requires re-evaluation; layout-only changes do not make review stale; unauthorized writes are rejected.

## Day 21 — Create one safe change and comparison tool

**User outcome:** AI changes, history and later GitHub updates can share the same mechanics.

**Session 21A — what and how:** Implement the six initial operations: add/remove/update component and add/remove/update flow. Apply to a copied IR, resolve temporary IDs and validate references.

**Session 21B — what and how:** Build semantic comparison with added/removed/changed objects, requirements and metadata. Keep move/resize/style differences separate.

**Why / user impact:** Users can understand a real architecture change without confusing it with cosmetic edits.

**Feasibility and reuse:** Extend the current change-plan and version infrastructure; avoid separate comparison engines for each feature.

**Done when:** Insert-between, remove, reroute, no-op, invalid references and conflicts pass; previews never mutate the original; full split/merge operations stay deferred.

## Day 22 — Preview and approve meaningful changes

**User outcome:** A request such as 'add Redis between API and database' shows the actual result.

**Session 22A — what and how:** Retrieve relevant context and request structured operations through the shared gateway. Validate the resulting architecture and any new findings.

**Session 22B — what and how:** Build Before / Changes / After using Day 21 comparison. Show exact nodes/flows and source/reason; apply through one existing atomic save after approval.

**Why / user impact:** Users understand what will change and can cancel safely.

**Feasibility and reuse:** Reuse operations, graph validation, version checks, shared gateway and immutable save; keep manually positioned existing nodes where possible.

**Done when:** Redis insertion previews the correct edges; stale previews cannot apply; cancel creates no version; repeated Apply creates only one version.

## Day 23 — Make history and navigation protect the work

**User outcome:** Users can compare and restore earlier work without losing current context.

**Session 23A — what and how:** Expose Open, Compare and Restore in existing history with author/source metadata when available. Preserve local work before restoring as a new head.

**Session 23B — what and how:** Preserve zoom, pan, selection and mode through Canvas, Docs and Review. Add local panel/route loading and error recovery boundaries.

**Why / user impact:** Users can investigate history and move between views without restarting their work.

**Feasibility and reuse:** Reuse immutable versions, archive hydration, recovery and the single comparison engine. Use client navigation where compatible.

**Done when:** Hot/archived comparison works; restore never rewrites history; panel failure leaves the canvas usable; navigation restores the previous context.

## Day 24 — Generate documents from known architecture facts

**User outcome:** The handoff document reflects the system and preserves user writing.

**Session 24A — what and how:** Create deterministic document sections from requirements, architecture, evidence, scenarios, findings and decisions. Include goals/non-goals, responsibilities, flows, data ownership, security, resilience and unknowns.

**Session 24B — what and how:** Track derived, user-authored and AI-proposed sections with source versions. Refresh a chosen derived section and keep manual content intact.

**Why / user impact:** Users get a reliable starting document and can see which sections need updating.

**Feasibility and reuse:** Extend existing Markdown/document versions with section metadata; preserve old documents as authored content through compatibility handling.

**Done when:** Opening Docs never regenerates text; semantic edits mark relevant sections stale; manual content and empty documents survive save/reload.

## Day 25 — Make AI writing respect the selected scope

**User outcome:** A writing instruction changes only what the user requested.

**Session 25A — what and how:** Send selected block, prompt, relevant context and source version through the gateway; return a bounded text patch with stale-version protection.

**Session 25B — what and how:** Add preview/accept/cancel for refinement and optional audience explanations for Founder, Product Manager, Developer, Architect and Security Reviewer. Verify current formatting/copy/export buttons.

**Why / user impact:** Users can simplify an explanation without duplicating the document or changing facts.

**Feasibility and reuse:** Use the existing editor selection, document persistence and gateway. Cached explanations depend on audience and semantic/source versions.

**Done when:** The prompt reaches the model; unrelated text is untouched; stale/cancelled patches cannot replace writing; ordinary component selection remains AI-free.

## Day 26 — Read uploaded documents with source references

**User outcome:** PDF, DOCX and Markdown become structured, reusable input.

**Session 26A — what and how:** Add a DocumentParser boundary and an isolated Docling adapter for PDF/DOCX; use a lightweight Markdown adapter. Preserve sections, pages, tables and code blocks.

**Session 26B — what and how:** Add private file storage, tenant-scoped hash/parser-version caching, file/page/time limits and malformed/encrypted-file handling. Test local fixtures.

**Why / user impact:** Users can verify which page or section supported a requirement and avoid repeated parsing.

**Feasibility and reuse:** Keep heavy parsing outside Next.js and convert parser output to BuildRAX-owned types. Confirm runtime capacity before enabling live uploads.

**Done when:** Supported fixtures retain locations and structure; parsing uses zero AI calls; repeated authorized content reuses cache; files cannot escape parser isolation.

## Day 27 — Turn an uploaded specification into an architecture

**User outcome:** Document upload uses the same trustworthy generation journey as a prompt.

**Session 27A — what and how:** Add Upload document, source preview and real upload/parse/extract progress. Feed parsed evidence through shared context, requirements, patterns and generation.

**Session 27B — what and how:** Show extracted requirements for correction and support retry from failed synthesis/layout. Exercise upload → requirements → architecture → save → reload.

**Why / user impact:** Users do not re-upload a large document because the final generation step failed.

**Feasibility and reuse:** Connect Day 26 adapter to the existing durable jobs; retain completed results and reference the same evidence/requirement contracts.

**Done when:** PDF/DOCX/Markdown journeys pass; synthesis retry does not reparse; missing source facts remain unknown; private source content stays out of operational logs.

## Day 28 — Read repository facts before connecting live accounts

**User outcome:** BuildRAX can detect architecture evidence without executing or sending all code to AI.

**Session 28A — what and how:** Build inventory/filtering and Tree-sitter detector interfaces. Respect ignore files; skip generated/vendor/binary content and safely bound file counts, sizes and time.

**Session 28B — what and how:** Create fixture detectors for Next.js, Express, FastAPI, PostgreSQL/Prisma/Supabase, Redis, workers/queues, external calls and Docker. Build a separate evidence graph with file/line references.

**Why / user impact:** Users can see the source behind a detected component and scanning stays affordable.

**Feasibility and reuse:** Start with the languages expected in beta. Dependency declarations are clues; they do not alone prove runtime use.

**Done when:** Fixture scans use zero AI calls and run no repository scripts; detectors distinguish observed use from installed packages; unknown frameworks are disclosed.

## Day 29 — Connect GitHub with explicit repository permission

**User outcome:** Signing in and allowing repository analysis become separate, clear actions.

**Session 29A — what and how:** Implement a read-only GitHub App connection with installation, repository and branch selection. Resolve an immutable commit and keep tokens on the server.

**Session 29B — what and how:** Connect bounded scanning jobs; show actual stages and measured scan summary. Handle access revocation and unauthorized repositories.

**Why / user impact:** Users control which repositories BuildRAX can read and know which commit was analyzed.

**Feasibility and reuse:** Use the Day 28 scanner and existing auth/jobs. GitHub App registration and callback configuration must be ready before live validation.

**Done when:** Only permitted repositories are listed/read; revoked installations stop new access; no write permission or browser secret; a commit-pinned scan can be reopened.

## Day 30 — Create architecture from repository evidence

**User outcome:** Repository facts become a readable system with clickable evidence.

**Session 30A — what and how:** Group the evidence graph using shared context, patterns and rules, with one normal AI abstraction call only when needed. Validate and compile the proposed architecture.

**Session 30B — what and how:** Show the scan summary before Generate, then source evidence for each component, Copy source path and authorized commit-pinned GitHub links.

**Why / user impact:** Users can tell observed code from inferred grouping or AI-added suggestions.

**Feasibility and reuse:** Use existing generation and provenance infrastructure; evidence graph remains separate from the smaller presented architecture.

**Done when:** Repository → evidence → architecture → source inspector passes; component grouping retains multiple references; a failed abstraction keeps the previous good architecture.

## Day 31 — Review source changes before updating the diagram

**User outcome:** The architecture can stay current without overwriting manual decisions.

**Session 31A — what and how:** Store source/parser/evidence/architecture versions. Reprocess changed files, handle renamed/deleted files and invalidate broader caches when analysis rules change.

**Session 31B — what and how:** Show drift through the shared comparison UI. Support Apply, Ignore and individually reviewed changes, validating the complete accepted result.

**Why / user impact:** Users see how code evolved and decide whether the architecture should follow it.

**Feasibility and reuse:** Reuse the same operations, comparison and atomic version save from Days 21–22. No automatic architecture mutation.

**Done when:** Change/rename/delete fixtures pass; partial approval remains consistent; stale updates conflict safely; scan failure preserves last-good architecture and manual layout.

## Day 32 — Provide different views of the same system

**User outcome:** Users can inspect system, data, sequence, deployment, security and failure views.

**Session 32A — what and how:** Build the shared view compiler and start with System, Data Flow and Sequence projections. Keep view-specific positions separate from semantic data.

**Session 32B — what and how:** Add Deployment, Security and Failure projections using only available facts; connect dashboard search/sort, real thumbnails, source commit and health where known.

**Why / user impact:** Users change perspective without maintaining six different diagrams; dashboard cards describe real project state.

**Feasibility and reuse:** All views read the same IR and scenario data. Missing deployment/security facts show insufficient information.

**Done when:** One semantic change updates every view; switching view creates no semantic version; manual positions persist per view; cards never invent health/source data.

## Day 33 — Make sharing and smaller screens dependable

**User outcome:** Viewers can understand the architecture safely from a minimal interface.

**Session 33A — what and how:** Create a read-only share shell for Explore, scenarios, route tracing, docs, zoom and pan. Show version/time and enforce a separate policy for private repository evidence.

**Session 33B — what and how:** Complete supported responsive behavior, button labels, keyboard focus, reduced motion, storage-error recovery and share copy/revoke states. Hide unsupported mobile authoring.

**Why / user impact:** Shared users get a clear reading experience and important controls work without a mouse.

**Feasibility and reuse:** Reuse existing share tokens and server authorization. A share link does not grant repository access.

**Done when:** Expired/revoked shares fail safely; shared routes cannot mutate or leak private evidence; supported mobile/keyboard journeys and serious accessibility checks pass.

## Day 34 — Prove readiness and rehearse the beta release

**User outcome:** The release decision is supported by measured results.

**Session 34A — what and how:** Add the aggregate beta:check command and run all nine attachment journeys plus failure simulation, local/cloud recovery, migration, permissions, archive and configuration tests.

**Session 34B — what and how:** Run staging load/failure tests, verify request tracing/alerts and backup/rollback; publish results and a small-cohort rollout decision with explicit remaining limits.

**Why / user impact:** Users receive a reliable product and the team can detect and recover from real problems.

**Feasibility and reuse:** Reuse fixtures and tests accumulated daily. Hosting, parser workers, GitHub, Redis, database and provider integration must be measured together.

**Done when:** No blocking correctness/security issue; complete database/tenant checks pass; latency and 100–200-user workload results are documented. If gates fail, repair and rerun before expanding access.

## Frontend and backend coordination

| Phase | Frontend responsibility | Backend/domain responsibility |
| --- | --- | --- |
| Input and generation | Form, requirement review, progress, cancel and recovery | Evidence/requirements, context, rules, gateway, jobs and safe publication |
| Canvas | Cursor, selection, connections, layout boundaries, drawing and undo | Validate semantic edits and preserve existing save contracts |
| Explore and simulation | Focus, route picker, step controls and understandable explanations | Graph traversal, scenarios, dependency analysis and evidence-aware results |
| Review and change | Findings, decisions, Before/Changes/After and explicit apply | Validation, stable finding identity, operations, comparison and version checks |
| Documents | Read/write, selected-text refinement, section freshness and upload | Section compiler, bounded patches, parsing, private sources and resume |
| GitHub | Authorization, repository selection, measured summary, evidence and drift | Read-only installation access, safe scanning, evidence graph, delta processing |
| Release | Read-only sharing, responsive UX, clear errors and feedback | Shared limits, tenant isolation, monitoring, load proof and rollback |

Days 2–4 define the shared information contract. Do not build document and repository features against separate temporary models. Day 15 graph calculations serve Explore, playback and failure analysis. Day 21 comparison serves AI changes, history and GitHub drift. These shared foundations are why the order matters.

## Setup to arrange before it becomes a blocker

- **Before Day 4:** working isolated Supabase test database and a designated staging database. Record which migrations are already deployed and how to recover the staging data.
- **Before Day 7:** secure configuration for the optional AI provider and production signing keys. Rotate the previously shared Supabase secret if rotation has not already been completed; do not put replacement values into the plan or source control.
- **Before Day 9:** Redis-compatible staging service and a runtime for bounded background workers. Development can use controlled adapters while setup is pending.
- **Before Day 26:** private source-file storage and a parser runtime with agreed size/page/time limits. Verify Docling support/version and deployment resources during implementation. Scanned-document OCR support must be explicitly tested and disclosed rather than assumed.
- **Before Day 29:** registered GitHub App, callback/install URLs and protected server credentials. BuildRAX login is separate from permission to read a repository. Start with metadata/contents read access only and confirm current provider requirements at implementation time.
- **Before Day 34:** authorized staging accounts, representative fixtures, monitoring destination, worker deployment, email/archive configuration if exposed, and a recoverable backup.

Local fixture work can continue while external setup is pending. The associated live feature stays unavailable until its integration tests pass.

## Cache, privacy and failure rules that apply to every day

- Cache parsed documents by authorized workspace/source scope, file hash and parser version.
- Cache repository analysis by authorized repository, commit, file hash and detector/parser versions. A changed detector can require a wider rescan.
- Cache context/explanations by source/semantic version, task and relevant settings. Do not serve one workspace's private result to another.
- Treat uploaded text and repository content as data. Never execute repository scripts, uploaded macros or instructions found inside them.
- Keep evidence locations and references when summarizing. A dependency package alone does not verify deployment or runtime behavior.
- Persist successful stages before advancing. Retry the failed stage, and keep the last approved architecture active if a new analysis is invalid.
- Bound all-path searches by depth, results and work/time; indicate when results are incomplete.
- Structural failure analysis shows dependencies and recorded resilience. It does not prove real-world uptime, failover or capacity.
- Only enabled production features require their associated service credentials, but they must fail safely when those credentials are missing.

## Milestone checks and release choices

**After Day 10:** demonstrate prompt → requirements → generation → save → reopen, including cancel, old-response rejection and failed-stage retry. This is an internal generation milestone.

**After Day 14:** run a 30-minute manual editing session on mixed 15-node and larger permitted fixtures. Include creation, connection, selection, resize, drawing, undo and recovery. Record visible lag and errors.

**After Day 20:** demonstrate Explore → route probe → scenario playback → structural failure → finding. Verify zero model calls during ordinary interaction.

**After Day 25:** demonstrate change request → comparison → apply → history → restore → document freshness → selected-text refinement. This can become an earlier core beta only after the applicable full release checks run. Document ingestion, repository features and unfinished views remain disabled. Reaching Day 25 alone does not authorize release.

**After Day 27:** demonstrate a document-derived architecture and retry after a synthesis failure without another parse.

**After Day 31:** demonstrate authorized repository → measured evidence → architecture → changed-file scan → approved drift update, including revoked permission and failed-scan recovery.

**Day 34:** run the whole release candidate. A calendar deadline never overrides failed data-safety, security or core-journey checks.

## How we will measure smoothness and AI use

| User expectation | Evidence required |
| --- | --- |
| A rule-based architecture appears quickly | Under 2 seconds for 95% of the measured standard requests. |
| A normal model-backed draft is quick | Under 10 seconds for 95% of normal, unqueued requests; queue waiting shown and measured separately. Parsing large files is measured separately too. |
| Clicking and exploring feels immediate | No model call for selecting, finding dependencies, route probing, comparison or playback. Route probe under 100 ms on a declared representative graph size. |
| Work feels safe | Local confirmation within about one second for supported payloads; cloud save about one second after debounce, with uploads reported separately. |
| Drawing follows the pointer | Measure input-to-paint latency, dropped frames and memory on representative hardware and permitted large drafts; agree the test machine and workload before claiming success. |
| Many users do not overwhelm the service | Test a realistic 100–200-user mix of editing, saving, browsing and generation. Also test 100 concurrent saves, conflicting saves to one diagram, queue saturation and worker failure. No lost/duplicate versions or unauthorized access. |
| AI cost stays controlled | Normal prompt/document path uses 0–2 reasoning calls; repository scan uses zero and abstraction normally at most one. Optional deep review and bounded repair/retry are separately counted. |

The 80–90% software / 10–20% AI split is a design direction, not a measurable promise based on lines of code. The concrete checks are which actions call AI, how many calls they make, how much context they send, and whether software validates and applies the result.

## What follows this release

Keep these outside the initial execution scope: billing, profile customization, real-time cursors, complex comments, enterprise administration, full mobile authoring, SDK/CLI, plugin marketplace, multi-agent panels and advanced notification administration.

The specification also identifies later extensions: manual scenario authoring, universal framework support, new Mermaid/OpenAPI/Terraform/Kubernetes input adapters, advanced capacity prediction and full split/merge architecture operations. Preserve extension points, but do not claim these are delivered by the initial six semantic operations or the first repository detectors. Existing Mermaid rendering/export remains supported.

## Exact session requests

Start with:

> Implement Day 1A only from docs/ARCHITECTURE-INTELLIGENCE-DAYWISE-PLAN.md. Inspect the current branch and preserve existing changes. Complete the session's scope, run appropriate checks, and write a concise handoff in docs/ARCHITECTURE-INTELLIGENCE-DAYWISE-PROGRESS.md. Stop at the session boundary.

Continue with:

> Implement Day 1B only from the daywise plan. Read Day 1A's handoff first, verify prerequisites, complete the relevant checks, and update progress.

For any later session:

> Implement Day 16A only from the daywise plan. Use completed prerequisite handoffs. If work remains in that session, record it explicitly rather than starting 16B.

To resume interrupted work:

> Continue Day 16A from the saved handoff. Finish its remaining work and verification before advancing.

## Required handoff after every session

```text
Day/session:
Status: not started / active / complete / blocked
Starting commit and existing local changes:
User behavior delivered:
Relevant files:
Checks actually run and results:
Database/live-service checks still unverified:
Unfinished work and exact blocker:
Next session and files to read:
```

This document is a plan. It marks no implementation or live integration complete. The existing detailed technical plan remains available for reference; this daywise plan supplies the plain-language execution order.
