# BuildRAX two-week beta execution plan

## The goal

At the end of two weeks, a new user should be able to:

1. Describe a real product without receiving a confusing error.
2. Get a useful first architecture in about 5–10 seconds for the common path.
3. Understand what BuildRAX created, what it assumed, and what is still unknown.
4. Move, resize, select, connect, and organize components without fighting the canvas.
5. Ask for a change and review exactly what will change before applying it.
6. Create useful documentation without duplicated or ignored instructions.
7. Save work safely, reopen it, and recover clearly from common problems.
8. Use the important journeys with a keyboard and on smaller screens.
9. Share the beta with 100–200 users without losing work or overwhelming the server.

This is a **beta-stabilization plan**, not a plan to build every long-term idea in two weeks.

## Simple meaning of frontend and backend

- **Frontend** means the screens, buttons, canvas, messages, and interactions the user sees.
- **Backend** means the server, database, AI calls, permissions, saving, security, and performance work happening behind the screen.

Both must agree. A smooth screen cannot compensate for unsafe saving, and a strong database cannot compensate for a confusing canvas.

## People and time needed

The plan is realistic in two weeks with:

- one frontend-focused engineer;
- one backend-focused engineer; and
- part-time product/design and testing support.

One experienced full-stack engineer can still follow the plan, but should complete the beta blockers first and move dashboard polish to after the beta. The chunks are intentionally small enough to complete in separate Codex sessions without re-reading or rewriting the whole system every time.

## Rules for every chunk

Each daily chunk should follow the same small process:

1. Read only the relevant part of this plan and the audit.
2. Make the smallest complete change for that day.
3. Run focused tests for the changed journey.
4. Test the visible behavior in an isolated browser draft.
5. Update the progress file with what passed, what remains, and any blocker.
6. Do not push unless the user asks.

Run the full test suite only at the end of Days 5, 9, and 10. This keeps daily work focused and saves time and tokens.

## What is included in the two weeks

- Reliable architecture creation from short and long descriptions.
- Correct handling of scale, cloud, tenancy, sensitive data, and technology choices.
- Truthful AI and deterministic behavior.
- A useful architecture-change preview.
- Predictable canvas modes, selection, connectors, layout, and freehand drawing.
- Useful documentation and review results.
- Clear saving and recovery messages.
- Mobile and keyboard fixes for the supported beta journey.
- Shared request limits, staging tests, monitoring, and basic load proof.
- A controlled internal beta release.

## What is deliberately postponed

- Real-time multiplayer editing.
- Full mobile drawing and connector creation.
- Terraform, Kubernetes, OpenAPI, or live cloud-account imports.
- A complete cost calculator.
- Advanced capacity simulation.
- A separate IDE or Codex skill.
- A large marketplace or hundreds of new icons.
- Enterprise approval workflows.

These are valuable, but including them now would put the core beta experience at risk.

---

# Week 1 — make the core journey truthful and smooth

## Day 1 — make starting an architecture reliable

### What we will do

Fix the page where the user describes a system. Long descriptions must work, and choices such as “high scale” or “sensitive data” must go into the correct part of the architecture.

### Frontend work

- Keep the main description box.
- Group the extra choices under clear labels:
  - expected number of users;
  - single-tenant or multi-tenant;
  - public, private, or sensitive data;
  - preferred cloud;
  - preferred technologies.
- Show the user which details are optional.
- Check the form before sending it and explain the exact problem beside the relevant field.
- Preserve the user’s description if generation fails.

### Backend work

- Stop copying one long description into a field that only accepts 240 characters.
- Keep the complete description as the overall system intent.
- Break it into smaller requirements only when those requirements can be derived safely.
- Store scale, cloud, tenancy, and data sensitivity in their correct fields.
- Return a clear error such as “This description contains unsupported markup” instead of “Request validation failed.”

### Why this matters

Serious architecture requests are naturally detailed. The current system is more likely to fail for a thoughtful user than for someone entering one sentence.

### User impact

The user can explain a real system once, keep their work after an error, and trust that the selected constraints actually affect the result.

### Why it is technically feasible

The request and Architecture IR already contain separate fields for scale, cloud, and technology. This work corrects how the existing fields are filled; it does not require a new database design.

### Done when

- Descriptions from 12 to 3,000 characters behave correctly.
- Scale, cloud, tenancy, sensitivity, and stack appear correctly in the resulting architecture.
- Tests cover short, medium, maximum-length, and invalid inputs.
- A failed request never clears the user’s text.

---

## Day 2 — make the first result understandable

### What we will do

Improve the transition from “Generate architecture” to the first usable canvas. The user should understand what the tool is doing and why the result looks the way it does.

### Frontend work

- Show simple progress steps:
  1. reading the request;
  2. choosing a starting pattern;
  3. checking connections;
  4. preparing the canvas.
- If the operation takes longer than expected, show that it is still working instead of appearing frozen.
- After generation, show a small summary:
  - what BuildRAX created;
  - what it inferred;
  - which important details are still unknown.
- Add “Review assumptions” and “Open canvas” actions.

### Backend work

- Return progress-friendly information with the result.
- Return the selected starting pattern and the reason it was selected.
- Return confirmed facts, inferred assumptions, and unknown fields separately.
- Keep the fast rule-based starting pattern available when an AI provider is unavailable.
- Do not describe rule-based generation as an AI result.

### Why this matters

A diagram without an explanation can look authoritative even when it is only a starting point. The user needs to know what they should trust and what they should review.

### User impact

The first result feels faster, more transparent, and safer. The user can correct assumptions before spending time editing the diagram.

### Why it is technically feasible

The server already knows the selected template, validation warnings, and Architecture IR assumptions. The work mainly exposes this existing information clearly.

### Done when

- The user always sees progress or a clear error.
- The first-result summary distinguishes facts, assumptions, and unknowns.
- The common local/template path opens within two seconds.
- The common AI-backed path has a target of 5–10 seconds and shows progress when it exceeds that time.

---

## Day 3 — make architecture changes truthful and safe

### What we will do

Replace the misleading change experience with one that understands a small, clearly supported set of architecture changes and shows the exact result before applying it.

### Frontend work

- Show example commands the beta actually supports:
  - add a component;
  - insert a component between two existing components;
  - remove a component;
  - replace a component;
  - change a connection.
- Display the names of added, changed, and removed components.
- Display added, changed, and removed connections.
- Highlight affected items directly on the canvas.
- Show warnings such as “This leaves the worker disconnected.”
- Keep Cancel as a true no-change action.

### Backend work

- Turn a user request into a small, structured change plan instead of directly changing the canvas.
- Make the plan operate on the Architecture IR, which is the structured record behind the canvas.
- Check that every referenced component exists.
- Check that new connections are allowed and the final graph is still connected.
- Check that the canvas has not changed since the preview was created.
- If no AI provider is configured, support honest “quick changes” rather than pretending that free-form AI is active.

### Why this matters

Architecture changes affect security, data flow, failure behavior, and cost. A count such as “one component added” is not enough information to approve a change.

### User impact

The user can understand and trust a proposed change before applying it, and can undo it as one complete action.

### Why it is technically feasible

The application already has a change-plan format, validation rules, version numbers, and an apply/cancel preview. The missing work is to produce and display a meaningful plan rather than a keyword-based single node.

### Done when

- “Insert Redis between API and database” adds Redis and the correct two connections.
- Remove, replace, reconnect, and no-change examples work.
- An unsafe or disconnected result is rejected with a plain explanation.
- Preview, apply, cancel, undo, and stale-version behavior pass browser tests.

---

## Day 4 — make every canvas mode predictable

### What we will do

Make pointer, hand, drawing, eraser, text, connection, and component-placement modes behave as one consistent system.

### Frontend work

- Show one clearly active tool at a time.
- Change the cursor to match the active tool.
- Clear tool-specific messages when the user changes tools.
- Let Escape cancel the current action first, then return to pointer mode.
- Make component placement end after placing one item unless the user chooses “place repeatedly.”
- Make the eraser continue until the user changes tools.
- Replace permanent status messages with:
  - short messages for success;
  - inline messages for form errors;
  - persistent warnings only for possible data loss.
- Keep the AI launcher collapsed near the lower-right corner when unused.

### Backend work

- No major server change is needed.
- Ensure each completed canvas action is recorded as one change for saving and undo.
- Keep visual-only changes separate from meaning-changing architecture edits.

### Why this matters

Most reports that a pointer, eraser, or placement tool is “broken” come from the interface showing one mode while the next click behaves like another.

### User impact

The user always knows what the next click or drag will do. The canvas begins to feel calm and dependable.

### Why it is technically feasible

The tools already exist. The work replaces many loosely related on/off values with one clear interaction state and defined entry/exit behavior.

### Done when

- Pointer, hand, shape, text, freehand, eraser, connector, and placement journeys pass in sequence.
- No old eraser or placement message remains after switching tools.
- Cursor, highlighted toolbar button, instruction, and actual behavior always agree.
- One action produces one undo step.

---

## Day 5 — make selection, connections, and layout feel professional

### What we will do

Fix the highest-friction canvas actions: selecting groups, connecting components, and automatically arranging a mixed diagram.

### Frontend work

- Make selection handles and hit areas easier to use.
- Show how many items are selected.
- Add common group actions: align, distribute, move, duplicate, and place inside a frame.
- Allow two connection methods:
  - drag from one port to another;
  - click a source, then click a valid target.
- Highlight valid targets while connecting.
- Explain why an invalid target cannot be used.
- Keep nodes and labels away from the toolbar, AI bar, minimap, inspector, and other panels after automatic layout.
- Improve line routing and label readability for a 15-node diagram.

### Backend work

- Reuse the existing connection compatibility checks for live feedback.
- Validate the final connection again on the server when the saved architecture meaning changes.
- Keep connection style as visual information and connection meaning as Architecture IR information.

### Why this matters

These are the actions users repeat most. If connecting and arranging require trial and error, the product feels slower than a general drawing tool.

### User impact

Users can build a complex architecture without losing nodes under controls, guessing where to drag, or arranging every item by hand.

### Why it is technically feasible

Selection, connection ports, compatibility checks, automatic layout, and layer order already exist. This chunk improves the interaction and adds safe boundaries around the existing layout result.

### Done when

- Single, Shift, marquee, and keyboard selection work reliably.
- A new user can connect two nodes without instructions from the development team.
- Automatic layout never hides content under interface controls.
- A 15-node reference architecture has readable labels and no critical node overlap.
- The complete Week 1 frontend, unit, and build test suite passes.

---

# Week 2 — make documents, performance, security, and release reliable

## Day 6 — make documentation genuinely useful

### What we will do

Separate automatic architecture documentation from AI writing, and make both useful for an engineering handoff.

### Frontend work

- Rename the baseline action to “Generate from architecture.”
- Keep “Ask AI” only for prompt-aware writing.
- Let the user choose whether AI should:
  - draft a new section;
  - rewrite selected text;
  - summarize selected text;
  - create a table;
  - explain selected canvas items.
- Preview the proposed text before replacing user writing.
- Show which document blocks are:
  - linked live to the canvas;
  - manually written;
  - AI-proposed;
  - out of date.
- Preserve the existing tooltips, copy, download, Markdown, tables, code, Mermaid, and image controls.

### Backend work

- Add the user’s instruction and selected document range to the AI request.
- Return only the requested section or text change, not the complete document.
- Keep the current document and Architecture IR version attached to the request.
- Build better baseline sections from known architecture information:
  - purpose and scope;
  - components and responsibilities;
  - important request/data paths;
  - security boundaries;
  - known scale and reliability needs;
  - decisions and assumptions;
  - unknowns and open questions.
- Never invent a number such as availability or traffic when the user has not supplied it.

### Why this matters

The present AI document action ignores the prompt and can duplicate the entire document. This prevents the document area from becoming a trustworthy workspace.

### User impact

The user receives a useful starting document and can ask for a focused improvement without losing or duplicating their work.

### Why it is technically feasible

Editable documents, immutable versions, IR links, insertion tools, and an AI endpoint already exist. The change narrows the AI request and response instead of rebuilding the document system.

### Done when

- “Write a failure-modes section” creates only that section.
- “Rewrite this paragraph” changes only the selected paragraph.
- Cancel and undo preserve the original text.
- Baseline documentation clearly labels missing facts.
- Copy and export show visible success feedback.

---

## Day 7 — make review findings actionable

### What we will do

Turn Review from a small list of generic advice into a useful checklist connected to the diagram.

### Frontend work

- Keep the existing review panel but add:
  - affected components;
  - “show on canvas”;
  - clear severity and reason;
  - Open, Accepted risk, Fixed, and Dismissed states;
  - a place for an owner and note.
- Group findings under security, reliability, performance, data, and operations.
- Explain that rule-based checks are automatic checks, not an AI expert review.

### Backend work

- Move the current four checks into a named rule list.
- Add a small beta set of high-value rules:
  - public entry without identity;
  - sensitive data without encryption;
  - missing secrets ownership;
  - missing monitoring;
  - single point of failure;
  - queue without retry/dead-letter behavior;
  - database without backup/recovery information;
  - unknown scale or recovery goals.
- Save finding status and link it to the Architecture IR version.
- Keep AI-assisted suggestions separate and clearly marked as proposals.

### Why this matters

A useful review must help the team decide who will fix a problem, where it occurs, and whether the risk was accepted.

### User impact

The user can move from a finding to the affected path, record a decision, and prove that the review was addressed.

### Why it is technically feasible

Findings already contain severity, status, and affected object IDs. The interface currently does not use all of that information, and the rule list is small enough to extend safely.

### Done when

- Clicking a finding focuses its nodes and connections.
- Status, owner, and note survive reload for signed-in projects.
- Every rule includes a test with a passing and failing example.
- The UI clearly distinguishes automatic rules from AI suggestions.

---

## Day 8 — remove visible lag and protect large drafts

### What we will do

Make drawing, typing, undo, and saving remain responsive as the canvas grows.

### Frontend work

- Draw the live freehand stroke in a lightweight layer instead of rebuilding the whole canvas on every pointer movement.
- Reduce unnecessary points while keeping the stroke visually smooth.
- Save the stroke only when the user releases the pointer.
- Group text typing into one undo action instead of one action per character.
- Group inspector edits into one undo action when the user leaves the field.
- Keep large images outside repeated undo copies.
- Show a clear warning before browser storage becomes full.

### Backend work

- Continue coalescing cloud saves so rapid edits do not create a server request for every movement.
- Hash and upload only what changed where practical.
- Confirm size limits before accepting a save.
- Keep binary image files in private Storage rather than inside JSON.

### Why this matters

Smoothness is determined by the slowest repeated action. Freehand movement, typing, and local saving happen many times per minute.

### User impact

The pen follows the pointer, typing does not destroy undo history, and larger diagrams remain usable without risking browser storage.

### Why it is technically feasible

The application already collects pointer events, has undo history, coalesces saves, and supports private image storage. The work changes when data is copied and committed, not the saved diagram format.

### Done when

- Freehand visually keeps up with the pointer on a representative lower-end laptop.
- A long stroke produces a bounded number of stored points.
- Typing a sentence creates one useful undo step.
- A permitted large draft remains responsive and recoverable.
- Drawing continues smoothly while local or cloud saving is running.

---

## Day 9 — make mobile, accessibility, and recovery honest

### What we will do

Define a realistic mobile beta experience and make important actions understandable to assistive technology.

### Frontend work

- Treat mobile as a viewer and light editor for this beta.
- Show only mobile-supported actions: open, pan, zoom, select, edit labels, read docs, review, and share.
- Hide drawing and connector tools that are not supported on touch.
- Give every icon-only button a permanent accessible name.
- Keep visible keyboard focus and return focus after closing a panel.
- Announce selection count, save state, errors, and completed actions.
- Make blocked browser storage show an actionable recovery message, not “draft missing.”
- Keep sign-in reachable through a clear mobile menu and update the test to match that intended journey.

### Backend work

- Preserve the difference between “storage could not be opened” and “draft does not exist.”
- Return safe, stable error codes so the frontend can show the right recovery action.
- Confirm session renewal and safe return paths in staging.

### Why this matters

A smaller screen should not expose controls that the product says do not work. Missing button names also block screen readers, voice control, and reliable browser testing.

### User impact

Mobile users get a smaller but dependable experience. Keyboard and assistive-technology users can understand and operate the important workflow.

### Why it is technically feasible

The responsive layout, mobile notice, accessible labels, and storage error screen already exist. This work aligns them and closes the broken paths.

### Done when

- The full mobile browser project passes.
- No important button is unnamed.
- Keyboard-only users can open, inspect, edit text, review, save, and close panels.
- Blocked storage offers retry and recovery guidance.
- Basic automated accessibility checks have no serious or critical issue on the key screens.

---

## Day 10 — make the backend safe for a controlled beta

### What we will do

Replace single-server protections with shared protections, verify the real database and login journey, run load tests, and make a go/no-go decision.

### Frontend work

- Show truthful states for queued, generating, saving, offline, conflict, and sign-in-required conditions.
- Add a small “Report a problem” action that includes a request ID but no private architecture content.
- Improve the dashboard enough for beta:
  - real diagram preview or honest generic icon;
  - search;
  - sort by recent;
  - rename;
  - duplicate;
  - archive/delete confirmation;
  - last saved and review status.
- Clarify visual versus structured export formats and show download completion.

### Backend work

- Replace the in-memory request limiter with a shared service such as Redis/Upstash.
- Limit requests by signed-in user, workspace, guest identity, and overall AI-provider capacity.
- Fail production startup if signing secrets are missing.
- Add monitoring for errors, slow requests, AI usage, save conflicts, failed migrations, and archive failures.
- Apply all migrations in a clean staging environment.
- Test real sign-in, private images, guest migration, saving, history, restore, share links, archive, and notification paths.
- Run load tests for 100 simultaneous saves and a controlled burst of generation requests.
- Test what happens when the AI provider, database, email provider, or network is slow or unavailable.

### Why this matters

A beta can survive an imperfect visual detail. It cannot survive lost work, accidental cross-account access, uncontrolled AI cost, or a server that fails when users arrive together.

### User impact

Users receive clear status, their work remains safe during failures, and the team can diagnose a problem without asking for private architecture data.

### Why it is technically feasible

RLS, version checks, idempotency, recovery, private assets, archive jobs, and request IDs already exist. The remaining work is deployment proof, shared traffic control, monitoring, and correcting known configuration fallbacks.

### Done when

- Every database migration and permission test passes in a clean staging environment.
- Real authentication and guest-to-account migration pass end to end.
- One hundred simultaneous saves complete without lost or duplicated versions.
- Multiple saves to the same diagram produce clear conflicts rather than silent overwrites.
- Missing production secrets stop deployment safely.
- Monitoring shows request time, errors, save conflicts, and AI-provider usage.
- The full unit, desktop browser, mobile browser, database, security, and build suite passes.

---

# Days 11–14 — controlled validation and release buffer

The coding plan above uses ten focused working days. The remaining calendar days protect the release from being rushed.

## Day 11 — internal user test

### What

Ask 3–5 people who did not build the product to create one architecture from a prompt, edit it, connect two components, generate documentation, save, and reopen it.

### Why

Developers already know where ports and hidden actions are. New users reveal confusing behavior that tests cannot predict.

### How

Observe without teaching. Record where the user pauses, retries, or asks what something means. Fix only beta-blocking confusion.

### Impact

This confirms that the canvas is understandable, not merely technically functional.

### Done when

At least four of five users complete the main journey without developer help, and every data-loss or dead-end problem is fixed.

## Day 12 — failure and recovery test

### What

Repeat the journey while the network is turned off, a save is delayed, a second tab edits the same diagram, and the AI provider fails.

### Why

Users judge reliability by what happens during problems, not only during the happy path.

### How

Use controlled test fixtures and staging switches. Confirm that the latest local work remains recoverable and every message tells the truth.

### Impact

Users do not panic, lose work, or accidentally overwrite a newer version.

### Done when

Every simulated failure has a clear state, safe retry, or explicit conflict choice.

## Day 13 — final performance and security check

### What

Repeat the load tests, permission tests, dependency audit, secret checks, and important browser journeys against the release candidate.

### Why

Late fixes can reintroduce failures. The final candidate must be tested as one complete product.

### How

Run the single beta-readiness command and save the results with the release version.

### Impact

The release decision is based on evidence rather than confidence or local screenshots.

### Done when

All P0 and P1 gates pass, no cross-account access is possible, and the published performance targets are met.

## Day 14 — controlled beta release

### What

Release first to a small group, then increase access gradually.

### Why

Gradual release limits damage if staging did not reveal a real-world problem.

### How

- Start with 10–20 invited users.
- Watch errors, save failures, generation time, and user feedback.
- Increase toward 100–200 users only while the system remains healthy.
- Keep a tested rollback available.

### Impact

The team learns from real usage without putting every user’s work at risk.

### Done when

The first group completes the core journey, monitoring remains healthy, support issues are understood, and the release owner approves expansion.

---

# User-experience targets

These targets explain what “smooth” means in user terms:

- A new user understands how to start within 30 seconds.
- A normal first architecture is visible within 5–10 seconds.
- The user always sees progress during a longer operation.
- Local drawing and dragging respond immediately to the pointer.
- No automatic layout hides work behind interface controls.
- A user can connect two components without documentation.
- A user can undo one meaningful action at a time.
- A document instruction changes only the requested section.
- The product never calls a fixed rule “AI” without explaining it.
- The product never clears a user’s prompt or document after a failed request.
- Every save state says whether the work is local, in the cloud, waiting, offline, or in conflict.
- An unavailable browser store is never described as deleted work.

# Technical success targets in plain language

- One hundred users can save at the same time without losing or duplicating versions.
- If two users or tabs edit the same version, one succeeds and the other receives a clear conflict.
- A common save finishes in under one second after the save starts.
- A common AI-backed first draft finishes in under ten seconds for at least 95 out of 100 requests during normal load.
- The server limits excess traffic consistently even when more than one server is running.
- Missing security keys stop the release instead of silently using development values.
- The team can trace an error using a request ID without logging private prompts or diagrams.
- Database permission tests prove one workspace cannot read or change another workspace.

# Token-friendly execution commands

Use one of these as a separate request. Complete only that chunk, run its focused tests, and update progress before starting the next one.

1. `Start two-week plan Day 1 — reliable architecture intake.`
2. `Start two-week plan Day 2 — understandable first result.`
3. `Start two-week plan Day 3 — truthful architecture changes.`
4. `Start two-week plan Day 4 — predictable canvas modes.`
5. `Start two-week plan Day 5 — selection, connectors, and layout.`
6. `Start two-week plan Day 6 — useful documentation.`
7. `Start two-week plan Day 7 — actionable review.`
8. `Start two-week plan Day 8 — canvas performance and large drafts.`
9. `Start two-week plan Day 9 — mobile, accessibility, and recovery.`
10. `Start two-week plan Day 10 — backend scale and beta readiness.`

Days 11–14 are validation and release steps and should begin only after Days 1–10 are complete.

# Final release rule

Do not release because the calendar reached Day 14. Release only when the core journey works, user work remains safe, all P0/P1 issues are closed, staging tests pass, and the measured load targets are met.
