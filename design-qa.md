# BuildRAX annotated landing and application — design QA

## Comparison target

- Source visual truth:
  - `/Users/chetanya/Desktop/Screenshot 2026-08-29 at 1.46.37 PM.png`
  - `/Users/chetanya/Desktop/Screenshot 2026-08-29 at 7.58.31 PM.png`
  - `/Users/chetanya/Desktop/Screenshot 2026-08-29 at 8.02.31 PM.png`
  - `/Users/chetanya/Desktop/Screenshot 2026-08-29 at 8.02.42 PM.png`
- Browser-rendered implementation evidence:
  - `/tmp/buildrax-landing-top-desktop.png`
  - `/tmp/buildrax-sandbox-denied-desktop.png`
  - `/tmp/buildrax-start-annotated-desktop.png`
  - `/tmp/buildrax-editor-handwritten-coach.png`
  - `/tmp/buildrax-landing-mobile-menu.png`
  - `/tmp/buildrax-feedback-hero-1122x1106.png`
  - `/tmp/buildrax-feedback-features-1122x1106.png`
  - `/tmp/buildrax-feedback-sandbox-1122x1106.png`
  - `/tmp/buildrax-feedback-sandbox-dark.png`
- Combined comparison evidence:
  - `/tmp/buildrax-qa-sandbox-comparison.png`
  - `/tmp/buildrax-qa-annotations-comparison.png`
  - `/tmp/buildrax-feedback-hero-before-after.png`
  - `/tmp/buildrax-feedback-sandbox-before-after.png`

## Viewport and normalization

- Source captures: 3420 × 1972 pixels, inferred high-density desktop capture.
- Desktop implementation captures: 1280 × 720 pixels from the in-app browser desktop viewport.
- Mobile menu capture: 481 × 1041 pixels with a 433 CSS-pixel inner width.
- Comparison sheets: each source was proportionally downsampled to 1280 × 738, center-cropped to 1280 × 720, and placed next to an unscaled 1280 × 720 implementation capture. This normalizes pixel dimensions while acknowledging that the references communicate a direction rather than one exact BuildRAX screen.
- Compared states: light landing/header, dark interactive sandbox with “Access denied” selected, light onboarding, light editor guidance, and mobile navigation open.

## Full-view comparison evidence

The implementation retains BuildRAX’s MiniMax typography, semantic category colors and light/dark parity while matching the references’ intended handwritten instructional layer and architecture-simulation surface. The simulation now inherits the same page, surface, border, text and accent tokens as the surrounding landing page instead of introducing an unrelated theme. The landing maintains its own MVP content and route model rather than copying unrelated reference product content.

The top bar uses a stable three-zone desktop grid and a two-control mobile shell. Navigation, theme, sign-in, primary creation and section anchors remain visually grouped at every checked width. The sandbox matches the source hierarchy: centered statement, scenario controls, large node workspace, plain-language trace panel and one outcome.

## Focused region comparison evidence

- Typography: DM Sans remains the display/body family; Caveat Variable provides the handwritten voice. The script font is limited to notes and does not replace functional UI text.
- Spacing and layout: desktop header, hero, sandbox, onboarding prompt and editor coach were inspected separately. The editor notes sit outside the architecture graph and can be dismissed.
- Colors and tokens: handwritten guidance uses muted theme tokens. The sandbox follows the landing theme in both modes while retaining blue active, green success and orange/red denial states where they convey system status.
- Image and icon quality: the supplied references do not require reusable photographic assets. All new arrows, scenario symbols and marks use Phosphor library icons; no placeholder raster art, emoji or handcrafted SVG assets were introduced.
- Copy: all sandbox text maps to MVP concepts—workspace authorization, RLS, diagram versions, audit events and idempotency.

## Interaction and accessibility checks

- Scenario tabs update `aria-pressed`, narration, visible trace events and outcome.
- Mobile menu reports `aria-expanded`, exposes a labelled navigation region and preserves the primary action.
- Hydration-safe buttons prevent early mobile taps from being lost before React is ready.
- Reduced-motion users do not receive the looping sandbox progression.
- The hero canvas uses a 7.5-second transform/opacity cycle across nodes, typed-flow arrows and the security-review card; the global reduced-motion rule collapses it to one 0.01ms pass.
- Persistent controls retain visible focus treatment, semantic button/link roles and minimum mobile targets.
- Onboarding still has a labelled 3,000-character prompt and keyboard-operable choices.
- In-app browser console check on the final landing, onboarding and editor routes: no errors.

## Comparison history

### Iteration 1

- P1: importing client-only Phosphor components into a Server Component caused the landing to render Next.js’s error overlay.
  - Fix: switched the server-rendered landing artwork to `@phosphor-icons/react/ssr`.
  - Post-fix evidence: `/tmp/buildrax-landing-top-desktop.png`.
- P2: six simulation stages clipped at compact desktop widths.
  - Fix: reduced the walkthrough to five MVP-relevant stages and tightened node width while keeping horizontal scrolling on mobile.
  - Post-fix evidence: `/tmp/buildrax-sandbox-denied-desktop.png`.
- P2: the hero preview’s right-side semantic nodes could overlap around the desktop/tablet boundary.
  - Fix: added a compact-desktop node layout and removed nonessential connector arrows at that breakpoint.
  - Post-fix evidence: `/tmp/buildrax-landing-top-desktop.png`.

### Iteration 2

- P1: very early WebKit interactions could land before client hydration, losing the scenario, menu or generation action.
  - Fix: interactive controls now remain disabled until a hydration-safe external-store signal is ready.
  - Post-fix evidence: the complete four-test mobile WebKit suite passes.

### Iteration 3 — browser annotations

- P1: the standalone dark walkthrough theme broke the visual continuity of the light landing page.
  - Fix: replaced hard-coded sandbox surfaces and text colors with the shared landing tokens, preserving full dark-mode parity.
  - Post-fix evidence: `/tmp/buildrax-feedback-sandbox-before-after.png` and `/tmp/buildrax-feedback-sandbox-dark.png`.
- P2: the hero architecture canvas appeared static despite representing a live semantic flow.
  - Fix: added staggered node emphasis, connector activation and a restrained review-card lift using transform/opacity motion only.
  - Post-fix evidence: computed animation is running as `canvas-node-cycle` at 7.5 seconds; `/tmp/buildrax-feedback-hero-1122x1106.png` captures an active frame.
- P2: the header descriptor and first-diagram storage line added unwanted copy density.
  - Fix: removed both requested strings without changing the surrounding navigation or primary actions.
  - Post-fix evidence: `/tmp/buildrax-feedback-hero-before-after.png`.
- P2: the three feature cards had excessive internal whitespace.
  - Fix: reduced card minimum height from 280px to 220px, padding from 28px to 22px × 24px, heading gap from 80px to 46px and grid gap from 16px to 14px.
  - Post-fix evidence: `/tmp/buildrax-feedback-features-1122x1106.png`.

### Iteration 4 — onboarding, navigation, template and editor annotations

- P1: template-library actions sent users through the prompt composer instead of opening the selected architecture.
  - Fix: `Use template` now creates a fresh local draft from the template snapshot and navigates directly to its populated canvas.
- P1: the editor reserved inspector space and showed an empty inspector before an item was selected.
  - Fix: the canvas uses the full available area by default; the inspector and its reserved width appear only for a selected component or manual object.
- P2: React Flow minimap and control chrome did not inherit dark-mode tokens, and selected objects had no visible resizing affordance.
  - Fix: applied token-aware minimap/control styling and added persistent dimension updates from resize handles on selected semantic and manual objects.
- P2: onboarding notes competed with the composition, template cards lacked decision context, and the landing had incomplete navigation/footer structure.
  - Fix: moved notes into their referenced regions with down/right directional cues, added template descriptions, introduced dedicated navbar routes, and rebuilt the footer into navigation/resource groups.

### Iteration 5 — landing composition and canvas controls

- P1: manual shapes occupied the same selection path as semantic components, so selecting a shape opened the inspector and reduced the drawing area.
  - Fix: manual primitives now remain on the full canvas when selected; the inspector is reserved for semantic components. Browser check: selecting a primitive exposed four resize handles, zero inspector panels and one inline text input.
- P1: manual and semantic node content kept its original fixed dimensions while React Flow resized only the outer wrapper.
  - Fix: both node bodies now fill their managed React Flow dimensions. Resize handles persist their completed width and height to the diagram model.
- P1: text primitives depended on inspector editing and were not practical to edit on the canvas.
  - Fix: text primitives now contain an inline, keyboard-editable textarea with an explicit label and placeholder.
- P2: the pointer and hand were separated from undo, redo and zoom, and the left tool rail offered no discoverable labels.
  - Fix: pointer, hand, undo, redo and zoom are grouped in the bottom control bar; every tool now has a named hover/focus tooltip in addition to its accessible label.
- P2: the landing hero began too low, its canvas read too small, the capability strip added unnecessary density, and the sandbox route showed an unrelated information page.
  - Fix: moved the hero upward, widened and raised the architecture preview, removed the capability strip, adjusted display letter spacing, redirected the sandbox route to the live walkthrough and changed the handwritten cue to point down to the scenario choices.

### Iteration 6 — sign-in, hero motion and AI entry

- P1: landing-page Sign in navigated directly to a dashboard instead of presenting authentication.
  - Fix: routed the control to a dedicated `/sign-in` page with Google, GitHub and email entry points; verified the landing link and the sign-in page heading in the local browser.
- P2: the hero’s height and spacing made the architecture preview feel undersized, while the handwritten note pointed away from the brand.
  - Fix: tightened the hero’s top and bottom spacing, raised the preview’s minimum height, inserted a deliberate divider after the hero and redirected the note toward the BuildRAX mark.
- P2: text motion was absent and the AI change control remained open in the editor.
  - Fix: added reduced-motion-safe, staggered hero copy entrance motion using Anime.js/Animate.css and changed the AI control to an `Ask AI` launcher at the lower-right; it expands only on request and returns there when closed.

## Current validation status

- Browser-rendered implementation evidence for Iteration 5: local in-app browser at 1122 × 1106 CSS pixels, dark theme, saved from the landing, sandbox and editor routes during the review session. The editor check verified `resizeHandles: 4`, `inspectorVisible: 0`, and `textInputs: 1` after selecting a manual primitive.
- Browser-rendered implementation evidence for Iteration 6: local in-app browser at 1122 × 1106 CSS pixels. The landing refresh confirmed Sign in resolves to `/sign-in`, the hero divider renders, and the logo-directed note is present. The editor confirmed the collapsed AI launcher expands to an input positioned 28px from the lower-right edge; its console had no errors.
- Static verification for Iteration 6 passed: strict TypeScript, ESLint, 9 unit tests and a production Next.js build.
- Static verification for Iteration 5 passed: strict TypeScript, ESLint, 9 unit tests and a production Next.js build.
- The source truth for this pass was the user-provided annotated browser captures plus the supplied reference screenshots. The visual comparison checked hero placement/scale, letter spacing, the removed capability strip, sandbox content/navigation and the updated editor control surface. Focused verification covered the selected primitive state because it is the key interaction regression in this pass.

## Findings

No actionable P0, P1 or P2 visual, responsive or interaction findings remain for the requested direction.

Automated acceptance after Iteration 3: 9 unit tests passed, 10 Playwright tests passed across desktop Chromium and the mobile project, lint and strict TypeScript passed, and the Next.js production build completed successfully.

## Follow-up polish

- P3: when the final Figma SVG node icon bundle arrives, replace the existing semantic letter badges without changing node geometry.
- P3: the handwritten notes could receive one additional editorial pass after final marketing copy is locked.

final result: passed
