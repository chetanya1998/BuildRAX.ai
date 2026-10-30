# Production feature matrix

This matrix distinguishes implementation milestones from hosted user features. A merged internal verification milestone does not become a production feature.

| Milestone | Main status | Production status | User availability | Evidence |
| --- | --- | --- | --- | --- |
| Day 16 / G03 — Scenarios and playback | Core/UI locally tested; acceptance gates remain, unmerged | Not deployed | `feat/g03-scenario-playback-core`: explicit scenario saves, controls, read-only playback and transient view restoration; stacked on G02/G01 | [Day 16 G03](DAY-16-G03-SCENARIO-CORE.md) |
| Day 16 / P01 — Presentation objects | Separate local branch, unmerged | Not deployed | `feat/p01-presentation-objects` at `7592788`: contracts/editor UI; not included in this branch | [P01 issue #38](https://github.com/chetanya1998/BuildRAX.ai/issues/38) |
| Day 15 / G02 — Explore, routes and search | Locally verified; unmerged | Not deployed | Separate `feat/g02-explore-route-search` branch stacked on G01 | [Day 15 G02](DAY-15-G02-EXPLORE.md) |
| Day 14 / G01 — Deterministic graph engine | Locally verified; pending merge | Not deployed | Internal library on `feat/g01-deterministic-graph`; no editor integration yet | [Day 14 G01 progress](DAY-14-G01-GRAPH-ENGINE.md) |
| Day 14 / RS01 — Research Intelligence v0 | Separate draft PR #34, based on A01 #33; unmerged | Not deployed | Server-only core; no live search backend | [RS01 PR](https://github.com/chetanya1998/BuildRAX.ai/pull/34) |
| Day 13 / F03 — Bounded freehand preview | Merged through PR #32; image-heavy profiling remains | Deployment not verified | Internal editor capability on `main` | [Freehand progress](DAY-13-F03-FREEHAND.md) |
| Day 13 / F03 — Inspector edit transactions | Merged through PR #32; broader F03 incomplete | Deployment not verified | Internal editor capability on `main` | [Day 13 progress](DAY-13-F03-INSPECTOR-TRANSACTIONS.md) |
| Day 12 / F02 — Manual-placement preservation | Merged through PR #27; broader F02 incomplete | Not deployed | Internal editor capability on `main` | [F02 progress](DAY-12-F02-LAYOUT.md) |
| Day 01 / B00 — Current implementation baseline | Pending until merged | Not applicable | Internal verification only | [Day 01 baseline](DAY-01-BASELINE-VERIFICATION.md) |
| Day 02 / B01 — Structured architecture input | Pending until merged | Not deployed | Available only on `feat/b01-structured-input` | [Day 02 structured input](DAY-02-STRUCTURED-INPUT.md) |
| Day 03 / B02 — Evidence and Requirement IR | Pending until merged | Not deployed | Internal contract only on `feat/b02-evidence-requirement-ir` | [Day 03 Evidence and Requirement IR](DAY-03-EVIDENCE-REQUIREMENT-IR.md) |
| Day 04 / B03 — Persisted traceability | Merged; application and database CI passed | Not deployed | Internal persistence capability on `main` | [Day 04 persisted traceability](DAY-04-PERSISTED-TRACEABILITY.md) |
| Day 05 / B04 — Context Compiler | Merged; application and CI checks passed | Not deployed | Internal compiler on `main` | [Day 05 Context Compiler](DAY-05-CONTEXT-COMPILER.md) |
| Day 06 / B05 — Rules and patterns | Merged; application and CI checks passed | Not deployed | Internal registries on `main` | [Day 06 rule and pattern registries](DAY-06-RULE-PATTERN-REGISTRIES.md) |
| Day 07 / B06 — Controlled AI gateway | Merged; application and CI checks passed | Not deployed | Internal gateway on `main` | [Day 07 controlled AI gateway](DAY-07-CONTROLLED-AI-GATEWAY.md) |
| Day 08 / B07 — Resumable generation jobs | Merged; application and database CI passed | Worker disabled | Internal durable workflow on `main` | [Day 08 resumable jobs](DAY-08-RESUMABLE-GENERATION-JOBS.md) |
| Day 09 / O01 — Shared limits and concurrency | Merged; application and database CI passed | Not deployed or load-tested | Internal admission controls on `main` | [Day 09 shared admission](DAY-09-SHARED-ADMISSION-CONTROL.md) |
| Day 10 / B08 — Complete generation workflow | Merged; application, browser, and database CI passed | Worker disabled; not deployed | Internal workflow on `main` | [Day 10 complete generation workflow](DAY-10-COMPLETE-GENERATION-WORKFLOW.md) |
| Day 11 / F01 — Predictable canvas interactions | Merged; application, browser, and database CI plus post-merge release checks passed | Not deployed | Internal editor capability on `main` | [Day 11 canvas interaction states](DAY-11-CANVAS-INTERACTION-STATES.md) |
| Day 12 — Selection and semantic connections | Merged through PR #23; application and full Chromium checks passed | Not deployed | Internal editor capability on `main` | [Day 12 selection and semantic connections](DAY-12-SELECTION-CONNECTIONS.md) |
