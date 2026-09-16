# Changelog

## Unreleased

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
