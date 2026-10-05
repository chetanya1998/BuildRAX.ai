# Day 13 / A01 — test results

Date: 6 October 2026. Branch: `feat/a01-task-aware-router`.
Base: `9427bc5`; A01 is prepared for its own draft PR, separate from F03.
Merge recommendation: hold until the failure-accounting regression is fixed.

## Verified

- Final suite: 199 unit/integration tests passed and the new regression failed
  (200 tests across 36 files). Lint and TypeScript passed.
- Router coverage includes all six task policies, deterministic/template paths,
  explicit provider mode, two-call retry/repair ceiling, budget exhaustion,
  cancellation, rate limits, opt-in fallback, health recovery and metadata.
- Chromium browser regressions: 35 passed; one mobile-only test skipped.
  These ran against the existing successful 4 October production build, which
  is newer than the runtime source changes. No runtime source was edited during
  this testing pass. The browser generation journeys use fixtures, not real AI.
- No live provider spend, hosted/database integration or mobile testing claimed.
  GitHub CI and merge approval are still required.

## Confirmed defect

`src/app/api/v1/ai/generations/route.test.ts` now reproduces a double-failure:
the provider returns HTTP 503 on both the initial call and its bounded retry.
The API correctly returns 502 and the provider spy confirms two calls, but
`recordGenerationRun` receives `attempts: 1`, not `2`. It also substitutes the
default model instead of retaining the fixture's selected model.

Cause: the route assigns its `run` variable only after synthesis succeeds.
The catch block therefore loses router execution metadata and falls back to
one attempt and environment/default provider-model values when synthesis throws.

The regression remains failing intentionally as evidence, not skipped or
marked as an expected failure. Correct the error-path metadata propagation and
rerun the suite before recommending merge. This testing pass changed only the
test and this report; it did not implement the production fix. Subsequent PR
preparation preserves the failing regression and does not authorize a merge.
