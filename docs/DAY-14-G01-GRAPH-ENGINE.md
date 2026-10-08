# Day 14 / G01 — deterministic graph engine

## Status — 8 October 2026

- Branch: `feat/g01-deterministic-graph`, based on `main` at `c21625c`.
- Implemented and verified locally; not pushed, merged or deployed.
- Separate G01 review unit. RS01 Research Intelligence remains pending A01
  PR #33, which is draft with an accounting regression. Day 14 is not complete.

## Implementation

`src/lib/architecture-ir/graph.ts` adds a read-only topology snapshot over the
existing Architecture IR, with no new persisted schema or presentation model.
It validates IDs and endpoints, sorts results deterministically, protects its
indexes from caller mutation and makes no AI or network calls.

- Directed incoming/outgoing arcs and upstream/downstream reachability follow
  IR flow direction. Bidirectional arcs preserve their original flow ID.
- Shortest paths use stable breadth-first traversal. All-path search enumerates
  simple paths; parallel flows produce distinct paths. A self-query returns the
  zero-edge path, not a cycle walk.
- `cycles()` returns cyclic strongly connected groups with membership IDs,
  not ordered walks or every elementary cycle. Connected components use weak
  connectivity; orphan nodes have no incident flows.
- Dependencies are explicit caller-supplied dependent → dependency assertions,
  independent of traffic arrows. Optional flow references must connect those
  components. No semantic dependency is inferred from a drawn connection.
- Impact returns failed IDs, transitive explicit dependents and incident flow
  IDs, labelled `structuralOnly` and `explicit-dependencies-only`. An empty
  dependency set means no known dependents, not evidence of zero actual impact.

All-path defaults are depth 20, 50 paths, 10,000 expansions and 50 ms. Hard
caps are depth 100, 1,000 paths, 100,000 expansions and 1,000 ms. Cancellation
and every bound report explicit truncation reasons alongside partial results.
Depth truncation means a branch was not explored, not proof of another target
path. Wall-clock cutoff can vary by machine; ordering is deterministic, and
tests inject a clock to verify timeout behavior without timing races.

## Verification

After installing the committed lockfile dependencies with `npm ci`:

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — 211 tests in 37 files passed with Vitest 5.0.2.
- `npm run build` — Next.js production build passed.
- 19 new G01 tests cover linear, branching, cyclic, disconnected, bidirectional
  and parallel-flow graphs; explicit dependencies; invalid references;
  immutable snapshots; layout/input-order invariance; all search limits and
  cancellation; maximum-size IR and combinatorial search fixtures.

No browser, database, live-provider or hosted deployment verification is
claimed for this change. The engine is not yet wired into editor controls;
Explore/route probe belongs to G02, presentation adaptation to G01A, and the
failure-simulation UI to G04. Existing Evidence IR → Requirement IR →
Architecture IR → Presentation IR boundaries remain unchanged.
