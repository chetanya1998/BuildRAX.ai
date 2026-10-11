# Day 15 / G02 — Explore, route probe and architecture search

Branch: `feat/g02-explore-route-search`, based on G01 `bca434f`.
Status (11 October 2026): locally verified; no push, PR, merge or deployment.

## Delivered

- Transient read-only Explore mode; Ctrl/Cmd+K opens search, N retains the
  insertion palette. Read-only shares cannot switch to design.
- Search current components, flows and caller-authorized requirements/evidence;
  stale references are ignored. Search and route probes make no AI/network calls.
- Upstream/downstream highlights and source-target shortest/simple paths reuse
  G01. Enumerations cap depth 12, paths 10, expansions 2,000 and time 30 ms;
  truncation is explicit. Unknown protocol/security values remain Unknown.
- Selection, highlighting and Explore viewport changes do not create semantic
  edits. Central commit/viewport guards protect async and keyboard paths.
- Header grid width is constrained so save-status text cannot resize the canvas
  and repeatedly refit/save it at the desktop breakpoint.

## Verification

- Lint, TypeScript, 220 unit tests (39 files), production build: passed.
- Chromium: 39 passed; one expected mobile-only skip. Covers existing recovery,
  inspector, freehand, generation and layout regressions plus light desktop and
  dark tablet-sized Explore search/reset/exit and mutation/AI guards.
- Light/dark screenshots inspected. Mobile, hosted share and authenticated
  production acceptance have not been performed; no hosted readiness claim.

RS02 is separate, based on RS01. The user confirmed on 11 October that Jev is
TypeSafe's product. This checkpoint does not complete Day 15 or merge G01.
