# Day 05 / B04 — Context Compiler and budgets

Implemented and verified locally on 21 September 2026.

## Branch brief

- Branch: `feat/b04-context-compiler`
- Base: merged Day 04 / B03 on `main`.
- Purpose: produce small, task-specific, traceable context without silently losing mandatory restrictions.
- Delivery state: merged to `main`; not deployed or production-verified.

## User outcome

BuildRAX can now normalize prose, retain section/table/code structure, merge like-for-like duplicate facts while preserving every source reference, and rank context separately for extraction, synthesis, change planning, review, documentation, and explanation. Configurable limits account for instruction and output-schema overhead as well as content. Every budget omission is recorded, while mandatory constraints either fit or cause an explicit `ContextBudgetError`.

The compiler rejects duplicate block IDs and text that becomes empty after normalization. Deduplication keeps different block kinds, formats, languages, and sections separate, so matching text cannot accidentally collapse a constraint into evidence or code into prose.

The compiler can consume the B02/B03 traceability bundle directly, so future document and repository adapters can share the same boundary.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Versioned ContextPack, task ranking, normalization, deduplication, budgets, and omission metadata | [Context Compiler](../src/lib/intelligence/context.ts) |
| Structured, duplicate, identity, format-boundary, overhead, mandatory, verbose, and token-estimate fixtures | [Context Compiler tests](../src/lib/intelligence/context.test.ts) |

## Verification

- Focused Context Compiler suite — 11 tests passed.
- `npm run release:check` — pass: release scan, lint, typecheck, 22 test files / 117 tests, and production build with 24 generated pages.
- Release scan — pass: 194 repository files and 11 uniquely timestamped migrations.

## Scope boundary

B04 prepares deterministic ContextPacks. B06 will connect these packs to the shared AI gateway; B04 does not add a second provider client or issue paid model calls.
