# Design Patterns Used In BuildRAX

BuildRAX uses two kinds of design patterns:

1. Product and UX patterns that make architecture planning understandable.
2. Backend architecture patterns represented by nodes and deterministic checks.

## Product And UX Patterns

### Workbench Pattern

The builder is structured like a technical workbench:

- left side: node library
- center: graph canvas
- right side: inspector
- bottom: terminal / step compiler
- modal layer: focused review, simulation, Mermaid, and export results

This pattern keeps the main work visible while allowing deeper tasks to open without navigating away.

Why it matters: users should not lose canvas context when reviewing, simulating, diagramming, or exporting.

### Progressive Disclosure

Complex controls are collapsed until needed.

Examples:

- left and right sidebars are collapsible
- custom node creator is collapsible
- export artifacts are generated on demand
- stage results open in modals

Why it matters: backend systems are complex, so the UI should avoid showing every possible option at once.

### Deterministic First, AI Later

The MVP uses deterministic review and simulation before AI generation.

Why it matters:

- users can trust repeatable checks
- no provider key is required
- results are easier to debug
- AI can later augment a stable foundation

### Modal Stage Pattern

Review, Simulation, Mermaid, and Export appear as consistent modal experiences.

Each stage has:

- title and description
- status badge
- result body
- compiler progress strip

Why it matters: the user learns one interaction model and can apply it to every stage.

### Terminal / Compiler Feedback Pattern

The bottom terminal shows progress and errors for review, simulation, Mermaid compilation, and export generation.

Why it matters: users need to know what the system is doing, especially when a step fails.

## Backend Architecture Patterns

### API Gateway Pattern

An API Gateway sits before internal services and can route, throttle, authenticate, or protect traffic.

Common nodes:

- API Gateway
- Rate Limiter
- Auth Node
- Request Validator

Example:

```text
HTTP Trigger -> API Gateway -> Rate Limiter -> Auth Node -> REST API Endpoint
```

### Validation Pattern

Request validation prevents invalid payloads from reaching core business logic.

Common nodes:

- Request Validator
- Output Parser
- Guardrail

Example:

```text
HTTP Trigger -> Request Validator -> Service Node
```

### Auth And Authorization Pattern

Authentication verifies identity. Authorization verifies permission.

Common nodes:

- Auth Node
- JWT Auth
- OAuth Login
- RBAC Permission Check
- API Key Auth

Example:

```text
REST API Endpoint -> JWT Auth -> RBAC Permission Check -> Admin Action
```

### Rate Limiting Pattern

Rate limiting protects public endpoints from abuse and unexpected cost spikes.

Common nodes:

- Rate Limiter
- API Gateway
- Metrics
- Alert

Example:

```text
HTTP Trigger -> Rate Limiter -> Request Validator -> Service Node
```

### Queue And Worker Pattern

Queues move slow or unreliable work outside the request-response path.

Common nodes:

- Queue
- Worker
- Dead Letter Queue
- Retry Handler

Example:

```text
Database Write -> Queue -> Worker -> Notification
```

### Dead Letter Queue Pattern

A dead letter queue stores failed jobs after retries are exhausted.

Common nodes:

- Queue
- Retry Handler
- Dead Letter Queue
- Alert

Example:

```text
Queue -> Worker -> Retry Handler -> Dead Letter Queue -> Alert
```

### Outbox Pattern

The outbox pattern helps keep database writes and emitted events consistent.

Common nodes:

- Database Transaction
- Outbox
- Event Bus
- Worker

Example:

```text
Database Transaction -> Outbox -> Event Bus
```

### Saga Pattern

A saga coordinates a long-running workflow across multiple systems and defines compensation steps when part of the workflow fails.

Common nodes:

- Saga
- Payment Gateway
- Database Write
- Notification
- Fallback

Example:

```text
Saga -> Payment Gateway -> Database Write -> Notification
Saga -> Fallback
```

### Circuit Breaker Pattern

A circuit breaker prevents repeated calls to a failing dependency.

Common nodes:

- Circuit Breaker
- External API as Custom Node
- Fallback
- Alert

Example:

```text
Service Node -> Circuit Breaker -> Payment Gateway
Circuit Breaker -> Fallback
```

### Observability Pattern

Observability makes workflows understandable in production.

Common nodes:

- Logger
- Metrics
- Tracing
- Alert
- Health Check

Example:

```text
Service Node -> Logger
Service Node -> Metrics
Metrics -> Alert
```

### Audit Trail Pattern

Audit logs provide durable records of sensitive actions.

Common nodes:

- Audit Log
- Admin Action
- Payment Gateway
- RBAC Permission Check

Example:

```text
RBAC Permission Check -> Admin Action -> Audit Log
```

### Usage Metering Pattern

Usage metering controls paid or limited operations.

Common nodes:

- Credit Meter
- Subscription
- Wallet
- LLM Call
- Report Export

Example:

```text
Auth Node -> Credit Meter -> LLM Call -> Credit Meter
```

### RAG Pattern

Retrieval-augmented generation combines search with model generation.

Common nodes:

- Prompt Template
- Embedding
- Vector Search
- LLM Call
- Guardrail
- Output Parser

Example:

```text
HTTP Trigger -> Prompt Template -> Vector Search -> LLM Call -> Guardrail -> Output Parser
```

## How Patterns Influence Review

The review engine looks for missing pattern pieces. Examples:

- A public API without Rate Limiter is flagged.
- External side effects without Retry Handler or Fallback are risky.
- Sensitive admin actions without Audit Log are incomplete.
- Async processing without Dead Letter Queue can hide failed jobs.
- Workflows without Logger, Metrics, or Tracing lack operational readiness.

## How Patterns Influence Simulation

Simulation uses patterns to estimate behavior:

- storage nodes add read/write latency
- cache nodes can reduce downstream load
- queues absorb load but can hide failures without DLQ
- external side effects add dependency risk
- observability nodes provide operational coverage

This lets BuildRAX provide useful design-time feedback without executing real backend code.
