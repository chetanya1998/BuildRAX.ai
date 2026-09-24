# Changelog

## Unreleased

### Controlled AI execution

#### Day 10 · B08 — Complete generation workflow

- Status: PR #20 ready; application, browser, and database CI verified
- Branch: `feat/b08-complete-generation-workflow`
- User impact: Connects durable generation stages to real progress, cancel/retry,
  explainable first-result review, and save/reload after explicit user inspection.
- Automatic checks: See `docs/DAY-10-COMPLETE-GENERATION-WORKFLOW.md`.
- Production verification: Worker remains disabled; hosted load is not claimed.

#### Day 09 · O01 — Shared limits and concurrency

- Status: Merged; application, browser, and database CI verified
- Branch: `feat/o01-shared-limits-concurrency`
- User impact: Adds signed guest identity, atomic shared request windows,
  bounded queue admission, and provider concurrency/cost leases across instances.
- Automatic checks: See `docs/DAY-09-SHARED-ADMISSION-CONTROL.md`.
- Production verification: Multi-instance load remains an O03 release gate.

#### Day 08 · B07 — Resumable generation jobs

- Status: Merged; application and database CI verified
- Branch: `feat/b07-resumable-generation-jobs`
- User impact: Persists bounded generation stages so interruption, cancellation,
  retry, and duplicate delivery cannot discard valid checkpoints or publish a
  stale result.
- Automatic checks: See `docs/DAY-08-RESUMABLE-GENERATION-JOBS.md`.
- Production verification: Worker remains disabled.

#### Day 07 · B06 — Controlled AI gateway

- Status: Merged; application and CI verified
- Branch: `feat/b06-controlled-ai-gateway`
- User impact: Routes synthesis, change planning, review, documentation,
  requirement extraction, and explanation through one validated, cancellable,
  usage-aware boundary.
- Automatic checks: See `docs/DAY-07-CONTROLLED-AI-GATEWAY.md`.
- Production verification: Not claimed.

### Architecture intelligence patterns

#### Day 06 · B05 — Rules and reusable patterns

- Status: Merged; application and CI verified
- Branch: `feat/b05-rule-pattern-registries`
- User impact: Adds 12 versioned architecture patterns and eight explainable,
  proposal-only rules while keeping explicit user constraints authoritative.
- Automatic checks: See `docs/DAY-06-RULE-PATTERN-REGISTRIES.md`.
- Production verification: Not claimed.

### Architecture intelligence context

#### Day 05 · B04 — Context Compiler and budgets

- Status: Merged; application and CI verified
- Branch: `feat/b04-context-compiler`
- User impact: Produces task-specific, source-aware context within configurable
  budgets and fails explicitly when mandatory constraints cannot fit.
- Automatic checks: See `docs/DAY-05-CONTEXT-COMPILER.md`.
- Production verification: Not claimed.

### Architecture intelligence persistence

#### Day 04 · B03 — Persisted evidence and requirements

- Status: Merged; application and database CI verified
- Branch: `feat/b03-persist-traceability`
- User impact: Carries evidence, requirements, and semantic references through
  recovery, saving, migration, history, restore, and readback.
- Automatic checks: See `docs/DAY-04-PERSISTED-TRACEABILITY.md`.
- Production verification: Not claimed.

### Architecture intelligence contracts

#### Day 03 · B02 — Evidence IR and Requirement IR

- Status: Implemented and verified locally
- Branch: `feat/b02-evidence-requirement-ir`
- User impact: Establishes traceable user facts, explicit unknowns, bounded
  confidence, conflict records, and scoped verification before these records
  are attached to saved architecture versions.
- Automatic checks: See `docs/DAY-03-EVIDENCE-REQUIREMENT-IR.md`.
- Production verification: Not claimed.

### Architecture input

#### Day 02 · B01 — Structured descriptions and context

- Status: Implemented and verified locally
- Branch: `feat/b01-structured-input`
- User impact: Accepts descriptions through 3,000 characters, keeps cloud,
  stack, scale, tenancy, and sensitivity separate, preserves input on errors,
  and identifies the failing stage or field.
- Automatic checks: See `docs/DAY-02-STRUCTURED-INPUT.md`.
- Production verification: Not claimed.

### Internal verification

#### Day 01 · B00 — Current implementation baseline

- Status: Verified locally
- Branch: `chore/b00-baseline-verification`
- User availability: Internal quality work
- User impact: Protects working recovery, persistence and canvas behavior
  while later architecture-intelligence features are developed.
- Automatic checks: See `docs/DAY-01-BASELINE-VERIFICATION.md`.
- Production verification: Not claimed.
