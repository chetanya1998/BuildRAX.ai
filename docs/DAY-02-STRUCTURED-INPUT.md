# Day 02 / B01 — structured architecture input

Implemented and verified locally on 16 September 2026.

## Branch brief

- Branch: `feat/b01-structured-input`
- Base: Day 01 commit `29c0b72` on `chore/b00-baseline-verification`
- Purpose: make detailed descriptions reliable while keeping architecture context typed, optional, and recoverable.
- Delivery state: local implementation; not merged, deployed, or production-verified.

## User outcome

The start flow now keeps the architecture description separate from product type, preferred stack, cloud provider, expected scale, tenancy, and data sensitivity. A valid description may contain up to 3,000 characters. If generation fails, every entered value remains available and the UI reports the failing stage or the field that needs correction.

The compiler converts the description into Architecture IR-safe requirement items of at most 240 characters without dropping the original recoverable description. Missing optional scale, tenancy, and sensitivity stay explicit unknowns instead of becoming invented requirements. Explicit structured choices override text or template inference.

## Implementation evidence

| Contract | Evidence |
| --- | --- |
| Raw description survives generation and local recovery | [request schema](../src/lib/domain/schema.ts), [start experience](../src/components/start/start-experience.tsx), and [browser journey](../tests/e2e/structured-input.spec.ts) |
| 239/240/241/3,000-character inputs compile safely | [compiler boundary tests](../src/lib/architecture-ir/compiler.test.ts) |
| Cloud, stack, scale, tenancy, and sensitivity remain separate | [request schema](../src/lib/domain/schema.ts), [compiler mapping](../src/lib/architecture-ir/compiler.ts), and [start form tests](../src/components/start/start-experience.test.tsx) |
| Unknown optional facts are not invented | [compiler unknown-value test](../src/lib/architecture-ir/compiler.test.ts) |
| Invalid inputs name their field and stage | [HTTP error contract](../src/lib/server/http.ts), [compile route tests](../src/app/api/v1/architecture/compile/route.test.ts), and [browser error journey](../tests/e2e/structured-input.spec.ts) |

## Verification

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 20 files and 92 tests passed.
- `npm run build` — pass; 24 pages generated.
- Focused structured-input Chromium journey — 2 tests passed.
- Full Chromium regression — all 27 executable tests passed when including the isolated rerun of one transient page-setup timeout; 1 mobile-only test was intentionally skipped. The timeout occurred before the affected test received a page, and that unchanged test passed alone in 1.9 seconds.

## Scope boundary and next day

B01 changes input, compilation, and error-reporting contracts only. It reuses the existing generation route, Architecture IR validation, guest recovery, cloud-save coordinator, and canvas model. It does not change persistence, authentication, migration, or hosted deployment.

Day 03 / B02 can now add Evidence IR and Requirement IR on top of the bounded requirements and explicit unknowns established here.
