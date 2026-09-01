# BuildRAX landing design direction

## Visual principle

The landing experience combines the restrained MiniMax product system with a working-whiteboard layer. DM Sans remains responsible for product hierarchy and UI legibility. Caveat is limited to short instructional notes, callouts and annotations. Handwritten text never carries critical actions, status, error or legal information.

## Top bar layout

The desktop header is a 76px sticky three-zone grid:

1. Brand zone: BuildRAX lockup and the quiet context label “Semantic architecture”.
2. Navigation zone: anchored links for How it works, Sandbox, Templates and Security.
3. Action zone: Sign in, theme control and the primary Start building action. A small handwritten note reinforces that the first diagram is free.

At widths below 980px, the centered section links are removed. Below 760px, the action zone becomes theme and menu controls. The opened menu exposes the complete section navigation and both authentication and creation actions with 44px minimum targets.

## Landing composition

- Hero: value proposition on the left, coded semantic-canvas preview on the right, with two handwritten prompts that explain how rough ideas become typed architecture.
- Capability band: concrete MVP scope counts.
- Product model: create, controlled AI changes and version-bound handoff.
- Interactive sandbox: three working scenarios—happy path, access denial and traffic spike—using the MVP’s actual RLS, versioning, audit and idempotency concepts.
- Templates: trusted provider-neutral starting points.
- Closing action: one focused route to `/start`.

## Annotation rules

- Use no more than one or two annotations per viewport.
- Keep notes between 18px and 23px and below normal body-text contrast.
- Pair directional marks with icon-library arrows; never rely on the mark alone.
- Hide nonessential notes when space becomes constrained.
- In the editor, notes are dismissible and do not obscure persistent controls.

## Motion and interaction

The sandbox advances through semantic stages every 1.05 seconds and restarts when a scenario is selected. Scenario selection, the mobile menu and every CTA are functional. Reduced-motion users receive a static first-stage view and no looping animation.
