# User-journey implementation handoff

## Current chunk: Day 1(b) / 1B — cloud-save coordinator

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

### Next session: Day 2A only

Make signed-in creation produce a real persisted project/diagram while preserving the clear guest path. Do not begin auth-route consolidation, guest migration, or canvas interaction work in the same chunk.

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
