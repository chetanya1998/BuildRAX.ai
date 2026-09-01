import { createConnector, createDiagram, createNode } from "./factory";
import { diagramSchema, type Diagram } from "./schema";

export type DiagramTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  diagram: Diagram;
};

function template(id: string, name: string, description: string, category: string, nodes: Diagram["nodes"], connectors: Diagram["connectors"]): DiagramTemplate {
  const diagram = createDiagram(name, nodes, connectors);
  diagram.id = `template-${id}`;
  diagram.assumptions = [
    { id: `${id}-scale`, type: "scale", text: "Traffic and storage estimates should be validated before implementation.", confidence: 0.72, affectedObjects: nodes.map((node) => node.id), edited: false },
  ];
  return { id, name, description, category, diagram: diagramSchema.parse(diagram) };
}

export const templates: DiagramTemplate[] = [
  template(
    "multi-tenant-saas",
    "Multi-tenant SaaS",
    "Secure tenant-aware web application with asynchronous work.",
    "Product",
    [
      createNode("browser", "saas-browser", "Customer browser", 40, 160),
      createNode("api-gateway", "saas-gateway", "API gateway", 340, 160),
      createNode("backend-service", "saas-service", "Tenant service", 640, 80),
      createNode("relational-database", "saas-db", "Tenant database", 940, 40),
      createNode("queue", "saas-queue", "Job queue", 640, 280),
      createNode("identity-provider", "saas-idp", "Identity provider", 340, 360),
    ],
    [
      createConnector("s1", "saas-browser", "saas-gateway", "http-rest", "HTTPS"),
      createConnector("s2", "saas-gateway", "saas-service", "http-rest", "Authenticated API"),
      createConnector("s3", "saas-service", "saas-db", "database-read-write", "Tenant-scoped SQL"),
      createConnector("s4", "saas-service", "saas-queue", "async-message", "Background jobs"),
      createConnector("s5", "saas-browser", "saas-idp", "http-rest", "OIDC"),
    ],
  ),
  template(
    "ai-rag",
    "AI / RAG system",
    "Retrieval-augmented generation with source-aware answers.",
    "AI",
    [
      createNode("frontend-app", "rag-ui", "AI workspace", 40, 160),
      createNode("backend-service", "rag-api", "Orchestrator API", 330, 160),
      createNode("retrieval-service", "rag-retrieval", "Retrieval service", 620, 40),
      createNode("vector-database", "rag-vector", "Vector index", 920, 40),
      createNode("hosted-llm", "rag-llm", "Hosted LLM", 620, 280),
      createNode("object-storage", "rag-store", "Source documents", 920, 280),
    ],
    [
      createConnector("r1", "rag-ui", "rag-api", "http-rest", "Question"),
      createConnector("r2", "rag-api", "rag-retrieval", "tool-call", "Retrieve context"),
      createConnector("r3", "rag-retrieval", "rag-vector", "vector-retrieval", "Similarity search"),
      createConnector("r4", "rag-api", "rag-llm", "model-inference", "Grounded prompt"),
      createConnector("r5", "rag-retrieval", "rag-store", "object-transfer", "Source content"),
    ],
  ),
  template(
    "ecommerce",
    "Ecommerce backend",
    "Transactional commerce with inventory and order events.",
    "Commerce",
    [
      createNode("mobile-app", "shop-client", "Storefront", 40, 160),
      createNode("api-gateway", "shop-api", "Commerce API", 330, 160),
      createNode("microservice", "shop-orders", "Order service", 620, 40),
      createNode("microservice", "shop-stock", "Inventory service", 620, 280),
      createNode("relational-database", "shop-db", "Commerce database", 920, 40),
      createNode("event-broker", "shop-events", "Order events", 920, 280),
    ],
    [
      createConnector("e1", "shop-client", "shop-api", "http-rest", "Checkout"),
      createConnector("e2", "shop-api", "shop-orders", "http-rest", "Create order"),
      createConnector("e3", "shop-api", "shop-stock", "grpc", "Reserve stock"),
      createConnector("e4", "shop-orders", "shop-db", "database-read-write", "Orders"),
      createConnector("e5", "shop-orders", "shop-events", "pub-sub", "Order placed"),
    ],
  ),
  template("event-driven", "Event-driven system", "Loosely coupled event producers and consumers.", "Platform", [
    createNode("api-gateway", "evt-api", "Event API", 40, 160),
    createNode("event-broker", "evt-broker", "Event broker", 350, 160),
    createNode("microservice", "evt-worker-a", "Billing consumer", 680, 40),
    createNode("microservice", "evt-worker-b", "Notification consumer", 680, 280),
    createNode("observability", "evt-obs", "Event observability", 980, 160),
  ], [
    createConnector("v1", "evt-api", "evt-broker", "pub-sub", "Domain events"),
    createConnector("v2", "evt-broker", "evt-worker-a", "async-message", "Billing events"),
    createConnector("v3", "evt-broker", "evt-worker-b", "async-message", "Notification events"),
    createConnector("v4", "evt-broker", "evt-obs", "event-stream", "Telemetry"),
  ]),
  template("realtime", "Realtime collaboration", "Low-latency bidirectional sessions and durable state.", "Realtime", [
    createNode("browser", "rt-client", "Realtime client", 40, 160),
    createNode("load-balancer", "rt-lb", "Connection balancer", 330, 160),
    createNode("backend-service", "rt-sync", "Sync service", 620, 80),
    createNode("cache", "rt-presence", "Presence cache", 920, 20),
    createNode("relational-database", "rt-db", "Document store", 920, 240),
  ], [
    createConnector("t1", "rt-client", "rt-lb", "websocket", "WebSocket"),
    createConnector("t2", "rt-lb", "rt-sync", "websocket", "Session"),
    createConnector("t3", "rt-sync", "rt-presence", "cache", "Presence"),
    createConnector("t4", "rt-sync", "rt-db", "database-read-write", "Snapshots"),
  ]),
  template("data-pipeline", "Data pipeline", "Streaming ingestion, processing and analytical storage.", "Data", [
    createNode("external-client", "data-source", "Event sources", 40, 160),
    createNode("event-stream", "data-stream", "Ingestion stream", 340, 160),
    createNode("serverless-function", "data-process", "Stream processor", 650, 160),
    createNode("object-storage", "data-lake", "Data lake", 950, 40),
    createNode("relational-database", "data-warehouse", "Analytics store", 950, 280),
  ], [
    createConnector("d1", "data-source", "data-stream", "event-stream", "Events"),
    createConnector("d2", "data-stream", "data-process", "event-stream", "Partitions"),
    createConnector("d3", "data-process", "data-lake", "object-transfer", "Raw data"),
    createConnector("d4", "data-process", "data-warehouse", "database-read-write", "Curated data"),
  ]),
  template("microservices", "Microservices starter", "Gateway, services, messaging and shared observability.", "Platform", [
    createNode("api-gateway", "ms-gateway", "API gateway", 40, 160),
    createNode("microservice", "ms-users", "User service", 350, 20),
    createNode("microservice", "ms-core", "Core service", 350, 220),
    createNode("queue", "ms-queue", "Work queue", 660, 220),
    createNode("relational-database", "ms-db", "Service database", 660, 20),
    createNode("observability", "ms-obs", "Observability", 970, 120),
  ], [
    createConnector("m1", "ms-gateway", "ms-users", "http-rest", "Users"),
    createConnector("m2", "ms-gateway", "ms-core", "http-rest", "Core API"),
    createConnector("m3", "ms-users", "ms-db", "database-read-write", "Profiles"),
    createConnector("m4", "ms-core", "ms-queue", "async-message", "Jobs"),
    createConnector("m5", "ms-core", "ms-obs", "event-stream", "Telemetry"),
  ]),
  template("mobile-backend", "Mobile backend", "Mobile API with identity, notifications and resilient storage.", "Mobile", [
    createNode("mobile-app", "mob-app", "Mobile app", 40, 160),
    createNode("identity-provider", "mob-idp", "Identity provider", 330, 20),
    createNode("api-gateway", "mob-api", "Mobile API", 330, 260),
    createNode("backend-service", "mob-service", "Application service", 640, 160),
    createNode("relational-database", "mob-db", "Application database", 950, 40),
    createNode("queue", "mob-jobs", "Notification jobs", 950, 280),
  ], [
    createConnector("b1", "mob-app", "mob-idp", "http-rest", "OIDC"),
    createConnector("b2", "mob-app", "mob-api", "http-rest", "HTTPS"),
    createConnector("b3", "mob-api", "mob-service", "http-rest", "Authenticated API"),
    createConnector("b4", "mob-service", "mob-db", "database-read-write", "Data"),
    createConnector("b5", "mob-service", "mob-jobs", "async-message", "Push jobs"),
  ]),
];

export function getTemplate(id: string | undefined) {
  return templates.find((entry) => entry.id === id);
}
