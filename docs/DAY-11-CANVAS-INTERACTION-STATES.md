# Day 11 / F01 — Predictable canvas interaction states

## Status

Implemented and verified locally on 26 September 2026 on
`feat/f01-canvas-interaction-states`.

## User outcome

The active tool, cursor, hint, and next pointer action now agree. Switching
tools clears unfinished placement, drawing, connection, text-edit, and rename
state instead of leaving competing interactions behind.

## Implementation

- Added one reducer-backed canvas interaction controller for selection, pan,
  component placement, connection creation, shapes, text, freehand, and eraser.
- Made drawing, placement, connection, text editing, and node renaming mutually
  exclusive transient states.
- Defined Escape and pointer-cancel cleanup that returns to safe selection.
- Added scoped, live tool hints and explicit pressed state for tool controls.
- Aligned pane cursors with placement and drawing tools.
- Reserved Cmd/Ctrl+K for component search and removed the competing AI-input
  shortcut path.
- Prevented canvas shortcuts from claiming input, textarea, select, or editable
  content keystrokes.

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm test` — 33 files and 174 tests passed
- `npm run build` — 27 routes generated
- Focused Chromium regression — eight journeys passed for inline rename,
  primitive drawing, freehand, tool exclusivity, component connection,
  selection, group movement, and marquee selection
- Full Chromium regression — 29 passed and one intentionally mobile-only test
  skipped

## Production boundary

This branch changes editor interaction behavior only. It does not claim hosted
deployment or production user validation until it is merged and exercised in
staging.
