# Day 12 / F02 — layout and canvas readability

Branch: `feat/f02-layout-readability`, based on merged PR #23 (`b5c0084`).
Milestone: Predictable Canvas and Understanding.
Intended bounded issue: preserve manual placement during auto-layout (F02-A).

Extend the existing ELK layout and architecture presentation snapshot. Dragging
or nudging a component marks its position as manual; subsequent auto-layout
keeps that component fixed and treats it as an obstacle. Existing annotation
obstacles remain respected. An exhausted collision search must find a safe
fallback rather than knowingly overlap an obstacle. An asynchronous result
must not overwrite edits made while ELK was running. Use existing commit/undo
and save paths, and preserve the read-only boundary.

The optional manual-position field is presentation-only. Old snapshots must
parse without receiving new default fields or changed checksums; semantic IR
must remain unchanged. No database migration or parallel presentation model is
introduced. Test layout determinism, oversized obstacles, pinned nodes,
snapshot round trips and semantic identity.

Follow-up: reserve the existing side-panel width in the canvas on desktop/tablet
and observe actual canvas size changes. Refit only on a size change, preserving
model positions and the initial recovered viewport. Keep responsive action
names explicit when their visible text is hidden. Verify open/resize/close in
both themes at 1440px and 1024px, without changing semantic or node positions.

Remaining F02 issues: broader usable-viewport coverage, group/label
and routing verification, and desktop/tablet browser acceptance. T01 templates
remain a separate Day 12 issue and branch. This branch does not complete Day 12.
