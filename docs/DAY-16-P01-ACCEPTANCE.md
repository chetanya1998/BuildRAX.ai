# Day 16 / P01 — local acceptance, 9 November 2026

Branch: `feat/p01-presentation-objects`, independently based on main `c21625c`.
Issue: [#38](https://github.com/chetanya1998/BuildRAX.ai/issues/38).
Scope: finish presentation-object browser and local persistence acceptance.
G03 remains separate in [PR #44](https://github.com/chetanya1998/BuildRAX.ai/pull/44).
No merge, production migration, hosted test or deployment was performed.

## Changes and defects fixed

- Carried shared save/share fix `2e0cec7` as `4f6170e`. The existing snapshot RPC
  qualifies SQL columns and shared reads use canonical materialized blobs with
  legacy fallback. Existing authorization, expiry and revocation checks remain.
- Reused G02's two header-width constraints. On the independent P01 branch,
  mobile save-status changes resized the canvas, causing repeated fit/save work.
- Bounded the mobile presentation panel inside the canvas, included its padding
  in the height, and raised its stacking order. The minimap no longer intercepts
  Create/Save; a browser assertion checks the visible scroll-panel bounds.
- Extended the existing start-form hydration guard to prompt and context inputs.
  The broad mobile run reproduced text being cleared when entered before React
  attached handlers. A delayed-script test verifies disabled server-rendered
  controls, then enabled controls and retained text after hydration. No sleeps,
  forced clicks, retries or disabled tests were added to conceal failures.

## Verification

- `npm run lint`, `npm run typecheck`, `npm run release:scan`: passed.
- `npm run build -- --webpack`: passed, including all 27 static pages.
- `npm test`: 213 passed across 39 files; one opt-in database test skipped.
- Full Chromium + mobile WebKit: 67 passed, 23 expected platform skips.
  New group/orphan checks run in light/dark on both projects: one reversible
  group movement transaction, unchanged semantic IR, manual-placement flags,
  unaffected outside nodes, real IndexedDB persistence, reload, orphan retention,
  explicit target repair, undo and redo. Existing checks cover all five object
  kinds and focus restoration. Browser generation uses local fixtures, not AI.
- All 15 migrations and 173 pgTAP assertions passed on a fresh disposable local
  database. The actual P01 snapshot test passed separately with 11 SQL assertions:
  owner migration/save; exact semantic, presentation and materialized readback;
  immutable previous version; preserved semantic version for visual movement;
  canonical shared read; invalid token; denied anonymous writes; tenant isolation.
- SharePage contract tests exercise its actual parser/loader with a mocked RPC,
  forwarding only a validated diagram and `readOnly` to the editor. They reject
  malformed/missing records and do not forward injected private evidence fields.
  A separate rendering test covers all five objects without authoring controls.

Local reproduction commands and isolation details:
[database verification](DAY-16-LOCAL-DATABASE-VERIFICATION.md).
The SQL helper uses rollback-only fixtures in `buildrax-day16-acceptance`; it does
not read app secrets. The configured remote Supabase project is production and
was not used. `audit-artifacts/` and the approved roadmap were not modified.

## Remaining gates and next sessions

Local SQL roles and route/rendering tests do not replace authenticated browser
saving or a real shared page served through Supabase. Those integration checks
remain pending in a local full-stack or explicitly authorized staging environment.
Form authoring is supported; inline canvas dragging and traced connector-path
highlight bounds are not claimed. P02 and later presentation features stay separate.

Review dependency order: [G01 #43](https://github.com/chetanya1998/BuildRAX.ai/pull/43)
→ [G02 #35](https://github.com/chetanya1998/BuildRAX.ai/pull/35) → G03 #44.
P01 stays independent. G01 and G03's initial PR quality workflows passed on
9 November; after each approved parent merge, retarget and retest the child.
The shared SQL migration in G03 and P01 is the same forward fix and must be
reconciled once during integration, not duplicated under a second timestamp.

Earlier work is still open: T01 registry/clone/customize/variants; F02 broader
layout/label/group/routing acceptance; F03 image-heavy profiling; A01/RS01/RS02
fresh review and shared admission/accounting/activation. Their existing head CI
passes do not prove live activation or close those gaps. Preserve one bounded
feature issue/branch/PR at a time and request explicit approval before each main
merge. Day 16 is not declared release-complete by this local checkpoint.
