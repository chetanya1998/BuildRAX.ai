import type { Category } from "./schema";

export type CatalogItem = {
  semanticType: string;
  name: string;
  category: Category;
  shortCode: string;
  description: string;
  defaultProtocols: string[];
};

export const categoryMeta: Record<Category, { label: string; color: string; soft: string }> = {
  client: { label: "Client", color: "#0891b2", soft: "#cffafe" },
  networking: { label: "Networking", color: "#2563eb", soft: "#dbeafe" },
  compute: { label: "Compute", color: "#7c3aed", soft: "#ede9fe" },
  data: { label: "Data", color: "#0f9f75", soft: "#d1fae5" },
  messaging: { label: "Messaging", color: "#b77900", soft: "#fef3c7" },
  ai: { label: "AI / ML", color: "#c026d3", soft: "#fae8ff" },
  security: { label: "Security", color: "#e0442e", soft: "#fee2e2" },
  devops: { label: "DevOps", color: "#596273", soft: "#e5e7eb" },
};

export const nodeCatalog: CatalogItem[] = [
  { semanticType: "user", name: "User", category: "client", shortCode: "US", description: "A person or actor using the system.", defaultProtocols: [] },
  { semanticType: "browser", name: "Web Browser", category: "client", shortCode: "WB", description: "Browser-based client application.", defaultProtocols: ["HTTPS"] },
  { semanticType: "mobile-app", name: "Mobile App", category: "client", shortCode: "MA", description: "Native or cross-platform mobile client.", defaultProtocols: ["HTTPS", "WebSocket"] },
  { semanticType: "external-client", name: "External Client", category: "client", shortCode: "EC", description: "Partner or third-party system client.", defaultProtocols: ["HTTPS"] },
  { semanticType: "dns", name: "DNS", category: "networking", shortCode: "DN", description: "Domain name resolution boundary.", defaultProtocols: ["DNS"] },
  { semanticType: "cdn", name: "CDN", category: "networking", shortCode: "CD", description: "Globally distributed content delivery.", defaultProtocols: ["HTTPS"] },
  { semanticType: "load-balancer", name: "Load Balancer", category: "networking", shortCode: "LB", description: "Distributes traffic across targets.", defaultProtocols: ["HTTPS", "TCP"] },
  { semanticType: "api-gateway", name: "API Gateway", category: "networking", shortCode: "AG", description: "Managed API entry point and policy boundary.", defaultProtocols: ["HTTPS", "REST"] },
  { semanticType: "frontend-app", name: "Frontend App", category: "compute", shortCode: "FE", description: "Web application presentation tier.", defaultProtocols: ["HTTPS"] },
  { semanticType: "backend-service", name: "Backend Service", category: "compute", shortCode: "BE", description: "Core server-side application service.", defaultProtocols: ["REST", "gRPC"] },
  { semanticType: "microservice", name: "Microservice", category: "compute", shortCode: "MS", description: "Independently deployable bounded service.", defaultProtocols: ["REST", "gRPC"] },
  { semanticType: "serverless-function", name: "Serverless Function", category: "compute", shortCode: "FN", description: "Event-driven stateless compute.", defaultProtocols: ["HTTPS", "Events"] },
  { semanticType: "kubernetes-cluster", name: "Kubernetes Cluster", category: "compute", shortCode: "K8", description: "Container orchestration boundary.", defaultProtocols: ["HTTPS", "gRPC"] },
  { semanticType: "relational-database", name: "Relational Database", category: "data", shortCode: "SQL", description: "Transactional relational datastore.", defaultProtocols: ["SQL"] },
  { semanticType: "document-database", name: "Document Database", category: "data", shortCode: "DOC", description: "Document-oriented datastore.", defaultProtocols: ["Wire protocol"] },
  { semanticType: "cache", name: "Cache", category: "data", shortCode: "CA", description: "Low-latency transient data store.", defaultProtocols: ["RESP"] },
  { semanticType: "vector-database", name: "Vector Database", category: "data", shortCode: "VEC", description: "Embedding index and similarity search.", defaultProtocols: ["HTTPS", "gRPC"] },
  { semanticType: "object-storage", name: "Object Storage", category: "data", shortCode: "OBJ", description: "Durable blob and file storage.", defaultProtocols: ["HTTPS"] },
  { semanticType: "queue", name: "Message Queue", category: "messaging", shortCode: "MQ", description: "Buffered asynchronous work handoff.", defaultProtocols: ["AMQP"] },
  { semanticType: "event-broker", name: "Event Broker", category: "messaging", shortCode: "EB", description: "Routes and distributes domain events.", defaultProtocols: ["AMQP", "MQTT"] },
  { semanticType: "pub-sub-topic", name: "Pub/Sub Topic", category: "messaging", shortCode: "PS", description: "Fan-out event publication channel.", defaultProtocols: ["Pub/Sub"] },
  { semanticType: "event-stream", name: "Event Stream", category: "messaging", shortCode: "ES", description: "Ordered durable event log.", defaultProtocols: ["Kafka"] },
  { semanticType: "hosted-llm", name: "Hosted LLM", category: "ai", shortCode: "LLM", description: "Managed language model inference endpoint.", defaultProtocols: ["HTTPS"] },
  { semanticType: "embedding-model", name: "Embedding Model", category: "ai", shortCode: "EM", description: "Converts content to vector representations.", defaultProtocols: ["HTTPS"] },
  { semanticType: "ai-agent", name: "AI Agent", category: "ai", shortCode: "AI", description: "Reasoning workflow using models and tools.", defaultProtocols: ["HTTPS"] },
  { semanticType: "retrieval-service", name: "Retrieval Service", category: "ai", shortCode: "RT", description: "Retrieves and ranks relevant context.", defaultProtocols: ["HTTPS", "gRPC"] },
  { semanticType: "identity-provider", name: "Identity Provider", category: "security", shortCode: "ID", description: "Authentication and identity authority.", defaultProtocols: ["OIDC", "OAuth 2.0"] },
  { semanticType: "secrets-manager", name: "Secrets Manager", category: "security", shortCode: "SM", description: "Protected secrets and key storage.", defaultProtocols: ["HTTPS"] },
  { semanticType: "repository", name: "Source Repository", category: "devops", shortCode: "RE", description: "Version-controlled source and configuration.", defaultProtocols: ["Git"] },
  { semanticType: "observability", name: "Observability", category: "devops", shortCode: "OB", description: "Logs, metrics, traces and alerting.", defaultProtocols: ["OTLP", "HTTPS"] },
];

export const catalogByType = new Map(nodeCatalog.map((item) => [item.semanticType, item]));
