# Day 06 / B05 — Rule and pattern registries

Implemented and verified locally on 21 September 2026.

## Branch brief

- Branch: `feat/b05-rule-pattern-registries`
- Base: merged Day 05 / B04 on `main`.
- Purpose: make common architecture starting points and deterministic suggestions versioned, explainable, and proposal-only.
- Delivery state: merged to `main` on 21 September 2026; not deployed or production-verified.

## User outcome

All eight existing diagram templates are now represented by versioned pattern definitions containing required and optional semantic components, known risks, clarifying questions, match terms, and priority. Four additional families cover static delivery, file processing, public APIs, and critical external integrations, bringing the registry to the requested 12 fixtures.

Eight deterministic rules cover files, background jobs, repeated reads, public APIs, critical external dependencies, queues, sensitive data, and static delivery. Each evaluation returns `matched`, `not-matched`, or `conflicting` plus its rationale and proposals. The evaluator never edits Architecture IR. Explicit template and structured input choices take precedence over inferred matches.

Matching is word-boundary and negation aware: short terms such as `rag` cannot match inside unrelated words such as `storage`, while explicit exclusions produce conflicts instead of component proposals. Registry records and their collections are runtime-frozen, and proposal payloads reject status/contents contradictions.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Versioned 12-pattern and eight-rule registries | [pattern and rule registries](../src/lib/intelligence/patterns.ts) |
| Existing deterministic compiler selects through the pattern registry | [architecture compiler](../src/lib/architecture-ir/compiler.ts) |
| Migration coverage, match/no-match/conflict, precedence, and non-mutation fixtures | [registry tests](../src/lib/intelligence/patterns.test.ts) |

## Verification

- Registry suite — 14 tests passed.
- Existing compiler suite — 12 tests passed with compatible template compilation behavior.
- `npm run release:check` — pass: release scan, lint, typecheck, 23 test files / 131 tests, and production build with 24 generated pages.
- Release scan — pass: 197 repository files and 11 uniquely timestamped migrations.

## Scope boundary

Rules only return proposals. B08 will place accepted, validated proposals into the generation pipeline; this day does not silently add nodes or requirements to user architecture.
