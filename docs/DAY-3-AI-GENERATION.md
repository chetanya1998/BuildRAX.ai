# Day 3 — AI generation foundation

## Delivered

- `POST /api/v1/ai/generations` is bounded to 30 seconds and emits a privacy-safe request ID.
- The deterministic provider remains the default when `OPENAI_API_KEY` is absent, so local and CI flows do not spend tokens or require a vendor key.
- The OpenAI provider uses the Responses API with Structured Outputs, `store: false`, an allow-listed component catalog, a 25-second SDK timeout and no automatic SDK retries.
- Every candidate is parsed against the canonical diagram schema, normalized with server-owned diagram values, then checked for catalog membership, category correctness, typed connection compatibility, connectedness and valid assumption references.
- One repair attempt is permitted only after malformed or semantically invalid model output. A second invalid result fails closed.
- Authenticated requests record only operational metadata in `ai_runs`: request ID, provider, model, duration, prompt version, attempt count and a redacted error class. Prompts and output payloads are not stored.

## Staging setup

1. Apply `202609030004_day3_ai_generation.sql` to the designated **staging** Supabase project after a recovery point is confirmed.
2. Set server-only `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the staging host. Do not put either in `NEXT_PUBLIC_*`, source control or browser code.
3. Set a non-development `RATE_LIMIT_HMAC_SECRET` before anonymous live generation is exposed.
4. Exercise `/start` with a normal prompt, a malformed/hostile prompt and a request that exceeds the anonymous rate limit. Confirm the UI gets only the generic error and a request ID.
5. Confirm `ai_runs` contains no prompt or diagram payload and that one user cannot read another user's entries.

## Runtime behaviour

```
browser -> request-size/schema/rate gate -> provider -> schema + semantic validator
        -> optional single repair -> response or safe failure
        -> best-effort metadata audit for authenticated users
```

This is synchronous by design for the first-draft path. Queue-backed generation, durable distributed rate limits and progress streaming remain later delivery items; they should be introduced before high-concurrency public traffic.
