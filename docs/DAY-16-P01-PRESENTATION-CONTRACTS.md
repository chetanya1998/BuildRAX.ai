# Day 16 / P01 — compatible presentation object contracts

Milestone: Scenarios, Review and Approved Changes (Days 16–22).
Issue: [#38](https://github.com/chetanya1998/BuildRAX.ai/issues/38).
Branch: `feat/p01-presentation-objects`, independently based on main `c21625c`.
Status: core and editor integration implemented locally; acceptance gates remain.
G03 is separate on `feat/g03-scenario-playback-core` at `47e3984`, based on G02.

## Existing subsystem extended

The existing Presentation IR has optional `objects`; the materialized Diagram
has the corresponding optional `presentationObjects` adapter field. There is no
new database, persistence path, history engine or semantic IR field. Existing
versioned snapshots, API validation, payload limits, private asset handling and
browser recovery remain authoritative. No migrations or authorization changes.

Supported objects: positioned notes, anchored annotations, targeted highlights,
flat visual groups and saved focus definitions. Definitions include schema
version, object revision and z-index; layers retain these IDs. Each array is
bounded to 200 objects, each target set to 100 refs. Targets are typed component,
flow or primitive IDs; groups cannot form nested object graphs. Strict schemas
reject active selection, active focus, scripts, arbitrary styling and invalid
dimensions/colors. The viewport renderer renders content as text, never HTML.

Saved focus definitions do not activate focus or overwrite the current viewport.
Active selection, playback position and temporary highlights remain transient.
Visual edits do not alter Architecture IR or its semantic checksum. Optional
fields have no defaults, preserving checksums for old artifacts. This guarantees
new-code/old-record readability, not that older strict clients can read new objects.

Missing targets are diagnostic warnings, not silently removed content or a reason
to reject unrelated semantic edits. The resolver returns only current target IDs
as active. Existing orphan records survive reload for later repair; newly added
or edited objects must reference available targets. New IDs cannot collide with
component, flow or primitive IDs.

`applyPresentationObjectCommand` validates insertion/edit/deletion, enforces
read-only and revision conflicts, and returns a new Diagram. The caller must use
the existing editor commit/undo path, which owns history, version bumps and save.
It is wired into the editor's common commit path. Clone/remap requires fresh unique IDs for every
object and target, failing rather than retaining old IDs. No canonical template
or architecture data is mutated by these helpers.

## Editor integration (19 October 2026)

A form-based panel creates, edits, duplicates, deletes and repairs all five kinds.
Flat group movement is one undoable transaction and marks components manually
positioned, preserving the existing auto-layout contract. Visual duplication uses
a fresh object ID while deliberately retaining the same architecture targets;
whole-architecture cloning still uses the strict remapping helper.

Saved focus is transient when opened: Exit, Escape, panel close, target removal
or unmount restores the prior viewport. Preview movement is excluded from saves.
Read-only rendering has no authoring controls. No new persistence or AI calls.
Mobile controls sit below the light-edit notice and avoid iOS input focus zoom.

## Verification

- Full regression suite: 209 tests across 38 files passed, including 13 P01 core
  and four editor tests.
- Lint, TypeScript checks, release-readiness scan and production Webpack build
  passed. Locally verified only; not pushed, merged or deployed.
- Combined layer capacity includes 150 components, 300 flows, 300 primitives
  and 200 presentation objects; a boundary regression covers all 950 layers.
- Focused contract tests cover every object, legacy schema/checksum stability,
  snapshot/materialization and guest/account recovery, unchanged semantic IR,
  saved versus active focus, orphan retention, collision rejection, input limits,
  safe colors/text, flat grouping, remapping, immutable transforms, revisions,
  read-only mode and target validation.
- Full Chromium run: 39 passed, one mobile-only test skipped. Four focused P01
  Chromium/mobile WebKit checks passed (all kinds, create/edit/duplicate/delete,
  undo/redo, recovery, focus restore and no post-generation AI calls).
- The broad desktop/mobile run had 49 passes, 23 platform skips and eight mobile
  failures. Two P01 overlap failures were fixed and retested. The other six
  failures concern sign-in, legacy/error recovery and structured generation;
  their baseline/reproducibility is not yet established. Do not call the entire
  mobile suite green. No test was disabled to hide these failures.
- Production Webpack build exited successfully, but caching warned ENOSPC;
  the host has very little free space. Hosted shared-view acceptance is untested.
- No live database or hosted release verification claimed. No changes to
  `audit-artifacts/` or approved roadmap text.

## Remaining before P01 / Day 16 readiness

Investigate the broader mobile regression failures and verify hosted sharing.
Authoring is form-based, not inline canvas dragging; flow-target bounds are the
endpoint bounding box, not a traced connector path. Group movement and orphan
repair have unit coverage, but dedicated browser coverage is still needed.
Keep P02 sticky-note brainstorming and later G02A/G03A presentation behavior
separate. Verify read-only/shared rendering and no private-evidence expansion.
G03 also needs picker, save action, controls/timing, finite pulse, reduced-motion
preference and prior-view restoration. Dependency integration, separate PRs,
fresh CI and explicit merge approval remain; Day 16 is not complete.
