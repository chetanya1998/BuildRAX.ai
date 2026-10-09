# Day 14 / RS01 — Research Intelligence v0

## Branch and progress — 8 October 2026

- `feat/rs01-research-intelligence`: server-side core implemented locally,
  stacked on A01 fix `95f8345`. RS01 changes are a separate review unit.
- `feat/a01-task-aware-router`: exhausted-retry accounting fixed locally; 216
  tests, lint, typecheck and production build passed. PR #33 remains draft and
  its remote CI still reflects the previous failing commit until publication.
- `feat/g01-deterministic-graph`: separate local G01 commit `bca434f`; not
  included in this branch. Its 211-test verification is recorded on that branch.
- Nothing from this session is pushed, merged or deployed. Day 14 is not a
  production-complete milestone. Publication and merge require approval.

## Existing subsystems extended

`runResearch` adds `research-extraction` to the existing A01 gateway/task registry
and uses its validation, request correlation, timeout and cancellation boundary.
Extraction is deterministic; no LLM is invoked. Search-call counts are separate
from LLM-call/token metadata: zero LLM cost does not mean a search backend is free.

The injected `ResearchSearchAdapter` accepts only a deliberate public query,
request ID, AbortSignal and result limit. No project, prompt history, raw
architecture, internal accounting callback or credentials are passed through.
There is no public research route or automatic generation integration yet.

Freshness is detected from an explicit `current` request or a bounded keyword
heuristic. `stable` explicitly disables search. Fresh relevant cached sources
can satisfy the source-count threshold without any search. This heuristic is
not a semantic research judge; RS02 owns sufficiency and alternatives.

Filtering rejects malformed, undated, stale, future-dated, irrelevant,
duplicate and visibly instruction-like snippets. Both publication and retrieval
must fall within the freshness window. Evergreen but undated documentation is
conservatively excluded, not treated as current merely because it was retrieved.
Newest entries are selected deterministically; a refresh can replace an older
partial cache entry. Tracking parameters/fragments do not create extra sources.

Research extends the existing Evidence IR source/location variants. Each item
retains source URL, title, publication/retrieval timestamps and a matching literal
quote. `source-observed` means the supplied excerpt was observed, not that its
claim was independently verified. Confidence 0.5 is a conservative label, not a
calibrated probability. Quotes remain `untrusted-external`; the text filter is
defense in depth, not a general prompt-injection guarantee. Source text is never
executed, interpreted as instructions or sent to a model by this implementation.

The existing Context Compiler emits bounded JSON evidence blocks with attribution
and trust labels, including when research later appears in a traceability bundle.
It does not turn research into requirements or change Architecture IR. Existing
snapshots round-trip research while retaining semantic and requirement checksums.
Old records parse unchanged; older deployed readers must be upgraded before
new research variants are persisted or shared with them.

## Bounds and honest result states

- At most one search call, 30 cached and 30 returned candidates, 8,000 characters
  per candidate excerpt, 10 retained sources and 500 characters per quote.
- Default freshness window 30 days (configurable 1–365); default coverage is two
  distinct hosts (configurable 1–5). Different hosts do not prove independence.
- Context defaults: 4,000 input / 1,000 output tokens; caller caps 8,000 / 2,000.
  The existing compiler reports omitted blocks. If retained context cannot cover
  the minimum hosts, status is `insufficient` with reason `context-budget`.
- States: `not-needed`, `cached`, `ready`, `insufficient`, `unavailable`.
  `ready` refers to these mechanical checks, not semantic sufficiency, which is
  explicitly `not-evaluated`. Partial evidence is retained on adapter failure.
- Shared gateway timeout defaults to 25 seconds, capped at 60 seconds. Even a
  non-cooperative adapter cannot delay the gateway response beyond that bound;
  adapter implementations must honor cancellation to stop their underlying work.

## Verification and remaining gates

Local checks passed: release scan, lint, TypeScript, 239 tests in 39 files
(Vitest 5.0.2; 23 new RS01 tests) and production build. The research tests cover
stable/cache no-search behavior, all filtering
rules, evidence attribution, input-order determinism, budgets, unsafe snippets
and URLs, adapter failure, timeout, cancellation, existing context integration
and snapshot compatibility. No live AI/search calls, browser, Supabase, hosted
or production verification is claimed for RS01.

Before public enablement: select/configure a search backend, enforce O01 shared
admission and cost accounting, validate its response-byte limits and network
allowlists/redirect/DNS behavior, and run live integration checks with explicit
authorization. URL validation here is attribution hygiene, not an SSRF defense
or permission to fetch arbitrary links. Any public API/UI requires its own
authentication, authorization and acceptance checks. RS02/RS03 integrations
remain separate roadmap work. `audit-artifacts/` was not modified.
