# Day 13 / A01 — task-aware AI Router

Branch: `feat/a01-task-aware-router`, updated with main `c21625c`; independent of
the F03 inspector/freehand branches. Extend B06's gateway and B07/O01's existing
job/lease path, not a parallel provider or budget system. Declare routes for
all six supported tasks; keep trusted templates and deterministic modes
provider-free. A configured synthesis provider retains its configured model.

Use one provider-call ceiling (at most two) across transient retry and output
repair. Runtime fallback to the existing deterministic compiler is server-owned,
opt-in, explicitly reported, and forbidden for explicit provider requests,
authentication failures and invalid output. Abort before retries/fallback.
An ephemeral provider-health circuit is only a local outage hint, not shared
admission control. Reuse O01 leases and cost controls unchanged. Report known
token usage, attempted calls and incomplete metering; never invent failed-call
costs. Preserve legacy metadata parsing and IR/checkpoint contracts.

Test every task route, invalid output, unavailable providers, cancellation,
call-budget exhaustion, repair/retry accounting, health recovery, metadata
compatibility and job integration. No live provider spend or deployment is
part of local fixture verification. Update the matrix and progress notes.

8 October accounting fix: publish selected provider/model and call count before
awaiting provider work. The gateway preserves a request-local snapshot through
failure, timeout and cancellation without altering provider error identity or
including payloads. The API logs only allow-listed execution metadata and does
not invent an attempted run for admission/configuration rejection.
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
