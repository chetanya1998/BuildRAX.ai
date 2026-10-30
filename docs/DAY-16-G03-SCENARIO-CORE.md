# Day 16 / G03 — scenario and playback core

Milestone: Scenarios, Review and Approved Changes (Days 16–22).
Issue: [#37](https://github.com/chetanya1998/BuildRAX.ai/issues/37).
Branch: `feat/g03-scenario-playback-core`, based on G02 `e845b35`, including G01.
Status: core and editor integration implemented locally; release gates remain.
P01 is separate on `feat/p01-presentation-objects`, UI commit `7592788`.

## Existing contracts extended

Architecture IR and its materialized Diagram gain optional `scenarios` with no
default. Old artifacts parse identically and retain their original checksums.
The schema has its own version and per-scenario revision, bounded unique IDs,
1–32 ordered continuous steps and requirement/evidence references. At most 20
definitions may be stored. Existing byte limits, tenant authorization and version
persistence apply; no new endpoint, table or migration is added.

The compiler, snapshot materializer and diagram-to-IR adapter retain definitions;
browser recovery uses its existing records. A scenario is semantic, unlike
playback index, selection, viewport and highlights. Provider proposals do not
gain scenario-generation authority in this issue.

Validation reuses G01 direction/topology. Steps retain exact canonical flow
content, so deletion or semantic changes invalidate playback. Invalid saved
definitions remain readable and recoverable rather than being silently repaired
or blocking unrelated architecture edits. Validation reports missing/changed
flows, wrong direction and absent/unrelated traceability. Refs are identifiers,
not private evidence text; without authorized traceability referenced scenarios
cannot play. The picker shows these reasons and disables playback.

Explicit pattern seeding offers at most three deterministic client-to-data or
messaging shortest-path proposals, based only on a registered template pattern.
It never modifies templates, replaces saved scenarios, invents runtime behavior,
or labels an arbitrary path a verified login/checkout journey.

The playback state machine supports play/pause/next/previous/restart/exit and
caller-driven ticks. It validates before returning active highlights, terminates
finite cyclic walks, clears focus on cancellation/exit and emits at most one
pulse iteration (zero with reduced motion). It owns no timers, network calls,
DOM state, persistence or independent history engine.

## Editor integration (19 October 2026)

The Scenarios panel exposes explicit Save suggested scenarios, a saved-definition
picker, Play, Pause, Next, Previous, Restart and Exit. Saving uses the existing
validated editor commit/undo/save path; suggestions never replace definitions.
Playback disables editing and reuses Explore's component/flow dimming adapter.
Each step shows its endpoints, flow ID and already-authorized reference IDs.
The UI schedules bounded 1.2-second ticks and one 600-ms outline pulse per step;
reduced-motion preference disables the pulse. There are no provider calls.

Pause/backgrounding stops advancement. Escape, Exit, changing scenarios, stale
or revised definitions and unmount cancel playback. The pre-playback viewport
is restored without persisting preview movement. Desktop framing leaves space
for the panel; mobile controls scroll below the light-edit notice and above the
mini-map. Narrow-screen canvas visibility remains limited while controls are open;
the later G02A/G03A coordinated presentation modes are not implemented here.

## Verification

- 240 unit/contract tests across 41 files passed, including 13 G03 core tests
  and seven editor tests. Lint, TypeScript and release-readiness scan passed.
- Full Chromium regression: 41 passed, one platform-specific skip. Four focused
  G03 Chromium/mobile WebKit checks passed in light/dark, including reduced
  motion, save/undo/redo/reload, ordering, mutation guards, viewport restoration
  and zero post-generation AI requests. Final mobile/build results below.
- One initial full unit run hit two guest-migration test failures; two subsequent
  full runs passed without changing migration code. This intermittency remains
  recorded rather than being claimed fixed.
- Cases: old schemas/checksums, snapshot and guest-recovery round trips, bounded
  and duplicate definitions, stale/deleted flows, reference validation, reverse
  and cyclic paths, deterministic seeds, no mutation/network, pause/step/order,
  restart, cancellation, exit and reduced-motion output.
- No database or hosted release verification claimed. `audit-artifacts/` unchanged.

## Remaining G03 / Day 16 work

Verify authenticated cloud saves and real share routes with authorized evidence.
Stale definitions, backgrounding and unmount have unit coverage; dedicated browser
tests for those cases remain. Manual scenario authoring is a later roadmap extension.
P01 issue #38 remains separate: contracts/editor UI are committed as `7592788`,
with hosted sharing and browser group/orphan acceptance still outstanding.
Publish/review only when authorized;
resolve dependency PRs and retest against main before requesting merge approval.
