# Production feature matrix

This matrix distinguishes implementation milestones from hosted user features. A merged internal verification milestone does not become a production feature.

| Milestone | Main status | Production status | User availability | Evidence |
| --- | --- | --- | --- | --- |
| Day 01 / B00 — Current implementation baseline | Pending until merged | Not applicable | Internal verification only | [Day 01 baseline](DAY-01-BASELINE-VERIFICATION.md) |
| Day 02 / B01 — Structured architecture input | Pending until merged | Not deployed | Available only on `feat/b01-structured-input` | [Day 02 structured input](DAY-02-STRUCTURED-INPUT.md) |
| Day 03 / B02 — Evidence and Requirement IR | Pending until merged | Not deployed | Internal contract only on `feat/b02-evidence-requirement-ir` | [Day 03 Evidence and Requirement IR](DAY-03-EVIDENCE-REQUIREMENT-IR.md) |
| Day 04 / B03 — Persisted traceability | Merged; application and database CI passed | Not deployed | Internal persistence capability on `main` | [Day 04 persisted traceability](DAY-04-PERSISTED-TRACEABILITY.md) |
| Day 05 / B04 — Context Compiler | Merged; application and CI checks passed | Not deployed | Internal compiler on `main` | [Day 05 Context Compiler](DAY-05-CONTEXT-COMPILER.md) |
| Day 06 / B05 — Rules and patterns | Merged; application and CI checks passed | Not deployed | Internal registries on `main` | [Day 06 rule and pattern registries](DAY-06-RULE-PATTERN-REGISTRIES.md) |
| Day 07 / B06 — Controlled AI gateway | Merged; application and CI checks passed | Not deployed | Internal gateway on `main` | [Day 07 controlled AI gateway](DAY-07-CONTROLLED-AI-GATEWAY.md) |
| Day 08 / B07 — Resumable generation jobs | Merged; application and database CI passed | Worker disabled | Internal durable workflow on `main` | [Day 08 resumable jobs](DAY-08-RESUMABLE-GENERATION-JOBS.md) |
| Day 09 / O01 — Shared limits and concurrency | PR #19 ready; application and database CI passed | Not deployed or load-tested | Internal admission controls on `feat/o01-shared-limits-concurrency` | [Day 09 shared admission](DAY-09-SHARED-ADMISSION-CONTROL.md) |
