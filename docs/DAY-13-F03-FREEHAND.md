# Day 13 / F03 — bounded freehand preview

Branch: `feat/f03-freehand-buffering`, stacked on inspector work `ec628d1`.
Status: locally verified, not merged or deployed (3 October 2026).

Freehand samples now live in a mutable, 2,048-point maximum buffer, not editor
state. An isolated SVG in React Flow's viewport updates at most once per
animation frame. No semantic-node reconstruction, history snapshot or save is
triggered by a sample. Short-distance jitter is filtered; capacity compaction
retains the starting point and latest endpoint. Very long strokes deliberately
lose older detail to maintain bounded memory and path-rendering work.

Pointer capture handles release outside the pane. Pointer cancellation, capture
loss and Escape discard ink safely. Release commits one existing primitive;
preview and persisted ink share smoothing. Bounds use all points, including for
closed loops. No parallel presentation model or storage schema was introduced.

Verification: lint, typecheck, 192 unit tests in 36 files, Webpack production
build, and 37 Chromium tests passed (one mobile-only skip). Tests include
100,000 samples, bounded point count, endpoint retention, no parent rerenders,
animation-frame batching, one undo step, redo, cancellation and local reload.
Turbopack compilation succeeded but its cache write exhausted disk; the
successful production build used `npx next build --webpack` instead.

Image-heavy snapshot-copy profiling/asset-reference work remains open; this
branch does not claim all F03 acceptance criteria complete. A01 is separate.
Mobile drawing, manual visual review and hosted/load testing are not claimed.
The earlier F03 inspector branch should be reviewed/merged before this stacked
branch; no main merge is authorized by this implementation step.
