import {
  ScenarioDefinition,
  TemplateBlueprint,
  WorkflowGraph,
  WorkflowNode,
} from "./types";
import { getDefaultNodeData } from "./catalog";

const sectors = [
  "B2B SaaS",
  "B2C",
  "Fintech",
  "D2C",
  "E-Commerce",
  "Payroll",
  "HR",
  "Marketing",
  "Sales Lead Generation",
  "Support / Ops",
] as const;

const blueprintSpecs = [
  {
    useCase: "Customer Support Triage",
    slug: "support-triage",
    tags: ["support", "routing", "classification"],
    connectors: ["slack", "email", "crm"],
  },
  {
    useCase: "Sales Lead Qualification",
    slug: "lead-qualification",
    tags: ["sales", "qualification", "crm"],
    connectors: ["crm", "email"],
  },
  {
    useCase: "Fraud Review and Escalation",
    slug: "fraud-review",
    tags: ["risk", "fraud", "review"],
    connectors: ["payments", "slack"],
  },
  {
    useCase: "Revenue Health Scoring",
    slug: "revenue-health",
    tags: ["revops", "scoring", "forecasting"],
    connectors: ["crm", "warehouse"],
  },
  {
    useCase: "Marketing Campaign Orchestration",
    slug: "campaign-orchestration",
    tags: ["marketing", "campaigns", "content"],
    connectors: ["ads", "email"],
  },
  {
    useCase: "Content QA and Personalization",
    slug: "content-qa",
    tags: ["content", "qa", "personalization"],
    connectors: ["cms", "email"],
  },
  {
    useCase: "Order Exception Handling",
    slug: "order-exception",
    tags: ["orders", "exceptions", "ops"],
    connectors: ["erp", "warehouse"],
  },
  {
    useCase: "Catalog Enrichment Pipeline",
    slug: "catalog-enrichment",
    tags: ["catalog", "enrichment", "ops"],
    connectors: ["cms", "storage"],
  },
  {
    useCase: "Payroll Exception Resolution",
    slug: "payroll-exception",
    tags: ["payroll", "exceptions", "compliance"],
    connectors: ["payroll", "email"],
  },
  {
    useCase: "Candidate Screening Workflow",
    slug: "candidate-screening",
    tags: ["hr", "screening", "review"],
    connectors: ["ats", "calendar"],
  },
] as const;

function createScenario(sector: string, useCase: string): ScenarioDefinition {
  return {
    name: `${sector} ${useCase} Baseline`,
    trafficProfile: "steady",
    dependencyMode: "safe_test",
    failureMode: "latency_spike",
    timeoutMs: 1200,
    queueDepth: 25,
    assertionRules: [
      {
        id: "latency",
        label: "Latency budget",
        kind: "max_latency_ms",
        threshold: 1500,
      },
      {
        id: "contains",
        label: "Output contains workflow status",
        kind: "contains",
        expected: "status",
      },
    ],
  };
}

function createNode(
  id: string,
  type: string,
  x: number,
  y: number,
  data: Record<string, unknown> = {}
): WorkflowNode {
  return {
    id,
    type,
    position: { x, y },
    data: {
      ...getDefaultNodeData(type),
      ...data,
    },
  };
}

function createGraph(sector: string, useCase: string): WorkflowGraph {
  const nodes: WorkflowNode[] = [
    createNode("gateway", "apiGatewayNode", 50, 180, {
      route: `/api/${sector.toLowerCase().replace(/\s+/g, "-")}/${useCase
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
    }),
    createNode("rate", "rateLimiterNode", 260, 180, {
      requestsPerMinute: sector === "B2C" ? 900 : 180,
    }),
    createNode("service", "serviceNode", 480, 180, {
      serviceName: `${useCase.toLowerCase().replace(/\s+/g, "-")}-service`,
    }),
    createNode("mongo", "mongoNode", 720, 90, {
      database: "enterprise_ops",
      collection: "workflow_context",
    }),
    createNode("queue", "queuePublishNode", 720, 280, {
      queueName: `${sector.toLowerCase().replace(/\s+/g, "_")}.${useCase
        .toLowerCase()
        .replace(/\s+/g, "_")}`,
    }),
    createNode("prompt", "promptNode", 980, 90, {
      template: `Design the ${useCase} flow for ${sector}. Use the current request and context to produce a structured orchestration plan with risk scoring, next steps, and escalation guidance.`,
    }),
    createNode("llm", "llmNode", 1210, 90, {
      model: sector === "Fintech" ? "gpt-4o" : "gpt-4.1-mini",
      systemPrompt: `You are designing a production-grade ${sector} ${useCase} workflow.`,
    }),
    createNode("assert", "assertionNode", 1210, 280, {
      contains: "status",
    }),
    createNode("trace", "traceNode", 1450, 180, {
      spanName: `${useCase.toLowerCase().replace(/\s+/g, "_")}_run`,
    }),
    createNode("output", "outputNode", 1690, 180, {
      label: `${useCase} Output`,
    }),
  ];

  const edges = [
    { id: "e1", source: "gateway", target: "rate", animated: true },
    { id: "e2", source: "rate", target: "service", animated: true },
    {
      id: "e3",
      source: "service",
      target: "mongo",
      sourceHandle: "default",
      targetHandle: "default",
      animated: true,
    },
    {
      id: "e4",
      source: "service",
      target: "queue",
      sourceHandle: "default",
      targetHandle: "default",
      animated: true,
    },
    {
      id: "e5",
      source: "mongo",
      target: "prompt",
      sourceHandle: "default",
      targetHandle: "default",
      animated: true,
    },
    {
      id: "e6",
      source: "prompt",
      target: "llm",
      sourceHandle: "prompt",
      targetHandle: "prompt",
      animated: true,
    },
    {
      id: "e7",
      source: "queue",
      target: "assert",
      sourceHandle: "default",
      targetHandle: "default",
      animated: true,
    },
    {
      id: "e8",
      source: "llm",
      target: "trace",
      sourceHandle: "default",
      targetHandle: "default",
      animated: true,
    },
    {
      id: "e9",
      source: "assert",
      target: "trace",
      sourceHandle: "pass",
      targetHandle: "default",
      animated: true,
    },
    {
      id: "e10",
      source: "trace",
      target: "output",
      sourceHandle: "default",
      targetHandle: "default",
      animated: true,
    },
  ];

  return {
    version: "1.0",
    nodes,
    edges,
    metadata: {
      name: `${sector} ${useCase}`,
      description: `Production-grade blueprint for ${sector} ${useCase}.`,
      mode: "design",
      tags: [sector, useCase],
      assumptions: [
        "Ingress traffic is authenticated at the edge.",
        "Downstream systems expose safe test environments for simulation.",
      ],
      riskWarnings: [
        "Validate dependency timeouts before promoting to live execution.",
      ],
      suggestedScenarios: [
        "latency spike on primary service",
        "queue backlog growth",
        "LLM output regression",
      ],
    },
  };
}

export const ENTERPRISE_BLUEPRINTS: TemplateBlueprint[] = sectors.flatMap(
  (sector) =>
    blueprintSpecs.map((spec) => ({
      slug: `${sector.toLowerCase().replace(/\s+/g, "-")}-${spec.slug}`,
      name: `${sector} ${spec.useCase}`,
      description: `Curated enterprise blueprint for ${spec.useCase} in ${sector}.`,
      sector,
      useCase: spec.useCase,
      maturity: "production" as const,
      tags: [sector, ...spec.tags],
      requiredConnectors: [...spec.connectors],
      configurableParameters: [
        "primary_model",
        "queue_name",
        "service_name",
        "timeout_budget",
      ],
      analysisRubric: [
        "Resilience against latency spikes",
        "Cost-to-quality trade-off",
        "Failure isolation and fallback coverage",
      ],
      benchmarkRubric: [
        "latency",
        "assertion_pass_rate",
        "token_usage",
        "quality_score",
      ],
      estimatedCreditCost: 1,
      defaultScenario: createScenario(sector, spec.useCase),
      graph: createGraph(sector, spec.useCase),
    }))
);
