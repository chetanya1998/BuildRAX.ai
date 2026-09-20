# Changelog

## Unreleased

### Architecture intelligence foundations

#### Day 06 · B05 — Rules and reusable patterns

- Status: Implemented and verified locally
- Branch: `feat/m1-b03-b05-foundations`
- User impact: Adds 12 versioned architecture patterns and eight explainable,
  proposal-only rules while keeping explicit user constraints authoritative.
- Automatic checks: See `docs/DAY-06-RULE-PATTERN-REGISTRIES.md`.
- Production verification: Not claimed.

#### Day 05 · B04 — Context Compiler and budgets

- Status: Implemented and verified locally
- Branch: `feat/m1-b03-b05-foundations`
- User impact: Produces task-specific, source-aware context within configurable
  budgets and fails explicitly when mandatory constraints cannot fit.
- Automatic checks: See `docs/DAY-05-CONTEXT-COMPILER.md`.
- Production verification: Not claimed.

#### Day 04 · B03 — Persisted evidence and requirements

- Status: Implemented; database execution environment-blocked
- Branch: `feat/m1-b03-b05-foundations`
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
