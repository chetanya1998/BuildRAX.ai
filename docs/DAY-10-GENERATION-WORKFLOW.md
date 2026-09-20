# Day 10 / B08 — Complete generation workflow

Implemented and verified locally on 20 September 2026.

## Branch brief

- Branch: `feat/m1-b06-b08-generation-platform`
- Base: Days 07–09 work in the same dependency-ordered branch.
- Purpose: connect traceable input to a validated architecture with truthful progress and an explainable handoff.
- Delivery state: local implementation; not merged, pushed, deployed, or production-verified.

## User outcome

The start journey now submits a durable job, polls actual completed stages, and supports cancellation and checkpoint-based retry. The server pipeline connects evidence, requirements, budgeted context, patterns/rules, deterministic or optional provider synthesis, semantic validation, layout, signed receipt, and publish. Before saving, users see facts, assumptions, and unknowns that shaped the architecture.

Template paths are explicitly deterministic and make zero model calls. Auto mode uses the provider only when configured; gateway metadata caps synthesis at one initial call and one repair and counts both separately.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Evidence-to-layout staged orchestration | [generation pipeline](../src/lib/generation-jobs/pipeline.ts) |
| Real polling, progress, cancel/retry, and explainable first result | [start experience](../src/components/start/start-experience.tsx) |
| Generate → inspect → save UI integration coverage | [start experience tests](../src/components/start/start-experience.test.tsx) |
| Deterministic zero-call and resume coverage | [pipeline tests](../src/lib/generation-jobs/pipeline.test.ts) |

## Verification

- Full application suite: 29 files and 138 tests pass.
- Repository lint, typecheck, production build, and release scan pass.
- Clean Supabase reset and all five database files / 108 assertions pass.

## Scope boundary

Local code and database behavior are verified. Hosted worker activation, multi-instance load, provider billing reconciliation, and a staging browser smoke test remain release-gate work.
