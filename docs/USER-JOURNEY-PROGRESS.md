# User-journey implementation handoff

## Current chunk: Day 1(a) / 1A — reliable local recovery

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
