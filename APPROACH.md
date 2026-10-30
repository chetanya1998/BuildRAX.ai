# BuildRAX implementation approach

## Roadmap amendment — 2 October 2026

Branch: `docs/roadmap-amendment-days12-34`.
Status: documentation prepared; feature implementation and merge are not claimed.

The [Days 12–34 amendment](docs/ARCHITECTURE-INTELLIGENCE-DAYWISE-PLAN.md#buildrax-34-day-roadmap-amendment--days-1234) is the scheduling and integration reference. Its source is the user's approved milestone/task table and supplied “BuildRAX Roadmap — Codex Execution Rules.” The original roadmap text remains intact. The appendix maps every original session to a retained owner and lists every original technical card and amendment card once in the scheduling inventory.

Days 1–11 are the merged, frozen implementation baseline; deployment and staging evidence remain separate. Existing selection/connection work from PR #23 remains a bridge and must not be confused with F02/T01 completion. Dependency gates resolve scheduling conflicts without silently deleting or renumbering approved tasks. “Jev” remains an unresolved label requiring clarification before its implementation.

This change affects planning only: no runtime contract, database object, credential, deployment or user data changes. `audit-artifacts/` is outside the change. Uppercase `APPROACH.md` is the canonical filename, matching the supplied execution rules; do not create a second lowercase document.

## Working method

Before an issue, read its roadmap card, inspect the branch and relevant implementation/tests/migrations, and record milestone, task ID, issue, branch, scope and acceptance checks. Extend the existing subsystem. Preserve Evidence IR → Requirement IR → Architecture IR → Presentation IR, semantic/visual separation, immutable history and tenant authorization.

Use one bounded issue per branch, with linked subissues when needed. Explain the problem, existing system extended, unchanged contracts, implementation, user impact, security/compatibility risks, tests and remaining work before or alongside implementation. Add an issue-specific approach document linked here when this file would become too large.

Verify applicable unit/contracts, integration, database/RLS, browser, accessibility, lint, type and build checks. Record actual manual browser/viewport, fixture, expected/observed results and limitations. State verified locally, PR ready, merged and released separately. Seek the user's approval before merge. Day 34 introduces no product feature.

## Verification for this documentation change

Compare the roadmap prefix byte-for-byte with the base version; require original sessions 12A–34B once each; require the 23 original and 22 amendment task IDs exactly once in the scheduling inventory; check its 23 day rows, unique coverage ownership, documentation links and whitespace. References outside the inventory are cross-references, not duplicate task definitions. Runtime tests are not applicable to this documentation-only change.
