# Day 10 / B08 — Complete generation workflow

Implemented and application-verified on 22 September 2026.

## Branch brief

- Branch: `feat/b08-complete-generation-workflow`
- Base: Day 09 / O01 merged on `main`.
- Purpose: connect the staged intelligence pipeline to an explainable prompt-to-canvas experience.
- Delivery state: implementation and local application/browser verification are complete; the additive database migration still requires the pull-request database gate before merge.

## User outcome

The start screen now creates a durable generation job instead of calling the legacy synchronous generation route. It reports completed server stages, permits cancellation, resumes status after transient failures, and retries failed or cancelled work from retained checkpoints. A completed job is shown as a first-result review with facts, assumptions, unknowns, validation totals, and proposal counts. The architecture is saved only after the user chooses to open it.

The pipeline now checkpoints evidence, requirements, bounded context, deterministic pattern/rule proposals, synthesis, validation, and layout. Rule output remains proposal-only and cannot silently mutate Architecture IR. Every retained checkpoint and the final public result is structurally validated before use.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Durable client journey, real stage progress, cancel/retry, and first-result review | [start experience](../src/components/start/start-experience.tsx) |
| Strict staged pipeline and zero-call deterministic path | [generation pipeline](../src/lib/generation-jobs/pipeline.ts) |
| Public job/result validation contract | [generation job schemas](../src/lib/generation-jobs/schema.ts) |
| Additive `rules` checkpoint support | [database migration](../supabase/migrations/202609220014_generation_workflow.sql) |
| Describe → generate → inspect → save → reload coverage | [browser workflow test](../tests/e2e/generation-workflow.spec.ts) |

## Verification

- Lint and TypeScript checks pass.
- All 32 unit/integration files and 169 tests pass.
- The 27-page optimized production build passes.
- The complete browser journey passes in desktop Chromium and mobile WebKit.
- Deterministic pipeline coverage proves zero model calls/tokens; the shared gateway contract still caps successful provider calls at two and separately caps repairs at one.
- Local Supabase connected but the Docker pgTAP run stalled before returning results. `007_generation_workflow.sql` is therefore a required pull-request database gate, not a claimed local pass.

## Scope boundary

This milestone completes the internal prompt-to-canvas path. It does not enable production workers or claim hosted multi-instance/load evidence; those remain deployment and O03 release-gate work.
