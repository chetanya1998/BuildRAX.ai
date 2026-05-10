# BuildRAX Node Catalog

BuildRAX nodes represent backend components. A node is not just a visual box; it carries a role, contracts, simulation assumptions, review checks, and export metadata.

The MVP registry contains 60 nodes across 13 categories.

## How To Think About Nodes

For non-technical users, a node is a building block of a backend system. For example, an "Auth Node" checks whether a user is allowed in, a "Database Write" stores data, and a "Queue" moves work into the background.

For technical users, a node is a typed graph component with:

- a stable node type
- a backend role
- inputs and outputs
- configuration fields
- deterministic review checks
- deterministic simulation behavior
- export mapping hints

## Node Categories

### Triggers

Triggers start a workflow.

| Node | Role | What it represents |
|---|---|---|
| HTTP Trigger | trigger | A public or private HTTP entry point. |
| Webhook Trigger | trigger | An incoming callback endpoint from an external system. |
| Cron Trigger | trigger | A scheduled job entry point. |
| Manual Trigger | trigger | A user/admin initiated workflow start. |
| Event Trigger | trigger | A subscriber to internal or external events. |

Example use: start a subscription renewal workflow every night using a Cron Trigger.

### API & Routing

API and routing nodes shape incoming requests and outgoing responses.

| Node | Role | What it represents |
|---|---|---|
| API Gateway | gateway | A traffic entry and routing layer before internal services. |
| REST API Endpoint | api_endpoint | A REST route exposed by the backend. |
| GraphQL Resolver | api_endpoint | A GraphQL query or mutation resolver. |
| Request Validator | validator | A payload and schema validation middleware. |
| Response Formatter | transformer | A response shaping and formatting layer. |

Example use: route a public REST request through validation before business logic.

### Auth & Security

Security nodes protect the workflow from unauthorized or abusive use.

| Node | Role | What it represents |
|---|---|---|
| Auth Node | guard | An authentication verification layer. |
| JWT Auth | guard | JWT verification middleware. |
| OAuth Login | external_side_effect | A social or enterprise identity provider login flow. |
| RBAC Permission Check | guard | Role-based authorization layer. |
| API Key Auth | guard | Developer API key verification layer. |
| Rate Limiter | guard | A traffic limiting component. |
| Secrets Manager | guard | A secret reference resolver. |
| Audit Log | compliance_observer | A durable compliance trail. |

Example use: a developer API should use API Key Auth, Rate Limiter, and Audit Log.

### Logic & Processing

Logic nodes represent core product behavior.

| Node | Role | What it represents |
|---|---|---|
| Router | decision_maker | A conditional branch in the workflow. |
| Service Node | processor | A core business service. |
| Function Node | processor | A stateless processing utility. |
| Mapper | transformer | A data mapping component. |
| Rule Engine | decision_maker | A deterministic business rule evaluator. |
| State Machine | state_controller | A lifecycle transition controller. |

Example use: route an order into approved, rejected, or manual review paths.

### Reliability

Reliability nodes reduce failure impact.

| Node | Role | What it represents |
|---|---|---|
| Retry Handler | reliability_controller | A retry policy component. |
| Circuit Breaker | reliability_controller | A dependency failure protection component. |
| Fallback | reliability_controller | A backup path for failures. |

Example use: wrap a third-party payment provider with retry and fallback behavior.

### Database & Storage

Storage nodes read and write application state.

| Node | Role | What it represents |
|---|---|---|
| PostgreSQL | storage_reader | A relational database component. |
| MongoDB | storage_reader | A document database component. |
| Database Read | storage_reader | A database read operation. |
| Database Write | storage_writer | A database mutation operation. |
| Database Transaction | atomic_state_manager | An all-or-nothing database operation. |
| Redis Cache | cache | An in-memory cache component. |
| Object Storage | file_storage | A file/blob storage component. |

Example use: store user profiles in PostgreSQL and cache frequent reads in Redis.

### Async & Events

Async nodes decouple request intake from background processing.

| Node | Role | What it represents |
|---|---|---|
| Queue | async_buffer | A job/event buffer. |
| Worker | background_processor | A background processor. |
| Dead Letter Queue | failure_store | A failed job/event store. |
| Event Bus | event_distributor | An event publish/subscribe layer. |
| Outbox | consistency_guard | A reliable DB-to-event publishing pattern. |
| Saga | distributed_transaction_controller | A distributed transaction coordinator. |

Example use: process video uploads in the background using Queue, Worker, and Dead Letter Queue.

### AI / ML

AI nodes represent model-powered product behavior. They are part of the catalog even though the current MVP does not require AI calls.

| Node | Role | What it represents |
|---|---|---|
| LLM Call | ai_inference | A model inference call. |
| Prompt Template | ai_input_builder | A structured prompt builder. |
| Embedding | vector_generator | A text-to-vector generator. |
| Vector Search | retrieval | A semantic retrieval component. |
| Guardrail | safety_validator | An AI/content safety and policy filter. |
| Output Parser | transformer | A structured output parser. |

Example use: design a RAG chatbot backend with Prompt Template, Embedding, Vector Search, LLM Call, Guardrail, and Output Parser.

### Payments & Billing

Payment nodes model financial operations and usage accounting.

| Node | Role | What it represents |
|---|---|---|
| Payment Gateway | external_side_effect | A payment provider integration. |
| Subscription | billing_state_manager | A recurring billing state component. |
| Credit Meter | usage_meter | A usage-based credit accounting component. |
| Wallet | balance_state_manager | A balance/coin/ledger component. |

Example use: meter AI credits before an expensive generation request.

### Communication

Communication nodes send messages or maintain live channels.

| Node | Role | What it represents |
|---|---|---|
| Notification | communication | A message delivery component. |
| WebSocket | realtime_channel | A realtime bidirectional channel. |

Example use: notify a customer when a report export is ready.

### Observability & Ops

Observability nodes help operators understand what happened.

| Node | Role | What it represents |
|---|---|---|
| Logger | observer | A structured logging component. |
| Metrics | observer | A metrics instrumentation component. |
| Tracing | observer | A distributed trace component. |
| Alert | operations_response | An alerting component. |
| Health Check | availability_monitor | A service health endpoint. |

Example use: add Logger, Metrics, and Alert around a payment workflow.

### Export & Admin

Export and admin nodes represent privileged or artifact-generating actions.

| Node | Role | What it represents |
|---|---|---|
| Report Export | exporter | A report or package generation component. |
| Admin Action | governance_action | A privileged admin operation. |

Example use: generate a monthly compliance report from a back-office workflow.

### Custom

Custom nodes model systems unique to a team or product.

| Node | Role | What it represents |
|---|---|---|
| Custom Node | user_defined_component | A user-defined software component. |

Example:

```text
Name: Fraud Scoring Service
Role: fraud_scoring_service
Dependencies:
- payment history database
- risk rule engine
- identity verification provider

Outputs:
- fraud_score
- review_required
- risk_reason

Failure modes:
- provider_timeout
- insufficient_data
- rules_engine_error
```

## How Nodes Are Used By BuildRAX

### Review

Review checks node roles and graph shape. For example:

- Public API entry points should include rate limiting.
- Workflows should include observability.
- External side effects should include reliability handling.
- Sensitive state changes should include audit logs.

### Simulation

Simulation walks through nodes in graph order and estimates behavior. It uses node roles to reason about latency, warnings, failures, fallbacks, and bottlenecks.

### Mermaid

Mermaid generation turns nodes and edges into sanitized flowchart source.

### Export

Exports use node labels, roles, contracts, and graph structure to create handoff artifacts.
