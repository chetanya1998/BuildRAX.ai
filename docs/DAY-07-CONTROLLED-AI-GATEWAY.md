# Day 07 / B06 — Controlled AI gateway

Implemented and verified locally on 21 September 2026.

## Branch brief

- Branch: `feat/b06-controlled-ai-gateway`
- Base: merged Day 06 / B05 on `main` (`a503057`).
- Purpose: route every model-capable task through one validated, observable, cancellable boundary.
- Delivery state: individual planned-feature branch; not merged, deployed, or production-verified.

## User outcome

Architecture synthesis, change planning, review, documentation, requirement extraction, and explanation now share a versioned gateway. The gateway validates task input and structured output, attaches request IDs, enforces bounded timeouts and cancellation, and reports attempts, repairs, tokens, and estimated cost. Deterministic tasks make zero provider calls. Production refuses missing rate-limit and receipt-signing secrets.

## Implementation evidence

| Capability | Evidence |
| --- | --- |
| Versioned task contracts, timeout/cancel, validation, usage metadata, and production checks | [AI gateway](../src/lib/ai/gateway.ts) |
| Single OpenAI provider adapter with abort signal and actual usage | [OpenAI provider](../src/lib/ai/openai-provider.ts) |
| Safe structured repair bounded to one retry | [generation service](../src/lib/ai/generation.ts) |
| Timeout, repair, usage, zero-call, and fail-closed coverage | [gateway tests](../src/lib/ai/gateway.test.ts) |

## Verification

- `npm run release:check` passed: release scan, lint, typecheck, 24 test files / 139 tests, and a production build with 24 generated pages.
- Gateway coverage includes schema validation, bounded one-repair behavior, request IDs, usage accounting, non-cooperative timeouts, caller cancellation, deterministic zero-call tasks, and fail-closed production configuration.
- Tests use deterministic fixture providers and make no paid provider calls; GitHub CI remains required before merge.

## Scope boundary

The gateway records provider usage returned by the SDK. Hosted billing reconciliation and production telemetry dashboards remain deployment work.
