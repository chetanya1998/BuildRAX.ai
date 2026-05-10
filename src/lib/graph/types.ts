export type BuilderMode = "design" | "review" | "simulate" | "diagram" | "export" | "analysis" | "test" | "live";

export type WorkflowLifecycle =
  | "draft"
  | "configured"
  | "reviewed"
  | "has_critical_issues"
  | "simulated"
  | "exported"
  | "archived"
  | "soft_deleted";

export type NodePack =
  | "entry_point"
  | "auth_security"
  | "data_layer"
  | "messaging_queue"
  | "external_service"
  | "monitoring_operations"
  | "custom";

export type NodeFieldType = "text" | "textarea" | "number" | "select" | "boolean" | "json" | "password";
export type ValueSchema = "text" | "json" | "number" | "boolean" | "array";

export interface NodePortDefinition {
  id: string;
  label?: string;
  schema?: ValueSchema;
}

export interface NodeFieldOption {
  label: string;
  value: string;
}

export interface NodeFieldDefinition {
  name: string;
  label: string;
  type: NodeFieldType;
  description?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: NodeFieldOption[];
}

export interface NodeCapabilityMatrix {
  design: boolean;
  analyze: boolean;
  simulate: boolean;
  execute: boolean;
}

export interface NodeDefinition {
  type: string;
  title: string;
  displayName?: string;
  description: string;
  pack: NodePack;
  category: string;
  icon: string;
  colorClass: string;
  inputs: NodePortDefinition[];
  outputs: NodePortDefinition[];
  fields: NodeFieldDefinition[];
  previewFields?: string[];
  capabilities: NodeCapabilityMatrix;
  reviewChecks: string[];
  simulationBehavior?: string;
  experimental?: boolean;
}

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: WorkflowNodePosition;
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  label?: string;
  condition?: string;
  edgeType?: "success" | "failure" | "async" | "data" | "control";
}

export interface WorkflowMetadata {
  name: string;
  description?: string;
  mode?: BuilderMode;
  tags?: string[];
  assumptions?: string[];
  riskWarnings?: string[];
  suggestedScenarios?: string[];
  mermaid?: string;
}

export interface WorkflowGraph {
  version: "1.0";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: WorkflowMetadata;
}

export type ReviewSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface ReviewIssue {
  id: string;
  severity: ReviewSeverity;
  category:
    | "architecture_completeness"
    | "security"
    | "reliability"
    | "scalability"
    | "data_flow"
    | "api_design"
    | "failure_handling"
    | "observability"
    | "cost_awareness"
    | "operational_readiness";
  affectedNodeId?: string;
  affectedNodeLabel?: string;
  description: string;
  whyItMatters: string;
  suggestedFix: string;
  designPatternReference: string;
}

export interface ReviewResult {
  status: "passed" | "needs_attention" | "blocked";
  scores: {
    architecture: number;
    security: number;
    reliability: number;
    observability: number;
    overall: number;
  };
  issues: ReviewIssue[];
  summary: string;
  createdAt: string;
}

export type SimulationScenarioId =
  | "happy_path"
  | "failure_path"
  | "timeout"
  | "load_estimate"
  | "security_misuse";

export interface SimulationScenario {
  id: SimulationScenarioId;
  name: string;
  inputs: Record<string, unknown>;
}

export interface SimulationTraceStep {
  nodeId: string;
  label: string;
  type: string;
  status: "completed" | "warning" | "failed" | "blocked" | "skipped";
  message: string;
  estimatedLatencyMs: number;
}

export interface SimulationResult {
  scenario: SimulationScenario;
  status: "completed" | "warning" | "failed" | "blocked";
  trace: SimulationTraceStep[];
  failedNodes: string[];
  affectedDownstreamNodes: string[];
  bottleneckEstimate: string;
  missingFallback: string[];
  summary: string;
  createdAt: string;
}

export interface TemplateBlueprint {
  slug: string;
  name: string;
  description: string;
  sector: string;
  useCase: string;
  maturity: "starter" | "production";
  tags: string[];
  requiredConnectors: string[];
  configurableParameters: string[];
  analysisRubric: string[];
  benchmarkRubric: string[];
  estimatedCreditCost: number;
  graph: WorkflowGraph;
}

export interface AssertionRule {
  id: string;
  label: string;
  kind: "contains" | "not_contains" | "max_latency_ms" | "schema";
  expected?: string;
  threshold?: number;
}

export interface ScenarioDefinition {
  name: string;
  trafficProfile: "single" | "burst" | "steady";
  dependencyMode: "fixture" | "safe_test" | "live";
  failureMode: "none" | "latency_spike" | "partial_outage" | "dependency_timeout";
  timeoutMs: number;
  queueDepth: number;
  assertionRules: AssertionRule[];
  prompt?: string;
  expectedBehavior?: string;
}

export interface BenchmarkVariant {
  variantId: string;
  label: string;
  graph: WorkflowGraph;
}

export interface BenchmarkScore {
  variantId: string;
  latencyMs: number;
  errorRate: number;
  assertionPassRate: number;
  tokenUsage: number;
  cost: number;
  qualityScore?: number;
  totalScore: number;
}

export interface CreditPolicy {
  promptCompile: number;
  templateInstantiate: number;
  simulate: number;
  execute: number;
  benchmarkVariant: number;
}

export interface CreditBalance {
  plan: "free" | "pro_20" | "growth_40" | "enterprise";
  availableCredits: number;
  monthlyLimit: number;
  dailyRemaining?: number;
  monthlyRemaining: number;
  disabled?: boolean;
  label?: string;
}

export type RunMode = "test" | "live";
export type RunStatus = "completed" | "failed" | "blocked" | "skipped";

export interface NodeExecutionMetrics {
  latencyMs: number;
  tokenUsage: number;
  cost: number;
  warnings: string[];
  providerId?: string;
  model?: string;
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: RunStatus;
  outputs: Record<string, unknown>;
  error?: string;
  blockedReason?: string;
  startedAt?: string;
  completedAt?: string;
  inputs?: Record<string, unknown>;
  metrics: NodeExecutionMetrics;
}

export interface GraphAnalysis {
  score: number;
  feedback: string;
  warnings: string[];
  flaws: string[];
  suggestedScenarios: string[];
}

export interface PromptCompileResult {
  graph: WorkflowGraph;
  assumptions: string[];
  unresolvedDependencies: string[];
  riskWarnings: string[];
  suggestedScenarios: string[];
}
