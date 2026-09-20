# Day 05 / B04 — Context Compiler and budgets

Implemented and verified locally on 20 September 2026.

## Branch brief

- Branch: `feat/m1-b03-b05-foundations`
- Base: Day 04 work in the same dependency-ordered branch.
- Purpose: produce small, task-specific, traceable context without silently losing mandatory restrictions.
- Delivery state: local deterministic implementation; not merged, pushed, deployed, or production-verified.

## User outcome

BuildRAX can now normalize prose, retain section/table/code structure, merge duplicate facts while preserving every source reference, and rank context separately for extraction, synthesis, change planning, review, documentation, and explanation. Configurable limits account for instruction and output-schema overhead as well as content. Every budget omission is recorded, while mandatory constraints either fit or cause an explicit `ContextBudgetError`.

The compiler can consume the B02/B03 traceability bundle directly, so future document and repository adapters can share the same boundary.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Versioned ContextPack, task ranking, normalization, deduplication, budgets, and omission metadata | [Context Compiler](../src/lib/intelligence/context.ts) |
| Structured, duplicate, overhead, mandatory, verbose, and token-estimate fixtures | [Context Compiler tests](../src/lib/intelligence/context.test.ts) |

## Verification

- Focused B02–B05 suite — 5 files and 46 tests passed.
- Repository lint, typecheck, test (23 files and 120 tests), build, and release scan — pass.

## Scope boundary

B04 prepares deterministic ContextPacks. B06 will connect these packs to the shared AI gateway; B04 does not add a second provider client or issue paid model calls.
