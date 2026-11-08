# BuildRAX — complete development handoff and amended 34-day execution guide

Snapshot date: **8 November 2026 (Asia/Kolkata)**. Repository: [chetanya1998/BuildRAX.ai](https://github.com/chetanya1998/BuildRAX.ai).

This is the consolidated context for continuing development. It records implemented work, verified evidence, branch dependencies, unfinished acceptance, and the work required in every remaining day/session. It supplements the approved roadmap; it does not turn a plan into delivered functionality. Read the status and next-session sections before selecting work.

### Navigation

- [Authority and status language](#1-authority-scope-and-status-language)
- [Current executive state](#2-executive-state)
- [Branches and publication inventory](#3-repository-branches-and-publication-inventory)
- [Architecture and existing extension points](#4-architectural-map-what-must-be-reused)
- [Completed Days 1–11](#5-completedfrozen-baseline-days-111)
- [Immediate next sessions](#6-immediate-continuation-sessions-before-new-day-17-scope)
- [Milestones and full day inventory](#7-preserved-milestones-and-day-by-day-inventory)
- [All remaining session cards](#8-session-cards-for-every-remaining-day)
- [Common acceptance and session handoff](#9-acceptance-and-handoff-required-for-every-feature-session-c)
- [Dependency and merge order](#10-dependency-and-merge-order)
- [Original day-number reconciliation](#11-original-session-numbering-reconciliation)
- [Day 16 implementation and evidence](#12-detailed-day-16-implementation-and-test-context)
- [Local environment and commands](#13-local-environment-and-safe-reproduction)
- [External setup and activation](#14-external-setup-and-activation-gates)
- [Integrated journeys and performance targets](#15-end-to-end-and-performance-proof-for-milestones)
- [Deferred scope](#16-deferred-scope-and-non-negotiable-limits)
- [Copyable future-session requests](#17-suggested-exact-future-session-requests)
- [Publication ledger](#18-publication-ledger-and-trust-limits)

For a resumed coding session, read sections 2, 6, 10 and the selected task card,
then its source/test handoff. For product or release planning, read sections 5,
7, 14–16. The entire guide is retained here so context does not depend on chat history.

## 1. Authority, scope and status language

The approved amendment schedules work by **task ID**, not the older plain-English day headings. Days 1–11 are completed/frozen at the merged implementation level. Later work extends those contracts. Frozen does not mean hosted, enabled or production-tested.

Sources, in order:
1. Current user direction: publish existing development and a detailed continuation document; keep tests local because the configured Supabase project is production; keep features in separate PRs and obtain explicit approval before merging.
2. [Approved Days 12–34 amendment, commit f60a12a](https://github.com/chetanya1998/BuildRAX.ai/blob/f60a12a/docs/ARCHITECTURE-INTELLIGENCE-DAYWISE-PLAN.md). It exists on `docs/roadmap-amendment-days12-34`; it is not present in the current `origin/main` roadmap.
3. [Technical execution plan](ARCHITECTURE-INTELLIGENCE-EXECUTION-PLAN.md), whose task cards define the original requirements.
4. [Original plain-English daywise plan](ARCHITECTURE-INTELLIGENCE-DAYWISE-PLAN.md), whose retained sessions are reconciled below.
5. Feature progress documents and source/tests on the branch that actually contains each feature. Historical “not pushed” or “pending merge” text can be stale; GitHub state and exact commits take precedence for publication status.
6. User-supplied “BuildRAX Roadmap — Codex Execution Rules”: inspect first, one bounded issue/branch, extend existing systems, preserve semantic/presentation boundaries, test and document actual results, approval before merge, and validation-only Day 34.

This document's proposed session subdivisions are execution guidance, not a new scope amendment. A session is a bounded outcome, not a guaranteed calendar day. Split larger sessions into A1/A2 with their own handoff; never hide spillover in Day 34.

Status vocabulary:
- **Not started:** no delivered implementation identified for the task.
- **In progress:** implementation or required acceptance remains.
- **Implemented but unverified:** code exists without sufficient passing evidence.
- **Verified locally:** named checks passed at the recorded revision; does not imply integrated, merged or deployed.
- **PR ready:** applicable checks and review preparation complete; approvals still apply.
- **Merged:** GitHub confirms integration into main.
- **Released:** deployment and enabled user journeys are verified separately.
- **Blocked:** identify the concrete dependency or environment and the work still possible independently.

## 2. Executive state

- GitHub `main` is `c21625c`, the F03 PR #32 merge. It is the continuation base; the local branch named `main` is a divergent UI-development history at `02060a0` and must not be pushed over GitHub main.
- Days 1–11 are merged. Selection/connections (#23), F02 manual placement/panel fitting (#27), and F03 inspector/freehand (#32) are also merged. Broader F02/F03 acceptance is not thereby complete.
- A01 accounting is fixed in published commit `95f8345`; its draft PR #33 still needs fresh CI/review and live activation gates. Do not repeat the obsolete claim that the known accounting regression is still unfixed.
- RS01 #34 and RS02 #36 are published server cores, not live research features. RS02 uses **TypeSafe Jev**, as clarified by the user.
- G01 and G02 are implemented; G02 draft PR #35 is stacked on G01. G03 is stacked on G02. P01 is independently based on main.
- G03 and P01 both have committed editor integration. Some older P01 notes incorrectly say G03 still needs UI; G03 UI exists at `4707d6f`.
- Day 16 is **not fully accepted or released**. This handoff preserves the remaining P01 group/orphan browser checks, shared-view integration, dependency integration and review work.
- Two real persistence defects were found during Day 16 checks: a semantic save SQL ambiguity and read-only sharing reading a cleared compatibility payload. The publication checkpoint includes a forward migration and regressions; these changes have not been deployed.
- Production configuration PR #41 is separate. Its report describes missing hosted configuration at the time of its investigation; current hosted health has not been rechecked here.
- No new product implementation is claimed for Days 17–34. Existing legacy functionality must be inspected and extended when those issues start.

## 3. Repository, branches and publication inventory

Working root is `/Users/chetanya/BuildRAX.ai`; it contains multiple Git worktrees. The active implementation checkout is `f03-editor`, not the parent folder.

| Branch | Known checkpoint / review | Brief and continuation |
| --- | --- | --- |
| `docs/implementation-handoff-2026-11-08` | Based on main `c21625c` | This full handoff; documentation only. |
| `docs/roadmap-amendment-days12-34` | `f60a12a`, published | Approved amendment and frozen-baseline record; review/integrate its documentation separately. |
| `feat/g01-deterministic-graph` | `bca434f`, published | Day 14 graph algorithms. Required before G02/G03. |
| `feat/g02-explore-route-search` | `e845b35`, draft [#35](https://github.com/chetanya1998/BuildRAX.ai/pull/35) | Day 15 Explore, search and route probe; base is G01. |
| `feat/g03-scenario-playback-core` | Core `47e3984`, UI `4707d6f`, publication additions below | Day 16 scenario persistence and transient playback; base is G02. |
| `feat/p01-presentation-objects` | Core `6d101e5`, UI `7592788`, published | Day 16 presentation objects; independently based on main. |
| `feat/a01-task-aware-router` | `95f8345`, draft [#33](https://github.com/chetanya1998/BuildRAX.ai/pull/33) | Day 13 router, including failure-accounting repair. |
| `feat/rs01-research-intelligence` | `a826cbc`, draft [#34](https://github.com/chetanya1998/BuildRAX.ai/pull/34) | Day 14 research evidence core; base is A01. |
| `feat/rs02-jev-research-judge` | `f8be5c0`, draft [#36](https://github.com/chetanya1998/BuildRAX.ai/pull/36) | Day 15 typed TypeSafe judgment; base is RS01. |
| `fix/p0-production-config` | `3faa1ee`, open [#41](https://github.com/chetanya1998/BuildRAX.ai/pull/41) | Config/build/health gate and friendly outage errors; separate from feature work. |
| `feat/f02-layout-readability` | `7f6d936`, merged #27 | Preserve manual placement; panel-aware fit and tablet labels. |
| `feat/f03-freehand-buffering` | `04765a3`, merged #32 | Inspector transactions plus bounded freehand input. |
| `feat/day12-selection-connections` | `641f8bd`, merged #23 | Retained selection/semantic-connection bridge. |
| `feat/m1-b03-b05-foundations`, `feat/m1-b06-b08-generation-platform` | Historical umbrella branches, already published | Preserve history; continue with bounded feature branches, not these old umbrellas. |

Publication means remote branch backup, not merge. New commits and final push evidence are recorded in the publication ledger at the end of this document. Do not use `git push --all`, force push, or push the divergent local main. Existing `ui-revamp*`, `fresh-variant` and unrelated histories are not newly reviewed roadmap deliverables.

Local worktree inventory:
- `BuildRAX.ai/`: historical generation-platform branch; untracked `audit-artifacts/` deliberately excluded.
- `f03-editor/`: G03 and the Day 16 test/fix checkpoint; untracked `.agents/` contains separately installed tools and is deliberately excluded.
- `f02-layout/`: merged F02 branch.
- `p0-config/`: separate P0 configuration PR.
- `roadmap-amendment/`: approved amendment branch.
- `implementation-handoff/`: this documentation branch.
- Old prunable `/private/tmp/buildrax-*` entries may exist; do not clean unrelated worktrees automatically.

## 4. Architectural map: what must be reused

### Information and trust boundaries

**Evidence IR → Requirement IR → Architecture IR → Presentation IR.**

Evidence carries source identity/location, observation type, uncertainty and provenance. Requirements carry user needs and constraints, without inventing missing facts. Architecture IR owns components, semantic flows, constraints, assumptions, decisions and scenarios. Presentation IR owns positions, styling, layers, notes, visual groups, highlights, annotations and saved focus definitions. Active focus, selection, hover, playback position and preview viewport are transient.

React Flow is the renderer/interaction adapter, not an additional canonical architecture database. Research and repository analysis produce evidence first. Models produce proposals; server schemas, reference validation, comparison and explicit user approval protect mutations.

### Existing extension points

| Responsibility | Existing locations / contracts | Rule for later work |
| --- | --- | --- |
| Semantic schema, compilation, validation | `src/lib/architecture-ir/{schema,compiler,validator,snapshot}.ts` | Preserve stable IDs, compatible optional fields, old snapshots and checksums. |
| Evidence/requirements/context/patterns | `src/lib/intelligence/{schema,input,context,patterns}.ts` | Retain source refs and unknowns; budget mandatory constraints and schema overhead. |
| Templates/catalog | `src/lib/domain/{templates,catalog,factory}.ts` | T01 extends these plus B05; never mutate canonical templates. |
| Graph/Explore/scenarios | G01/G02/G03 branch files `graph.ts`, `explore.ts`, `scenario-schema.ts`, `scenarios.ts` | Deterministic ID-based operations, bounded work, no model calls. |
| Presentation objects | P01 branch `presentation-objects.ts`, `presentation-commands.ts`; editor `presentation-tools.tsx`, `presentation-geometry.ts` | One common commit/history/save path; visual objects do not change semantic checksum. |
| Canvas | `src/components/editor/architecture-editor.tsx` and existing interaction modules | Extend existing controller, keyboard ownership and undo. Do not mutate React Flow as a competing command path. |
| Local recovery/cloud coordination | `src/lib/storage/{drafts,recovery-writer,cloud-save-coordinator}.ts` | Preserve guest/account isolation, debounce, migrations and failure recovery. |
| Immutable persistence | `src/lib/supabase/{architecture-artifacts,projects}.ts`, `supabase/migrations/` | Reuse artifact blobs, version links, checksums, idempotency, RLS and archive path. |
| Model access | `src/lib/ai/`; A01 branch router/task policy | All feature model calls pass through the shared gateway/router. |
| Durable work and admission | `src/lib/generation-jobs/`, `src/lib/server/rate-limit.ts`, related SQL | Real stages, bounded leases, shared limits; inspect actual implementation before selecting another infrastructure store. |
| Sharing | `src/app/share/[token]/page.tsx`, `read_shared_diagram`, share-token hashing | Read-only capability; token does not grant repository permission or private traceability access. |
| API saves | `src/app/api/v1/diagrams/[id]/route.ts`, restore routes | Server validation, version conflict, private asset checks, bounded payloads and atomic saves remain mandatory. |

The roadmap mentions Redis-compatible admission as a design option. Existing O01 uses shared database controls. Do not provision Redis or replace working admission merely because the older text mentions it; document any actual required infrastructure change.

### Compatibility and security invariants

- Old records must parse without receiving defaults that alter checksums. New optional fields preserve old-record readability; this does not guarantee an old strict client can read new records.
- Never rewrite immutable version history to apply an edit or restore. Restores create a new head with conflict/idempotency checks.
- Visual-only changes preserve semantic checksums and must not invalidate semantic reviews.
- Every command defines validation, execute, undo, redo, persistence impact and semantic/presentation classification.
- All external text is untrusted data. Do not execute repository scripts, document macros or instructions embedded in evidence.
- Source caches include authorized tenant/repository scope, content hash and parser/detector/prompt versions; shared content hashes do not bypass authorization.
- Limits, cancellation, retry, stale-completion protection and safe errors accompany the feature, not a later hardening pass.
- A source-observed quote means the excerpt was observed; it is not proof that the quote's claim is true.
- Structural dependency/failure results do not prove uptime, failover, deployment, capacity or runtime use.
- Private evidence, raw documents, source bodies, secrets and raw model reasoning do not enter routine logs.

## 5. Completed/frozen baseline: Days 1–11

These are merged implementation checkpoints, preserved rather than rebuilt. Hosted worker/configuration/load gates remain separate.

| Day / task | Delivered outcome | Merge evidence | Regression obligations |
| --- | --- | --- | --- |
| 1 / B00 | Reproducible baseline, retained-feature inventory and open-defect evidence. | #6, branch `chore/b00-baseline-verification` | Existing drafts/history and baseline journeys remain readable. |
| 2 / B01 | Structured prompt fields, supported 3,000-character input, retained text and specific errors. | #7, `feat/b01-structured-input` | 239/240/241/3,000 boundaries, explicit tenancy/constraints, no fabricated values. |
| 3 / B02 | Versioned Evidence/Requirement contracts, stable refs, unknowns, confidence and provenance validation. | #8, final evidence-integrity fix `5b05c1c` | AI cannot mark facts verified; invalid/cross-source refs rejected. |
| 4 / B03 | Evidence/requirements linked to immutable artifact graph through migration/save/history/readback. | #11 | RLS, checksums, guest/account isolation, replay and old-record compatibility. |
| 5 / B04 | Shared Context Compiler, normalization/deduplication, ranking, budgets and omission records. | #12 | Preserve mandatory constraints and source attribution under budget pressure. |
| 6 / B05 | Rule/pattern registries and proposal-only architecture knowledge. | #13 | Match/no-match/conflicts; user restrictions win; all specified pattern families retain fixtures. |
| 7 / B06 | Shared AI gateway with validation, bounded retries/timeouts/cancellation and usage metadata. | #14 | No direct provider calls in feature modules; deterministic no-key mode remains useful. |
| 8 / B07 | Durable stage jobs, leases, polling, cancellation, retry and stale-result rejection. | #15 | Interrupted/duplicate workers never publish twice; completed stages reused. |
| 9 / O01 | Shared admission/rate/concurrency controls, signed guest identities and honest capacity rejection. | #19 | Tenant/user limits, expiry/crash recovery, cost ceilings and Retry-After. Hosted multi-instance proof remains open. |
| 10 / B08 | Prompt-to-result workflow with real stage progress, validation/compilation and safe result publication. | #20 | Generate → inspect → save → reload, cancel/retry and rejected old completions. Worker deployment remains separate. |
| 11 / F01 | Predictable interaction states, keyboard ownership, Escape/pointer cleanup and scoped feedback. | #21; status follow-up #22 | One exclusive tool, editable-input shortcut isolation, preserved selection/drawing/recovery. |

The earlier plain-English Days 2/3 swapped the conceptual input/contracts narrative; the merged B01/B02 sequence above is authoritative. Do not repeat finished baseline work to satisfy a stale heading.

## 6. Immediate continuation sessions before new Day 17 scope

These sessions reconcile current work; they are not permission to merge or deploy.

### Session NEXT-1 — publish and retain this checkpoint

Outcome: all reviewed new G03 fixes/tests and this document are committed on their intended branches and the remote SHAs match. Preserve P01 separately. Exclude `audit-artifacts/`, local secrets, generated build/test outputs and `.agents/`. Record exactly which checks passed, including skips and remaining gaps.

### Session NEXT-2 — finish Day 16 local acceptance

1. Inspect the publication commits and carry only the shared persistence/test-fix commit onto P01 where applicable; do not cherry-pick the whole G03 feature into P01.
2. Add P01 browser journeys for moving a flat group as one transaction, undo/redo, save/reload, deleting an anchor, retaining the orphan warning and explicitly repairing targets.
3. Exercise actual P01 snapshot save/readback/share with all five object kinds; ensure semantic IR/checksum remain unchanged across presentation-only versions.
4. Verify the shared page renders read-only, excludes authoring controls and does not expand private evidence. G03 scenarios with unauthorized evidence references must remain unavailable rather than granting evidence access through a token.
5. Re-run applicable desktop/mobile, light/dark, keyboard/reduced-motion checks. Record full-suite mobile failures individually rather than extrapolating focused passes.
6. Reconcile G01 → G02 → G03 and independently P01 with current main in the approved sequence. Test the integrated result after dependencies merge.
7. Separate feature PRs, current CI, user approval and later deployment remain gates. Do not mark the whole day complete from only G03 tests.

### Session NEXT-3 — close earlier incomplete task boundaries

- T01 is not verified delivered; implement structured registry/clone/customize/variant behavior as its own issue.
- F02: complete group/label/routing and declared viewport acceptance beyond existing manual placement/panel fitting.
- F03: profile image-heavy drafts and actual input-to-paint/memory behavior. Existing freehand tests do not prove all performance targets.
- A01: verify fresh CI at the accounting-fix commit and review before merge.
- RS01/RS02: complete O01 integration and authorized provider evaluation before any public activation; product alternative review belongs to RS03.
- P0 configuration: review #41 separately, confirm configuration safely, and obtain deployment approval. Production is not a test environment.

### Session NEXT-4 — start Day 17 only when its prerequisites are usable

G04 needs G01/G03. G01A needs G01/P01. If only one path is ready, execute that bounded issue without claiming the entire day complete. Follow the corresponding cards below.

## 7. Preserved milestones and day-by-day inventory

| Milestone | Working-day slots | Completion condition |
| --- | --- | --- |
| Reliable Structured Generation | 1–10, frozen | Preserve merged baseline; retain external release gates. |
| Predictable Canvas and Understanding | 11–15 | Complete each original and amended issue; Day 11 frozen. |
| Scenarios, Review and Approved Changes | 16–22 | Safe deterministic exploration, presentation, review, comparison and approved changes. |
| Documentation and Document Input | 23–26 | Version-aware writing and authorized resumable document input. |
| Repository Evidence and Synchronization | 27–30 | Evidence-first scoped repository analysis and explicit approved drift updates. |
| Views and Operational Readiness | 31–34 | Shared semantic views, safe sharing/navigation and measured integrated validation. |

| Day | Original task | Amendment task |
| --- | --- | --- |
| 12 | F02 — Fix layout and canvas readability | T01 — Structured Template Registry and clone/customize/variant workflow |
| 13 | F03 — Reduce drawing and editing overhead | A01 — Task-aware AI Router |
| 14 | G01 — Implement the deterministic graph engine | RS01 — Research Intelligence v0 |
| 15 | G02 — Add Explore, route probe and architecture search | RS02 — TypeSafe Jev sufficiency judgment and alternatives |
| 16 | G03 — Add scenarios and flow playback | P01 — Presentation IR notes, focus, highlights, groups and annotations |
| 17 | G04 — Add failure impact analysis | G01A — Deterministic presentation traversal APIs |
| 18 | R01 — Expand validation, findings and health | F01A — Copy, duplicate, layer and context-menu commands |
| 19 | R02 — Build actionable Review mode | P02 — Sticky-note brainstorming layer |
| 20 | C01 — Implement semantic operations and diff | G02A — Design/Explore/Present modes and focused presentation |
| 21 | C02 — Add Before/Delta/After and safe apply | G03A — Presentation-oriented scenario/dataflow playback |
| 22 | C03 — Reuse comparison in history and sharing | G02B — Unified route probe and architecture search |
| 23 | D01 — Compile useful version-aware documents | C03A — History Before/Delta/After integration |
| 24 | D02 — Implement scoped refinement and explanation | O02A — Read-only sharing with Presentation Mode |
| 25 | I01 — Add document parser service and fixtures | RS03 — Research/template/architecture-alternative integration |
| 26 | I02 — Connect upload to resumable generation | H02A — GitHub authorization and repository scope selection |
| 27 | H01 — Add repository fixture analysis | H01A — Language inventory and universal code-evidence model |
| 28 | H02 — Connect the read-only GitHub App | H01B — Strong TypeScript/JavaScript and Python adapters |
| 29 | H03 — Generate architecture from repository evidence | H01C — Java, Go and C# adapters |
| 30 | H04 — Add incremental sync and drift approval | H01D — Infrastructure and deployability evidence |
| 31 | V01 — Add derived architecture views | H01E — Cross-language resolver and Repository Evidence Graph |
| 32 | O02 — Improve dashboard and read-only sharing | H03A — Evidence Graph → Architecture and Canvas → Source trace |
| 33 | F04 — Finish cross-screen frontend reliability | H04A — Changed-file accumulator and architecture-impact notification |
| 34 | O03 — Run integrated beta and performance gates | No new feature; full amended-product validation only |

## 8. Session cards for every remaining day

For each feature: **A** establishes/contracts or verifies existing core behavior; **B** connects the full user behavior and required tests; **C** is the common review/handoff session described in section 9. A day with two items has two issues/branches and two independent A/B/C sequences. Do not combine them into a day-sized PR.

Original-task “Retained scope” and “Original exit condition” below preserve the technical execution-card requirements. Session steps make those requirements actionable. Amendment cards add to them; they do not replace them.

### Day 12 / F02 — Fix layout and canvas readability

**Status:** In progress; manual placement and panel fitting merged (#27).

**Dependencies:** F01.

**Retained scope:** Pass a measured usable canvas rectangle into existing ELK layout. Preserve manual positions, place new nodes deterministically, and handle group boundaries, labels, routing and panel resize. Keep layout changes undoable.

**Session 12-F02-A:** Verify measured canvas bounds and panel changes; preserve manually placed nodes and the existing deterministic ELK placement path. Inspect the retained selection/connection bridge first.

**Session 12-F02-B:** Complete mixed/dense fixture checks for group bounds, labels, routing, light/dark desktop/tablet and save/reload; record semantic-checksum equality and unresolved visual defects.

**Original exit condition:** 15-node and dense fixtures avoid fixed controls at supported desktop/tablet widths; reopen preserves overrides; auto-layout does not modify semantic checksums.

**Session 12-F02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 12 / T01 — Structured Template Registry and clone/customize/variant workflow

**Status:** Not verified implemented; existing templates/patterns are groundwork.

**Dependencies:** B05; compatible IR, persistence and command contracts.

**Session 12-T01-A:** Inventory existing templates and B05 patterns; define structured versioned validated template records, supported metadata and pattern/architecture/presentation references. Keep user-facing templates distinct from internal patterns.

**Session 12-T01-B:** Implement clone-on-use with full fresh ID/reference remapping, customization and variant lineage; reuse existing save/undo. Never write edits back into canonical templates.

**Acceptance:** Canonical immutability; clone validity; references remapped across components/flows/presentation/scenarios when present; variant compatibility; undo and save/reload. No automatic internet-driven template publication.

**Session 12-T01-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace F02.

### Day 13 / F03 — Reduce drawing and editing overhead

**Status:** In progress; inspector/freehand merged (#32); image-heavy performance remains.

**Dependencies:** F01.

**Retained scope:** Buffer freehand points in a lightweight overlay and commit on pointer-up. Use bounded point reduction, memoized selectors and asset references. Group inspector edits on blur/Enter/debounce. Retain snapshot undo until command migration is justified.

**Session 13-F03-A:** Retain grouped inspector transactions and bounded 2,048-point freehand preview. Measure render isolation and a single undo step for one stroke or committed field edit.

**Session 13-F03-B:** Profile representative image-heavy drafts for binary copying, paint latency, dropped frames and memory. Change only measured bottlenecks; verify cancel, pointer capture, undo/redo, reload and existing asset-reference handling.

**Original exit condition:** Drawing does not rebuild all semantic nodes per sample; one stroke/field edit is one undo step; image-heavy edits do not repeatedly copy binary payloads.

**Session 13-F03-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 13 / A01 — Task-aware AI Router

**Status:** Published draft #33; accounting fixed at 95f8345; activation/review pending.

**Dependencies:** B06, B07, O01 and B04.

**Session 13-A01-A:** Review the existing task policies, provider/model selection, structured validation, timeout/cancellation, two-call retry/repair budget, explicit server-owned fallback and provider-health hints. Do not instantiate another gateway.

**Session 13-A01-B:** Verify failure metadata survives retries, repairs, timeouts and cancellation; admission rejection must not fabricate an attempted provider run. Review current CI and shared lease/cost settlement before any live endpoint activation.

**Acceptance:** Malformed output, zero/exhausted budgets, unavailable providers, fallback restrictions, cancellation and resolved-provider/model accounting. Paid/provider/live tests require specific authorization; a configured key alone does not enable the feature.

**Session 13-A01-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace F03.

### Day 14 / G01 — Implement the deterministic graph engine

**Status:** Verified locally and published at bca434f; pending integration/review.

**Dependencies:** B03.

**Retained scope:** Build a typed TypeScript adjacency engine over IR. Provide directed incoming/outgoing, upstream/downstream, dependencies, shortest path, bounded all-path search, cycles, orphans, connected components and impact analysis. Define dependency direction independently of visual arrow direction.

**Session 14-G01-A:** Review ID-only adjacency/traversal, explicit dependency semantics and deterministic ordering already implemented; avoid recreating the engine.

**Session 14-G01-B:** Rerun bounds/cancellation/cyclic/disconnected/parallel/bidirectional fixtures at the integration base; measure route costs at declared graph sizes and record truncation.

**Original exit condition:** Linear, branching, cyclic, disconnected and bidirectional fixtures pass. All-path queries have depth/path/time limits and report truncation; output contains IDs, never coordinates.

**Session 14-G01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 14 / RS01 — Research Intelligence v0

**Status:** Published draft #34 at a826cbc; server core only.

**Dependencies:** A01 and B04; O01 for activation.

**Session 14-RS01-A:** Retain freshness-need detection, generic injected search adapter, fresh-cache no-search path, bounded deterministic filtering/deduplication and attributed Research Evidence.

**Session 14-RS01-B:** Select/configure an authorized backend only when approved; implement shared admission/cost settlement and bounded request/response/network behavior. Feed retained evidence to the existing Context Compiler.

**Acceptance:** No-search/cache, stale/future/undated/duplicate/irrelevant sources, hostile snippets, omissions, failure and cancellation. Preserve source attribution and uncertainty. URL attribution checks are not SSRF protection; no automatic Architecture IR mutation.

**Session 14-RS01-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace G01.

### Day 15 / G02 — Add Explore, route probe and architecture search

**Status:** Verified locally at e845b35; draft PR #35 stacked on G01.

**Dependencies:** G01, F01.

**Retained scope:** Add read-only Explore interactions, evidence/requirement inspector, upstream/downstream highlighting, reset focus, source/target route probe and unified Cmd/Ctrl+K search. Unknown protocol/security fields remain Unknown.

**Session 15-G02-A:** Retain Explore/search/probe and authorized evidence inspector. Verify active unsaved edits feed the existing IR adapter, while focus and viewport remain transient.

**Session 15-G02-B:** Complete read-only/shared and supported mobile acceptance, keyboard focus/reset, unknown-field display and zero provider calls; retarget only after approved G01 merge.

**Original exit condition:** Explore cannot mutate; search focuses the right object; route results show supported facts and boundaries; all operations make zero AI calls.

**Session 15-G02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 15 / RS02 — TypeSafe Jev sufficiency judgment and alternatives

**Status:** Published draft #36 at f8be5c0; fixture-tested core; not activated.

**Dependencies:** RS01, A01, B04/B05; O01 before live use.

**Session 15-RS02-A:** Use the existing explicit server-injected TypeSafe adapter and quoted evidence; revalidate provenance/freshness/coverage rather than trusting supplied status fields. Limit alternatives to registered patterns.

**Session 15-RS02-B:** Complete admission/concurrency/cost settlement and deliberate review workflow. Revalidate the provider contract when implementing live integration; perform authorized evaluation before enabling it.

**Acceptance:** Strict requested-question/choice/probability/usage schema; bounded one-call transport; no automatic retries/fallback; conflicts/low confidence/insufficient evidence require review. No invented architecture and no automatic apply.

**Session 15-RS02-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace G02.

### Day 16 / G03 — Add scenarios and flow playback

**Status:** Implemented and locally tested; Day 16 acceptance remains.

**Dependencies:** G01, G02.

**Retained scope:** Persist scenario IDs, ordered steps and references in existing versioned IR. Seed scenarios from known patterns. Add picker, play/pause/next/previous/restart/exit, finite pulses and reduced-motion support.

**Session 16-G03-A:** Retain optional versioned scenarios, exact flow signatures, explicit pattern proposals and invalid-definition preservation. Review the new real database save/share test and forward migration.

**Session 16-G03-B:** Finish shared-page and dependency integration; verify picker/save, pause/step/restart/exit, cancellation, finite pulses, reduced motion and viewport restoration. Keep manual scenario authoring deferred.

**Original exit condition:** Playback follows valid flow IDs without AI calls; removing a referenced flow marks the scenario invalid; exit clears highlighting. Manual scenario construction is a later enhancement.

**Session 16-G03-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 16 / P01 — Presentation IR notes, focus, highlights, groups and annotations

**Status:** Published core/UI at 7592788; local acceptance incomplete.

**Dependencies:** Compatible persistence and editor commit/history; baseline F01/F02/F03.

**Session 16-P01-A:** Retain optional presentation objects and diagram adapter, strict versioned schemas, typed refs, bounds, no old-record defaults and immutable command transforms. Saved focus definitions must not activate focus.

**Session 16-P01-B:** Complete all five authoring kinds through common commit/undo/save, flat group movement, orphan retention/repair and transient focus restoration. Carry shared persistence fixes independently and add remaining browser/real-DB coverage.

**Acceptance:** Visual changes preserve semantic checksum; unique IDs and clone remapping; read-only mode; revisions; 200 objects/100 refs; reload/undo/redo; old record readability; no private evidence expansion. Inline canvas dragging and sticky-note brainstorming are not implicitly delivered.

**Session 16-P01-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace G03.

### Day 17 / G04 — Add failure impact analysis

**Status:** Not started as a roadmap feature.

**Dependencies:** G01, G03.

**Retained scope:** Simulate a selected component's unavailability in temporary state. Calculate dependents, affected scenarios, reachable alternatives and documented resilience gaps. Clearly label the result as structural impact, not measured capacity or outage prediction.

**Session 17-G04-A:** Define transient unavailable-component state over G01 dependency edges; compute affected dependents, scenarios and reachable alternatives without modifying saved IR.

**Session 17-G04-B:** Integrate controls and evidence-aware explanations. Test cycles, disconnected graphs, alternative-but-unverified failover, absent resilience evidence, reset/exit and zero AI calls.

**Original exit condition:** Known failure/alternate-path fixtures pass; traffic direction is not mistaken for dependency direction; no unverified failover is promised; saved architecture stays unchanged.

**Session 17-G04-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 17 / G01A — Deterministic presentation traversal APIs

**Status:** Not started.

**Dependencies:** G01 and P01.

**Session 17-G01A-A:** Inventory graph APIs and add typed presentation adapters for direct neighbors, upstream/downstream, connected groups, bounded paths and focus target sets. Keep graph results semantic IDs, coordinates in the presentation layer.

**Session 17-G01A-B:** Connect available focus/highlight consumers to the same adapters; expose cancellation, stable ordering and explicit incomplete/truncated results.

**Acceptance:** Cycles, parallel and bidirectional edges, disconnected targets, stale refs, bounded work and input-order determinism; no model calls, semantic writes or second graph engine.

**Session 17-G01A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace G04.

### Day 18 / R01 — Expand validation, findings and health

**Status:** Not started as a roadmap feature; inspect legacy review before extending.

**Dependencies:** B05, G01.

**Retained scope:** Extend current review checks through a separate validation registry and typed, version-bound findings. Cover authentication, rate limits, timeouts/retries, DLQ strategy, encryption, redundancy, monitoring and graph gaps. Add categorical health and coverage.

**Session 18-R01-A:** Extend existing rules into typed, stable, version-bound findings and categorical coverage/health. Distinguish missing information from verified defects.

**Session 18-R01-B:** Test auth/rate-limit/retry/timeout/DLQ/encryption/redundancy/monitoring and graph-gap rules; unchanged findings retain IDs, history remains, and resolution requires a fresh evaluation.

**Original exit condition:** Missing evidence yields Unknown/not documented rather than a verified vulnerability claim. Historical findings remain; unchanged finding IDs persist across reviews; resolve requires re-evaluation.

**Session 18-R01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 18 / F01A — Copy, duplicate, layer and context-menu commands

**Status:** Not started as a common-command extension.

**Dependencies:** F01 and P01; existing command/history/persistence.

**Session 18-F01A-A:** Inventory existing copy/layer actions; define validated shared commands and fresh ID/reference remapping for supported copied selections, including presentation objects.

**Session 18-F01A-B:** Wire keyboard and context-menu actions to the same execute/undo/redo path; preserve text-input ownership, clipboard limits and read-only restrictions.

**Acceptance:** Copy/paste/duplicate without ID collisions or broken refs, one undo transaction, layer preservation, save/reload, semantic versus visual classification and no mutation in Explore/share modes.

**Session 18-F01A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace R01.

### Day 19 / R02 — Build actionable Review mode

**Status:** Not started as a roadmap feature.

**Dependencies:** R01, F01.

**Retained scope:** Group findings by severity/category/component. Focus affected nodes/flows and show evidence, rationale and recommendation. Persist accept-risk/ignore status; recheck for resolution. Add review freshness and honest coverage labels.

**Session 19-R02-A:** Add severity/category/component groups and accessible focus/evidence/rationale/recommendation presentation to existing review UI.

**Session 19-R02-B:** Persist authorized accept-risk/ignore decisions and re-evaluate resolution. Verify stale review labeling, visual-only non-staleness, reload, keyboard, empty/error/retry states and no fabricated scores.

**Original exit condition:** Finding interactions are accessible; state is authorized and survives reload; visual-only edits do not mark reviews stale; no unsupported numerical score appears.

**Session 19-R02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 19 / P02 — Sticky-note brainstorming layer

**Status:** Not started; P01 positioned notes are the foundation.

**Dependencies:** P01 and common commands; F01A where clipboard/layers are needed.

**Session 19-P02-A:** Extend the existing note object/editor into the specified brainstorming interaction without adding semantic components or another note store. Define text editing, placement and selection within the existing interaction controller.

**Session 19-P02-B:** Integrate move/resize/style/layer/duplicate/delete through common commands; retain accessibility and read-only rendering.

**Acceptance:** Notes remain presentation-only; safe text rendering, empty/large-text limits, undo/redo, keyboard, theme/responsive behavior and reload. Do not add comments/mentions/multiplayer.

**Session 19-P02-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace R02.

### Day 20 / C01 — Implement semantic operations and diff

**Status:** Not started as a roadmap feature.

**Dependencies:** B03, G01.

**Retained scope:** Support ADD/REMOVE/UPDATE node and edge operations. Resolve temporary IDs and apply to cloned IR; validate before returning. Build one IR diff and separate presentation diff for future change/history/sync consumers.

**Session 20-C01-A:** Define the six node/edge ADD/REMOVE/UPDATE operations, temporary-ID resolution and cloned-IR validation. Keep split/merge outside scope.

**Session 20-C01-B:** Implement one semantic diff and a distinct presentation diff; test insert-between, removal, update, edge reroute, no-op, broken refs and stale base. Publish a shared contract for C02/C03/H04.

**Original exit condition:** Insert-between, remove, update, reroute as edge operations, invalid references, no-op and stale-base tests pass. Future split/merge operations remain excluded.

**Session 20-C01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 20 / G02A — Design/Explore/Present modes and focused presentation

**Status:** Not started.

**Dependencies:** G02, P01 and G01A.

**Session 20-G02A-A:** Define one coordinated mode/focus policy over the current editor. Specify entry/exit, editing permissions, toolbar/panel visibility, keyboard ownership and transient viewport restoration.

**Session 20-G02A-B:** Implement focused architecture presentation using saved definitions and shared traversal/highlight APIs. Coordinate panel space and responsive viewing rather than nesting independent mode engines.

**Acceptance:** Mode switches do not save transient state; Design restores controls; Explore/Present/shared views cannot mutate; Escape/close/unmount/reduced-motion/keyboard behavior; zero AI for ordinary focus.

**Session 20-G02A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace C01.

### Day 21 / C02 — Add Before/Delta/After and safe apply

**Status:** Not started as a roadmap feature.

**Dependencies:** C01, B06, F02.

**Retained scope:** Retrieve scoped context for change requests; use deterministic supported commands or gateway proposals. Preview named changes with labels/icons, then explicitly apply through existing atomic save. Bind preview to diagram/IR versions and local revision.

**Session 21-C02-A:** Build scoped deterministic/gateway proposals and Before/Delta/After preview using C01; bind to diagram version, IR version and local revision.

**Session 21-C02-B:** Apply only after explicit approval through existing atomic save. Test cancellation, intervening edits, repeated apply/idempotency and exact Redis-between-service-and-database edges without implying a new source of truth.

**Original exit condition:** Add Redis between service and database previews exact edges; intervening edits invalidate preview; cancel saves nothing; repeated apply creates one version. Redis is not made the source of truth implicitly.

**Session 21-C02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 21 / G03A — Presentation-oriented scenario/dataflow playback

**Status:** Not started.

**Dependencies:** G03 and G02A.

**Session 21-G03A-A:** Reuse G03 scenario state, timers, validation and finite pulses in Present mode; add presentation framing and readable step context without a new playback engine.

**Session 21-G03A-B:** Coordinate mode changes, focus, pause/background behavior and exit restoration with the common presentation policy.

**Acceptance:** Valid and invalid/stale journeys, cycles, cancellation, reduced motion, read-only viewing, preserved viewport/history and zero AI; no manual scenario-authoring expansion.

**Session 21-G03A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace C02.

### Day 22 / C03 — Reuse comparison in history and sharing

**Status:** Not started as a roadmap feature; existing history must be reused.

**Dependencies:** C02.

**Retained scope:** Add compare/open/restore to existing history with author/source metadata when available. Preserve work before restore and create a new head. Use a minimal read-only share shell with Explore/flow/route/docs only as permitted.

**Session 22-C03-A:** Extend history open/compare/restore with available author/source metadata and archive-aware reads; preserve unsaved work before restore.

**Session 22-C03-B:** Create a conflict-safe new head on restore and verify immutable history, replay and failed archive retrieval. Coordinate read-only comparison with sharing and navigation preservation; do not duplicate C01 diff.

**Original exit condition:** Hot/archive comparisons pass; restore is idempotent and conflict-safe; viewers cannot mutate; private repo evidence is excluded unless separately authorized.

**Session 22-C03-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 22 / G02B — Unified route probe and architecture search

**Status:** Not started as the amended completion scope; basic search/probe exists.

**Dependencies:** G02, G01A and authorized available evidence.

**Session 22-G02B-A:** Inventory G02 search/probe and extend the same index/contracts across available components, flows, requirements and permitted evidence; preserve unknown fields and explain route boundaries.

**Session 22-G02B-B:** Unify keyboard entry, result focus, source/target selection, bounded route choices and reset across supported modes without duplicate search or graph services.

**Acceptance:** Exact target focus, no unauthorized source text, cycle/depth/result limits, cancellation, empty/no-route/truncated states, read-only and responsive interactions; no AI.

**Session 22-G02B-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace C03.

### Day 23 / D01 — Compile useful version-aware documents

**Status:** Not started as a roadmap feature; document saving already exists.

**Dependencies:** B03, R01, G03.

**Retained scope:** Inspect existing document-save implementation first. Extend it with deterministic sections from requirements, IR, findings, scenarios and decisions; track derived/user-authored/AI-proposed origins and source hashes. Refresh only selected derived sections.

**Session 23-D01-A:** Inventory current document persistence and compile deterministic sections from requirements, architecture, scenarios, findings and decisions; track source hashes and origins.

**Session 23-D01-B:** Refresh only selected derived sections. Verify user prose survives opening/refresh, affected sections become stale on semantic changes, explicit unknowns remain and local/cloud immutable document recovery works.

**Original exit condition:** Opening never regenerates user text; unknowns are explicit; semantic changes mark affected derived sections stale; existing immutable document save/recovery remains functional.

**Session 23-D01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 23 / C03A — History Before/Delta/After integration

**Status:** Not started.

**Dependencies:** C01/C02/C03.

**Session 23-C03A-A:** Reuse the same semantic/presentation diff model for chosen history versions, including source/author metadata only where known and archive/loading failures.

**Session 23-C03A-B:** Integrate Before/Delta/After navigation and restore preview without altering old versions; ensure cancelled comparisons preserve current workspace context.

**Acceptance:** Identical versions/no-op, semantic versus visual changes, archived/unavailable data, stale-base restore and read-only comparison; no independent diff engine.

**Session 23-C03A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace D01.

### Day 24 / D02 — Implement scoped refinement and explanation

**Status:** Not started as a roadmap feature.

**Dependencies:** D01, B06, G02.

**Retained scope:** Send selected block, instruction, source revision and relevant ContextPack. Return bounded document patches with insert/replace/cancel preview. Add cached audience-specific explanation without changing facts; default component inspector remains deterministic.

**Session 24-D02-A:** Define selected-block patch requests containing instruction, source revision and bounded relevant context; use the shared gateway and audience/version-aware cache.

**Session 24-D02-B:** Add insert/replace/cancel preview and verify stale/cancelled responses never overwrite unrelated text. Preserve selection and formatting/copy/export behavior; ordinary component selection makes no AI call.

**Original exit condition:** Prompt reaches the gateway; stale patches fail; cancelling preserves text; no whole-document append masquerades as refinement; normal component selection makes zero AI calls.

**Session 24-D02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 24 / O02A — Read-only sharing with Presentation Mode

**Status:** Not started; basic share route already exists.

**Dependencies:** Existing share authorization, G02A; C03 where comparison is exposed.

**Session 24-O02A-A:** Extend the authorized minimal share shell with available Present/Explore/scenario/docs/route viewing and version/time context. Explicitly define repository/evidence exclusions.

**Session 24-O02A-B:** Support safe focus, pan/zoom, keyboard and reduced-motion controls plus revoked/expired/deleted-link behavior; use the existing token and persistence path.

**Acceptance:** No edit/API mutation through shared UI or token; no private source paths/excerpts/install metadata; tests for expiry/revocation, supported mobile layouts and disabled unavailable capabilities.

**Session 24-O02A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace D02.

### Day 25 / I01 — Add document parser service and fixtures

**Status:** Not started.

**Dependencies:** B03, B07.

**Retained scope:** Define DocumentParser/ParsedDocument boundaries and a Docling adapter outside Next.js. Support PDF/DOCX plus lightweight Markdown parsing. Preserve pages, sections, tables/code and cache by tenant-scoped content hash plus parser version.

**Session 25-I01-A:** Define BuildRAX-owned DocumentParser/ParsedDocument interfaces; implement isolated PDF/DOCX Docling adapter and lightweight Markdown parser using local fixtures.

**Session 25-I01-B:** Preserve pages/headings/tables/code; enforce file/page/time/memory/path limits, private tenant-scoped hash+parser-version cache and malformed/encrypted failures. Document OCR coverage honestly.

**Original exit condition:** Local fixtures parse with locations; malformed/encrypted/unsupported files return specific errors; quotas/timeouts apply; filenames/archive paths cannot escape isolation; parse uses zero model calls.

**Session 25-I01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 25 / RS03 — Research/template/architecture-alternative integration

**Status:** Not started.

**Dependencies:** RS01, RS02, T01 and C01/C02 validated proposal workflow.

**Session 25-RS03-A:** Connect freshness-justified research, reviewed sufficiency and registered alternatives to the existing user workflow; preserve evidence provenance and explain missing/conflicting information.

**Session 25-RS03-B:** Allow deliberate alternative comparison and approved clone/change actions through validated proposals and existing version saves. Retain canonical template immutability and explicit source/cost boundaries.

**Acceptance:** No auto-publication or auto-apply; insufficient/conflicting/low-confidence evidence remains reviewable; stale/cancelled proposals cannot overwrite; audit usage and source refs without logging private content.

**Session 25-RS03-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace I01.

### Day 26 / I02 — Connect upload to resumable generation

**Status:** Not started.

**Dependencies:** I01, B08.

**Retained scope:** Add Upload document entry, private source upload and genuine parse/extract/generate progress. Convert sections into Evidence and Requirement IR using the shared pipeline. Retain parse output on downstream failure.

**Session 26-I02-A:** Add authenticated upload, source preview, extracted requirement review and genuine upload/parse/extract/generate stages using B07/B08.

**Session 26-I02-B:** Test all supported formats through save/reload and retries after synthesis/layout failure without re-upload/reparse. Confirm cache authorization, cancellation, unknown facts and source privacy.

**Original exit condition:** Upload → requirements → architecture passes; repeat content reuses authorized cache; failed synthesis never reuploads/reparses; original source is absent from analytics.

**Session 26-I02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 26 / H02A — GitHub authorization and repository scope selection

**Status:** Not started.

**Dependencies:** Existing authentication/authorization; H01A contract coordination.

**Session 26-H02A-A:** Separate login from repository permission. Extend the read-only GitHub App path with installation, allowed repository and branch selection; resolve immutable commit identity.

**Session 26-H02A-B:** Require entire-repository or selected scope plus include/exclude files/folders before scanning. Validate paths and permissions server-side; retain tokens only on the server.

**Acceptance:** No automatic full scan after connection; unauthorized/revoked access denied, immutable commit retained, scope exclusions enforced and no write permission or browser secret.

**Session 26-H02A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace I02.

### Day 27 / H01 — Add repository fixture analysis

**Status:** Not started.

**Dependencies:** B03, B04.

**Retained scope:** Create inventory/filtering and Tree-sitter detector interfaces before live access. Initial detector set: Next.js, Express, FastAPI, PostgreSQL/Prisma/Supabase, Redis, queue workers and Docker configuration. Build an evidence graph with commit/file/line references.

**Session 27-H01-A:** Create safe bounded inventory/filtering and detector interfaces before live authorization. Respect ignore files; skip generated/vendor/binary content and never execute repository code.

**Session 27-H01-B:** Use fixture detectors for Next.js, Express, FastAPI, PostgreSQL/Prisma/Supabase, Redis, queues/workers, external calls and Docker. Emit scoped commit/file/line evidence and separate declared dependencies from observed usage.

**Original exit condition:** Fixture scans make zero AI calls and execute no repository code; generated/vendor/binary files are skipped; dependency declarations are distinguished from observed runtime usage.

**Session 27-H01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 27 / H01A — Language inventory and universal code-evidence model

**Status:** Not started.

**Dependencies:** H01 fixture harness, Evidence IR/B03/B04.

**Session 27-H01A-A:** Define language-neutral evidence IDs, source spans, commit/path/language/parser versions, observed/declaration/inference labels and unresolved relationships. Inventory languages and exclusions within bounded scope.

**Session 27-H01A-B:** Publish fixture/adapter contracts shared by TS/JS, Python, Java, Go, C# and infrastructure evidence; keep repositories and deployment units distinct.

**Acceptance:** Deterministic inventory, unknown-language disclosure, scope limits, source span validity, stable IDs and tenant isolation. Adapters never emit Architecture IR or execute source.

**Session 27-H01A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace H01.

### Day 28 / H02 — Connect the read-only GitHub App

**Status:** Not started.

**Dependencies:** H01, B07.

**Retained scope:** Separate GitHub sign-in from repository authorization. Add installation, permitted repo/branch selection and commit resolution; request Metadata/Contents read only. Keep tokens server-side and fetch immutable commit content through bounded jobs.

**Session 28-H02-A:** Extend H02A authorization into immutable commit fetch and B07 scanning jobs. Retain explicit permitted repository/branch/scope selection and server-side tokens.

**Session 28-H02-B:** Verify actual progress, bounded file/size/time costs, scan summary, revoked installations and unauthorized repositories; reopening resolves the same scanned commit. Do not request write permissions.

**Original exit condition:** Unauthorized repos and revoked installations fail safely; secrets never reach browser/logs; repo/size/file/time limits apply; no write permission is requested.

**Session 28-H02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 28 / H01B — Strong TypeScript/JavaScript and Python adapters

**Status:** Not started.

**Dependencies:** H01/H01A.

**Session 28-H01B-A:** Implement fixture-driven adapters for imports/calls/routes/services/data access/jobs and relevant framework conventions using the shared evidence model.

**Session 28-H01B-B:** Cover monorepo/module boundaries and ambiguous/dynamic usage; retain unresolved relations instead of inventing certainty. Integrate parser caching and limits.

**Acceptance:** Next.js/Express/FastAPI plus database/queue/external-call fixtures; syntax errors, generated/vendor exclusion, import aliases and declaration-versus-runtime evidence. Zero AI for scanning.

**Session 28-H01B-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace H02.

### Day 29 / H03 — Generate architecture from repository evidence

**Status:** Not started; full polyglot acceptance gated by H01E.

**Dependencies:** H02, B08.

**Retained scope:** Show measured scan results before Generate. Feed the evidence graph into shared context/rules/patterns; use at most one normal abstraction call. Link grouped components to multiple evidence items and commit-pinned source links.

**Session 29-H03-A:** Show measured evidence summary before generation, then feed the resolved evidence graph through shared context/patterns/rules and at most one normal ambiguity/abstraction call.

**Session 29-H03-B:** Validate/compile a proposal with many-to-one source trace. Test observed versus inferred labels, authorized commit-pinned links and retention of the last approved architecture when abstraction fails.

**Original exit condition:** Repository fixture → evidence → architecture → inspector passes; suggested components are labelled; existing verified architecture survives failed abstraction.

**Session 29-H03-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 29 / H01C — Java, Go and C# adapters

**Status:** Not started.

**Dependencies:** H01/H01A; shared adapter harness.

**Session 29-H01C-A:** Add the three specified language adapters with consistent source references, symbol/module/service evidence and explicit supported framework/detector scope.

**Session 29-H01C-B:** Cover imports/calls/routes/data/worker boundaries where supported and unresolved dynamic behavior; run mixed-language fixtures through the shared contract.

**Acceptance:** No folder-name-only service claims; compare normalized evidence shape across languages, deterministic results, syntax/unsupported cases and bounded scans. Do not add deferred languages.

**Session 29-H01C-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace H03.

### Day 30 / H04 — Add incremental sync and drift approval

**Status:** Not started; full polyglot acceptance gated by H01E.

**Dependencies:** H03, C02.

**Retained scope:** Store repo/branch/commit/parser/evidence/architecture versions. Scan only changed files and remove deleted evidence; invalidate broader analysis on parser/config changes. Produce drift through shared operations/diff. Provide apply/ignore/review individually with revalidation.

**Session 30-H04-A:** Track repository/scope/commit/parser/detector/evidence/architecture baselines; process changes, renames and deletions, with wider invalidation on parser/config changes.

**Session 30-H04-B:** Present drift through C01/C02, support Apply/Ignore/individual review, validate the whole partial approval and conflict-check the base. Preserve manual layout and last-good architecture on failures; no automatic synchronization.

**Original exit condition:** Rename/delete/change fixtures update evidence; apply uses base-version checks; ignore records its baseline; partial approval validates the whole result; failed sync preserves last-good architecture.

**Session 30-H04-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 30 / H01D — Infrastructure and deployability evidence

**Status:** Not started.

**Dependencies:** H01A and repository inventory.

**Session 30-H01D-A:** Extract supported manifests, Dockerfiles, deployment/process/port/route and CI evidence without executing builds or scripts. Require evidence for deployable boundaries.

**Session 30-H01D-B:** Connect infrastructure records to code units with attribution, uncertainty and conflicts; represent missing deployability evidence explicitly.

**Acceptance:** Fixtures distinguish folders/packages from deployable services and declared config from runtime facts. Enforce scope/source refs; Terraform/HCL analysis remains explicitly deferred.

**Session 30-H01D-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace H04.

### Day 31 / V01 — Add derived architecture views

**Status:** Not started.

**Dependencies:** G03, G04, R02.

**Retained scope:** Build a View Compiler over the same IR for System, Data Flow, Sequence, Deployment, Security and Failure. Sequence requires a scenario; other unavailable facts show insufficient information. Store presentation overrides by view.

**Session 31-V01-A:** Build one View Compiler over semantic IR/scenarios for System, Data Flow and Sequence, with per-view presentation overrides.

**Session 31-V01-B:** Add Deployment, Security and Failure projections only from supported facts. Verify all views follow one semantic change, switching adds no semantic version, and unknown deployment/security data stays unknown.

**Original exit condition:** One semantic change updates all projections; view switching does not create semantic versions; each view has independent visual overrides without duplicate semantic graphs.

**Session 31-V01-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 31 / H01E — Cross-language resolver and Repository Evidence Graph

**Status:** Not started; pull forward before full H03/H04 acceptance.

**Dependencies:** H01A, H01B, H01C, H01D.

**Session 31-H01E-A:** Resolve cross-file/language/service/API relationships into the shared Repository Evidence Graph using normalized evidence, stable identity and explicit unresolved edges.

**Session 31-H01E-B:** Test mixed-language repositories, ambiguous matches, renamed/deleted sources, cyclic dependencies and scope boundaries; pass resolved graph to H03 rather than constructing architecture in adapters.

**Acceptance:** Polyglot end-to-end traceability, deterministic resolution, no invented certainty and cache/version invalidation. Nominal Day 31 must not be used to excuse marking Day 29/30 full polyglot acceptance complete early.

**Session 31-H01E-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace V01.

### Day 32 / O02 — Improve dashboard and read-only sharing

**Status:** Not started as a roadmap feature; dashboard/share basics already exist.

**Dependencies:** C03, H03, R02.

**Retained scope:** Extend existing dashboard cards with real thumbnails, search/sort, available health, source commit and findings. Expose Open/History/Share and Sync only when applicable. Keep private repository details out of public share output.

**Session 32-O02-A:** Extend existing dashboard with real thumbnails, search/sort, known health/findings/source commit and applicable Open/History/Share/Sync actions.

**Session 32-O02-B:** Unify share-management flows with O02A/C03: copy/revoke/expiry/read-only behavior and private source exclusions. Verify cards contain real data, empty/error states and permission-safe actions.

**Original exit condition:** Cards represent real data; search/sort work; missing analysis shows Unknown; public shares expose no private source paths, evidence excerpts or installation metadata.

**Session 32-O02-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 32 / H03A — Evidence Graph → Architecture and Canvas → Source trace

**Status:** Not started.

**Dependencies:** H01E and H03; authorized evidence UI.

**Session 32-H03A-A:** Complete many-to-many mapping from evidence graph to approved architecture components/flows while keeping observed facts distinct from abstraction suggestions.

**Session 32-H03A-B:** Expose authorized Canvas → Source trace with exact commit/path/span, copy-path and commit-pinned links, including grouping with multiple evidence references.

**Acceptance:** Round-trip trace coverage, unknown/unresolved evidence, changed/deleted source history, revoked access and no private repository exposure through public shares; retain approved architecture on failed regeneration.

**Session 32-H03A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace O02.

### Day 33 / F04 — Finish cross-screen frontend reliability

**Status:** Not started as cross-product acceptance.

**Dependencies:** F01, G02, R02, D02, I02, H03.

**Retained scope:** Preserve zoom, selection, mode and inspector through workspace navigation. Add route error/loading boundaries and recovery actions. Complete keyboard names/focus, contrast, reduced motion and mobile read/explore behavior; do not expand into full mobile authoring.

**Session 33-F04-A:** Preserve zoom, selection, mode and inspector across Canvas/Docs/Review navigation. Add scoped loading/error boundaries and recovery without losing the architecture.

**Session 33-F04-B:** Complete keyboard names/focus/contrast/reduced motion, storage failures and supported mobile read/explore. Recheck copy/revoke messages and light/dark responsive layouts; full mobile authoring remains deferred.

**Original exit condition:** Canvas → Docs → Review → Canvas preserves context; panel failures leave architecture intact; storage errors are not reported as missing drafts; supported responsive and keyboard journeys pass.

**Session 33-F04-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. Keep this task's issue, branch and PR independently reviewable.

### Day 33 / H04A — Changed-file accumulator and architecture-impact notification

**Status:** Not started.

**Dependencies:** H04, H01E and existing job/notification contracts.

**Session 33-H04A-A:** Accumulate authorized changed/renamed/deleted-file events with deduplication and stable baselines; reuse incremental analysis and bounded jobs.

**Session 33-H04A-B:** Surface evidence-based architecture-impact notifications with review entry points; show pending/failed/stale states and record ignored baselines.

**Acceptance:** No silent Architecture IR synchronization; duplicate/out-of-order events, revocation, failed scans and stale proposals preserve the last approved architecture. Notifications must not leak source content.

**Session 33-H04A-C:** Apply section 9, retain a dedicated issue/branch/PR, and update evidence and remaining gates. This task does not replace F04.

### Day 34 / O03 — Run integrated beta and performance gates

**Status:** Not started; validation-only product scope.

**Dependencies:** O01, O02, F04, H04, V01.

**Retained scope:** Add beta:check for lint/type/unit/build/desktop/responsive/database/configuration checks. Run the nine specification E2Es plus recovery/security scenarios. Measure queue wait separately from model execution. Validate staging, telemetry alerts and recovery runbook.

**Session 34-O03-A:** Assemble/run beta:check and all integrated journeys, database/RLS/security/polyglot/source-trace/accessibility/configuration checks. No unfinished product feature enters this day.

**Session 34-O03-B:** Run authorized staging performance/load/failure/backup/rollback drills, publish measurements and residual limits, and obtain a separate release decision. A failing gate blocks rollout; move major unfinished scope to a later milestone.

**Original exit condition:** Publish test results and measured p95 for deterministic/model generation, route probe and saves. No release on missing DB checks, critical defects or unverified tenant isolation.

**Session 34-O03-C:** Apply the shared acceptance/publication checklist in section 9; record the exact commit, tests, remaining limits and next dependency. No product scope may be introduced here.

## 9. Acceptance and handoff required for every feature session C

Before coding: inspect Git status, exact base, task/issue, current roadmap and `APPROACH.md` (tracked uppercase; some older prose uses lowercase). Read only relevant source/contracts/tests and prerequisite handoffs. Check that the feature does not already exist. State scope and expected user outcome.

Before calling a task ready:
1. Normal, empty, loading, failure, retry, unauthorized and interrupted paths are covered where relevant.
2. UI changes have accessible names, keyboard/focus ownership, supported desktop/mobile layouts, light/dark and reduced-motion checks.
3. API boundaries specify input/output schemas, authentication/authorization, validation errors, limits, conflict/idempotency and safe observability.
4. Migrations describe purpose, RLS/permission impact, index needs, immutability/compatibility and rollback/forward-fix strategy; tests cover valid and denied access and old data.
5. Run focused tests and required lint/type/unit/build gates. Run database and browser gates when the behavior requires them. Never label a skipped or unavailable check passed.
6. Measure performance if changing a critical path; name fixture, workload, machine/browser and metric. Do not infer responsiveness from a successful render.
7. Record manual verification separately from browser automation: browser/viewport, fixture, expected/actual behavior, screenshots when useful and remaining limits.
8. Update the issue-specific progress note, `APPROACH.md`, `CHANGELOG.md` and production matrix without conflating implementation/merge/release.
9. Commit logical changes, inspect diff and secret/generated-file exclusions, push intended branch and prepare a focused PR. Keep a day/task branch brief.
10. Obtain explicit user approval before merging into main. Do not merge a stacked child into its feature parent as a shortcut.
11. Retest after dependency integration/retargeting; obtain separate authority for live enablement, migrations or release.

A suitable session handoff:

```text
Day/task/session:
Milestone and issue:
Branch, starting SHA, final SHA and parent dependency:
Existing changes preserved:
User behavior delivered:
Semantic/presentation/API/database contracts touched:
Files and existing subsystems extended:
Exact commands and results (including skipped checks):
Manual verification and screenshots:
Security/compatibility/performance evidence:
Unfinished work and concrete blocker:
PR/base/CI/approval/deployment state:
Next bounded session and first command:
```

Do not introduce new abstractions, dependencies or parallel systems merely to organize the roadmap. Use the smallest change that fully satisfies the issue. An incomplete parent task remains in progress even if a subissue passes.

## 10. Dependency and merge order

### Canvas / deterministic features

`main → G01 → G02 → G03`

P01 starts independently from main. Integrating P01 and G03 eventually touches shared editor/schema/snapshot code; resolve conflicts by preserving both behaviors and rerun combined compatibility/browser tests. Carry the shared persistence fix `2e0cec7` as a distinct prerequisite where needed. Do not assume a P01 branch already includes it.

After G01 approval/merge, retarget G02 #35 to main, inspect its reduced diff and retest. After G02 approval/merge, do the same for G03. Keep P01 a separate review unit. G01A/G02A/G03A reuse these foundations rather than becoming replacements.

### AI / research

`main → A01 #33 → RS01 #34 → RS02 #36`

Each child PR currently targets the parent feature branch to show a bounded diff. Merge approved prerequisites into main first, then retarget/reconcile each child and rerun checks. A01's old accounting failure is repaired; fresh CI/review and live activation are distinct remaining gates.

RS03 also requires T01 and the C01/C02 proposal/approval workflow. Do not expose live RS01/RS02 routes before shared admission/concurrency/cost handling and authorized provider evaluation.

### Review / change / documents

G01 + B05 → R01 → R02. B03 + G01 → C01 → C02 → C03 → C03A. D01 consumes B03/R01/G03; D02 consumes D01 and the shared gateway/context. I01 uses B03/B07; I02 connects I01/B08. Existing document/history functionality is retained.

### Repository path and scheduling inversion

H02A establishes explicit repository permission and scope before scanning. H01/H01A establish the fixture harness and universal evidence model. H01B/H01C/H01D produce language/infrastructure evidence. **H01E resolution is a prerequisite for full polyglot H03/H04 acceptance**, despite its Day 31 label. Pull it forward or split H03/H04 into clearly partial fixtures and later integrated acceptance; never falsely complete the full tasks early.

H03A finishes Canvas → Source trace; H04A adds accumulation and impact notification to H04. All approved drift uses C01/C02, not automatic architecture synchronization.

### Release path

O02A needs G02A and the existing share boundary. V01 uses G03/G04/R02. O02/F04 bring dashboard/sharing/navigation together. O03 validates the complete amended product and is the final gate, not a development buffer.

## 11. Original session numbering reconciliation

The original plain-English roadmap is preserved unchanged on this documentation branch. Its numbers shifted relative to the technical/amended schedule. The following mapping retains every original Day 12–34 pair exactly once, without scheduling its task twice.

| Original session pair | Retained task owner in amended schedule |
| --- | --- |
| 12A / 12B | Selection/connections bridge, merged PR #23; prerequisite canvas behavior. |
| 13A / 13B | F02, amended Day 12. |
| 14A / 14B | F03, amended Day 13. |
| 15A / 15B | G01, amended Day 14. |
| 16A / 16B | G02, amended Day 15. |
| 17A / 17B | G03, amended Day 16. |
| 18A / 18B | G04, amended Day 17. |
| 19A / 19B | R01, amended Day 18. |
| 20A / 20B | R02, amended Day 19. |
| 21A / 21B | C01, amended Day 20. |
| 22A / 22B | C02, amended Day 21. |
| 23A / 23B | C03, amended Day 22; navigation regression also verified under F04. |
| 24A / 24B | D01, amended Day 23. |
| 25A / 25B | D02, amended Day 24. |
| 26A / 26B | I01, amended Day 25. |
| 27A / 27B | I02, amended Day 26. |
| 28A / 28B | H01, amended Day 27. |
| 29A / 29B | H02, amended Day 28. |
| 30A / 30B | H03, amended Day 29. |
| 31A / 31B | H04, amended Day 30. |
| 32A / 32B | V01, amended Day 31; dashboard subwork joins O02, without duplicate implementation. |
| 33A / 33B | F04, amended Day 33; sharing subwork joins O02/O02A. |
| 34A / 34B | O03, validation only. |

A request such as “Day 16A” is ambiguous without a task ID. Use “Day 16 / G03 / A” or “Day 16 / P01 / A” in future work requests.

## 12. Detailed Day 16 implementation and test context

### G03 behavior already present

- Optional versioned semantic scenarios in Architecture IR and the materialized diagram; no default fields added to old artifacts.
- Up to 20 saved definitions, 1–32 continuous ordered steps, stable IDs/revisions and requirement/evidence references.
- Flow signatures preserve exact canonical bindings; semantic changes/deletion invalidate playback while retaining readable saved definitions.
- Pattern seeding produces at most three deterministic client-to-data or messaging proposals, saved only by explicit action. It does not fabricate verified login/checkout behavior.
- Picker, Play/Pause/Next/Previous/Restart/Exit, bounded 1.2-second ticks, one 600-ms pulse per step, no pulse under reduced motion.
- Playback/pause protects editing; transient focus/viewport never writes into semantic history. Backgrounding pauses, switching/close/Escape/unmount cancel and restore prior view.
- Shared scenarios without authorized required traceability remain unplayable; a share token must not become private-evidence permission.
- Mobile panel visibility has limits; coordinated Present mode belongs to G02A/G03A.

### P01 behavior already present on its own branch

- Optional Presentation IR `objects` and Diagram `presentationObjects`; existing persistence, validation, payload limits and recovery are reused.
- Positioned notes, anchored annotations, targeted highlights, flat visual groups and saved focus definitions.
- Up to 200 objects, 100 typed targets per object; component/flow/primitive refs, unique IDs, bounded safe styles/text, no nested object graph.
- Form-based create/edit/duplicate/delete/repair; one transaction for moving a flat group, preserving manual-placement metadata.
- Missing targets warn and remain recoverable; new/edited references must be valid. Focus only activates transiently and restores the previous view on exit/close/target removal.
- Layer capacity covers 150 components + 300 flows + 300 primitives + 200 presentation objects.
- Visual duplicate gets a fresh object ID while keeping intended architecture targets. Whole-architecture clone uses full ID remapping.
- Remaining dedicated browser group/orphan tests and P01 database/shared acceptance are explicit NEXT-2 work. Do not confuse P01 notes with complete P02 brainstorming.

### Checkpoint verification on G03

| Check | Result / scope |
| --- | --- |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm test` | 240 passed, one opt-in database test skipped by default. |
| `npm run release:scan` | Passed; 15 uniquely timestamped migrations. |
| `npm run build -- --webpack` | Passed, including TypeScript/static generation. |
| Changed browser suites, Chromium + mobile WebKit | 18 passed: auth navigation, local recovery/storage, G03 background/switch/close and changed/deleted-flow reload. |
| Fresh disposable database bootstrap | All 15 migrations applied. Existing local DB and production were not modified. |
| Repository SQL suite | 173 pgTAP assertions passed. |
| Explicit G03 persistence test | Passed; nine actual SQL assertions through migration, version save/readback, share and tenant denial. |

Earlier feature-branch evidence, **not rerun as a combined product in this publication session**:
- G01: 211 unit tests plus lint/type/build.
- G02: 220 unit tests; 39 Chromium passes and one platform skip; lint/type/build.
- A01 accounting fix: 216 tests in 38 files; lint/type/build.
- RS01: 239 tests in 39 files; release scan/lint/type/build; fixture search/provider only.
- RS02: 267 tests in 41 files; release scan/lint/type/build; fixture TypeSafe transport only.
- P01: 209 tests in 38 files; lint/type/release scan/build; 39 Chromium passes plus one skip and four focused desktop/mobile checks.
- Historical broad P01 desktop/mobile run: 49 passes, 23 skips, eight failures. Two P01 overlap defects were fixed and focused checks rerun. Shared sign-in/recovery fixtures now pass on G03; this does **not** establish a fully green integrated P01 mobile suite. Structured-generation/mobile baseline and fresh broad P01 rerun remain to assess.

No live provider, authenticated hosted browser, staging load or production validation is claimed. SQL-role tests are meaningful real database integration but are not a browser login/session test.

### Shared fixes and exact failure explanation

Migration `202610300015_snapshot_save_and_share.sql`:
1. Qualifies `review_runs.diagram_id` and `documents.diagram_id` during semantic save invalidation. They previously collided with the RPC output variable, failing the semantic-changed branch.
2. Resolves shared payload via `diagram_version_artifacts.diagram_blob_id → artifact_blobs.hot_payload`, with legacy `diagram_versions.payload` fallback. Compatibility payloads are deliberately cleared by an earlier migration, so reading only that field returned null.
3. Keeps RPC signatures, token scope/expiry/revocation/deleted-project checks, RLS and immutable history. No new application storage system or data rewrite.
4. SQL regressions now prove semantic version advance and review/document staleness, canonical share readback and invalid/expired/revoked/deleted denial.

Test corrections:
- Stable hoisted router mock and awaited async deletion/navigation in `draft-loader.test.tsx` prevent effect churn and leaked async assertions.
- Mobile sign-in test opens the collapsed navigation.
- IndexedDB error injection patches `IDBFactory.prototype.open`, which reliably reaches WebKit.
- Reusable browser fixture seeds an existing legacy draft and exercises the application's real migration path; no test-only application endpoint.
- New scenario DB helper uses application canonical checksums and actual SQL roles, with transactional rollback.

## 13. Local environment and safe reproduction

The configured Supabase project was explicitly identified by the user as **production**. Keep tests local. Do not copy the original checkout's `.env.local` into test worktrees, publish it, create remote accounts, apply remote migrations or send test records to it.

The original checkout contains Supabase configuration; f03-editor does not have its own app configuration. Presence checks previously found URL/publishable/service-role values, with some signing variables absent. Those are historical presence-only observations, not assurance that hosting is configured now. No values belong in this document.

The existing Docker database `supabase_db_buildrax-mvp` has migration drift: an unmatched local `202609200012` and missing later repository migrations were observed. Running current tests against it initially produced obsolete traceability ambiguity and missing function errors. Do not reset it to repair a test run.

The disposable `buildrax-day16-acceptance` container has no published ports and uses the already available Supabase Postgres 17.6.1.167 image. Bootstrap copies **schema definitions only** for auth/storage from the existing local database, then applies repository migrations to the disposable target. It does not copy users or records. A migration-content fingerprint prevents silently testing stale migrations. Test fixtures roll back.

Local verification commands on the G03 branch:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run release:scan
npx playwright install chromium webkit
npx playwright test tests/e2e/auth-journey.spec.ts tests/e2e/local-recovery.spec.ts tests/e2e/g03-interruption.spec.ts --project=chromium --project=mobile --workers=2
npm run build -- --webpack
```

Do not run build concurrently with the dev-server browser tests because they both write `.next`. The browser tests use local fixtures; they are not provider evaluations. Keep payloads/secrets out of logs. Browser binaries and Docker may require local system permission.

For the separate local SQL check, with Docker and the local schema-source container available:

```sh
docker run --rm --name buildrax-day16-acceptance \
  -e POSTGRES_PASSWORD=day16-local-test-only -e POSTGRES_DB=postgres \
  -d public.ecr.aws/supabase/postgres:17.6.1.167
# Wait for Postgres readiness before running the bootstrap.
node scripts/day16-db-check.mjs
DAY16_DATABASE_TESTS=1 npm test -- src/lib/architecture-ir/scenarios.persistence.test.ts
docker stop buildrax-day16-acceptance
```

The password shown is a disposable local fixture. If a container with that name already exists, identify it before taking action; do not stop another person's work. If migrations changed, recreate only the disposable target after confirming ownership. The helper deliberately has fixed local names and reads no application credentials.

Resource note: disk exhaustion interrupted historical builds/browser installation. Current Webpack build passed, but check disk before large parser/browser/image operations. Do not delete user data or unrelated worktrees/caches automatically.

## 14. External setup and activation gates

| Capability | Required setup before live acceptance | Current position |
| --- | --- | --- |
| Supabase/auth/save | Designated test/staging project, applied migrations, callback URLs, separate secrets, recoverable backup | Only production was identified; local testing is authorized. |
| Gateway/generation | Approved provider configuration, signing secrets, shared limits, worker hosting, actual usage accounting | Baseline merged; enabled hosted journey not verified here. |
| Research/TypeSafe | Authorized search backend and TypeSafe model/account, shared admission/concurrency/cost integration, byte/network bounds, permitted spend | Server cores only; do not auto-enable on key presence. |
| Document input | Isolated parser runtime, private source storage, agreed size/page/time/OCR limits and monitored workers | Future I01/I02 setup. |
| GitHub analysis | Registered read-only GitHub App, approved installation/callback URLs, server credentials, explicit repository/scope authorization | Future H02A/H02 setup. |
| Final release | Authorized staging fixtures/accounts, load environment, monitoring/alerts, backup/restore, worker/parser/provider integration | O03 gate; no production load tests authorized. |

PR #41 introduces configuration validation/build readiness and friendly outage handling. Its documented variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_HMAC_SECRET`, `GENERATION_RECEIPT_SECRET`, and `SHARE_TOKEN_PEPPER`. Record names only. Confirm required deployment scopes and enabled-feature behavior from that branch's runbook before deployment. Do not weaken its gates simply to make a build green.

The earlier “staging versus main cost” discussion did not provide enough preserved evidence to declare a selected hosting topology. Keep main as a Git branch distinct from an environment, and staging as a separately authorized test deployment/data boundary. Do not claim two live environments exist from branch names.

If previously exposed credentials have not been rotated, the owner must complete secure rotation before live use. Do not retrieve or print values as part of a handoff.

## 15. End-to-end and performance proof for milestones

### Integrated journeys

1. Prompt → structured requirements → architecture → inspect → save → reload.
2. PDF/DOCX/Markdown → parse → evidence → requirements → architecture; retry failed synthesis without parsing/uploading again.
3. Explore → upstream/downstream → route probe → reset; zero model calls.
4. Scenario picker → play/pause/step/restart/exit; invalid bindings, background/cancel and reduced motion.
5. Failure simulation → affected dependents/scenarios → evidenced alternatives → exit with unchanged saved IR.
6. Change request → six supported operations → Before/Delta/After → explicit apply → one version.
7. History → hot/archive compare → conflict-safe restore → new head.
8. Shared read-only Explore/Present/docs/scenario/route → expiry/revocation; no private repository evidence.
9. Scoped authorized repository → deterministic multi-language evidence → resolved graph → abstraction → source inspector.
10. Changed/renamed/deleted files → accumulated impact → drift → partial approval → validated new version, preserving manual layout.
11. Guest/account recovery, interrupted migration, two-tab conflicts, expired sessions, offline/storage failures and old-version compatibility.
12. Template clone/customize/variant → presentation objects → persistence, with canonical immutability and semantic/visual separation.
13. Freshness-justified research → attributed evidence → TypeSafe sufficiency/alternatives → explicit review/proposal approval; no unmetered or automatic changes.

### Measured targets, not claims of current attainment

| Metric | Required measurement |
| --- | --- |
| Deterministic generation | p95 under 2 seconds on declared standard fixtures. |
| Normal model generation | p95 under 10 seconds excluding queue wait; queue wait reported separately. Large parse time measured separately. |
| Route probe | Under 100 ms on a declared representative graph size; bounded/truncated queries labeled. |
| Save/recovery | Local confirmation about one second for supported payloads; cloud save about one second after debounce, with uploads separate. |
| Drawing/editing | Input-to-paint, dropped frames and memory on named hardware/browser and representative dense/image fixtures. |
| Concurrent traffic | Realistic 100–200-user mix; 100 concurrent saves, conflicting edits, queue saturation and worker failure. No lost/duplicate versions or unauthorized access. |
| AI use | Normal prompt/document paths 0–2 reasoning calls; deterministic scan zero; repository abstraction normally at most one. Repair/retry/deep-review calls separately counted. |

The 80–90% software / 10–20% AI split is a design direction, not a measured code or runtime ratio. Verify actual calls, context size, usage and trusted validation instead.

Milestone checkpoints retain the original user journeys even when task days were renumbered: generation after baseline; mixed-canvas editing after F02/F03; Explore/playback/failure/review after their prerequisites; changes/history/documents after C/D; document ingestion after I; repository drift after H. Core beta can exclude unfinished ingestion/repository/view features only through an explicit release scope and disabled capabilities, never by calling the full amended roadmap complete.

## 16. Deferred scope and non-negotiable limits

Keep outside this amended release unless separately approved:
- Automatic GitHub Architecture IR synchronization; H04 remains explicit Apply/Ignore/review.
- Automatic internet-driven template publication or rewriting.
- Real-time multiplayer/cursors, comments, mentions and review threads.
- Terraform/HCL analysis and Rust, PHP, Ruby, Kotlin, Scala, Elixir, C/C++, Swift or Dart adapters.
- Multi-provider deep research, automatic contradiction resolution and advanced optimization.
- Full billing, profile customization, enterprise administration, SDK/CLI, plugin marketplace, multi-agent panels and advanced notification administration.
- Full mobile authoring, universal framework coverage, advanced capacity prediction and full split/merge architecture operations.
- Manual scenario construction as a new feature beyond current known-pattern scenario seeding.
- New Mermaid/OpenAPI/Terraform/Kubernetes input adapters; existing Mermaid rendering/export remains supported.

Day 34 may add aggregate test infrastructure and repair release-blocking regressions, followed by affected gate reruns. It may not absorb missing major features. Stable tagging and rollout require their own release decision.

Escalate a concrete contract/data/security/scope conflict before proceeding with
the affected action: destructive migrations, possible user-data loss, missing
external authority, weakening a security control, duplicate subsystem design,
or expansion into deferred scope. Continue safe independent work and document
the evidence and options. Routine compatible fixes and read-only investigation
do not require another permission request when already authorized.

## 17. Suggested exact future-session requests

```text
Continue Day 16 / P01 acceptance from docs/DEVELOPMENT-HANDOFF-2026-11-08.md.
Read NEXT-2, the P01 branch note and the shared fix commit first.
Keep production untouched and G03/P01 separate. Finish group movement/orphan
browser tests and real local snapshot/share checks; report exact remaining gates.
```

```text
Implement Day 17 / G04 / A only after verifying G01/G03 prerequisites.
Reuse the graph engine and scenario model. Define and test transient structural
failure analysis; do not promise real-world availability or mutate saved IR.
```

```text
Implement Day 12 / T01 as its own bounded issue and branch.
Inspect existing B05/templates first; deliver structured registry and safe
clone/customize/variant behavior with immutable canonical templates.
```

```text
Prepare A01 PR #33 for review at the latest commit. Verify failure accounting and
current CI; do not enable live providers or merge. Keep RS01/RS02 stacked and separate.
```

Use the actual filename casing shown in this repository; the final handoff filename is linked from APPROACH and CHANGELOG. Each request should identify one task and session, not ask for an entire milestone branch.

## 18. Publication ledger and trust limits

This document describes inspected source, fetched GitHub PR/branch state, recorded historical feature reports and explicitly run local tests. It is not a production audit.

- Shared Day 16 fixes/harness: `2e0cec7` — semantic save/share fixes, SQL regressions and reusable local verification.
- G03-specific acceptance: `ff2ade5` — scenario persistence and interruption/stale-definition browser coverage, progress/changelog/matrix updates.
- G03 approach note: `636e62d`; committed separately to preserve the tracked `APPROACH.md` casing.
- P01 remains `7592788` on its own branch; no new P01 acceptance is implied by this publication.
- Approved amendment remains `f60a12a` on its documentation branch.
- This handoff is on `docs/implementation-handoff-2026-11-08`, based on GitHub main `c21625c`; it does not bring G03/P01 code into main.

Before any future execution, refresh refs and inspect branch status again. Remote CI, provider contracts, dependencies and environments may have changed. Read-only publication verification is not a license to overwrite divergent work. Main merge approval and production authority remain separate from the user's instruction to push this checkpoint.
