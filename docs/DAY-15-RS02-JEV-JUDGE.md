# Day 15 / RS02 — TypeSafe Jev research judgment

## Branch brief — 11 October 2026

`feat/rs02-jev-research-judge` starts from RS01 `a826cbc`, which is stacked on
A01. This is a separate local review unit, not pushed, merged or deployed.
G02 is independently committed at `e845b35` on `feat/g02-explore-route-search`,
based on G01 `bca434f`. Its 220 unit tests and 39 Chromium checks passed (one
mobile-only skip), plus lint, types and build. No G02/editor changes are bundled
into RS02. Existing A01 #33 and RS01 #34 remain separate draft PRs.

## Contract and implementation

The user confirmed Jev is TypeSafe's product. The adapter follows the official
[TypeSafe OpenAPI contract](https://api.typesafe.ai/openapi.json), checked on
11 October: POST `/v1/systemone`, bearer authentication, explicit model, quoted
state and named choice questions. No SDK or dependency was added. Responses
must have exactly the requested questions/options, finite bounded confidence
and probabilities, an approximately normalized distribution, a highest-
probability selected choice, resolved model and valid token usage.

`runResearchJudgment` extends the existing AI gateway/router and Context Compiler.
It accepts a bounded question, RS01 result and up to three registered B05 pattern
IDs. RS01 source filtering is reused with a 30-day freshness window and two-host
minimum. Supplied status/counts are not sufficient: dates, relevance, literal
attribution, duplicate content and retained evidence references are rechecked.
This conservative freshness policy can reject useful older/undated material.

Only the question, retained evidence and selected pattern descriptions/risks are
sent. Arbitrary caller-supplied ContextPack text is discarded and reconstructed
from validated evidence. Evidence is quoted as untrusted data, separate from
server-owned questions. Visible injection filtering is defense in depth, not a
general prompt-injection or factual-correctness guarantee.

The Context Compiler budgets the question, candidate definitions, questions and
evidence (default 4,000 estimated input tokens, maximum 8,000). Mandatory-context
overflow throws before dispatch; evidence omitted for budget causes insufficient
status and no dispatch. HTTP payloads additionally cap request/response bytes at
40,000/32,000. Gateway timeout/cancellation and a one-call ceiling apply; no
automatic retry, repair, fallback, external source fetch or architecture write.

Jev returns sufficiency, insufficiency, conflict or uncertainty plus applicability
judgments for supplied patterns, not newly invented architectures. Choices below
the server-owned 0.8 confidence/probability threshold require review. Alternatives
cannot be marked supported when overall evidence is insufficient/conflicting.
Every result requires human review; pattern risks/questions stay attached.
Existing Evidence IR → Requirement IR → Architecture IR → Presentation IR stays
unchanged. No migrations or parallel research/architecture storage were added.

Successful metadata reports actual resolved model and token usage; cost is null
because no verified pricing policy is configured. Failures/timeouts preserve
attempted-provider accounting. No provider body, secret or evidence is logged.

## Verification

Final local checks on 11 October: lint, TypeScript, all 267 tests (41 files,
28 new RS02 tests) and the production build passed. Release-readiness scan passed;
no database schema changes. G02 browser results above belong to its separate
branch, not an integrated/merged G02 + RS02 build. GitHub CI has not run for RS02.

Fixture-only checks cover valid judgments/alternatives, no-evidence and forged
coverage, stale/future/irrelevant/mirrored/same-host sources, visible injection,
unknown candidates, context omissions, zero call budgets, malformed answers,
low confidence, conflict, unconfigured provider, outage, cancellation, timeout,
response-byte limits and transport contract.
No paid API, live credential, hosted UI or database validation is claimed.

## Remaining activation work — Day 15 is not release-complete

1. Review/merge A01 and RS01 sequentially with approval; retarget/retest RS02.
2. Configure an authorized research backend and TypeSafe account/model. The
   adapter is explicit server injection, never automatically enabled by an env key.
3. Wire O01 shared admission, concurrency/cost lease and usage settlement before
   exposing live judgment. Existing leases are generation-job-specific; this core
   does not invent a process-local substitute or bypass them through a public route.
4. Integrate the evidence/judgment/alternative review UI and workflow; confirm
   scope/privacy controls and live evaluation with approved credentials/spend.
5. Publish separate G02/RS02 PRs when authorized, run CI and obtain merge approval.

No changes were made to `audit-artifacts/` or the approved roadmap text.
