# Day 16 / G03 — scenario and playback core

Milestone: Scenarios, Review and Approved Changes (Days 16–22).
Issue: [#37](https://github.com/chetanya1998/BuildRAX.ai/issues/37).
Branch: `feat/g03-scenario-playback-core`, based on G02 `e845b35`, including G01.
Status: verified locally, not pushed or merged; this is partial G03.

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
cannot play. Later UI must show these reasons before starting playback.

Explicit pattern seeding offers at most three deterministic client-to-data or
messaging shortest-path proposals, based only on a registered template pattern.
It never modifies templates, replaces saved scenarios, invents runtime behavior,
or labels an arbitrary path a verified login/checkout journey.

The playback state machine supports play/pause/next/previous/restart/exit and
caller-driven ticks. It validates before returning active highlights, terminates
finite cyclic walks, clears focus on cancellation/exit and emits at most one
pulse iteration (zero with reduced motion). It owns no timers, network calls,
DOM state, persistence or independent history engine.

## Verification

- 233 unit/contract tests across 40 files passed, including 13 G03 tests.
- Lint, TypeScript and production build passed.
- Cases: old schemas/checksums, snapshot and guest-recovery round trips, bounded
  and duplicate definitions, stale/deleted flows, reference validation, reverse
  and cyclic paths, deterministic seeds, no mutation/network, pause/step/order,
  restart, cancellation, exit and reduced-motion output.
- No UI added: manual/browser acceptance not performed for G03. No database or
  hosted release verification claimed. `audit-artifacts/` unchanged.

## Remaining G03 / Day 16 work

Wire the scenario picker and explicit save action through the existing editor
commit/undo path. Add timing, controls, accessible announcements, finite visual
pulse, reduced-motion preference and prior-view restoration; test read-only,
light/dark, responsive layouts, keyboard and interruption in the browser.
P01 issue #38 remains a separate feature. Publish/review only when authorized;
resolve dependency PRs and retest against main before requesting merge approval.
