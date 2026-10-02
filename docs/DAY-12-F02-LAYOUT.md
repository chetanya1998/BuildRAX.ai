# Day 12 / F02 — manual-placement preservation

Date: 2 October 2026.
Branch: `feat/f02-layout-readability`, based on merged Day 12 selection work
(`b5c0084`, PR #23). Status: F02 in progress, first bounded implementation
locally verified. See [approach](../APPROACH.md).

## Changed behavior

Auto-layout keeps manually dragged/nudged components fixed. Movable nodes
avoid fixed components and existing annotations, including obstacles too large
for the normal bounded offset search. Layout failure and stale results leave
the current diagram intact. All-manual and empty diagrams are no-ops.

Manual placement is recorded in the existing presentation snapshot as optional
`manualPosition`; absent fields stay absent in legacy snapshots. No semantic IR
field or database schema is added. Reopening restores the marker and position.

Browser testing identified two related integration defects: React Flow consumed
arrow keys before the persistent command handler, and state-updater replay could
duplicate undo entries. Keyboard moves now reach the existing command path, and
history is recorded once outside the diagram updater.

## Verification

- Lint and TypeScript passed.
- Unit suite: 34 files, 179 tests passed.
- Production build passed (27 generated routes).
- Full Chromium suite: 31 passed, one intentionally mobile-only test skipped.
- New Chromium journey: template fixture → nudge → auto-layout → undo/redo →
  browser recovery → reload → auto-layout; passed.
- Focused layout tests cover deterministic placement, large obstacles, no-op
  cases, 15-node non-overlap, semantic checksum stability and snapshot restore.
- Manual visual inspection and staging/database execution have not been run.

## Remaining Day 12 work

Side-panel canvas resizing/refitting and responsive action labels were corrected
in the follow-up; see [acceptance results](DAY-12-F02-ACCEPTANCE-RESULTS.md).
F02 still requires broader usable-canvas fitting,
group/label/routing checks and the supported desktop/tablet acceptance matrix.
The canvas now reserves side-panel space, but other floating overlays still
need broader verification. A user
control to reset manual-placement overrides should be designed with that work.
T01 Template Registry remains a separate issue and branch, not implemented here.
Day 12 is not complete, and no merge or deployment is claimed.

Dependency installation reported six advisories in the existing locked tree,
including a critical Next.js `next/og` ImageResponse advisory
(GHSA-vcvr-r3jv-pc5j). No `next/og` or `ImageResponse` usage was found in `src`;
that does not establish absence of exposure. Dependency upgrades and security
review remain separate work; the lockfile was not changed.
