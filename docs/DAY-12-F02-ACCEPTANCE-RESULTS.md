# F02 remaining acceptance checks — 3 October 2026

Initial tested commit: `a3c199b`, PR #27. Runtime files were unchanged during this
verification. The new local `tests/e2e/f02-acceptance.spec.ts` deliberately asserts
the unfinished acceptance requirements; it is not a passing regression suite.

GitHub checks inspected: quality, browser, Supabase migration/RLS, GitGuardian
and Netlify preview passed. These verify the submitted bounded PR, not all F02.

Command: `npx playwright test tests/e2e/f02-acceptance.spec.ts --project=chromium --workers=2`.
Fixture: 15-node multi-tenant SaaS generated through the existing mocked job
fixture; real browser editor, local recovery and ELK layout.

| Viewport | Theme | Closed-panel node visibility | Open Export panel | Accessible action names |
| --- | --- | --- | --- | --- |
| 1440 × 900 | Light | Passed measured geometry | Failed: 7 nodes obscured | Passed for tested actions |
| 1440 × 900 | Dark | Passed measured geometry | Failed: 7 nodes obscured | Passed for tested actions |
| 1024 × 900 | Light | Passed measured geometry | Failed: 9 nodes obscured | Auto layout and Export unnamed |
| 1024 × 900 | Dark | Passed measured geometry | Failed: 9 nodes obscured | Auto layout and Export unnamed |

Final result: four failing acceptance cases. Opening Export leaves model node
positions unchanged in every case, but does not reframe the visible diagram
around the panel. On tablet the responsive CSS hides text spans without
retaining accessible names. The diagnostic uses the observed toolbar button
order to continue geometry checks after recording those naming failures.

Screenshots captured for all cases in `test-results/f02-acceptance-*/`.
Desktop/light and tablet/dark panel-open screenshots were visually inspected
and confirm the overlap. This was screenshot inspection of automated journeys,
not a manual interactive or production test.

No implementation fixes, merge, deployment or GitHub changes were made.
Measured usable viewport/panel handling and accessible labels need correction.
Group-boundary/routing and dense-graph visual acceptance remain unverified.
T01 is unimplemented and cannot pass feature acceptance yet. Hosted staging
and authenticated cloud round trips were not exercised; database evidence is
the passed GitHub Supabase job, not a new local database run.

## Fix verification

The subsequent fix reserves side-panel space in the desktop/tablet canvas and
uses ResizeObserver to refit the viewport after dimension changes. Model
positions remain unchanged. Explicit accessible labels cover topbar actions
whose visible labels are hidden at tablet width.

All four original failures now pass. The tests use accessible role/name
selectors again, and also exercise resizing between desktop/tablet widths and
closing the panel. Tablet/dark screenshot inspection confirms that the Export
panel no longer covers the diagram. The full graph becomes a small overview at
this width; this is not a claim that all labels are readable without zooming.
Broader routing/group readability and other floating-overlay acceptance remain
outside this correction. No staging or production deployment is claimed.

Final local checks: 179 unit tests passed; full Chromium suite 35 passed and
one intentionally mobile-only test skipped; lint, typecheck and production
build passed. New CI results are required for the follow-up commit; the earlier
Supabase result above applies to the original PR head.
