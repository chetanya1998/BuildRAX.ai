// Generated from /Users/chetanya/Downloads/buildrax_node_roles_and_100_templates_catalog.json
// Source generated_at: 2026-05-09T20:44:54.466078Z

export const BUILD_RAX_ROLE_TAXONOMY = [
  {
    "role": "trigger",
    "description": "Starts a workflow by accepting external, scheduled, manual, or event-driven traffic.",
    "traffic_effect": "creates_initial_request_stream"
  },
  {
    "role": "gateway",
    "description": "Receives and routes incoming traffic before it reaches internal services.",
    "traffic_effect": "routes_or_limits_traffic"
  },
  {
    "role": "api_endpoint",
    "description": "Represents a backend route or resolver that accepts requests and returns responses.",
    "traffic_effect": "accepts_and_forwards_traffic"
  },
  {
    "role": "validator",
    "description": "Checks payload, schema, format, and required data before forwarding traffic.",
    "traffic_effect": "rejects_invalid_traffic"
  },
  {
    "role": "guard",
    "description": "Protects resources using auth, permissions, rate limits, or policies.",
    "traffic_effect": "blocks_unauthorized_or_excess_traffic"
  },
  {
    "role": "decision_maker",
    "description": "Routes traffic into branches based on rules, conditions, or attributes.",
    "traffic_effect": "splits_traffic_paths"
  },
  {
    "role": "processor",
    "description": "Executes core business logic, calculations, or product-specific operations.",
    "traffic_effect": "processes_and_forwards_traffic"
  },
  {
    "role": "transformer",
    "description": "Maps, formats, normalizes, parses, or restructures data.",
    "traffic_effect": "changes_payload_shape"
  },
  {
    "role": "state_controller",
    "description": "Controls lifecycle states and valid transitions.",
    "traffic_effect": "permits_or_rejects_state_transitions"
  },
  {
    "role": "reliability_controller",
    "description": "Handles retries, fallback, circuit breaking, or failure recovery.",
    "traffic_effect": "reduces_failure_impact"
  },
  {
    "role": "storage_reader",
    "description": "Reads data from persistent or temporary stores.",
    "traffic_effect": "adds_read_latency_and_store_load"
  },
  {
    "role": "storage_writer",
    "description": "Writes or mutates data in persistent systems.",
    "traffic_effect": "adds_write_latency_and_state_mutation"
  },
  {
    "role": "atomic_state_manager",
    "description": "Runs multiple operations as a consistent transaction.",
    "traffic_effect": "ensures_all_or_nothing_consistency"
  },
  {
    "role": "cache",
    "description": "Stores temporary data to reduce downstream latency and load.",
    "traffic_effect": "serves_hits_or_forwards_misses"
  },
  {
    "role": "file_storage",
    "description": "Stores and retrieves files, exports, media, and binary assets.",
    "traffic_effect": "adds_upload_download_latency"
  },
  {
    "role": "async_buffer",
    "description": "Buffers jobs or events between request intake and processing.",
    "traffic_effect": "absorbs_spikes_and_adds_queue_wait"
  },
  {
    "role": "background_processor",
    "description": "Processes queued or scheduled jobs outside the request-response path.",
    "traffic_effect": "drains_queue_with_worker_capacity"
  },
  {
    "role": "failure_store",
    "description": "Stores failed jobs/events for inspection, replay, or manual recovery.",
    "traffic_effect": "captures_retry_exhaustion"
  },
  {
    "role": "event_distributor",
    "description": "Publishes events to one or more subscribers.",
    "traffic_effect": "fans_out_events"
  },
  {
    "role": "consistency_guard",
    "description": "Ensures database state changes and emitted events remain consistent.",
    "traffic_effect": "prevents_lost_events"
  },
  {
    "role": "distributed_transaction_controller",
    "description": "Coordinates long-running multi-step workflows and compensation.",
    "traffic_effect": "manages_partial_failure"
  },
  {
    "role": "ai_inference",
    "description": "Calls a model or inference service for generation, classification, extraction, or reasoning.",
    "traffic_effect": "adds_token_cost_and_model_latency"
  },
  {
    "role": "ai_input_builder",
    "description": "Builds structured prompts or AI inputs from variables and context.",
    "traffic_effect": "increases_prompt_size"
  },
  {
    "role": "vector_generator",
    "description": "Converts text or media into embeddings.",
    "traffic_effect": "adds_embedding_latency_and_cost"
  },
  {
    "role": "retrieval",
    "description": "Fetches relevant documents, chunks, or records for search/RAG.",
    "traffic_effect": "adds_index_query_latency"
  },
  {
    "role": "safety_validator",
    "description": "Checks content, responses, or actions against safety and policy rules.",
    "traffic_effect": "blocks_or_flags_risky_outputs"
  },
  {
    "role": "external_side_effect",
    "description": "Calls external providers and may create irreversible effects such as payments or messages.",
    "traffic_effect": "adds_dependency_risk_and_side_effects"
  },
  {
    "role": "billing_state_manager",
    "description": "Manages subscription, renewal, plan, invoice, or access state.",
    "traffic_effect": "mutates_billing_state"
  },
  {
    "role": "usage_meter",
    "description": "Checks, reserves, consumes, refunds, and records usage credits.",
    "traffic_effect": "controls_paid_operations"
  },
  {
    "role": "balance_state_manager",
    "description": "Maintains wallet, coin, balance, or ledger state.",
    "traffic_effect": "mutates_financial_balance"
  },
  {
    "role": "communication",
    "description": "Sends user/admin messages over email, SMS, WhatsApp, push, or in-app channels.",
    "traffic_effect": "adds_provider_delivery_latency"
  },
  {
    "role": "realtime_channel",
    "description": "Maintains live bidirectional communication for status, chat, presence, or streams.",
    "traffic_effect": "adds_connection_and_message_load"
  },
  {
    "role": "observer",
    "description": "Records logs, metrics, traces, analytics, or audit events.",
    "traffic_effect": "observes_without_blocking_when_async"
  },
  {
    "role": "operations_response",
    "description": "Triggers operational alerts, incidents, or escalations.",
    "traffic_effect": "reacts_to_threshold_breaches"
  },
  {
    "role": "availability_monitor",
    "description": "Checks service and dependency health.",
    "traffic_effect": "reports_health_state"
  },
  {
    "role": "exporter",
    "description": "Generates downloadable files, reports, code scaffolds, or packages.",
    "traffic_effect": "creates_async_export_artifacts"
  },
  {
    "role": "governance_action",
    "description": "Represents privileged admin or compliance action.",
    "traffic_effect": "changes_controlled_system_state"
  },
  {
    "role": "compliance_observer",
    "description": "Creates durable records of sensitive or important actions.",
    "traffic_effect": "records_compliance_events"
  },
  {
    "role": "user_defined_component",
    "description": "Represents a user-defined internal service, custom API, custom model, or business-specific component.",
    "traffic_effect": "depends_on_declared_manifest"
  }
] as const;

export const BUILD_RAX_NODE_CATALOG = [
  {
    "id": "http_trigger",
    "name": "HTTP Trigger",
    "category": "Triggers",
    "role": "trigger",
    "what_it_is": "A public or private HTTP entry point.",
    "what_it_does": "Receives client/API traffic and starts the workflow.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 5,
      "p95_latency_ms": 20,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "received",
      "forwarded",
      "malformed_rejected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "rate_limit_recommended"
    ],
    "export_mapping": {
      "export_as": "route/controller/openapi_path",
      "default_files": [
        "controller",
        "dto",
        "integration_test",
        "openapi.yaml",
        "openapi_path"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "webhook_trigger",
    "name": "Webhook Trigger",
    "category": "Triggers",
    "role": "trigger",
    "what_it_is": "An incoming callback endpoint from an external system.",
    "what_it_does": "Receives third-party events and verifies duplicate/signature behavior.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 5,
      "p95_latency_ms": 20,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "received",
      "forwarded",
      "malformed_rejected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "signature_verification_required",
      "idempotency_required"
    ],
    "export_mapping": {
      "export_as": "webhook_route/signature_middleware",
      "default_files": [
        "config",
        "controller",
        "dto",
        "integration_test",
        "middleware",
        "openapi_path",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "cron_trigger",
    "name": "Cron Trigger",
    "category": "Triggers",
    "role": "trigger",
    "what_it_is": "A scheduled job entry point.",
    "what_it_does": "Starts workflow based on time schedule and prevents overlapping runs.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 5,
      "p95_latency_ms": 20,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "received",
      "forwarded",
      "malformed_rejected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "job_lock_recommended"
    ],
    "export_mapping": {
      "export_as": "cron_config/scheduled_worker",
      "default_files": [
        "job_schema",
        "queue_config",
        "retry_config",
        "worker"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "manual_trigger",
    "name": "Manual Trigger",
    "category": "Triggers",
    "role": "trigger",
    "what_it_is": "A user/admin initiated workflow start.",
    "what_it_does": "Starts workflow from button/action with permission and audit checks.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 5,
      "p95_latency_ms": 20,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "received",
      "forwarded",
      "malformed_rejected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "rbac_required",
      "audit_required"
    ],
    "export_mapping": {
      "export_as": "admin_action_endpoint",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "event_trigger",
    "name": "Event Trigger",
    "category": "Triggers",
    "role": "trigger",
    "what_it_is": "A subscriber to internal or external events.",
    "what_it_does": "Starts workflow when an event is published.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 5,
      "p95_latency_ms": 20,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "received",
      "forwarded",
      "malformed_rejected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "event_schema_validation_required"
    ],
    "export_mapping": {
      "export_as": "event_subscriber",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "api_gateway",
    "name": "API Gateway",
    "category": "API & Routing",
    "role": "gateway",
    "what_it_is": "A traffic entry and routing layer before internal services.",
    "what_it_does": "Routes, throttles, authenticates, and protects API traffic.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 25,
      "p95_latency_ms": 80,
      "failure_rate": 0.002,
      "max_rps": 2000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "routed",
      "rate_limited",
      "blocked",
      "forwarded"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "rate_limit_required",
      "auth_recommended"
    ],
    "export_mapping": {
      "export_as": "gateway_config/middleware",
      "default_files": [
        "config",
        "middleware",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "rest_api_endpoint",
    "name": "REST API Endpoint",
    "category": "API & Routing",
    "role": "api_endpoint",
    "what_it_is": "A REST route exposed by the backend.",
    "what_it_does": "Accepts request payload, calls services, and returns response.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 80,
      "p95_latency_ms": 250,
      "failure_rate": 0.005,
      "max_rps": 500,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "accepted",
      "responded",
      "timed_out",
      "failed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "auth_recommended"
    ],
    "export_mapping": {
      "export_as": "controller/route/dto/openapi_path",
      "default_files": [
        "controller",
        "dto",
        "integration_test",
        "openapi.yaml",
        "openapi_path"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "graphql_resolver",
    "name": "GraphQL Resolver",
    "category": "API & Routing",
    "role": "api_endpoint",
    "what_it_is": "A GraphQL query or mutation resolver.",
    "what_it_does": "Resolves graph queries and may fan out to multiple services.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 80,
      "p95_latency_ms": 250,
      "failure_rate": 0.005,
      "max_rps": 500,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "accepted",
      "responded",
      "timed_out",
      "failed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "query_complexity_limit_recommended"
    ],
    "export_mapping": {
      "export_as": "resolver/schema",
      "default_files": [
        "migration_or_index_config",
        "model_or_schema",
        "repository"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "request_validator",
    "name": "Request Validator",
    "category": "API & Routing",
    "role": "validator",
    "what_it_is": "A payload and schema validation middleware.",
    "what_it_does": "Rejects invalid requests before they hit business logic.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 10,
      "p95_latency_ms": 30,
      "failure_rate": 0.001,
      "max_rps": 2000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "validated",
      "rejected",
      "schema_mismatch"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "validation_schema/middleware",
      "default_files": [
        "config",
        "middleware",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "response_formatter",
    "name": "Response Formatter",
    "category": "API & Routing",
    "role": "transformer",
    "what_it_is": "A response shaping and formatting layer.",
    "what_it_does": "Normalizes service output into API response format.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 70,
      "failure_rate": 0.002,
      "max_rps": 1500,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "transformed",
      "mapping_failed",
      "missing_field"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "response_mapper",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "auth_node",
    "name": "Auth Node",
    "category": "Auth & Security",
    "role": "guard",
    "what_it_is": "An authentication verification layer.",
    "what_it_does": "Checks login/session/token validity before forwarding traffic.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 35,
      "p95_latency_ms": 120,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "allowed",
      "blocked",
      "unauthorized",
      "forbidden"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "required_for_private_resources"
    ],
    "export_mapping": {
      "export_as": "auth_middleware",
      "default_files": [
        "config",
        "middleware",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "jwt_auth",
    "name": "JWT Auth",
    "category": "Auth & Security",
    "role": "guard",
    "what_it_is": "JWT verification middleware.",
    "what_it_does": "Validates token signature, expiry, issuer, and claims.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 35,
      "p95_latency_ms": 120,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "allowed",
      "blocked",
      "unauthorized",
      "forbidden"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "jwt_secret_or_public_key_required"
    ],
    "export_mapping": {
      "export_as": "jwt_middleware",
      "default_files": [
        "config",
        "middleware",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "oauth_login",
    "name": "OAuth Login",
    "category": "Auth & Security",
    "role": "external_side_effect",
    "what_it_is": "A social or enterprise identity provider login flow.",
    "what_it_does": "Redirects/verifies identity provider auth and creates local session.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": true,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 700,
      "p95_latency_ms": 2500,
      "failure_rate": 0.025,
      "max_rps": 100,
      "cost_per_request_usd": 0.0005
    },
    "possible_outcomes": [
      "processed",
      "failed",
      "duplicate_blocked",
      "webhook_pending"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "state_param_required",
      "csrf_protection_required"
    ],
    "export_mapping": {
      "export_as": "oauth_adapter/callback_route",
      "default_files": [
        "controller",
        "dto",
        "integration_test",
        "openapi_path"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "rbac_permission_check",
    "name": "RBAC Permission Check",
    "category": "Auth & Security",
    "role": "guard",
    "what_it_is": "Role-based authorization layer.",
    "what_it_does": "Checks whether actor role can perform a requested action.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 35,
      "p95_latency_ms": 120,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "allowed",
      "blocked",
      "unauthorized",
      "forbidden"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "resource_level_check_required"
    ],
    "export_mapping": {
      "export_as": "permission_guard",
      "default_files": [
        "config",
        "middleware",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "api_key_auth",
    "name": "API Key Auth",
    "category": "Auth & Security",
    "role": "guard",
    "what_it_is": "Developer API key verification layer.",
    "what_it_does": "Validates key, scope, quota, and workspace ownership.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 35,
      "p95_latency_ms": 120,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "allowed",
      "blocked",
      "unauthorized",
      "forbidden"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "scope_check_required",
      "rotation_recommended"
    ],
    "export_mapping": {
      "export_as": "api_key_guard",
      "default_files": [
        "config",
        "middleware",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "rate_limiter",
    "name": "Rate Limiter",
    "category": "Auth & Security",
    "role": "guard",
    "what_it_is": "A traffic limiting component.",
    "what_it_does": "Blocks excess requests by user, org, IP, API key, or plan.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 35,
      "p95_latency_ms": 120,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "allowed",
      "blocked",
      "unauthorized",
      "forbidden"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "redis_or_distributed_store_required"
    ],
    "export_mapping": {
      "export_as": "redis_rate_limiter",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "secrets_manager",
    "name": "Secrets Manager",
    "category": "Auth & Security",
    "role": "guard",
    "what_it_is": "A secret reference resolver.",
    "what_it_does": "Resolves secret references without exposing raw secrets to frontend.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 35,
      "p95_latency_ms": 120,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "allowed",
      "blocked",
      "unauthorized",
      "forbidden"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "encrypted_store_required",
      "frontend_must_not_receive_secret"
    ],
    "export_mapping": {
      "export_as": "secret_resolver",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "audit_log",
    "name": "Audit Log",
    "category": "Auth & Security",
    "role": "compliance_observer",
    "what_it_is": "A durable compliance trail.",
    "what_it_does": "Records who did what, when, from where, and to which resource.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": false,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 30,
      "p95_latency_ms": 120,
      "failure_rate": 0.002,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "audit_record_created",
      "retention_applied",
      "compliance_gap"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "immutable_or_append_only_recommended"
    ],
    "export_mapping": {
      "export_as": "audit_model/service/middleware",
      "default_files": [
        "config",
        "interface",
        "middleware",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "router",
    "name": "Router",
    "category": "Logic & Processing",
    "role": "decision_maker",
    "what_it_is": "A conditional branch in the workflow.",
    "what_it_does": "Sends traffic to different paths based on rules or attributes.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 15,
      "p95_latency_ms": 50,
      "failure_rate": 0.001,
      "max_rps": 1500,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "branch_selected",
      "fallback_branch_used",
      "no_rule_matched"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "branch_logic/unit_tests",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "service_node",
    "name": "Service Node",
    "category": "Logic & Processing",
    "role": "processor",
    "what_it_is": "A core business service.",
    "what_it_does": "Executes domain logic such as create order, match user, or calculate score.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 120,
      "p95_latency_ms": 400,
      "failure_rate": 0.005,
      "max_rps": 300,
      "cost_per_request_usd": 0.00003
    },
    "possible_outcomes": [
      "processed",
      "failed",
      "timed_out"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "service_file/interface/unit_test",
      "default_files": [
        "integration_test",
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "function_node",
    "name": "Function Node",
    "category": "Logic & Processing",
    "role": "processor",
    "what_it_is": "A stateless processing utility.",
    "what_it_does": "Runs a small transformation or calculation.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 120,
      "p95_latency_ms": 400,
      "failure_rate": 0.005,
      "max_rps": 300,
      "cost_per_request_usd": 0.00003
    },
    "possible_outcomes": [
      "processed",
      "failed",
      "timed_out"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "utility_function/unit_test",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "mapper",
    "name": "Mapper",
    "category": "Logic & Processing",
    "role": "transformer",
    "what_it_is": "A data mapping component.",
    "what_it_does": "Transforms one schema into another for downstream compatibility.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 70,
      "failure_rate": 0.002,
      "max_rps": 1500,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "transformed",
      "mapping_failed",
      "missing_field"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "mapper_function/types/tests",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "rule_engine",
    "name": "Rule Engine",
    "category": "Logic & Processing",
    "role": "decision_maker",
    "what_it_is": "A deterministic business rule evaluator.",
    "what_it_does": "Applies rules and returns decisions, scores, or routes.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 15,
      "p95_latency_ms": 50,
      "failure_rate": 0.001,
      "max_rps": 1500,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "branch_selected",
      "fallback_branch_used",
      "no_rule_matched"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "rule_config/evaluator/tests",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "state_machine",
    "name": "State Machine",
    "category": "Logic & Processing",
    "role": "state_controller",
    "what_it_is": "A lifecycle transition controller.",
    "what_it_does": "Ensures state changes follow allowed transitions.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 40,
      "p95_latency_ms": 120,
      "failure_rate": 0.002,
      "max_rps": 700,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "transition_allowed",
      "transition_rejected",
      "state_conflict"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "state_machine_config/transition_tests",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "retry_handler",
    "name": "Retry Handler",
    "category": "Reliability",
    "role": "reliability_controller",
    "what_it_is": "A retry policy component.",
    "what_it_does": "Retries failed actions with backoff and limits.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 60,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "retried",
      "fallback_used",
      "circuit_opened",
      "recovered"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "retry_utility/backoff_config",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "circuit_breaker",
    "name": "Circuit Breaker",
    "category": "Reliability",
    "role": "reliability_controller",
    "what_it_is": "A dependency failure protection component.",
    "what_it_does": "Stops calls to failing dependencies and routes to fallback.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 60,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "retried",
      "fallback_used",
      "circuit_opened",
      "recovered"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "circuit_breaker_wrapper",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "fallback",
    "name": "Fallback",
    "category": "Reliability",
    "role": "reliability_controller",
    "what_it_is": "A backup path for failures.",
    "what_it_does": "Returns backup response or routes to alternate component.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 60,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "retried",
      "fallback_used",
      "circuit_opened",
      "recovered"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "fallback_service/tests",
      "default_files": [
        "integration_test",
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "postgresql",
    "name": "PostgreSQL",
    "category": "Database & Storage",
    "role": "storage_reader",
    "what_it_is": "A relational database component.",
    "what_it_does": "Represents relational reads/writes, indexes, joins, and transactions.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 70,
      "p95_latency_ms": 250,
      "failure_rate": 0.004,
      "max_rps": 800,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "read_success",
      "read_failed",
      "not_found",
      "slow_query"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "connection_string_secret_ref_required"
    ],
    "export_mapping": {
      "export_as": "repository/schema/migration",
      "default_files": [
        "migration_or_index_config",
        "model_or_schema",
        "repository"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "mongodb",
    "name": "MongoDB",
    "category": "Database & Storage",
    "role": "storage_reader",
    "what_it_is": "A document database component.",
    "what_it_does": "Represents document reads/writes, indexes, and flexible schemas.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 70,
      "p95_latency_ms": 250,
      "failure_rate": 0.004,
      "max_rps": 800,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "read_success",
      "read_failed",
      "not_found",
      "slow_query"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "connection_string_secret_ref_required"
    ],
    "export_mapping": {
      "export_as": "repository/model/index_config",
      "default_files": [
        "migration_or_index_config",
        "model_or_schema",
        "repository"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "database_read",
    "name": "Database Read",
    "category": "Database & Storage",
    "role": "storage_reader",
    "what_it_is": "A database read operation.",
    "what_it_does": "Fetches records by query, key, index, or filter.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 70,
      "p95_latency_ms": 250,
      "failure_rate": 0.004,
      "max_rps": 800,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "read_success",
      "read_failed",
      "not_found",
      "slow_query"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "repository_read_method/query_test",
      "default_files": [
        "integration_test",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "database_write",
    "name": "Database Write",
    "category": "Database & Storage",
    "role": "storage_writer",
    "what_it_is": "A database mutation operation.",
    "what_it_does": "Creates, updates, or deletes state.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": true,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 100,
      "p95_latency_ms": 350,
      "failure_rate": 0.006,
      "max_rps": 400,
      "cost_per_request_usd": 0.00003
    },
    "possible_outcomes": [
      "write_success",
      "write_failed",
      "duplicate_conflict",
      "rollback"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "audit_recommended_for_sensitive_writes"
    ],
    "export_mapping": {
      "export_as": "repository_write_method/write_test",
      "default_files": [
        "integration_test",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "database_transaction",
    "name": "Database Transaction",
    "category": "Database & Storage",
    "role": "atomic_state_manager",
    "what_it_is": "An all-or-nothing database operation.",
    "what_it_does": "Commits or rolls back grouped writes.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 150,
      "p95_latency_ms": 600,
      "failure_rate": 0.008,
      "max_rps": 250,
      "cost_per_request_usd": 0.00005
    },
    "possible_outcomes": [
      "transaction_committed",
      "transaction_rolled_back",
      "deadlock_detected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "transaction_wrapper/consistency_tests",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "redis_cache",
    "name": "Redis Cache",
    "category": "Database & Storage",
    "role": "cache",
    "what_it_is": "An in-memory cache component.",
    "what_it_does": "Serves cached data, forwards misses, and reduces downstream load.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 5,
      "p95_latency_ms": 20,
      "failure_rate": 0.002,
      "max_rps": 5000,
      "cost_per_request_usd": 0.000005
    },
    "possible_outcomes": [
      "cache_hit",
      "cache_miss",
      "stale_data",
      "evicted"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "cache_service/ttl_config",
      "default_files": [
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "object_storage",
    "name": "Object Storage",
    "category": "Database & Storage",
    "role": "file_storage",
    "what_it_is": "A file/blob storage component.",
    "what_it_does": "Stores uploads, exports, media, documents, and signed URLs.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 250,
      "p95_latency_ms": 1200,
      "failure_rate": 0.006,
      "max_rps": 200,
      "cost_per_request_usd": 0.0001
    },
    "possible_outcomes": [
      "uploaded",
      "downloaded",
      "signed_url_created",
      "storage_failed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "file_validation_required",
      "signed_url_expiry_required"
    ],
    "export_mapping": {
      "export_as": "storage_service/signed_url_logic",
      "default_files": [
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "queue",
    "name": "Queue",
    "category": "Async & Events",
    "role": "async_buffer",
    "what_it_is": "A job/event buffer.",
    "what_it_does": "Absorbs traffic spikes and decouples slow work from request path.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": true
    },
    "default_simulation_profile": {
      "avg_latency_ms": 10,
      "p95_latency_ms": 50,
      "failure_rate": 0.003,
      "max_rps": 3000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "queued",
      "delayed",
      "dropped",
      "backpressure_triggered"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "queue_config/producer",
      "default_files": [
        "job_schema",
        "queue_config",
        "retry_config",
        "worker"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "worker",
    "name": "Worker",
    "category": "Async & Events",
    "role": "background_processor",
    "what_it_is": "A background processor.",
    "what_it_does": "Processes queued jobs with concurrency and retry behavior.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": true
    },
    "default_simulation_profile": {
      "avg_latency_ms": 500,
      "p95_latency_ms": 3000,
      "failure_rate": 0.01,
      "max_rps": 100,
      "cost_per_request_usd": 0.00005
    },
    "possible_outcomes": [
      "job_processed",
      "job_failed",
      "job_retried",
      "worker_saturated"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "worker_file/job_handler/tests",
      "default_files": [
        "integration_test",
        "job_schema",
        "queue_config",
        "retry_config",
        "unit_test",
        "worker"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "dead_letter_queue",
    "name": "Dead Letter Queue",
    "category": "Async & Events",
    "role": "failure_store",
    "what_it_is": "A failed job/event store.",
    "what_it_does": "Captures items that failed after retries for replay or investigation.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": false,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 80,
      "failure_rate": 0.002,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "dead_lettered",
      "replayed",
      "inspected"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "dlq_config/replay_handler",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "event_bus",
    "name": "Event Bus",
    "category": "Async & Events",
    "role": "event_distributor",
    "what_it_is": "An event publish/subscribe layer.",
    "what_it_does": "Publishes events to one or many subscribers.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": true
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 100,
      "failure_rate": 0.004,
      "max_rps": 2000,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "event_published",
      "event_delivered",
      "subscriber_failed",
      "fanout_completed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "event_publisher/subscriber/schema",
      "default_files": [
        "migration_or_index_config",
        "model_or_schema",
        "repository"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "outbox",
    "name": "Outbox",
    "category": "Async & Events",
    "role": "consistency_guard",
    "what_it_is": "A reliable DB-to-event publishing pattern.",
    "what_it_does": "Stores events in DB transaction and publishes asynchronously.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 60,
      "p95_latency_ms": 220,
      "failure_rate": 0.004,
      "max_rps": 500,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "outbox_event_created",
      "event_published",
      "publish_retry"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "outbox_model/worker",
      "default_files": [
        "job_schema",
        "migration_or_index_config",
        "model_or_schema",
        "queue_config",
        "repository",
        "retry_config",
        "worker"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "saga",
    "name": "Saga",
    "category": "Async & Events",
    "role": "distributed_transaction_controller",
    "what_it_is": "A distributed transaction coordinator.",
    "what_it_does": "Runs multi-step workflows with compensation on failure.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 250,
      "p95_latency_ms": 1200,
      "failure_rate": 0.012,
      "max_rps": 150,
      "cost_per_request_usd": 0.00008
    },
    "possible_outcomes": [
      "saga_completed",
      "saga_failed",
      "compensation_started",
      "compensation_completed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "saga_orchestrator/compensation_handlers",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "llm_call",
    "name": "LLM Call",
    "category": "AI / ML",
    "role": "ai_inference",
    "what_it_is": "A model inference call.",
    "what_it_does": "Generates, classifies, summarizes, or extracts data using a model.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 2500,
      "p95_latency_ms": 7000,
      "failure_rate": 0.02,
      "max_rps": 50,
      "cost_per_request_usd": 0.002
    },
    "possible_outcomes": [
      "generated",
      "timed_out",
      "provider_failed",
      "fallback_model_used"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "prompt_injection_controls_recommended"
    ],
    "export_mapping": {
      "export_as": "llm_service/provider_adapter",
      "default_files": [
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "prompt_template",
    "name": "Prompt Template",
    "category": "AI / ML",
    "role": "ai_input_builder",
    "what_it_is": "A structured prompt builder.",
    "what_it_does": "Combines variables, instructions, and retrieved context.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 30,
      "p95_latency_ms": 100,
      "failure_rate": 0.002,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "prompt_built",
      "variable_missing",
      "token_limit_warning"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "prompt_template_file/variable_schema",
      "default_files": [
        "migration_or_index_config",
        "model_or_schema",
        "repository"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "embedding",
    "name": "Embedding",
    "category": "AI / ML",
    "role": "vector_generator",
    "what_it_is": "A text-to-vector generator.",
    "what_it_does": "Creates embeddings for semantic search or RAG.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 700,
      "p95_latency_ms": 2200,
      "failure_rate": 0.01,
      "max_rps": 100,
      "cost_per_request_usd": 0.0002
    },
    "possible_outcomes": [
      "embedding_created",
      "batch_processed",
      "provider_failed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "embedding_service/batch_worker",
      "default_files": [
        "interface",
        "job_schema",
        "queue_config",
        "retry_config",
        "service",
        "unit_test",
        "worker"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "vector_search",
    "name": "Vector Search",
    "category": "AI / ML",
    "role": "retrieval",
    "what_it_is": "A semantic retrieval component.",
    "what_it_does": "Finds relevant chunks/documents using vector similarity.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 120,
      "p95_latency_ms": 450,
      "failure_rate": 0.005,
      "max_rps": 400,
      "cost_per_request_usd": 0.00003
    },
    "possible_outcomes": [
      "documents_retrieved",
      "no_match",
      "retrieval_failed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "retriever_interface/query_tests",
      "default_files": [
        "integration_test",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "guardrail",
    "name": "Guardrail",
    "category": "AI / ML",
    "role": "safety_validator",
    "what_it_is": "An AI/content safety and policy filter.",
    "what_it_does": "Blocks or flags unsafe, invalid, or non-compliant outputs.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 120,
      "p95_latency_ms": 500,
      "failure_rate": 0.004,
      "max_rps": 300,
      "cost_per_request_usd": 0.00005
    },
    "possible_outcomes": [
      "passed",
      "blocked",
      "flagged_for_review"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "guardrail_service/policy_config",
      "default_files": [
        "config",
        "interface",
        "middleware",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "output_parser",
    "name": "Output Parser",
    "category": "AI / ML",
    "role": "transformer",
    "what_it_is": "A structured output parser.",
    "what_it_does": "Parses text/model output into typed JSON or schema.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 70,
      "failure_rate": 0.002,
      "max_rps": 1500,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "transformed",
      "mapping_failed",
      "missing_field"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "parser_function/output_schema/tests",
      "default_files": [
        "integration_test",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "payment_gateway",
    "name": "Payment Gateway",
    "category": "Payments & Billing",
    "role": "external_side_effect",
    "what_it_is": "A payment provider integration.",
    "what_it_does": "Creates payment orders, verifies status, and handles payment side effects.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": true,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 700,
      "p95_latency_ms": 2500,
      "failure_rate": 0.025,
      "max_rps": 100,
      "cost_per_request_usd": 0.0005
    },
    "possible_outcomes": [
      "processed",
      "failed",
      "duplicate_blocked",
      "webhook_pending"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "idempotency_required",
      "webhook_signature_required"
    ],
    "export_mapping": {
      "export_as": "payment_service/provider_adapter/webhook",
      "default_files": [
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "subscription",
    "name": "Subscription",
    "category": "Payments & Billing",
    "role": "billing_state_manager",
    "what_it_is": "A recurring billing state component.",
    "what_it_does": "Manages plans, renewals, cancellations, grace periods, and access.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": true,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 200,
      "p95_latency_ms": 900,
      "failure_rate": 0.01,
      "max_rps": 200,
      "cost_per_request_usd": 0.0001
    },
    "possible_outcomes": [
      "subscription_created",
      "renewal_failed",
      "access_updated"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "billing_webhook_required"
    ],
    "export_mapping": {
      "export_as": "subscription_service/plan_model",
      "default_files": [
        "interface",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "credit_meter",
    "name": "Credit Meter",
    "category": "Payments & Billing",
    "role": "usage_meter",
    "what_it_is": "A usage-based credit accounting component.",
    "what_it_does": "Checks, reserves, consumes, refunds, and logs credits.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 50,
      "p95_latency_ms": 180,
      "failure_rate": 0.003,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00001
    },
    "possible_outcomes": [
      "credits_reserved",
      "credits_consumed",
      "credits_refunded",
      "insufficient_credits"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "server_side_only_required"
    ],
    "export_mapping": {
      "export_as": "credit_service/usage_ledger",
      "default_files": [
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "wallet",
    "name": "Wallet",
    "category": "Payments & Billing",
    "role": "balance_state_manager",
    "what_it_is": "A balance/coin/ledger component.",
    "what_it_does": "Updates wallet balance and creates ledger entries.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": true,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": true,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 120,
      "p95_latency_ms": 450,
      "failure_rate": 0.006,
      "max_rps": 400,
      "cost_per_request_usd": 0.00003
    },
    "possible_outcomes": [
      "balance_updated",
      "ledger_entry_created",
      "negative_balance_blocked"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "idempotency_required",
      "audit_required"
    ],
    "export_mapping": {
      "export_as": "wallet_service/ledger_model",
      "default_files": [
        "interface",
        "migration_or_index_config",
        "model_or_schema",
        "repository",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "notification",
    "name": "Notification",
    "category": "Communication",
    "role": "communication",
    "what_it_is": "A message delivery component.",
    "what_it_does": "Sends email, SMS, WhatsApp, push, or in-app alerts.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": true,
      "can_retry": true,
      "can_timeout": true,
      "can_queue": true
    },
    "default_simulation_profile": {
      "avg_latency_ms": 500,
      "p95_latency_ms": 3000,
      "failure_rate": 0.03,
      "max_rps": 100,
      "cost_per_request_usd": 0.0004
    },
    "possible_outcomes": [
      "sent",
      "queued",
      "delivered",
      "failed",
      "rate_limited"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "opt_out_rules_recommended"
    ],
    "export_mapping": {
      "export_as": "notification_service/provider_adapter/templates",
      "default_files": [
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "websocket",
    "name": "WebSocket",
    "category": "Communication",
    "role": "realtime_channel",
    "what_it_is": "A realtime bidirectional channel.",
    "what_it_does": "Sends live status, chat, progress, or presence updates.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 30,
      "p95_latency_ms": 150,
      "failure_rate": 0.01,
      "max_rps": 1000,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "connected",
      "message_delivered",
      "connection_dropped",
      "broadcast_sent"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "auth_required_for_private_channels"
    ],
    "export_mapping": {
      "export_as": "websocket_gateway/connection_manager",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "logger",
    "name": "Logger",
    "category": "Observability & Ops",
    "role": "observer",
    "what_it_is": "A structured logging component.",
    "what_it_does": "Writes operational and business logs.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": false,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": false,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 10,
      "p95_latency_ms": 40,
      "failure_rate": 0.001,
      "max_rps": 5000,
      "cost_per_request_usd": 0.000005
    },
    "possible_outcomes": [
      "event_recorded",
      "metric_emitted",
      "log_written",
      "trace_span_created"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "pii_redaction_recommended"
    ],
    "export_mapping": {
      "export_as": "logger_config/log_schema",
      "default_files": [
        "migration_or_index_config",
        "model_or_schema",
        "repository"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "metrics",
    "name": "Metrics",
    "category": "Observability & Ops",
    "role": "observer",
    "what_it_is": "A metrics instrumentation component.",
    "what_it_does": "Emits counters, gauges, histograms, and operational metrics.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": false,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": false,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 10,
      "p95_latency_ms": 40,
      "failure_rate": 0.001,
      "max_rps": 5000,
      "cost_per_request_usd": 0.000005
    },
    "possible_outcomes": [
      "event_recorded",
      "metric_emitted",
      "log_written",
      "trace_span_created"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "metrics_instrumentation/dashboard_config",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "tracing",
    "name": "Tracing",
    "category": "Observability & Ops",
    "role": "observer",
    "what_it_is": "A distributed trace component.",
    "what_it_does": "Tracks request path and node-level spans.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": false,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": false,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 10,
      "p95_latency_ms": 40,
      "failure_rate": 0.001,
      "max_rps": 5000,
      "cost_per_request_usd": 0.000005
    },
    "possible_outcomes": [
      "event_recorded",
      "metric_emitted",
      "log_written",
      "trace_span_created"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "opentelemetry_setup/span_conventions",
      "default_files": [
        "config_stub",
        "documentation_stub",
        "test_stub"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "alert",
    "name": "Alert",
    "category": "Observability & Ops",
    "role": "operations_response",
    "what_it_is": "An alerting component.",
    "what_it_does": "Triggers alerts or incidents when thresholds are breached.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 100,
      "p95_latency_ms": 500,
      "failure_rate": 0.01,
      "max_rps": 500,
      "cost_per_request_usd": 0.00005
    },
    "possible_outcomes": [
      "alert_triggered",
      "incident_created",
      "escalated"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "alert_rules/notification_route",
      "default_files": [
        "controller",
        "dto",
        "integration_test",
        "openapi_path"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "health_check",
    "name": "Health Check",
    "category": "Observability & Ops",
    "role": "availability_monitor",
    "what_it_is": "A service health endpoint.",
    "what_it_does": "Reports readiness, liveness, and dependency health.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": false,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 20,
      "p95_latency_ms": 80,
      "failure_rate": 0.001,
      "max_rps": 1000,
      "cost_per_request_usd": 0
    },
    "possible_outcomes": [
      "healthy",
      "degraded",
      "unhealthy"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [],
    "export_mapping": {
      "export_as": "health_route/dependency_checks",
      "default_files": [
        "controller",
        "dto",
        "integration_test",
        "openapi_path"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "report_export",
    "name": "Report Export",
    "category": "Export & Admin",
    "role": "exporter",
    "what_it_is": "A report or package generation component.",
    "what_it_does": "Generates PDF, CSV, JSON, ZIP, Markdown, or code packages.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": true
    },
    "default_simulation_profile": {
      "avg_latency_ms": 3000,
      "p95_latency_ms": 15000,
      "failure_rate": 0.015,
      "max_rps": 20,
      "cost_per_request_usd": 0.001
    },
    "possible_outcomes": [
      "export_started",
      "file_generated",
      "upload_completed",
      "export_failed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "signed_download_url_required"
    ],
    "export_mapping": {
      "export_as": "export_worker/templates/storage_upload",
      "default_files": [
        "job_schema",
        "queue_config",
        "retry_config",
        "worker"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "admin_action",
    "name": "Admin Action",
    "category": "Export & Admin",
    "role": "governance_action",
    "what_it_is": "A privileged admin operation.",
    "what_it_does": "Changes sensitive product/user state with permission and audit.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": true,
      "creates_side_effect": true,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 100,
      "p95_latency_ms": 400,
      "failure_rate": 0.004,
      "max_rps": 200,
      "cost_per_request_usd": 0.00002
    },
    "possible_outcomes": [
      "admin_action_completed",
      "permission_blocked",
      "state_changed"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "rbac_required",
      "audit_required"
    ],
    "export_mapping": {
      "export_as": "admin_route/permission_guard/audit",
      "default_files": [
        "config",
        "controller",
        "dto",
        "integration_test",
        "middleware",
        "openapi_path",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  },
  {
    "id": "custom_node",
    "name": "Custom Node",
    "category": "Custom",
    "role": "user_defined_component",
    "what_it_is": "A user-defined software component.",
    "what_it_does": "Represents internal service, custom API, ML model, third-party component, or domain-specific operation.",
    "input_contract": {
      "type": "object",
      "description": "Configured in node settings or inherited from upstream node."
    },
    "output_contract": {
      "type": "object",
      "description": "Defined by node type and downstream mapping."
    },
    "traffic_behavior": {
      "accepts_traffic": true,
      "can_block_traffic": false,
      "forwards_traffic": true,
      "changes_state": false,
      "creates_side_effect": false,
      "can_retry": false,
      "can_timeout": true,
      "can_queue": false
    },
    "default_simulation_profile": {
      "avg_latency_ms": 300,
      "p95_latency_ms": 1000,
      "failure_rate": 0.01,
      "max_rps": 100,
      "cost_per_request_usd": 0.0001
    },
    "possible_outcomes": [
      "processed",
      "failed",
      "simulated_with_defaults"
    ],
    "metrics_produced": [
      "input_count",
      "output_count",
      "success_count",
      "failure_count",
      "rejected_count",
      "avg_latency_ms",
      "p95_latency_ms",
      "throughput_rps",
      "cost_usd"
    ],
    "security_requirements": [
      "manifest_validation_required"
    ],
    "export_mapping": {
      "export_as": "custom_service_skeleton/manifest/types/tests",
      "default_files": [
        "integration_test",
        "interface",
        "service",
        "unit_test"
      ]
    },
    "confidence_requirements": [
      "input_schema",
      "output_schema",
      "avg_latency_ms",
      "p95_latency_ms",
      "failure_rate",
      "max_rps",
      "timeout_policy"
    ]
  }
] as const;

export const BUILD_RAX_TEMPLATE_CATALOG = [
  {
    "id": "tpl_001_user_authentication_saas",
    "name": "User Authentication SaaS",
    "category": "B2B SaaS",
    "product_type": "SaaS",
    "description": "Reusable backend architecture template for user authentication saas.",
    "core_flow": [
      "Signup/Login",
      "Auth",
      "Session",
      "RBAC",
      "Dashboard Access",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Auth Node",
        "catalog_match": true,
        "node_id": "auth_node",
        "fallback_type": null
      },
      {
        "name": "JWT Auth",
        "catalog_match": true,
        "node_id": "jwt_auth",
        "fallback_type": null
      },
      {
        "name": "RBAC Permission Check",
        "catalog_match": true,
        "node_id": "rbac_permission_check",
        "fallback_type": null
      },
      {
        "name": "Session Manager",
        "catalog_match": false,
        "node_id": "session_manager",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Invalid login spike",
        "Expired token flow",
        "Session store latency"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Auth routes, middleware, session model, RBAC config, audit log",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_002_multi_tenant_saas_workspace",
    "name": "Multi-Tenant SaaS Workspace",
    "category": "B2B SaaS",
    "product_type": "SaaS",
    "description": "Reusable backend architecture template for multi-tenant saas workspace.",
    "core_flow": [
      "Organization",
      "Workspace",
      "Members",
      "Roles",
      "Resource Permissions",
      "Billing"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Auth Node",
        "catalog_match": true,
        "node_id": "auth_node",
        "fallback_type": null
      },
      {
        "name": "RBAC Permission Check",
        "catalog_match": true,
        "node_id": "rbac_permission_check",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Subscription",
        "catalog_match": true,
        "node_id": "subscription",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Tenant isolation breach risk",
        "Permission mismatch",
        "Workspace invite abuse"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Org/workspace models, permission service, invite API, audit trail",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_003_subscription_billing_saas",
    "name": "Subscription Billing SaaS",
    "category": "B2B SaaS",
    "product_type": "SaaS",
    "description": "Reusable backend architecture template for subscription billing saas.",
    "core_flow": [
      "Plan Selection",
      "Checkout",
      "Payment Gateway",
      "Webhook",
      "Subscription State",
      "Invoice"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Subscription",
        "catalog_match": true,
        "node_id": "subscription",
        "fallback_type": null
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Webhook delay",
        "Duplicate payment",
        "Renewal failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Checkout API, provider adapter, webhook handler, subscription model",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_004_usage_based_credits_saas",
    "name": "Usage-Based Credits SaaS",
    "category": "B2B SaaS",
    "product_type": "SaaS",
    "description": "Reusable backend architecture template for usage-based credits saas.",
    "core_flow": [
      "User Action",
      "Credit Check",
      "Credit Reserve",
      "Job Run",
      "Credit Consume/Refund"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Credit Meter",
        "catalog_match": true,
        "node_id": "credit_meter",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Double click duplicate action",
        "Worker failure refund",
        "Insufficient credits"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Credit service, usage ledger, reservation logic, idempotency tests",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_005_team_collaboration_saas",
    "name": "Team Collaboration SaaS",
    "category": "B2B SaaS",
    "product_type": "SaaS",
    "description": "Reusable backend architecture template for team collaboration saas.",
    "core_flow": [
      "Workspace",
      "Invite Member",
      "Permission Check",
      "Shared Resource",
      "Comments",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Auth Node",
        "catalog_match": true,
        "node_id": "auth_node",
        "fallback_type": null
      },
      {
        "name": "RBAC Permission Check",
        "catalog_match": true,
        "node_id": "rbac_permission_check",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Invite spam",
        "Permission conflict",
        "Concurrent editing"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Member APIs, invite service, permissions, comment model",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_006_project_management_saas",
    "name": "Project Management SaaS",
    "category": "B2B SaaS",
    "product_type": "SaaS",
    "description": "Reusable backend architecture template for project management saas.",
    "core_flow": [
      "Project",
      "Task",
      "Assignment",
      "Status Change",
      "Notification",
      "Activity Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Invalid state transition",
        "Notification delivery delay",
        "Task overload"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Project/task modules, state transitions, activity log",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_007_crm_lead_management",
    "name": "CRM Lead Management",
    "category": "B2B SaaS",
    "product_type": "CRM",
    "description": "Reusable backend architecture template for crm lead management.",
    "core_flow": [
      "Lead Form",
      "Validation",
      "Deduplication",
      "Lead Score",
      "CRM Pipeline",
      "Notification"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Deduplication",
        "catalog_match": false,
        "node_id": "deduplication",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "CRM Node",
        "catalog_match": false,
        "node_id": "crm_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Duplicate leads",
        "Invalid forms",
        "CRM API rate limit"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Lead API, dedupe service, scoring rules, CRM adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_008_customer_support_ticketing",
    "name": "Customer Support Ticketing",
    "category": "B2B SaaS",
    "product_type": "Support",
    "description": "Reusable backend architecture template for customer support ticketing.",
    "core_flow": [
      "Ticket Created",
      "Classification",
      "Assignment",
      "SLA Timer",
      "Agent Reply",
      "Resolution"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "SLA breach",
        "Queue backlog",
        "Assignment overload"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Ticket module, SLA worker, assignment rules, notification service",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_009_document_approval_saas",
    "name": "Document Approval SaaS",
    "category": "B2B SaaS",
    "product_type": "Workflow",
    "description": "Reusable backend architecture template for document approval saas.",
    "core_flow": [
      "Upload Document",
      "Review",
      "Comment",
      "Approve/Reject",
      "Version Store",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "File Upload Trigger",
        "catalog_match": false,
        "node_id": "file_upload_trigger",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Large file upload",
        "Invalid file",
        "Approval delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Upload service, document model, approval workflow, version log",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_010_b2b_reporting_dashboard",
    "name": "B2B Reporting Dashboard",
    "category": "B2B SaaS",
    "product_type": "Analytics",
    "description": "Reusable backend architecture template for b2b reporting dashboard.",
    "core_flow": [
      "Data Source",
      "ETL Job",
      "Metrics Store",
      "Dashboard API",
      "Role-Based View"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Batch Job",
        "catalog_match": false,
        "node_id": "batch_job",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "RBAC Permission Check",
        "catalog_match": true,
        "node_id": "rbac_permission_check",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Slow query",
        "ETL failure",
        "Permission leak"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "ETL worker, metrics APIs, dashboard endpoints",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_011_consumer_app_onboarding",
    "name": "Consumer App Onboarding",
    "category": "B2C App",
    "product_type": "Mobile App",
    "description": "Reusable backend architecture template for consumer app onboarding.",
    "core_flow": [
      "Install",
      "Signup",
      "OTP/Auth",
      "Profile Setup",
      "Preferences",
      "Home Feed"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Auth Node",
        "catalog_match": true,
        "node_id": "auth_node",
        "fallback_type": null
      },
      {
        "name": "OTP Service",
        "catalog_match": false,
        "node_id": "otp_service",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "OTP delivery failure",
        "Profile abandonment",
        "Invalid user data"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Auth APIs, OTP adapter, profile service, analytics events",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_012_social_feed_app",
    "name": "Social Feed App",
    "category": "B2C App",
    "product_type": "Social",
    "description": "Reusable backend architecture template for social feed app.",
    "core_flow": [
      "Create Post",
      "Media Upload",
      "Feed Ranking",
      "Feed API",
      "Engagement Events"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Ranking Node",
        "catalog_match": false,
        "node_id": "ranking_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Media upload spike",
        "Feed API latency",
        "Engagement write pressure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Post service, media upload, feed worker, ranking stub",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_013_chat_app",
    "name": "Chat App",
    "category": "B2C App",
    "product_type": "Realtime",
    "description": "Reusable backend architecture template for chat app.",
    "core_flow": [
      "Send Message",
      "WebSocket",
      "Message Store",
      "Delivery Status",
      "Push Notification"
    ],
    "recommended_nodes": [
      {
        "name": "WebSocket",
        "catalog_match": true,
        "node_id": "websocket",
        "fallback_type": null
      },
      {
        "name": "Auth Node",
        "catalog_match": true,
        "node_id": "auth_node",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Connection drop",
        "Message backlog",
        "Push failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Realtime gateway, message model, delivery status, push adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_014_video_calling_app",
    "name": "Video Calling App",
    "category": "B2C App",
    "product_type": "Realtime",
    "description": "Reusable backend architecture template for video calling app.",
    "core_flow": [
      "User Match",
      "Call Session",
      "RTC Provider",
      "Timer",
      "Billing",
      "Call Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Timer Node",
        "catalog_match": false,
        "node_id": "timer_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Credit Meter",
        "catalog_match": true,
        "node_id": "credit_meter",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "RTC provider failure",
        "Timer drift",
        "Billing duplicate"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Call session service, RTC adapter, timer worker, billing ledger",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_015_dating_app_matchmaking",
    "name": "Dating App Matchmaking",
    "category": "B2C App",
    "product_type": "Social",
    "description": "Reusable backend architecture template for dating app matchmaking.",
    "core_flow": [
      "Profile",
      "Preference Filter",
      "Recommendation",
      "Like/Match",
      "Chat Unlock"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Filter Node",
        "catalog_match": false,
        "node_id": "filter_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Recommendation Node",
        "catalog_match": false,
        "node_id": "recommendation_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Recommendation latency",
        "Fake profile spike",
        "Match write pressure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Profile service, match service, recommendation interface",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_016_fitness_tracking_app",
    "name": "Fitness Tracking App",
    "category": "B2C App",
    "product_type": "Health/Fitness",
    "description": "Reusable backend architecture template for fitness tracking app.",
    "core_flow": [
      "User Activity",
      "Device Sync",
      "Goal Engine",
      "Progress Dashboard",
      "Reminder"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Device sync burst",
        "Bad payload",
        "Reminder delivery failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Activity ingestion, goal rules, dashboard API",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_017_learning_app",
    "name": "Learning App",
    "category": "B2C App",
    "product_type": "EdTech",
    "description": "Reusable backend architecture template for learning app.",
    "core_flow": [
      "Course Enrollment",
      "Lesson Progress",
      "Quiz",
      "Score",
      "Recommendation",
      "Certificate"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Recommendation Node",
        "catalog_match": false,
        "node_id": "recommendation_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Quiz fraud",
        "Progress inconsistency",
        "Certificate export failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Course module, progress service, quiz scoring, certificate exporter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_018_food_delivery_app",
    "name": "Food Delivery App",
    "category": "B2C App",
    "product_type": "Commerce",
    "description": "Reusable backend architecture template for food delivery app.",
    "core_flow": [
      "Restaurant Search",
      "Cart",
      "Checkout",
      "Order Routing",
      "Delivery Tracking",
      "Notification"
    ],
    "recommended_nodes": [
      {
        "name": "Search Query Node",
        "catalog_match": false,
        "node_id": "search_query_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "WebSocket",
        "catalog_match": true,
        "node_id": "websocket",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Peak order load",
        "Payment failure",
        "Delivery status delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Menu search, cart service, order state machine, payment adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_019_ride_booking_app",
    "name": "Ride Booking App",
    "category": "B2C App",
    "product_type": "Mobility",
    "description": "Reusable backend architecture template for ride booking app.",
    "core_flow": [
      "Ride Request",
      "Driver Match",
      "Fare Estimate",
      "Trip Tracking",
      "Payment",
      "Rating"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Similarity Match Node",
        "catalog_match": false,
        "node_id": "similarity_match_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "WebSocket",
        "catalog_match": true,
        "node_id": "websocket",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Driver match delay",
        "Realtime updates drop",
        "Payment timeout"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Ride service, match logic, fare calculator, tracking channel",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_020_push_notification_engagement",
    "name": "Push Notification Engagement",
    "category": "B2C App",
    "product_type": "Growth",
    "description": "Reusable backend architecture template for push notification engagement.",
    "core_flow": [
      "User Segment",
      "Campaign Trigger",
      "Notification Queue",
      "Push Delivery",
      "Analytics"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Provider rate limit",
        "Queue backlog",
        "Low delivery"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Campaign worker, segmentation rules, notification queue",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_021_two_sided_marketplace",
    "name": "Two-Sided Marketplace",
    "category": "Marketplace",
    "product_type": "Marketplace",
    "description": "Reusable backend architecture template for two-sided marketplace.",
    "core_flow": [
      "Buyer Request",
      "Seller Match",
      "Offer",
      "Payment",
      "Fulfillment",
      "Rating"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Similarity Match Node",
        "catalog_match": false,
        "node_id": "similarity_match_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Match failure",
        "Payment dispute",
        "Fulfillment delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Buyer/seller modules, offer service, payment flow, rating model",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_022_creator_marketplace",
    "name": "Creator Marketplace",
    "category": "Marketplace",
    "product_type": "Creator Economy",
    "description": "Reusable backend architecture template for creator marketplace.",
    "core_flow": [
      "Brand Brief",
      "Creator Search",
      "Creator Match",
      "Campaign Contract",
      "Payment Escrow"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Search Query Node",
        "catalog_match": false,
        "node_id": "search_query_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Similarity Match Node",
        "catalog_match": false,
        "node_id": "similarity_match_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Creator search slow",
        "Contract state conflict",
        "Escrow failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Brand brief API, creator search, matching service, escrow contract model",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_023_freelance_marketplace_with_escrow",
    "name": "Freelance Marketplace with Escrow",
    "category": "Marketplace",
    "product_type": "Freelance",
    "description": "Reusable backend architecture template for freelance marketplace with escrow.",
    "core_flow": [
      "Project Posted",
      "Freelancer Bid",
      "Milestone Escrow",
      "Work Submission",
      "Release Payment"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Milestone dispute",
        "Late submission",
        "Duplicate release"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Project/bid modules, escrow service, milestone state machine",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_024_service_booking_marketplace",
    "name": "Service Booking Marketplace",
    "category": "Marketplace",
    "product_type": "Booking",
    "description": "Reusable backend architecture template for service booking marketplace.",
    "core_flow": [
      "Service Search",
      "Provider Availability",
      "Booking",
      "Payment",
      "Reminder",
      "Review"
    ],
    "recommended_nodes": [
      {
        "name": "Search Query Node",
        "catalog_match": false,
        "node_id": "search_query_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Calendar Node",
        "catalog_match": false,
        "node_id": "calendar_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Availability conflict",
        "Double booking",
        "Payment failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Provider availability, booking service, payment adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_025_real_estate_listing_marketplace",
    "name": "Real Estate Listing Marketplace",
    "category": "Marketplace",
    "product_type": "Real Estate",
    "description": "Reusable backend architecture template for real estate listing marketplace.",
    "core_flow": [
      "Property Listing",
      "Search Filters",
      "Lead Form",
      "Agent Assignment",
      "Follow-Up"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Search Query Node",
        "catalog_match": false,
        "node_id": "search_query_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "CRM Node",
        "catalog_match": false,
        "node_id": "crm_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Lead spam",
        "Search latency",
        "Agent overload"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Listing service, lead routing, search filters",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_026_rental_marketplace",
    "name": "Rental Marketplace",
    "category": "Marketplace",
    "product_type": "Rental",
    "description": "Reusable backend architecture template for rental marketplace.",
    "core_flow": [
      "Listing",
      "Availability Check",
      "Booking",
      "Deposit",
      "Return Check",
      "Refund"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Calendar Node",
        "catalog_match": false,
        "node_id": "calendar_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Refund Node",
        "catalog_match": false,
        "node_id": "refund_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Deposit refund dispute",
        "Availability mismatch",
        "Late return"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Rental booking, deposit ledger, refund workflow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_027_b2b_vendor_marketplace",
    "name": "B2B Vendor Marketplace",
    "category": "Marketplace",
    "product_type": "Procurement",
    "description": "Reusable backend architecture template for b2b vendor marketplace.",
    "core_flow": [
      "Buyer Requirement",
      "Vendor Discovery",
      "RFQ",
      "Quote Comparison",
      "Purchase Order"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Search Query Node",
        "catalog_match": false,
        "node_id": "search_query_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "RFQ overload",
        "Vendor response delay",
        "Approval bottleneck"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "RFQ module, quote comparison, PO workflow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_028_job_marketplace",
    "name": "Job Marketplace",
    "category": "Marketplace",
    "product_type": "HRTech",
    "description": "Reusable backend architecture template for job marketplace.",
    "core_flow": [
      "Candidate Profile",
      "Job Match",
      "Application",
      "Recruiter Review",
      "Interview Pipeline"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Similarity Match Node",
        "catalog_match": false,
        "node_id": "similarity_match_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Calendar Node",
        "catalog_match": false,
        "node_id": "calendar_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Application burst",
        "Match quality drop",
        "Interview scheduling conflict"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Candidate/job modules, matching, application state machine",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_029_expert_consultation_marketplace",
    "name": "Expert Consultation Marketplace",
    "category": "Marketplace",
    "product_type": "Consultation",
    "description": "Reusable backend architecture template for expert consultation marketplace.",
    "core_flow": [
      "User Query",
      "Expert Match",
      "Slot Booking",
      "Video Call",
      "Payment Split"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Similarity Match Node",
        "catalog_match": false,
        "node_id": "similarity_match_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Calendar Node",
        "catalog_match": false,
        "node_id": "calendar_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Commission Split",
        "catalog_match": false,
        "node_id": "commission_split",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Expert unavailable",
        "Call provider failure",
        "Payout split error"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Expert match service, booking, RTC adapter, payout split",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_030_dispute_resolution_marketplace",
    "name": "Dispute Resolution Marketplace",
    "category": "Marketplace",
    "product_type": "Trust & Safety",
    "description": "Reusable backend architecture template for dispute resolution marketplace.",
    "core_flow": [
      "Dispute Raised",
      "Evidence Upload",
      "Moderator Review",
      "Decision",
      "Payment Action"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Evidence upload fail",
        "Moderator backlog",
        "Wrong payment action"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Dispute module, evidence storage, admin decision flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_031_ai_chatbot_saas",
    "name": "AI Chatbot SaaS",
    "category": "AI Product",
    "product_type": "AI SaaS",
    "description": "Reusable backend architecture template for ai chatbot saas.",
    "core_flow": [
      "User Message",
      "Context Fetch",
      "Prompt Build",
      "LLM Call",
      "Output Parser",
      "Response"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Prompt Template",
        "catalog_match": true,
        "node_id": "prompt_template",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Output Parser",
        "catalog_match": true,
        "node_id": "output_parser",
        "fallback_type": null
      },
      {
        "name": "Logger",
        "catalog_match": true,
        "node_id": "logger",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Model timeout",
        "Parser failure",
        "High token cost"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Chat API, prompt templates, provider adapter, parser tests",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_032_rag_knowledge_base",
    "name": "RAG Knowledge Base",
    "category": "AI Product",
    "product_type": "AI SaaS",
    "description": "Reusable backend architecture template for rag knowledge base.",
    "core_flow": [
      "Document Upload",
      "Chunking",
      "Embedding",
      "Vector Search",
      "LLM Answer",
      "Citation"
    ],
    "recommended_nodes": [
      {
        "name": "File Upload Trigger",
        "catalog_match": false,
        "node_id": "file_upload_trigger",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Embedding",
        "catalog_match": true,
        "node_id": "embedding",
        "fallback_type": null
      },
      {
        "name": "Vector Search",
        "catalog_match": true,
        "node_id": "vector_search",
        "fallback_type": null
      },
      {
        "name": "Prompt Template",
        "catalog_match": true,
        "node_id": "prompt_template",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Embedding backlog",
        "No relevant chunks",
        "Citation mismatch"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Ingestion worker, vector schema, retrieval service, answer API",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_033_ai_agent_tool_calling",
    "name": "AI Agent Tool Calling",
    "category": "AI Product",
    "product_type": "Agent",
    "description": "Reusable backend architecture template for ai agent tool calling.",
    "core_flow": [
      "User Task",
      "Agent Planner",
      "Tool Selection",
      "Tool Call",
      "Result Memory",
      "Final Answer"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Router",
        "catalog_match": true,
        "node_id": "router",
        "fallback_type": null
      },
      {
        "name": "Tool Call Node",
        "catalog_match": false,
        "node_id": "tool_call_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Memory Node",
        "catalog_match": false,
        "node_id": "memory_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Output Parser",
        "catalog_match": true,
        "node_id": "output_parser",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Tool loop runaway",
        "Tool timeout",
        "Memory bloat"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Agent runner, tool interface, loop limiter, memory store",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_034_ai_content_generation",
    "name": "AI Content Generation",
    "category": "AI Product",
    "product_type": "Marketing AI",
    "description": "Reusable backend architecture template for ai content generation.",
    "core_flow": [
      "Brief",
      "Prompt Template",
      "LLM Draft",
      "Policy Check",
      "Human Review",
      "Publish"
    ],
    "recommended_nodes": [
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Prompt Template",
        "catalog_match": true,
        "node_id": "prompt_template",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Guardrail",
        "catalog_match": true,
        "node_id": "guardrail",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "CMS Node",
        "catalog_match": false,
        "node_id": "cms_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Unsafe output",
        "Human review delay",
        "Publish API failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Content generation service, guardrails, approval workflow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_035_ai_image_video_generation",
    "name": "AI Image/Video Generation",
    "category": "AI Product",
    "product_type": "Creative AI",
    "description": "Reusable backend architecture template for ai image/video generation.",
    "core_flow": [
      "Creative Brief",
      "Asset Prompt",
      "Generation API",
      "Moderation",
      "Storage",
      "Gallery"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Prompt Template",
        "catalog_match": true,
        "node_id": "prompt_template",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Guardrail",
        "catalog_match": true,
        "node_id": "guardrail",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Generation failure",
        "Moderation block",
        "Large file storage cost"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Asset generation adapter, moderation, gallery API",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_036_ai_code_documentation",
    "name": "AI Code Documentation",
    "category": "AI Product",
    "product_type": "DevTool",
    "description": "Reusable backend architecture template for ai code documentation.",
    "core_flow": [
      "Code Upload",
      "Parser",
      "Function Detection",
      "LLM Documentation",
      "Export PDF/Markdown"
    ],
    "recommended_nodes": [
      {
        "name": "File Upload Trigger",
        "catalog_match": false,
        "node_id": "file_upload_trigger",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "File Parser Node",
        "catalog_match": false,
        "node_id": "file_parser_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Large repo timeout",
        "Parser mismatch",
        "Export fail"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Code parser, doc worker, markdown/PDF export",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_037_ai_customer_support_automation",
    "name": "AI Customer Support Automation",
    "category": "AI Product",
    "product_type": "Support AI",
    "description": "Reusable backend architecture template for ai customer support automation.",
    "core_flow": [
      "Ticket",
      "Intent Detection",
      "KB Retrieval",
      "Suggested Reply",
      "Agent Approval"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Vector Search",
        "catalog_match": true,
        "node_id": "vector_search",
        "fallback_type": null
      },
      {
        "name": "Prompt Template",
        "catalog_match": true,
        "node_id": "prompt_template",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Wrong intent",
        "No KB match",
        "Approval delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Ticket classifier, retriever, reply suggestion, approval flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_038_ai_lead_scoring",
    "name": "AI Lead Scoring",
    "category": "AI Product",
    "product_type": "Sales AI",
    "description": "Reusable backend architecture template for ai lead scoring.",
    "core_flow": [
      "Lead Data",
      "Enrichment",
      "Scoring Model",
      "CRM Update",
      "Sales Notification"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "ML Model Node",
        "catalog_match": false,
        "node_id": "ml_model_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "CRM Node",
        "catalog_match": false,
        "node_id": "crm_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Enrichment API quota",
        "Bad score threshold",
        "CRM update failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Lead enrichment, scoring service, CRM sync",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_039_ai_moderation",
    "name": "AI Moderation",
    "category": "AI Product",
    "product_type": "Trust & Safety",
    "description": "Reusable backend architecture template for ai moderation.",
    "core_flow": [
      "User Content",
      "Text/Image/Video Check",
      "Risk Score",
      "Auto Action/Human Review"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Guardrail",
        "catalog_match": true,
        "node_id": "guardrail",
        "fallback_type": null
      },
      {
        "name": "Risk Score Node",
        "catalog_match": false,
        "node_id": "risk_score_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Router",
        "catalog_match": true,
        "node_id": "router",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "False positive",
        "Review backlog",
        "Auto-ban risk"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Moderation service, risk rules, admin review flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_040_ai_workflow_review",
    "name": "AI Workflow Review",
    "category": "AI Product",
    "product_type": "BuildRAX Core",
    "description": "Reusable backend architecture template for ai workflow review.",
    "core_flow": [
      "Workflow Graph",
      "Static Rules",
      "Simulation",
      "AI Explanation",
      "Risk Report"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Simulation mismatch",
        "LLM explanation cost",
        "Report export failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Workflow analyzer, static rules, report generation",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_041_event_tracking_pipeline",
    "name": "Event Tracking Pipeline",
    "category": "Data & Analytics",
    "product_type": "Analytics",
    "description": "Reusable backend architecture template for event tracking pipeline.",
    "core_flow": [
      "Frontend Event",
      "Event Collector",
      "Queue",
      "Processor",
      "Analytics Store",
      "Dashboard"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Event spike",
        "Queue backlog",
        "Data loss risk"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Event collector, processor worker, analytics API",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_042_realtime_dashboard",
    "name": "Realtime Dashboard",
    "category": "Data & Analytics",
    "product_type": "Analytics",
    "description": "Reusable backend architecture template for realtime dashboard.",
    "core_flow": [
      "Data Source",
      "Stream Processor",
      "Metrics Store",
      "WebSocket/API",
      "Dashboard"
    ],
    "recommended_nodes": [
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Stream Processor Node",
        "catalog_match": false,
        "node_id": "stream_processor_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "WebSocket",
        "catalog_match": true,
        "node_id": "websocket",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Stream lag",
        "Dashboard stale data",
        "Metric cardinality"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Stream processor, metrics store, realtime dashboard API",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_043_etl_data_pipeline",
    "name": "ETL Data Pipeline",
    "category": "Data & Analytics",
    "product_type": "Data Pipeline",
    "description": "Reusable backend architecture template for etl data pipeline.",
    "core_flow": [
      "Source DB",
      "Extract",
      "Transform",
      "Validate",
      "Load",
      "Report"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Extraction timeout",
        "Transform error",
        "Load failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "ETL worker, transform functions, data validation report",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_044_customer_segmentation",
    "name": "Customer Segmentation",
    "category": "Data & Analytics",
    "product_type": "Marketing Data",
    "description": "Reusable backend architecture template for customer segmentation.",
    "core_flow": [
      "User Events",
      "Feature Builder",
      "Segmentation Rules",
      "Segment Store",
      "Campaign Export"
    ],
    "recommended_nodes": [
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Segment drift",
        "Event delay",
        "Export failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Feature builder, segment rules, campaign export",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_045_funnel_analytics",
    "name": "Funnel Analytics",
    "category": "Data & Analytics",
    "product_type": "Product Analytics",
    "description": "Reusable backend architecture template for funnel analytics.",
    "core_flow": [
      "Event Stream",
      "Funnel Steps",
      "Drop-Off Calculation",
      "Dashboard",
      "Alert"
    ],
    "recommended_nodes": [
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Missing events",
        "Wrong step order",
        "Alert noise"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Funnel processor, metrics API, alert rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_046_revenue_analytics",
    "name": "Revenue Analytics",
    "category": "Data & Analytics",
    "product_type": "Finance Analytics",
    "description": "Reusable backend architecture template for revenue analytics.",
    "core_flow": [
      "Payments",
      "Orders",
      "Refunds",
      "Revenue Metrics",
      "Cohort Dashboard"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Refund mismatch",
        "Payment webhook delay",
        "Cohort query slow"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Revenue pipeline, metrics dashboard, export report",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_047_anomaly_detection",
    "name": "Anomaly Detection",
    "category": "Data & Analytics",
    "product_type": "Monitoring",
    "description": "Reusable backend architecture template for anomaly detection.",
    "core_flow": [
      "Metrics Stream",
      "Baseline Model",
      "Deviation Detection",
      "Alert",
      "Incident Log"
    ],
    "recommended_nodes": [
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "ML Model Node",
        "catalog_match": false,
        "node_id": "ml_model_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "False alert",
        "Delayed detection",
        "Baseline drift"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Anomaly worker, baseline config, incident log",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_048_data_warehouse_sync",
    "name": "Data Warehouse Sync",
    "category": "Data & Analytics",
    "product_type": "BI",
    "description": "Reusable backend architecture template for data warehouse sync.",
    "core_flow": [
      "Operational DB",
      "Batch Sync",
      "Warehouse",
      "Transformation",
      "BI Dashboard"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Batch Job",
        "catalog_match": false,
        "node_id": "batch_job",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Batch failure",
        "Replication lag",
        "Warehouse query cost"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Sync worker, mapping layer, warehouse loader",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_049_report_generation",
    "name": "Report Generation",
    "category": "Data & Analytics",
    "product_type": "Reporting",
    "description": "Reusable backend architecture template for report generation.",
    "core_flow": [
      "Report Request",
      "Query Builder",
      "Data Fetch",
      "PDF/CSV Export",
      "Email Delivery"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Large export timeout",
        "Slow query",
        "Email delivery failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Report API, export worker, signed URL, email delivery",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_050_attribution_tracking",
    "name": "Attribution Tracking",
    "category": "Data & Analytics",
    "product_type": "Marketing",
    "description": "Reusable backend architecture template for attribution tracking.",
    "core_flow": [
      "UTM Click",
      "Session Store",
      "Conversion Event",
      "Attribution Rule",
      "Campaign Report"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Cookie/session loss",
        "Attribution conflict",
        "Conversion delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Click tracker, attribution rules, campaign report",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_051_digital_wallet",
    "name": "Digital Wallet",
    "category": "Fintech & Payments",
    "product_type": "Fintech",
    "description": "Reusable backend architecture template for digital wallet.",
    "core_flow": [
      "Add Money",
      "Payment Gateway",
      "Wallet Credit",
      "Ledger Entry",
      "Notification"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      },
      {
        "name": "Wallet",
        "catalog_match": true,
        "node_id": "wallet",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Duplicate credit",
        "Payment pending",
        "Ledger mismatch"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Wallet service, ledger, payment webhook, idempotency tests",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_052_escrow_payment",
    "name": "Escrow Payment",
    "category": "Fintech & Payments",
    "product_type": "Marketplace Payments",
    "description": "Reusable backend architecture template for escrow payment.",
    "core_flow": [
      "Buyer Payment",
      "Escrow Hold",
      "Milestone Approval",
      "Release/Refund",
      "Ledger"
    ],
    "recommended_nodes": [
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      },
      {
        "name": "Refund Node",
        "catalog_match": false,
        "node_id": "refund_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Release dispute",
        "Refund failure",
        "Ledger mismatch"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Escrow service, milestone states, ledger model",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_053_subscription_renewal",
    "name": "Subscription Renewal",
    "category": "Fintech & Payments",
    "product_type": "SaaS Billing",
    "description": "Reusable backend architecture template for subscription renewal.",
    "core_flow": [
      "Renewal Cron",
      "Payment Attempt",
      "Success/Failure",
      "Grace Period",
      "Access Update"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Subscription",
        "catalog_match": true,
        "node_id": "subscription",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Gateway failure",
        "Grace period abuse",
        "Access mismatch"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Renewal worker, subscription states, notification rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_054_invoice_payment",
    "name": "Invoice Payment",
    "category": "Fintech & Payments",
    "product_type": "B2B Billing",
    "description": "Reusable backend architecture template for invoice payment.",
    "core_flow": [
      "Invoice Created",
      "Payment Link",
      "Payment Webhook",
      "Receipt",
      "Accounting Sync"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Webhook delay",
        "Accounting sync failure",
        "Receipt export fail"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Invoice service, payment link, accounting adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_055_refund_processing",
    "name": "Refund Processing",
    "category": "Fintech & Payments",
    "product_type": "Payments",
    "description": "Reusable backend architecture template for refund processing.",
    "core_flow": [
      "Refund Request",
      "Eligibility Check",
      "Payment Gateway Refund",
      "Ledger Update"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Duplicate refund",
        "Gateway timeout",
        "Eligibility error"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Refund service, eligibility rules, ledger update",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_056_fraud_detection_payment",
    "name": "Fraud Detection Payment",
    "category": "Fintech & Payments",
    "product_type": "Risk",
    "description": "Reusable backend architecture template for fraud detection payment.",
    "core_flow": [
      "Payment Attempt",
      "Risk Score",
      "Approve/Review/Reject",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Fraud Check Node",
        "catalog_match": false,
        "node_id": "fraud_check_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Router",
        "catalog_match": true,
        "node_id": "router",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Risk API failure",
        "False positive",
        "Review backlog"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Fraud scoring adapter, decision rules, review flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_057_kyc_verification",
    "name": "KYC Verification",
    "category": "Fintech & Payments",
    "product_type": "Compliance",
    "description": "Reusable backend architecture template for kyc verification.",
    "core_flow": [
      "User Data",
      "Document Upload",
      "KYC Provider",
      "Result Webhook",
      "Account Status"
    ],
    "recommended_nodes": [
      {
        "name": "File Upload Trigger",
        "catalog_match": false,
        "node_id": "file_upload_trigger",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Provider delay",
        "Document rejection",
        "Webhook duplicate"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "KYC service, provider adapter, account status flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_058_payout_management",
    "name": "Payout Management",
    "category": "Fintech & Payments",
    "product_type": "Marketplace Payments",
    "description": "Reusable backend architecture template for payout management.",
    "core_flow": [
      "Earnings Calculation",
      "Payout Batch",
      "Bank Transfer",
      "Status Webhook",
      "Ledger"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Batch Job",
        "catalog_match": false,
        "node_id": "batch_job",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Bank failure",
        "Payout mismatch",
        "Batch retry"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Payout worker, batch ledger, status webhook",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_059_credit_based_usage_billing",
    "name": "Credit-Based Usage Billing",
    "category": "Fintech & Payments",
    "product_type": "Usage Billing",
    "description": "Reusable backend architecture template for credit-based usage billing.",
    "core_flow": [
      "User Action",
      "Credit Reserve",
      "Action Execute",
      "Credit Consume",
      "Usage Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Credit Meter",
        "catalog_match": true,
        "node_id": "credit_meter",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Database Transaction",
        "catalog_match": true,
        "node_id": "database_transaction",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Insufficient credits",
        "Worker failed after reserve",
        "Double consume"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Credit meter, usage ledger, refund handling",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_060_financial_reconciliation",
    "name": "Financial Reconciliation",
    "category": "Fintech & Payments",
    "product_type": "Finance Ops",
    "description": "Reusable backend architecture template for financial reconciliation.",
    "core_flow": [
      "Payment Records",
      "Gateway Settlement",
      "Internal Ledger",
      "Mismatch Detection"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Mismatch spike",
        "Gateway report delay",
        "Slow reconciliation"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Reconciliation worker, mismatch report, alert rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_061_admin_dashboard",
    "name": "Admin Dashboard",
    "category": "Internal Tools",
    "product_type": "Admin",
    "description": "Reusable backend architecture template for admin dashboard.",
    "core_flow": [
      "Admin Login",
      "RBAC",
      "Data Fetch",
      "Action Panel",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Auth Node",
        "catalog_match": true,
        "node_id": "auth_node",
        "fallback_type": null
      },
      {
        "name": "RBAC Permission Check",
        "catalog_match": true,
        "node_id": "rbac_permission_check",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Permission leak",
        "Slow admin query",
        "Unaudited action"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Admin APIs, permission guards, audit service",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_062_user_management_admin",
    "name": "User Management Admin",
    "category": "Internal Tools",
    "product_type": "Admin",
    "description": "Reusable backend architecture template for user management admin.",
    "core_flow": [
      "Search User",
      "View Profile",
      "Update Status",
      "Notify User",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Search Query Node",
        "catalog_match": false,
        "node_id": "search_query_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Wrong user update",
        "Search slow",
        "Notification failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "User admin module, status update, audit",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_063_content_moderation_dashboard",
    "name": "Content Moderation Dashboard",
    "category": "Internal Tools",
    "product_type": "Trust & Safety",
    "description": "Reusable backend architecture template for content moderation dashboard.",
    "core_flow": [
      "Flagged Content",
      "Moderator Review",
      "Decision",
      "User Action",
      "Audit Trail"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Reviewer backlog",
        "Evidence missing",
        "Wrong enforcement"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Moderation dashboard APIs, decision workflow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_064_support_operations_dashboard",
    "name": "Support Operations Dashboard",
    "category": "Internal Tools",
    "product_type": "Support Ops",
    "description": "Reusable backend architecture template for support operations dashboard.",
    "core_flow": [
      "Ticket Queue",
      "Assignment",
      "SLA Monitor",
      "Resolution",
      "Feedback"
    ],
    "recommended_nodes": [
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "SLA breach",
        "Assignment overload",
        "Feedback missing"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Support queue, SLA monitor, resolution flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_065_approval_management",
    "name": "Approval Management",
    "category": "Internal Tools",
    "product_type": "Workflow",
    "description": "Reusable backend architecture template for approval management.",
    "core_flow": [
      "Request Created",
      "Manager Approval",
      "Finance Approval",
      "Final Action"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Approval stuck",
        "Unauthorized approval",
        "Final action failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Approval workflow, role-based approvals, reminders",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_066_inventory_management",
    "name": "Inventory Management",
    "category": "Internal Tools",
    "product_type": "Operations",
    "description": "Reusable backend architecture template for inventory management.",
    "core_flow": [
      "Stock Update",
      "Threshold Check",
      "Reorder Alert",
      "Vendor Request"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Stock mismatch",
        "False reorder",
        "Vendor API failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Inventory service, reorder rules, vendor adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_067_logistics_tracking",
    "name": "Logistics Tracking",
    "category": "Internal Tools",
    "product_type": "Logistics",
    "description": "Reusable backend architecture template for logistics tracking.",
    "core_flow": [
      "Order",
      "Shipment Created",
      "Tracking Updates",
      "Delivery Status",
      "Notification"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Tracking delay",
        "Carrier API failure",
        "Wrong status"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Shipment service, carrier webhook, tracking API",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_068_hrms_leave_approval",
    "name": "HRMS Leave Approval",
    "category": "Internal Tools",
    "product_type": "HRTech",
    "description": "Reusable backend architecture template for hrms leave approval.",
    "core_flow": [
      "Leave Request",
      "Policy Check",
      "Manager Approval",
      "Calendar Update",
      "Notification"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Calendar Node",
        "catalog_match": false,
        "node_id": "calendar_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Policy conflict",
        "Calendar sync fail",
        "Approval delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Leave module, policy rules, calendar adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_069_incident_management",
    "name": "Incident Management",
    "category": "Internal Tools",
    "product_type": "SRE",
    "description": "Reusable backend architecture template for incident management.",
    "core_flow": [
      "Alert Trigger",
      "Incident Created",
      "On-Call Notify",
      "Resolution Log",
      "Postmortem"
    ],
    "recommended_nodes": [
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Notification missed",
        "Incident duplicate",
        "Postmortem not generated"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Incident service, escalation rules, postmortem export",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_070_compliance_reporting",
    "name": "Compliance Reporting",
    "category": "Internal Tools",
    "product_type": "Compliance",
    "description": "Reusable backend architecture template for compliance reporting.",
    "core_flow": [
      "Data Collection",
      "Policy Check",
      "Evidence Store",
      "Report Export",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Evidence missing",
        "Policy check fail",
        "Report export delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Compliance worker, evidence store, report package",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_071_api_documentation_generator",
    "name": "API Documentation Generator",
    "category": "Developer Tools",
    "product_type": "DevTool",
    "description": "Reusable backend architecture template for api documentation generator.",
    "core_flow": [
      "Code/API Input",
      "Endpoint Parser",
      "Schema Extractor",
      "OpenAPI",
      "Docs Export"
    ],
    "recommended_nodes": [
      {
        "name": "File Upload Trigger",
        "catalog_match": false,
        "node_id": "file_upload_trigger",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "File Parser Node",
        "catalog_match": false,
        "node_id": "file_parser_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Parser failure",
        "Incomplete schemas",
        "Large repo timeout"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Parser service, OpenAPI exporter, docs generator",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_072_backend_scaffold_generator",
    "name": "Backend Scaffold Generator",
    "category": "Developer Tools",
    "product_type": "DevTool",
    "description": "Reusable backend architecture template for backend scaffold generator.",
    "core_flow": [
      "Workflow Graph",
      "Services",
      "Routes",
      "DTOs",
      "Tests",
      "Docker Export"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Large graph export",
        "Unsupported node",
        "Zip upload fail"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Scaffold exporter, code templates, zip packaging",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_073_ci_cd_pipeline",
    "name": "CI/CD Pipeline",
    "category": "Developer Tools",
    "product_type": "DevOps",
    "description": "Reusable backend architecture template for ci/cd pipeline.",
    "core_flow": [
      "Git Push",
      "Build",
      "Test",
      "Security Scan",
      "Deploy",
      "Rollback"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rollback Node",
        "catalog_match": false,
        "node_id": "rollback_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Build failure",
        "Test failure",
        "Deployment rollback"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "CI workflow config, deploy worker, rollback script",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_074_feature_flag_system",
    "name": "Feature Flag System",
    "category": "Developer Tools",
    "product_type": "SaaS Infra",
    "description": "Reusable backend architecture template for feature flag system.",
    "core_flow": [
      "Feature Created",
      "Segment Rules",
      "Runtime Check",
      "Rollout",
      "Metrics"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Cache",
        "catalog_match": false,
        "node_id": "cache",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Stale config",
        "Bad rollout",
        "Metric missing"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Feature flag service, runtime SDK stub, rollout rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_075_api_load_testing",
    "name": "API Load Testing",
    "category": "Developer Tools",
    "product_type": "Performance",
    "description": "Reusable backend architecture template for api load testing.",
    "core_flow": [
      "Endpoint Config",
      "Load Scenario",
      "k6 Test",
      "Metrics",
      "Bottleneck Report"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Target timeout",
        "Worker saturation",
        "Report generation failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "k6 script export, load test runner, bottleneck report",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_076_webhook_testing",
    "name": "Webhook Testing",
    "category": "Developer Tools",
    "product_type": "API Tooling",
    "description": "Reusable backend architecture template for webhook testing.",
    "core_flow": [
      "Webhook Event",
      "Signature Check",
      "Retry",
      "Delivery Log",
      "Failure Alert"
    ],
    "recommended_nodes": [
      {
        "name": "Webhook Trigger",
        "catalog_match": true,
        "node_id": "webhook_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Retry Handler",
        "catalog_match": true,
        "node_id": "retry_handler",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Invalid signature",
        "Retry exhaustion",
        "Delivery failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Webhook tester, signature validation, delivery log",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_077_error_monitoring",
    "name": "Error Monitoring",
    "category": "Developer Tools",
    "product_type": "Observability",
    "description": "Reusable backend architecture template for error monitoring.",
    "core_flow": [
      "App Error",
      "Error Collector",
      "Grouping",
      "Alert",
      "Issue Creation"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Logger",
        "catalog_match": true,
        "node_id": "logger",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "Ticketing Node",
        "catalog_match": false,
        "node_id": "ticketing_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Error spike",
        "Alert noise",
        "Issue API failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Error collector, grouping logic, alert rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_078_secret_management",
    "name": "Secret Management",
    "category": "Developer Tools",
    "product_type": "Security",
    "description": "Reusable backend architecture template for secret management.",
    "core_flow": [
      "Secret Created",
      "Encrypted Store",
      "Runtime Fetch",
      "Rotation",
      "Audit Log"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Secrets Manager",
        "catalog_match": true,
        "node_id": "secrets_manager",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Secret leak",
        "Rotation failure",
        "Access without audit"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Secret store, rotation worker, access audit",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_079_multi_environment_config",
    "name": "Multi-Environment Config",
    "category": "Developer Tools",
    "product_type": "DevOps",
    "description": "Reusable backend architecture template for multi-environment config.",
    "core_flow": [
      "Dev/Staging/Prod Config",
      "Validation",
      "Runtime Injection",
      "Audit"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Config Store Node",
        "catalog_match": false,
        "node_id": "config_store_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Secrets Manager",
        "catalog_match": true,
        "node_id": "secrets_manager",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Wrong env config",
        "Missing variable",
        "Unauthorized config change"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Config service, env validation, audit trail",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_080_developer_api_key_management",
    "name": "Developer API Key Management",
    "category": "Developer Tools",
    "product_type": "API Platform",
    "description": "Reusable backend architecture template for developer api key management.",
    "core_flow": [
      "Create API Key",
      "Scope Assignment",
      "Usage Tracking",
      "Rate Limit",
      "Revoke"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "API Key Auth",
        "catalog_match": true,
        "node_id": "api_key_auth",
        "fallback_type": null
      },
      {
        "name": "Rate Limiter",
        "catalog_match": true,
        "node_id": "rate_limiter",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Key abuse",
        "Scope mismatch",
        "Usage overage"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "API key service, scopes, usage metering",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_081_creator_campaign_platform",
    "name": "Creator Campaign Platform",
    "category": "Creator & Media",
    "product_type": "Creator Economy",
    "description": "Reusable backend architecture template for creator campaign platform.",
    "core_flow": [
      "Brand Brief",
      "Creator Match",
      "Campaign Contract",
      "Content Upload",
      "Approval",
      "Payment"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Similarity Match Node",
        "catalog_match": false,
        "node_id": "similarity_match_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Creator mismatch",
        "Content upload fail",
        "Payment release dispute"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Campaign service, creator matching, approval/payment workflow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_082_ai_ugc_campaign",
    "name": "AI-UGC Campaign",
    "category": "Creator & Media",
    "product_type": "AI Creative",
    "description": "Reusable backend architecture template for ai-ugc campaign.",
    "core_flow": [
      "Brand Goal",
      "Persona Selection",
      "Script",
      "Video Generation",
      "Review",
      "Publish"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Prompt Template",
        "catalog_match": true,
        "node_id": "prompt_template",
        "fallback_type": null
      },
      {
        "name": "LLM Call",
        "catalog_match": true,
        "node_id": "llm_call",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "CMS Node",
        "catalog_match": false,
        "node_id": "cms_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Generation failure",
        "Unsafe script",
        "Publish fail"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "AI-UGC generation pipeline, approval flow, publish adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_083_video_upload_processing",
    "name": "Video Upload & Processing",
    "category": "Creator & Media",
    "product_type": "Media Platform",
    "description": "Reusable backend architecture template for video upload & processing.",
    "core_flow": [
      "Video Upload",
      "Transcode",
      "Thumbnail",
      "Moderation",
      "CDN",
      "Publish"
    ],
    "recommended_nodes": [
      {
        "name": "File Upload Trigger",
        "catalog_match": false,
        "node_id": "file_upload_trigger",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Guardrail",
        "catalog_match": true,
        "node_id": "guardrail",
        "fallback_type": null
      },
      {
        "name": "CDN Node",
        "catalog_match": false,
        "node_id": "cdn_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Transcode backlog",
        "Moderation block",
        "CDN delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Video upload service, processing worker, media pipeline",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_084_live_streaming",
    "name": "Live Streaming",
    "category": "Creator & Media",
    "product_type": "Realtime Media",
    "description": "Reusable backend architecture template for live streaming.",
    "core_flow": [
      "Streamer Starts",
      "Stream Session",
      "Moderation",
      "Viewer Events",
      "Gifts",
      "Payout"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "WebSocket",
        "catalog_match": true,
        "node_id": "websocket",
        "fallback_type": null
      },
      {
        "name": "Guardrail",
        "catalog_match": true,
        "node_id": "guardrail",
        "fallback_type": null
      },
      {
        "name": "Wallet",
        "catalog_match": true,
        "node_id": "wallet",
        "fallback_type": null
      },
      {
        "name": "Payout Node",
        "catalog_match": false,
        "node_id": "payout_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Stream provider fail",
        "Moderation delay",
        "Gift payout mismatch"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Stream session service, viewer events, gift ledger",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_085_content_scheduling",
    "name": "Content Scheduling",
    "category": "Creator & Media",
    "product_type": "Content Ops",
    "description": "Reusable backend architecture template for content scheduling.",
    "core_flow": [
      "Content Draft",
      "Approval",
      "Schedule",
      "Publish API",
      "Analytics"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Publish API rate limit",
        "Missed schedule",
        "Approval delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Scheduler, approval workflow, platform publisher",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_086_influencer_payout",
    "name": "Influencer Payout",
    "category": "Creator & Media",
    "product_type": "Creator Payments",
    "description": "Reusable backend architecture template for influencer payout.",
    "core_flow": [
      "Campaign Metrics",
      "Earnings Calculation",
      "Approval",
      "Payout",
      "Tax Report"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "Database Read",
        "catalog_match": true,
        "node_id": "database_read",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Payout Node",
        "catalog_match": false,
        "node_id": "payout_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Wrong calculation",
        "Approval delay",
        "Payout fail"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Earnings worker, payout service, tax report export",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_087_campaign_analytics",
    "name": "Campaign Analytics",
    "category": "Creator & Media",
    "product_type": "Marketing Analytics",
    "description": "Reusable backend architecture template for campaign analytics.",
    "core_flow": [
      "UTM Clicks",
      "Engagement Metrics",
      "Conversion Events",
      "ROI Dashboard"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "UTM loss",
        "Late conversion",
        "Dashboard slow"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Campaign tracker, ROI API, metrics processor",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_088_brand_creator_escrow",
    "name": "Brand-Creator Escrow",
    "category": "Creator & Media",
    "product_type": "Creator Payments",
    "description": "Reusable backend architecture template for brand-creator escrow.",
    "core_flow": [
      "Brand Payment",
      "Escrow",
      "Deliverable Approval",
      "Release/Dispute"
    ],
    "recommended_nodes": [
      {
        "name": "Payment Gateway",
        "catalog_match": true,
        "node_id": "payment_gateway",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      },
      {
        "name": "Refund Node",
        "catalog_match": false,
        "node_id": "refund_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Deliverable dispute",
        "Payment duplicate",
        "Refund request"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Escrow model, deliverable approval, dispute state machine",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_089_lead_routing_automation",
    "name": "Lead Routing Automation",
    "category": "Operations & Automation",
    "product_type": "Sales Ops",
    "description": "Reusable backend architecture template for lead routing automation.",
    "core_flow": [
      "Lead Form",
      "Enrichment",
      "Territory Rule",
      "Sales Assignment",
      "Notification"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Database Write",
        "catalog_match": true,
        "node_id": "database_write",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "CRM Node",
        "catalog_match": false,
        "node_id": "crm_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Enrichment rate limit",
        "Bad territory rule",
        "Sales overload"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Lead router, enrichment adapter, assignment rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_090_email_marketing_automation",
    "name": "Email Marketing Automation",
    "category": "Operations & Automation",
    "product_type": "Marketing Ops",
    "description": "Reusable backend architecture template for email marketing automation.",
    "core_flow": [
      "Segment",
      "Campaign",
      "Email Queue",
      "Delivery",
      "Open/Click Tracking"
    ],
    "recommended_nodes": [
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Queue",
        "catalog_match": true,
        "node_id": "queue",
        "fallback_type": null
      },
      {
        "name": "Worker",
        "catalog_match": true,
        "node_id": "worker",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Email provider limit",
        "Queue backlog",
        "Tracking pixel blocked"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Campaign worker, email adapter, tracking endpoints",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_091_customer_onboarding_automation",
    "name": "Customer Onboarding Automation",
    "category": "Operations & Automation",
    "product_type": "Customer Success",
    "description": "Reusable backend architecture template for customer onboarding automation.",
    "core_flow": [
      "Signup",
      "Checklist",
      "Nudge",
      "Support Trigger",
      "Activation Score"
    ],
    "recommended_nodes": [
      {
        "name": "Event Trigger",
        "catalog_match": true,
        "node_id": "event_trigger",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Ticketing Node",
        "catalog_match": false,
        "node_id": "ticketing_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Nudge spam",
        "Activation score wrong",
        "Support backlog"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Onboarding rules, nudge worker, activation metrics",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_092_churn_prevention",
    "name": "Churn Prevention",
    "category": "Operations & Automation",
    "product_type": "Customer Success",
    "description": "Reusable backend architecture template for churn prevention.",
    "core_flow": [
      "Usage Drop",
      "Risk Score",
      "Retention Campaign",
      "Customer Success Alert"
    ],
    "recommended_nodes": [
      {
        "name": "Event Bus",
        "catalog_match": true,
        "node_id": "event_bus",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "ML Model Node",
        "catalog_match": false,
        "node_id": "ml_model_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "CRM Node",
        "catalog_match": false,
        "node_id": "crm_node",
        "fallback_type": "custom_or_advanced_node"
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "False churn signal",
        "Delayed alert",
        "Campaign fatigue"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Churn scoring worker, retention campaign, CS alert",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_093_vendor_onboarding",
    "name": "Vendor Onboarding",
    "category": "Operations & Automation",
    "product_type": "B2B Ops",
    "description": "Reusable backend architecture template for vendor onboarding.",
    "core_flow": [
      "Vendor Signup",
      "Document Upload",
      "Verification",
      "Approval",
      "Listing Active"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Object Storage",
        "catalog_match": true,
        "node_id": "object_storage",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Notification",
        "catalog_match": true,
        "node_id": "notification",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Document rejection",
        "Verification delay",
        "Unauthorized approval"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Vendor onboarding, document verification, approval flow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_094_procurement_approval",
    "name": "Procurement Approval",
    "category": "Operations & Automation",
    "product_type": "Procurement",
    "description": "Reusable backend architecture template for procurement approval.",
    "core_flow": [
      "Purchase Request",
      "Budget Check",
      "Manager Approval",
      "Vendor PO"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Approval Node",
        "catalog_match": false,
        "node_id": "approval_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Budget mismatch",
        "Approval delay",
        "PO API failure"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Procurement request, budget rules, approval chain",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_095_policy_violation_detection",
    "name": "Policy Violation Detection",
    "category": "Operations & Automation",
    "product_type": "Trust & Safety",
    "description": "Reusable backend architecture template for policy violation detection.",
    "core_flow": [
      "User Action",
      "Rule Check",
      "Risk Score",
      "Warning/Suspension",
      "Audit"
    ],
    "recommended_nodes": [
      {
        "name": "Event Trigger",
        "catalog_match": true,
        "node_id": "event_trigger",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Risk Score Node",
        "catalog_match": false,
        "node_id": "risk_score_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Router",
        "catalog_match": true,
        "node_id": "router",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "False positive",
        "Auto-suspend risk",
        "Audit missing"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Policy rules, risk scoring, enforcement workflow",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_096_bot_detection",
    "name": "Bot Detection",
    "category": "Operations & Automation",
    "product_type": "Security",
    "description": "Reusable backend architecture template for bot detection.",
    "core_flow": [
      "Traffic Event",
      "Feature Extraction",
      "Classifier",
      "Risk Score",
      "Block/Allow"
    ],
    "recommended_nodes": [
      {
        "name": "HTTP Trigger",
        "catalog_match": true,
        "node_id": "http_trigger",
        "fallback_type": null
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "ML Model Node",
        "catalog_match": false,
        "node_id": "ml_model_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Router",
        "catalog_match": true,
        "node_id": "router",
        "fallback_type": null
      },
      {
        "name": "Logger",
        "catalog_match": true,
        "node_id": "logger",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Bot spike",
        "Classifier drift",
        "False block"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Traffic feature extractor, classifier service, block rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_097_campaign_launch_management",
    "name": "Campaign Launch Management",
    "category": "Operations & Automation",
    "product_type": "AdTech",
    "description": "Reusable backend architecture template for campaign launch management.",
    "core_flow": [
      "Campaign Input",
      "Keyword Check",
      "Policy Check",
      "Budget Setup",
      "Launch",
      "Monitor"
    ],
    "recommended_nodes": [
      {
        "name": "REST API Endpoint",
        "catalog_match": true,
        "node_id": "rest_api_endpoint",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Policy rejection",
        "Budget API fail",
        "Launch delay"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Campaign launcher, policy checks, ad platform adapter",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_098_ad_revenue_monitoring",
    "name": "Ad Revenue Monitoring",
    "category": "Operations & Automation",
    "product_type": "AdTech",
    "description": "Reusable backend architecture template for ad revenue monitoring.",
    "core_flow": [
      "Ad Spend",
      "Revenue Fetch",
      "ROAS Calculation",
      "Alert",
      "Optimization Action"
    ],
    "recommended_nodes": [
      {
        "name": "Cron Trigger",
        "catalog_match": true,
        "node_id": "cron_trigger",
        "fallback_type": null
      },
      {
        "name": "External API Node",
        "catalog_match": false,
        "node_id": "external_api_node",
        "fallback_type": "custom_or_advanced_node"
      },
      {
        "name": "Mapper",
        "catalog_match": true,
        "node_id": "mapper",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "Admin Action",
        "catalog_match": true,
        "node_id": "admin_action",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "API quota",
        "Wrong ROAS",
        "False optimization"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Revenue fetcher, ROAS calculator, alert/action rules",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_099_data_quality_monitoring",
    "name": "Data Quality Monitoring",
    "category": "Operations & Automation",
    "product_type": "Data Ops",
    "description": "Reusable backend architecture template for data quality monitoring.",
    "core_flow": [
      "Data Ingest",
      "Validation Rules",
      "Error Report",
      "Alert",
      "Retry"
    ],
    "recommended_nodes": [
      {
        "name": "Event Trigger",
        "catalog_match": true,
        "node_id": "event_trigger",
        "fallback_type": null
      },
      {
        "name": "Request Validator",
        "catalog_match": true,
        "node_id": "request_validator",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "Retry Handler",
        "catalog_match": true,
        "node_id": "retry_handler",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Schema drift",
        "High invalid records",
        "Retry exhaustion"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Data quality checks, error reports, retry policy",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  },
  {
    "id": "tpl_100_system_health_monitoring",
    "name": "System Health Monitoring",
    "category": "Operations & Automation",
    "product_type": "SRE",
    "description": "Reusable backend architecture template for system health monitoring.",
    "core_flow": [
      "Service Metrics",
      "Threshold Rules",
      "Alert",
      "Incident",
      "Resolution Report"
    ],
    "recommended_nodes": [
      {
        "name": "Metrics",
        "catalog_match": true,
        "node_id": "metrics",
        "fallback_type": null
      },
      {
        "name": "Rule Engine",
        "catalog_match": true,
        "node_id": "rule_engine",
        "fallback_type": null
      },
      {
        "name": "Alert",
        "catalog_match": true,
        "node_id": "alert",
        "fallback_type": null
      },
      {
        "name": "State Machine",
        "catalog_match": true,
        "node_id": "state_machine",
        "fallback_type": null
      },
      {
        "name": "Report Export",
        "catalog_match": true,
        "node_id": "report_export",
        "fallback_type": null
      },
      {
        "name": "Audit Log",
        "catalog_match": true,
        "node_id": "audit_log",
        "fallback_type": null
      }
    ],
    "simulation_profile": {
      "traffic_inputs_to_configure": [
        "requests_per_minute",
        "peak_multiplier",
        "duration_minutes",
        "concurrency",
        "failure_injection"
      ],
      "default_scenarios": [
        "Alert fatigue",
        "Incident duplicate",
        "Metric missing"
      ],
      "key_metrics": [
        "workflow_success_rate",
        "workflow_failure_rate",
        "avg_latency_ms",
        "p95_latency_ms",
        "bottleneck_node",
        "estimated_cost_usd",
        "queue_depth_if_any",
        "rejected_requests",
        "risk_score"
      ]
    },
    "validation_checks": [
      "required_entry_trigger_exists",
      "all_required_node_configs_present",
      "port_contracts_are_compatible",
      "auth_and_permission_layers_present_when_needed",
      "side_effect_nodes_have_idempotency",
      "async_or_retry_strategy_present_for_slow_dependencies",
      "audit_logs_present_for_sensitive_actions"
    ],
    "engineering_exports": {
      "summary": "Health monitor, incident workflow, resolution report",
      "folders": [
        "01-architecture",
        "02-api-contracts",
        "03-backend-scaffold",
        "04-infrastructure",
        "05-testing",
        "06-reports"
      ],
      "files": [
        "architecture.md",
        "system-diagram.mmd",
        "buildrax.workflow.json",
        "node-contracts.json",
        "openapi.yaml",
        "postman_collection.json",
        "README.md",
        ".env.example",
        "docker-compose.yml",
        "k6-load-test.js",
        "simulation-report.md",
        "risk-report.md",
        "monitoring-checklist.md"
      ]
    },
    "engineering_takeaway": [
      "What services/routes/workers need to be built",
      "What contracts each component must follow",
      "Where latency, cost, security, or failure risks exist",
      "What tests and load checks should be created first"
    ]
  }
] as const;

export const BUILD_RAX_RECOMMENDED_MVP = {
  "launch_nodes_count": 50,
  "launch_templates_count": 25,
  "mvp_template_ids": [
    "tpl_001_user_authentication_saas",
    "tpl_002_multi_tenant_saas_workspace",
    "tpl_003_subscription_billing_saas",
    "tpl_004_usage_based_credits_saas",
    "tpl_005_team_collaboration_saas",
    "tpl_006_project_management_saas",
    "tpl_007_crm_lead_management",
    "tpl_008_customer_support_ticketing",
    "tpl_009_document_approval_saas",
    "tpl_010_b2b_reporting_dashboard",
    "tpl_011_consumer_app_onboarding",
    "tpl_012_social_feed_app",
    "tpl_013_chat_app",
    "tpl_014_video_calling_app",
    "tpl_015_dating_app_matchmaking",
    "tpl_016_fitness_tracking_app",
    "tpl_017_learning_app",
    "tpl_018_food_delivery_app",
    "tpl_019_ride_booking_app",
    "tpl_020_push_notification_engagement",
    "tpl_021_two_sided_marketplace",
    "tpl_022_creator_marketplace",
    "tpl_023_freelance_marketplace_with_escrow",
    "tpl_024_service_booking_marketplace",
    "tpl_025_real_estate_listing_marketplace"
  ],
  "notes": [
    "Start with backend-controlled workflow CRUD, node registry, compiler, validation engine, simulation engine, and export engine.",
    "Keep custom nodes declarative through manifests in MVP; do not execute user-uploaded code.",
    "Use worker queues for simulation/export jobs and immutable workflow versions for traceability."
  ]
} as const;
