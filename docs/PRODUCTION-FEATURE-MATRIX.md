# Production feature matrix

This matrix distinguishes implementation milestones from hosted user features. A merged internal verification milestone does not become a production feature.

| Milestone | Main status | Production status | User availability | Evidence |
| --- | --- | --- | --- | --- |
| Day 01 / B00 — Current implementation baseline | Pending until merged | Not applicable | Internal verification only | [Day 01 baseline](DAY-01-BASELINE-VERIFICATION.md) |
| Day 02 / B01 — Structured architecture input | Pending until merged | Not deployed | Available only on `feat/b01-structured-input` | [Day 02 structured input](DAY-02-STRUCTURED-INPUT.md) |
| Day 03 / B02 — Evidence and Requirement IR | Pending until merged | Not deployed | Internal contract only on `feat/b02-evidence-requirement-ir` | [Day 03 Evidence and Requirement IR](DAY-03-EVIDENCE-REQUIREMENT-IR.md) |
| Day 04 / B03 — Persisted traceability | Pending until merged; verified locally | Not deployed | Internal persistence work on `feat/m1-b03-b05-foundations` | [Day 04 persisted traceability](DAY-04-PERSISTED-TRACEABILITY.md) |
| Day 05 / B04 — Context Compiler | Pending until merged | Not deployed | Internal compiler on `feat/m1-b03-b05-foundations` | [Day 05 Context Compiler](DAY-05-CONTEXT-COMPILER.md) |
| Day 06 / B05 — Rules and patterns | Pending until merged | Not deployed | Internal registries on `feat/m1-b03-b05-foundations` | [Day 06 rule and pattern registries](DAY-06-RULE-PATTERN-REGISTRIES.md) |
| Day 07 / B06 — Controlled AI gateway | Pending until merged | Not deployed | Internal gateway on `feat/m1-b06-b08-generation-platform` | [Day 07 controlled AI gateway](DAY-07-CONTROLLED-AI-GATEWAY.md) |
| Day 08 / B07 — Resumable generation jobs | Pending until merged; database verified locally | Worker disabled | Internal durable workflow on `feat/m1-b06-b08-generation-platform` | [Day 08 resumable jobs](DAY-08-RESUMABLE-GENERATION-JOBS.md) |
| Day 09 / O01 — Shared admission control | Pending until merged; database verified locally | Not load-tested in staging | Internal shared limits on `feat/m1-b06-b08-generation-platform` | [Day 09 shared admission](DAY-09-SHARED-ADMISSION-CONTROL.md) |
| Day 10 / B08 — Generation workflow | Pending until merged | Not deployed | Local start-to-save flow on `feat/m1-b06-b08-generation-platform` | [Day 10 generation workflow](DAY-10-GENERATION-WORKFLOW.md) |
