# User-journey correction plan

Work on `fresh-variant`. Complete one small chunk per session, run its focused checks, and update `USER-JOURNEY-PROGRESS.md` before moving on. These are engineering work packages, not a claim that a calendar day guarantees completion. This file does not claim to update Jira.

## Day 1(a) / Chunk 1A — reliable browser recovery

Goal: a locally confirmed edit can be reopened without losing the canvas, document, images, or original generation information.

- Store the complete editable canvas, Architecture IR, presentation, and document together.
- Keep the signed original generation separately from later edits.
- Keep guest drafts separate from authenticated recovery, keyed by account, workspace, and diagram.
- Upgrade old local records without deleting them; import old guest documents without resurrecting intentionally deleted text.
- Serialize local writes and keep newer edits waiting when an older write is running.
- Detect a different tab's newer local revision; never silently overwrite it.
- Clearly distinguish a local recovery failure from a cloud-save failure. Allow retry and a downloadable recovery copy.
- Opening Docs must open the document, not regenerate it.

Acceptance: focused storage and editor tests plus browser tests for refresh, offline editing, storage failure, recovery download/retry, and two-tab protection pass.

Not included: a new cloud-save coordinator, automatic cloud conflict merging, full guest-to-account document migration, or production deployment.

## Day 1(b) / Chunk 1B — cloud-save coordinator

Build on 1A, without rewriting local recovery.

1. Extract cloud saving and replay from the editor into one coordinator per authenticated diagram.
2. Capture a request's diagram/IR base versions, local edit revision, and idempotency key together.
3. Allow only one request in flight; keep newer edits pending and send them after it settles.
4. Save after five seconds of idle, with a maximum 30-second interval during continuous editing.
5. Retry transient failures with the same idempotency key and bounded backoff. Do not retry authentication, validation, or version conflicts as if they were network failures.
6. Clear only the acknowledged queued request, never a newer one. Recheck the local snapshot before replaying an older queued request.
7. Expose truthful states: local pending/saved/error, cloud pending/saving/saved/offline/conflict/auth-required/error.
8. Flush local recovery before internal navigation and warn where flushing is impossible; do not promise asynchronous writes will finish when a browser process is killed.
9. Add delayed-response, failure, offline/reconnect, navigation, and stale-base tests.

Acceptance: a successful old response cannot mark newer edits as cloud-saved or remove their queue record. Auth and conflict responses retain the local document and canvas.

## Following chunks

| Day | Chunk | User outcome |
| --- | --- | --- |
| 2 | 2A: signed-in creation | Starting a new architecture while signed in creates a workspace project, not an unexplained guest-only draft. |
| 2 | 2B: authentication journey | Sign-in, callbacks, and return-to-canvas behavior use one clear route and keep the user's work in view. |
| 3 | 3A: guest migration | Assets, document, current snapshot, and original generation lineage survive signup; keep backups until the complete result is verified. |
| 3 | 3B: conflict recovery | Compare cloud and browser versions, preserve both, and choose an explicit resolution. |
| 4 | Canvas corrections | Stabilize selection, dragging, resizing, connectors, freehand, layers, keyboard behavior, and project switching with repeatable browser tests. |
| 5 | Document persistence | Save editable documents to the backend, clarify generated drafts versus user writing, and verify document actions and exports. |
| 6 | IR/version alignment | Finish semantic edit, AI proposal, history/restore, review, document, and export version alignment. |
| 7 | Beta readiness | Run release, authorization, recovery, accessibility, and realistic concurrent-user checks; fix blockers before inviting the beta cohort. |

Break a row into further bounded chunks if the inspection reveals more work. Completing local tests is not proof that production supports 100–200 simultaneous users.
