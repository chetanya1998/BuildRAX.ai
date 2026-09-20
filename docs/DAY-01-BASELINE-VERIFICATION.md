# Day 01 / B00 — baseline verification

Verified on 16 September 2026 from `chore/b00-baseline-verification`, based on `origin/fresh-variant` at `1593285`. This is local and source verification only. No staging or production system, personal account, or hosted database was changed.

## 1. What was verified

The status in this table is authoritative for B00. “Verified” means verified locally; it never implies staging or production proof.

| Area | Status | Evidence | Remaining limitation |
| --- | --- | --- | --- |
| Guest recovery | Regression | [recovery integration tests](../src/components/editor/editor-recovery.test.tsx), [browser recovery journeys](../tests/e2e/local-recovery.spec.ts), and a disposable draft survived edit/reload | Desktop recovery, quota recovery and stale-tab protection pass. Mobile blocked IndexedDB can still be reported as a missing draft (BRX-AUD-017). A crash inside the 800 ms checkpoint window can lose the newest uncommitted edit. |
| Cloud saving | Staging unverified | [coordinator tests](../src/lib/storage/cloud-save-coordinator.test.ts), [hook integration](../src/components/editor/use-cloud-save.test.tsx), and [cloud-save implementation](../src/components/editor/use-cloud-save.ts) | Ordering, idempotency, retry and conflict states pass locally. No authenticated hosted save or multi-instance test ran. Extend this coordinator; do not create another save path. |
| Authentication | Regression | [return-path tests](../src/lib/auth/return-path.test.ts), [Chromium auth journey](../tests/e2e/auth-journey.spec.ts), and the manual save gate retained `/draft/:id?migrate=1` | Real OAuth/email remains staging-unverified. The mobile landing sign-in action is behind navigation while the test expects a named direct action, and mobile editor action names disappear (BRX-AUD-015). |
| Guest migration | Staging unverified | [migration component tests](../src/components/editor/draft-loader.test.tsx), [migration route](../src/app/api/v1/guest-migrations/route.ts), and migration `202609110006` plus corrective migration `202609150010` | Atomic source and checksum/readback logic exist, but pgTAP could not connect to local Supabase and no hosted migration was attempted. Extend the existing transaction and readback; do not rebuild it. |
| Canvas editing | Verified | All 25 executed Chromium tests passed; manual placement, movement, styling, Shift selection, connection, freehand, erase, undo and redo passed; see [guest-flow.spec.ts](../tests/e2e/guest-flow.spec.ts) | Desktop verification only. Touch authoring is intentionally unsupported; mode coherence, safe-area layout, edit grouping and large-canvas performance remain roadmap work. |
| Architecture IR | Verified | [compiler tests](../src/lib/architecture-ir/compiler.test.ts), [snapshot tests](../src/lib/architecture-ir/snapshot.test.ts), [compile route tests](../src/app/api/v1/architecture/compile/route.test.ts) | IR validation, checksums and deterministic materialization pass locally. The input adapter still copies a valid long prompt into a 240-character requirement and fails before producing IR (BRX-AUD-001). |
| Documents | Regression | Manual Markdown edit/preview/copy and navigation passed; [document browser coverage](../tests/e2e/guest-flow.spec.ts) verifies inserts, preview and Markdown download; document migration/source exists | AI-labeled refinement ignores the prompt and appends a full deterministic document (BRX-AUD-003). Hosted document version/conflict behavior is unverified. |
| History and restore | Staging unverified | History/restore routes and immutable SQL are present in [version routes](../src/app/api/v1/diagrams/%5Bid%5D/versions) and `202609060005_architecture_ir_persistence.sql` | Guest drafts have no cloud history. Restore-as-new-head was not executed because Supabase and an authenticated disposable workspace were unavailable. Extend immutable versions; never rewrite history. |
| Archive and notifications | Production unverified | Source exists in `202609120008_archive_delivery_hardening.sql`, [maintenance route tests](../src/app/api/internal/architecture-maintenance/route.test.ts) and [worker unit tests](../tests/unit/netlify/architecture-maintenance.test.ts) | Database policies, private Storage, scheduler, delivery and day-30 hydrate/restore were not executed. Scheduler must remain disabled until release verification passes. |
| Export and sharing | Incomplete | Mermaid/filename units pass; manual export controls were present; [document E2E](../tests/e2e/guest-flow.spec.ts) verifies Markdown download; [read-only share shell](../src/app/share/%5Btoken%5D/page.tsx) exists | The manual browser driver could not observe blob-download completion for all five formats. Share creation/readback needs hosted auth/database. Export scope, confirmation and version bundle are incomplete. |
| Rate limits and scaling | Incomplete | Source inspection of [rate-limit.ts](../src/lib/server/rate-limit.ts) and release configuration | Limits use a process-local `Map`, guest identity is client-influenced, no executable load suite exists, and 100–200-user capacity is unproven. |

The recovery writer, cloud-save coordinator, guest migration/readback, Architecture IR snapshots, immutable versions and canvas model are retained systems. Later days must extend their contracts and tests rather than replace them.

## 2. Automatic tests verified

Environment: macOS local workspace, Node.js project dependencies from the checked-out lockfile, Next.js 16.3.3, Chromium supplied to Playwright. Counts are from this B00 execution, not copied from earlier progress notes.

| Command | Result and counts | What it proves |
| --- | --- | --- |
| `npm run release:scan` | Pass: 0 findings; 195 repository files scanned; 10 uniquely timestamped migrations | Local repository/configuration presence only. It does not apply migrations or scan hosted secrets. Count is from the final documentation tree. |
| `npm run lint` | Pass: 0 errors, 0 warnings | Local static lint rules. |
| `npm run typecheck` | Pass: 0 TypeScript diagnostics | Local compile-time contracts. |
| `npm test` | Pass: 20 files, 80 tests; 0 failed, 0 skipped | Local unit, component and route fixtures, including recovery, saving, IR and migration behavior. No live database/browser behavior. |
| `npm run build` | Pass: 0 build errors; 24 pages generated; 37 app-manifest entries | Production-mode compilation and route generation, not a deployed runtime. |
| `npm run test:e2e -- --project=chromium` | Pass: 25 passed, 0 failed, 1 intentionally mobile-only test skipped | Local desktop browser behavior against disposable drafts. The first sandboxed attempt could not bind port 3000; the authorized local-server rerun is the recorded result. |
| `npm run db:test` | **Environment blocked:** 0 pgTAP tests executed; connection refused at `127.0.0.1:54322`; 3 SQL test files present | Does not prove database behavior. Docker/local Supabase must be running before this can pass. |

Supplemental mobile baseline: `npm run test:e2e -- --project=mobile` produced 11 passed, 2 failed and 13 intentionally desktop-only skips. A serial six-test rerun produced 3 passed and 3 failed: landing sign-in remained inaccessible by its expected name, Docs remained unnamed in the recovery journey, and blocked IndexedDB displayed “draft not available” instead of the recovery alert. These match BRX-AUD-015 and BRX-AUD-017 and are recorded as regressions, not test success.

## 3. Manual tests verified

All destructive interaction used two disposable guest drafts. No hosted or personal data was used.

| # | Scenario | Result | Observed result |
| --- | --- | --- | --- |
| 1 | Open landing and begin blank architecture | Pass | `/start` opened a blank guest draft and reported `Saved locally`. |
| 2 | Start from a template | Pass | Multi-tenant SaaS opened with 15 components and 17 typed flows. |
| 3 | Detailed description and failure handling | **Fail** | A 577-character valid prompt returned generic `Request validation failed.` The original prompt remained in the field. Reproduces BRX-AUD-001. |
| 4 | Place, move, resize and restyle semantic nodes | Pass | Placed a Microservice, moved/renamed/restyled Tenant service, and observed local save. Resize is additionally asserted by the passing Chromium journey. |
| 5 | Shift and marquee multi-selection | Pass | Shift selected two nodes manually; marquee selected multiple nodes in the current Chromium journey. |
| 6 | Create and edit a compatible connector | Pass | Created Tenant API → Object storage and changed it to curved, dashed, label `Asset upload`. |
| 7 | Freehand, erase, undo and redo | Pass | Drew and erased a stroke; undo restored it and redo removed it. |
| 8 | Edit, preview, copy and download documentation | Pass | Edited and previewed Markdown and received copy confirmation. Chromium verified a `.md` download event. |
| 9 | Export PNG, SVG, JSON, Mermaid and Markdown | Blocked | All five controls were present and source paths were inspected, but the manual in-app browser did not surface blob-download completion for the five-format pass. Markdown download and Mermaid serialization have automated evidence; full manual format verification remains open. |
| 10 | Reload a guest draft | Pass | Reload restored the renamed/styled node and authored document. |
| 11 | Sign-in return path without draft loss | Pass | Save gate linked to `/sign-in?next=/draft/:id?migrate=1`; returning to the draft retained edits. Provider completion is staging-unverified. |
| 12 | History and restore as a new head | Blocked | Requires an authenticated persisted diagram and a live database. Source exists; no claim of runtime proof is made. |
| 13 | Navigate Canvas, Docs and Review | Pass | The authored document and canvas edits survived all three local views. |
| 14 | Desktop and supported mobile/read-only behavior | **Fail** | Desktop passed. Mobile palette passed, but action names and mobile recovery journeys failed. Read-only share requires a hosted share token and remains staging-unverified. |
| 15 | Offline, invalid-input and unavailable-storage states | **Fail** | Desktop quota/offline recovery passed and invalid long input failed safely. Mobile unavailable IndexedDB was misreported as a missing draft. |
| 16 | Removed ellipse controls stay absent | Pass | No Ellipse action appeared manually or in the passing component-palette browser assertion. |

## 4. Confirmed P0/P1 defects

The September 12 audit remains accurate for the following release blockers. Source inspection plus current reproduction confirms they are still open; the final column assigns the roadmap chunk that owns the correction.

| Priority | IDs and confirmed gap | Roadmap owner |
| --- | --- | --- |
| P0 | BRX-AUD-001 long prompts fail; BRX-AUD-005 known receipt-secret fallback | B01; B06/O03 |
| P0 | BRX-AUD-002 keyword-only disconnected “AI” changes; BRX-AUD-003 prompt-ignoring document refinement | C01/C02; D02 |
| P0 | BRX-AUD-004 process-local request protection; BRX-AUD-006 staging/database/load behavior unproven | O01; O03 |
| P1 | BRX-AUD-007 preferences flattened into `preferredStack`; BRX-AUD-008 preview hides actual graph changes | B01; C01/C02 |
| P1 | BRX-AUD-009 layout ignores safe areas; BRX-AUD-010 connection gesture is undiscoverable; BRX-AUD-011 modes/notices remain independent | F02; F01; F01 |
| P1 | BRX-AUD-012 per-keystroke history; BRX-AUD-013 freehand render pressure; BRX-AUD-014 full-snapshot undo/recovery pressure | F03 |
| P1 | BRX-AUD-015 unnamed mobile actions; BRX-AUD-016 contradictory mobile controls; BRX-AUD-017 blocked storage appears missing | F04 |
| P1 | BRX-AUD-018 narrow review; BRX-AUD-019 generic documents; BRX-AUD-020 weak portfolio dashboard | R01/R02; D01; O02 |
| P1 | BRX-AUD-021 silent/optional telemetry; BRX-AUD-022 incomplete aggregate release gate | B06/O03; O03 |

P2 items BRX-AUD-023 through BRX-AUD-029 remain tracked in the audit but are not promoted into the B00 P0/P1 gate.

## 5. User impact and why B00 is needed

Day 01 does not introduce a visible feature. It prevents later development from replacing working systems or building new features on incorrect assumptions. Users benefit because recovery, saving, canvas editing and version history remain protected while known broken journeys are assigned to later work.

Existing documents used “delivered” for source implementations while the audit correctly distinguished local, staging and production evidence. B00 resolves that contradiction: source plus passing local tests is local proof; database migrations, OAuth, private Storage, archive delivery, sharing and scale remain unverified until executed in their target environments.

## 6. Day 02 readiness

Day 02 / B01 is ready to begin. Working systems have current evidence, regressions have reproduction steps, staging/production gaps are explicit, and the authoritative interpretation of earlier claims is recorded above.

B01 may change architecture input contracts and error handling. It must reuse the current generation route, compiler boundary, Architecture IR validation, guest recovery, cloud-save coordinator and version graph. Its first executable checks are the 239/240/241/3,000-character boundaries plus separate scale, cloud, tenancy, sensitivity and stack fields. It must not replace persistence, recovery, migration or canvas state.
