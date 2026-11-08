# Production feature matrix

This matrix distinguishes implementation milestones from hosted user features. A merged internal verification milestone does not become a production feature.

Status reconciled with GitHub on 8 November 2026. The [complete handoff](DEVELOPMENT-HANDOFF-2026-11-08.md)
records exact commits, local test evidence, remaining sessions and the approved
amendment. Hosted configuration and production availability were not revalidated.

| Milestone | Main status | Production status | User availability | Evidence |
| --- | --- | --- | --- | --- |
| Day 16 / G03 — Scenarios/playback | Published branch; unmerged; local SQL/browser gates pass; integration remains | Not verified | `feat/g03-scenario-playback-core`, `636e62d`, stacked on G02/G01 | [Handoff](DEVELOPMENT-HANDOFF-2026-11-08.md#12-detailed-day-16-implementation-and-test-context) |
| Day 16 / P01 — Presentation objects | Published branch; unmerged; acceptance remains | Not verified | `feat/p01-presentation-objects`, `7592788`; independent from G03 | [Handoff](DEVELOPMENT-HANDOFF-2026-11-08.md#12-detailed-day-16-implementation-and-test-context) |
| Day 15 / G02 — Explore/route/search | Published draft #35; unmerged | Not verified | Core/UI on separate branch stacked on G01 | [PR #35](https://github.com/chetanya1998/BuildRAX.ai/pull/35) |
| Day 15 / RS02 — TypeSafe Jev | Published draft #36; unmerged; server core | Not activated here | O01/live-provider/product integration remains | [PR #36](https://github.com/chetanya1998/BuildRAX.ai/pull/36) |
| Day 14 / G01 — Graph engine | Published branch; locally verified; unmerged | Not verified | Internal deterministic library, `bca434f` | [Handoff](DEVELOPMENT-HANDOFF-2026-11-08.md) |
| Day 14 / RS01 — Research evidence | Published draft #34; unmerged; server core | Not activated here | Live search/admission/integration remains | [PR #34](https://github.com/chetanya1998/BuildRAX.ai/pull/34) |
| Day 13 / A01 — AI Router | Published draft #33; accounting fixed; unmerged | Not verified | `95f8345`; fresh CI/review and activation gates remain | [PR #33](https://github.com/chetanya1998/BuildRAX.ai/pull/33) |
| Day 12 / T01 — Template Registry | Not verified delivered | Not verified | Existing templates/patterns are groundwork only | [Handoff](DEVELOPMENT-HANDOFF-2026-11-08.md) |
| Day 13 / F03 — Bounded freehand preview | Merged #32; image-heavy profiling remains | Not verified | Internal editor capability on main | [Freehand progress](DAY-13-F03-FREEHAND.md) |
| Day 13 / F03 — Inspector edit transactions | Merged #32; broader F03 incomplete | Not verified | Internal editor capability on main | [Day 13 progress](DAY-13-F03-INSPECTOR-TRANSACTIONS.md) |
| Day 12 / F02 — Manual-placement preservation | Merged through PR #27; broader F02 incomplete | Not deployed | Internal editor capability on `main` | [F02 progress](DAY-12-F02-LAYOUT.md) |
| Day 01 / B00 — Current implementation baseline | Merged #6; frozen baseline | Not applicable | Internal verification only | [Day 01 baseline](DAY-01-BASELINE-VERIFICATION.md) |
| Day 02 / B01 — Structured architecture input | Merged #7; frozen baseline | Not verified | Internal capability on main | [Day 02 structured input](DAY-02-STRUCTURED-INPUT.md) |
| Day 03 / B02 — Evidence and Requirement IR | Merged #8; frozen baseline | Not verified | Internal contract on main | [Day 03 Evidence and Requirement IR](DAY-03-EVIDENCE-REQUIREMENT-IR.md) |
| Day 04 / B03 — Persisted traceability | Merged; application and database CI passed | Not deployed | Internal persistence capability on `main` | [Day 04 persisted traceability](DAY-04-PERSISTED-TRACEABILITY.md) |
| Day 05 / B04 — Context Compiler | Merged; application and CI checks passed | Not deployed | Internal compiler on `main` | [Day 05 Context Compiler](DAY-05-CONTEXT-COMPILER.md) |
| Day 06 / B05 — Rules and patterns | Merged; application and CI checks passed | Not deployed | Internal registries on `main` | [Day 06 rule and pattern registries](DAY-06-RULE-PATTERN-REGISTRIES.md) |
| Day 07 / B06 — Controlled AI gateway | Merged; application and CI checks passed | Not deployed | Internal gateway on `main` | [Day 07 controlled AI gateway](DAY-07-CONTROLLED-AI-GATEWAY.md) |
| Day 08 / B07 — Resumable generation jobs | Merged; application and database CI passed | Worker disabled | Internal durable workflow on `main` | [Day 08 resumable jobs](DAY-08-RESUMABLE-GENERATION-JOBS.md) |
| Day 09 / O01 — Shared limits and concurrency | Merged; application and database CI passed | Not deployed or load-tested | Internal admission controls on `main` | [Day 09 shared admission](DAY-09-SHARED-ADMISSION-CONTROL.md) |
| Day 10 / B08 — Complete generation workflow | Merged; application, browser, and database CI passed | Worker disabled; not deployed | Internal workflow on `main` | [Day 10 complete generation workflow](DAY-10-COMPLETE-GENERATION-WORKFLOW.md) |
| Day 11 / F01 — Predictable canvas interactions | Merged; application, browser, and database CI plus post-merge release checks passed | Not deployed | Internal editor capability on `main` | [Day 11 canvas interaction states](DAY-11-CANVAS-INTERACTION-STATES.md) |
| Day 12 — Selection and semantic connections | Merged through PR #23; application and full Chromium checks passed | Not deployed | Internal editor capability on `main` | [Day 12 selection and semantic connections](DAY-12-SELECTION-CONNECTIONS.md) |
