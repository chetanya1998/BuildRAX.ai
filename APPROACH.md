# Day 16 / P01 — compatible presentation object contracts

Milestone: Scenarios, Review and Approved Changes. Issue #38.
Branch: `feat/p01-presentation-objects`, independently based on main `c21625c`.
Extend the existing Presentation IR and materialized diagram with optional typed
notes, annotations, highlights, flat visual groups and saved focus definitions.
Do not add fields to old records, semantic IR, or checksums of old artifacts.
Keep active focus/selection/playback transient and reject those persisted fields.

Preserve unresolved target references as explicit warnings so graph deletions
cannot erase notes or block unrelated edits. New object commands must resolve
their targets, honor read-only mode and revision conflicts, and return a validated
Diagram for the existing commit/undo path. No second history/persistence engine.
Require complete fresh ID maps for cloning; never copy old reference IDs silently.
Test schema bounds, snapshot/recovery round trips, unchanged semantic checksums,
legacy compatibility, command immutability and remapping. Renderer/authoring UI,
actual editor undo/browser and share acceptance remain follow-up work. No schema
migration, public endpoint, deployment or merge. G03 issue #37 stays separate.

## Previous F03 approach (retained history)

Branch: `feat/f03-freehand-buffering`, stacked on inspector commit `ec628d1`.
Delivery: one F03 editor PR to main includes inspector and freehand work;
A01 remains in its own PR, per the user's 6 October instruction.
Keep samples outside React editor state in a bounded 2,048-point buffer. Render
only an animation-frame-batched SVG path inside the existing React Flow
viewport. Commit a single existing freehand primitive on pointer release;
capture the pointer, cancel safely, preserve the endpoint and existing
undo/save contracts. Reuse the same smoothing function for preview and saved
ink. No new IR or image storage system. Verify long streams, render isolation,
undo/redo, Escape and reload. A01 remains a separate branch based on main.

## Previous inspector approach (retained history)

Current branch: `feat/f03-inspector-transactions`, based on main merge
`9427bc5`. Milestone: Predictable Canvas and Understanding.
Intended issue: one undoable inspector field edit (F03 editing subissue).

Keep inspector text drafts local and call the existing commit path once on
blur or Enter. Escape cancels a draft. Multiline fields preserve Enter for
newlines and use Ctrl/Cmd+Enter to commit. Respect IME composition and field
limits. Reuse diagram validation, history and persistence; no schema or
database changes. Use object/field/value keys to reset drafts on external
changes. Select/color controls and inline canvas editing remain as implemented.

Acceptance: one commit per edit, no-op/cancel, validation, composition,
multiline, external updates, read-only behavior, and browser node/connector
undo/redo and reload. Draft text becomes durable only after a valid commit.
F03 freehand buffering and image-heavy profiling remain separate issues.
A01 is separate Day 13 work; unfinished Day 12 items remain tracked.

## Previous F02 approach (retained history)

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
