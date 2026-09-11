# User-journey implementation handoff

## Current chunks: Day 4(a) and 4(b) — deterministic canvas interaction and workflow

### Day 4 implemented

- React Flow and the saved diagram no longer compete as two live sources of drag positions. Temporary movement stays in the controlled React Flow nodes and is committed once at drag end.
- Measured node dimensions are preserved when selection or editor data changes, preventing selected groups from becoming temporarily uninitialized during movement.
- Pointer mode supports direct movement, Shift multi-selection, partial-intersection marquee selection, multi-node dragging, and Arrow-key nudging. Shift+Arrow moves the selection ten canvas units; Arrow alone moves it one.
- Node and primitive layer order remains part of the saved diagram. Bring-to-front and send-to-back now have browser assertions that verify their effective order after selection is cleared.
- Semantic nodes remain resizable and connector handles create editable connections. Route, line texture, direction, label, protocol, authentication, and encryption remain configurable in the inspector.
- Freehand drawing continues collecting coalesced pointer samples while the live preview is under the pointer. The preview cannot intercept drawing input, and stored strokes render through a smooth cubic path.
- Signed-in canvases now expose a compact project switcher containing the user's accessible projects and a link back to the full dashboard. Existing recovery-before-navigation protection applies to each project link.
- The mini-map remains independently collapsible, node appearance controls remain persistent, and no snap-to-grid or ellipse creation control was reintroduced.

### Day 4 acceptance coverage

- Browser coverage exercises node resize, connector creation, single/multi-node movement, keyboard movement, marquee selection, style persistence, front/back layering, and continuous smoothed freehand input.
- The movement journey fails if React Flow emits its former “node not initialized” diagnostic.
- Full verification on 2026-09-12: 75 unit/component tests, typecheck, lint, and production build passed.
- Desktop/mobile guest-canvas regression: 26 passed and 14 intentionally platform-specific tests skipped. All 19 applicable desktop canvas journeys passed.

### Day 4 remaining limits

- Touch-first drawing and connection creation remain intentionally desktop-only for the MVP; mobile retains pan, zoom, selection, and light editing.
- Project switching is a safe whole-project navigation, not multiple simultaneously mounted canvases or browser-like editor tabs.
- Connector compatibility remains advisory for manual diagrams. Semantic validation still reports unusual connections rather than silently deleting them.

### Next session: Day 5(a) only

Persist editable documents as version-aligned backend artifacts, while preserving the distinction between AI-generated drafts and user-authored changes.

---

## Completed chunks: Day 3(a) and 3(b) — complete guest migration and conflict recovery

### Day 3 implemented

- Guest signup migration now carries the current Architecture IR, presentation, server-materialized diagram, editable document, private canvas/document images, and the original signed AI generation artifact in one verified workflow.
- Canvas and document data-image references are uploaded to private diagram-scoped storage before migration. The server rejects remaining base64 images, references outside the workspace/diagram boundary, missing uploads, checksum mismatches, and excessive image counts or sizes.
- The original AI generation remains separate from the edited current snapshot. Its signed receipt is verified against the original checksums, linked to its AI run, and stored as immutable generation lineage.
- The complete database migration creates the project, diagram head, IR version, presentation/materialized artifacts, document version, and generation-origin link atomically. Replaying the same idempotency request returns the same result; conflicting content is rejected.
- The client reads the migrated architecture, document, and generation origin back and compares their checksums. The browser draft is deleted only after every expected value matches. Upload, transaction, read-back, or checksum failures leave the complete browser recovery intact.
- Cloud projects now load their persisted editable document into both canvas and document views instead of silently regenerating it.
- A cloud/browser version mismatch now opens an explicit recovery decision rather than a generic stop screen. The user can download the browser copy, preserve both and save the browser copy as a new cloud version, or preserve both and continue from the cloud version.
- Both sides of every conflict are archived in IndexedDB before resolution, with the selected resolution and timestamp retained. Automatic retries remain stopped until the user chooses.

### Day 3 acceptance coverage

- Unit/component coverage proves complete-migration deletion happens only after all read-back hashes match, mismatches retain the draft, and both cloud/browser conflict choices preserve both source copies.
- Full verification on 2026-09-12: 75 unit/component tests, typecheck, lint, and production build passed.
- Chromium journey regression: 24 passed and one intentionally mobile-only test skipped.
- A new eight-assertion pgTAP suite covers atomic document/origin migration, replay safety, duplicate prevention, immutability, and cross-tenant RLS. It is committed but could not be executed while the local Docker/Supabase engine was unavailable; no hosted database was touched.

### Day 3 remaining limits

- Conflict resolution deliberately provides two safe whole-version choices, not field-level merging. A visual or semantic three-way merge belongs after the beta reliability path is proven.
- Choosing the browser canvas creates a new cloud architecture version, while its locally recovered document remains protected for the later document-save API chunk. Cross-device editable document saving is still Day 5 work.
- The new PostgreSQL migration must pass the local pgTAP suite and then a staging migration/RLS check before deployment.
- Real OAuth signup, private Storage, and email-provider behavior still require staging credentials and an authenticated staging journey.

### Next session: Day 4(a) only

Make canvas interaction states deterministic: selection versus pan behavior, marquee/multi-select, node movement, and truthful pointer/hand cursors. Keep persistence contracts unchanged.

---

## Completed chunks: Day 2(a) and 2(b) — signed-in creation and authentication journey

### Day 2 implemented

- `/start` now receives trusted session state from the server. Anonymous users still create recoverable browser drafts; authenticated users create a workspace project before the canvas opens.
- Blank and AI-generated signed-in architectures use the same validated Architecture IR, presentation, materialized diagram, checksum, idempotency, RLS, and read-back verification path.
- A failed signed-in project creation remains an explicit error. It never silently downgrades into an unexplained guest draft.
- Authenticated AI generation no longer sends guest identity headers. Guest generation retains its anonymous-session rate-limit identity.
- `/api/v1/projects` is now the clear signed-in creation endpoint. It reuses the existing atomic first-version persistence transaction rather than introducing a second, weaker write path.
- `/sign-in` is the single sign-in surface. The duplicate dashboard modal and duplicate provider logic were removed.
- Sign-in accepts one sanitized internal `next` destination. OAuth and email callbacks preserve it, reject external/protocol-relative/recursive callback targets, and return failures to the sign-in screen without discarding the intended destination.
- An already authenticated visitor to `/sign-in` is returned immediately to the safe intended destination.
- The guest editor's save gate now goes directly to sign-in with `/draft/:id?migrate=1` as its return target, keeping the canvas in view for the existing migration continuation.

### Day 2 acceptance coverage

- Unit/component coverage proves internal return paths are preserved, unsafe return paths are rejected, anonymous blank creation stays local, authenticated blank creation persists first, and a failed cloud creation never creates a guest draft.
- Full verification on 2026-09-11: 70 unit/component tests, typecheck, lint, and production build passed.
- Chromium journey regression: 24 passed (including the dedicated sign-in and hostile-return-path checks) and one intentionally mobile-only test skipped.
- The PostgreSQL suite could not start: the local Supabase database was absent and Docker Desktop's engine did not respond to either `supabase start` or `docker info`. No hosted database was touched. Re-run `npm run db:test` once Docker reports a healthy engine.

### Day 2 remaining limits

- The signed-in creation endpoint deliberately reuses the hardened atomic first-version transaction currently named `migrate_guest_architecture` in PostgreSQL. The public API and user journey are correctly separated, but renaming/splitting this legacy database routine and its internal audit label should be done in the next database migration without changing its idempotency behavior.
- Hosted OAuth/email-provider redirects were not exercised with a real external account in automated tests. Local callback safety and routing contracts are covered; staging-provider verification remains a release check.
- Complete guest asset/document/origin migration remains Day 3A. This chunk only preserves the correct return-to-draft continuation.
- Conflict comparison and explicit resolution remain Day 3B.

### Next session: Day 3A only

Make guest-to-account migration carry assets, editable document content, current snapshot, and original generation lineage, retaining the browser backup until the complete persisted result is verified.

---

## Completed chunk: Day 1(b) / 1B — cloud-save coordinator

Day 1(a) was committed and pushed to `origin/fresh-variant` as `efa75df` before beginning this chunk.

### Day 1(b) implemented

- Cloud saving now runs through one coordinator per authenticated diagram instead of two competing editor effects.
- Only one request is sent at a time. An edit arriving behind a delayed request remains pending, is rebased on the returned diagram/IR versions, and is sent next.
- Each request captures its diagram base version, IR base version, local revision, and idempotency key together.
- Normal scheduling is five seconds after the last edit, with a hard 30-second ceiling during continuous editing.
- Network, rate-limit, and server failures are queued and retried with the same idempotency key using bounded exponential backoff. `Retry-After` is honored when supplied.
- Offline work creates a durable scoped retry before waiting for connectivity. Reconnect resumes the exact request.
- Authentication/authorization failures, validation rejections, and version conflicts stop automatic retries. They preserve both local recovery and the cloud request for explicit resolution.
- A queued request can replace only an older/equal local revision. Clearing a successful request checks its idempotency key, so an old response cannot delete a newer queued request.
- Cloud states are distinct from browser recovery states: pending, saving, saved, offline, conflict, sign-in required, and error.
- Internal editor navigation first confirms the latest browser recovery. It does not block on a possibly slow network request; cloud work can be reconstructed from the scoped local record on reopen.
- Cloud image upload happens as part of sending; an upload/network failure retains the original request and its local image for retry.
- Reviews and generated documentation persist only when the current semantic canvas is actually cloud-saved.

### Day 1(b) acceptance coverage

- Five-second idle and 30-second maximum scheduling.
- Delayed old response with a newer edit waiting.
- Same-key retry and bounded backoff.
- Offline durability and reconnect.
- No automatic retry for conflict, auth, or validation failures.
- HTTP failure classification.
- Queue isolation, local-revision ordering, and idempotency-specific clearing.
- Hook-level delayed HTTP integration proving the next request uses the returned base version and latest edit.

Final verification on 2026-09-11:

```text
npm test: 62 passed
npm run typecheck: passed
npm run lint: passed
npm run build: passed (23 application routes built)
Chromium guest + recovery regression: 22 passed, 1 intentionally mobile-only test skipped
```

The first browser run exposed two existing tests that counted nodes before React Flow finished rendering. They were corrected to wait for the expected 15 initial nodes; the full rerun passed. React Flow still emits its pre-existing “node not initialized” diagnostic during the programmatic multi-node drag test; that test passes, but the diagnostic should be handled in the Day 4 canvas chunk rather than hidden here.

### Day 1(b) remaining limits

- Conflict comparison/merge UI remains Chunk 3B; Day 1(b) deliberately stops and preserves both copies.
- Session renewal UI remains Chunk 2B. Day 1(b) reports sign-in required without silently retrying forbidden requests.
- Documents remain browser-recovered but are not yet stored by the cloud diagram endpoint (Chunk 5).
- Legacy unscoped retry rows remain retained and quarantined because account ownership cannot be proven.
- A hard browser/OS termination can interrupt work before the 800 ms local checkpoint. No browser application can guarantee an asynchronous final write after process termination.
- Hosted Supabase/RLS, deployment, and 100–200-user load tests are release work; local coordinator tests do not establish production capacity.

### Original next-session note (now completed)

Day 2A and 2B were subsequently completed together at the user's request. See the current section above.

---

## Completed chunk: Day 1(a) / 1A — reliable local recovery

Branch: `fresh-variant`. No production deployment, database migration, or credential change was performed for this chunk.

### Implemented

- IndexedDB version 4 adds account-scoped recovery and cloud retry tables. Versions 1–3 and their old records are retained.
- Guest recovery extends the existing draft record rather than duplicating all its images in another table. Account recovery uses a key containing user, workspace, and diagram IDs; identity comes from the authenticated server page.
- Canvas, IR, presentation, document (including an intentional empty string), images/references, and original generation are recovered together. Current artifact checksums are recalculated locally.
- The original signed generation remains a separate artifact. Layout-only recovery does not turn its semantic provenance into a manual edit.
- Old guest documents are read from their old localStorage key once; after the first IndexedDB save, even an empty document is authoritative. The old key is retained as a backup. Unscoped old documents are not imported into signed-in accounts.
- A serialized writer coalesces edits in 800 ms windows. It retains the newest waiting snapshot when an earlier write is slow or fails. Identical checkpoints do not increment the local revision.
- Local compare-and-write detects stale tabs. A different cloud base stops editor initialization rather than overwriting either copy. Full conflict resolution is still a later chunk.
- Local failures show a persistent warning, retry action, and full JSON recovery download. Browser unload warns while local changes remain unconfirmed; hiding the page attempts a flush. A browser/OS crash can still lose work that was not yet committed.
- Docs opens the existing document. Generating a replacement is a separate button and asks before replacing nonempty writing.
- Reopening confirmed recovery uses the stored viewport rather than automatically fitting the canvas again.
- An old image upload response cannot replace a newer image source or its newer styling.
- Read-only shared canvases do not load or save private local documents. Nonessential palette preference failures do not crash the editor.
- Guest migration retains its browser backup because its current server transaction does not yet prove document/origin migration succeeded.

### Checks

Final verification passed: 52 unit/component tests and four Chromium recovery journeys. Commands:

```sh
npm test
npm run typecheck
npm run lint
npx playwright test tests/e2e/local-recovery.spec.ts --project=chromium --workers=1
```

Tests use fixtures and isolated browser contexts, not the user's live canvas. The only new dependency is `fake-indexeddb`, for development tests.

### Important limits / do not mistake these for completed work

- Editable documents are still local-only. This chunk does not make them durable across devices.
- Legacy unscoped cloud retry rows are retained but not automatically sent using an account whose ownership they cannot prove. Add an explicit, authorized recovery path in 1B/3B; never infer ownership from whichever account happens to be signed in.
- A JSON recovery download is a rescue copy, not a completed import UI.
- When cloud and browser versions differ, this slice preserves them and offers a download; it does not implement a merge/resolution UI.
- Full generation-receipt verification/linkage for an edited guest draft, uploaded-asset checksum reconciliation, and complete document migration are still 3A work.
- The existing cloud autosave/replay code is not yet the 1B coordinator. Its scheduling, truthful latest-revision status, idempotency replay, and auth/conflict state machine still need completion.
- Browser account scoping prevents accidental cross-account recovery in the app; it is not encryption or protection from someone with access to the same browser profile/devtools.
- No hosted authenticated end-to-end journey, database/RLS suite, production deployment, or concurrency/load test was performed for this local-recovery slice.

### Next session: start only Chunk 1B

Read this file and `USER-JOURNEY-PLAN.md`, then inspect:

- `src/components/editor/architecture-editor.tsx`: current cloud autosave and replay effects.
- `src/components/editor/editor-recovery.tsx`: hydration gate and local recovery hook.
- `src/lib/storage/drafts.ts`: guest/account records and scoped retry contracts.
- `src/lib/storage/recovery-writer.ts`: already-tested local write coalescer.
- `src/app/api/v1/diagrams/[id]/route.ts`: existing save contract (confirm exact route before edits).

Do not revisit the landing page, icon catalog, or unrelated AI features. Keep `audit-artifacts/` untouched. Do not merge `main` or push without a new request.
