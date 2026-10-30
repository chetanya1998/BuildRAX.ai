# Day 16 / G03 — scenario and playback core

19 October continuation: connect the existing state machine to the editor with
an explicit save-suggestions transaction, picker and playback controls. Reuse
the current dimming adapter; keep timers, focus and viewport transient. Disable
editing while playing or paused, restore the prior view on exit/unmount, pause
on backgrounding, cancel on stale refs and respect reduced motion. No provider
calls. P01 UI is separately committed as `7592788`, not included in this branch.

Milestone: Scenarios, Review and Approved Changes. Issue #37.
Branch: `feat/g03-scenario-playback-core`, stacked on G02 `e845b35` (and G01).
Extend versioned Architecture IR with optional bounded scenario definitions,
mirror them through the existing diagram adapter, and reuse G01 for valid walks.
Do not add defaults to old artifacts or change their checksum. Ordered steps
retain exact flow bindings and requirement/evidence IDs; changed/deleted flows
invalidate playback without making a stale saved architecture unreadable.

Seed explicit proposals from registered patterns, never automatically mutate
templates or call a model. Implement a deterministic, cancellable playback state
machine; the UI now supplies scheduling, controls, focus restoration and rendering
without a second playback engine. No parallel persistence/history, new endpoint,
migration or deployment.
Test backward compatibility, round trips, stale and unknown refs, order, bounds,
cycles, direction, play/pause/step/restart/exit and reduced-motion output. This
implementation still needs hosted/dependency integration gates before Day 16 is
release-complete. P01 is issue #38, separate.

## Previous G02 approach (retained history)

Branch: `feat/g02-explore-route-search`, stacked on tested G01 `bca434f`.
Extend the existing editor with a transient read-only Explore panel. Reuse G01
for reachability and bounded route queries, and the existing diagram-to-IR
adapter for current unsaved edits. Search components, flows, requirements and
evidence already authorized and passed to this editor. No source fetching or AI.
Keep Explore selection/highlights/viewport out of semantic history and saved
diagram state. Disable editing tools and mutation shortcuts while exploring;
read-only shares can never switch to editing. Show unknown protocol/security
values honestly, and distinguish graph reachability from operational dependency.
Test search/reference resolution, path bounds, stale IDs, read-only interactions,
reset/exit, keyboard access, responsive themes and zero mutation/AI calls.

RS02 remains a separate Day 15 issue on the unmerged RS01 dependency. On
11 October the user confirmed Jev means TypeSafe's structured-decision product.
Use its official typed judgment API; do not bundle RS02 into G02.

## Previous G01 approach (retained history)

Branch: `feat/g01-deterministic-graph`, from main `c21625c` (merged F03).
Implement a pure typed adjacency engine over existing Architecture IR. Return
IDs only, snapshot input topology, sort results deterministically, reject
ambiguous topology, and make no model/network calls. Directed traversal follows
IR flow direction, including bidirectional flows. Dependency/impact queries use
explicit dependent → dependency relations supplied separately; an arrow alone
does not establish operational dependence. No new persisted IR fields.

Provide incoming/outgoing arcs, reachability, shortest path, bounded simple-path
enumeration, cyclic strongly connected groups, orphans, weak components and
structural impact. Path enumeration has depth, path-count, expansion and time
bounds plus cancellation, with explicit truncation reasons. Test linear,
branching, cyclic, disconnected, parallel and bidirectional fixtures; reordered
input, immutable snapshots, invalid references and every bound.

RS01 is the second amended Day 14 feature. Its AI integration depends on A01
PR #33, which remains draft with an accounting regression. Do not bypass that
gateway or silently merge/fix A01 as part of G01. G01 is a separate review unit;
Day 14 is not complete until RS01 and its dependency are verified.

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
