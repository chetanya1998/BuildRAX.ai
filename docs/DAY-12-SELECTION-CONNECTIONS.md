# Day 12 — Selection and semantic connections

## Status

Implemented and locally verified on 27 September 2026 on
`feat/day12-selection-connections`.

This follows the amended day-wise plan. The older executable-plan F02 card is
layout-focused; that layout work remains separate and is not claimed complete
by this branch.

## User outcome

Users can see how many objects they selected, move and layer the group, and
create a semantic connection by choosing a source and a compatible target.
Decorative lines and arrows remain separate canvas objects.

## Implementation

- Added a dedicated semantic Connect tool and `C` keyboard shortcut alongside
  the existing port-drag interaction.
- Added click-source/click-target connection creation with compatibility-based
  valid and invalid target highlighting.
- Added a live hover edge preview and explicit reasons when a target is
  rejected or already connected.
- Preserved port dragging, component quick-insert, connector inspection, style
  editing, Escape cancellation, and undo/redo history.
- Added a visible selection count and clear-selection action for single,
  Shift, and marquee selections.
- Increased resize-handle hit areas without changing stored node dimensions.
- Kept group movement and front/back actions applied to the full selected set.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm test` — 33 files and 174 tests passed
- `npm run build` — 27 routes generated
- Focused Chromium journeys for resize/port drag, semantic click connection,
  compatibility rejection, preview, connector styling, cancellation, undo,
  group movement, multi-selection, layering, and marquee selection
- Full Chromium regression — 30 passed and one intentionally mobile-only test
  skipped

## Production boundary

This branch changes local editor behavior only. It does not claim deployment,
staging validation, or completion of the layout-focused F02 card.
