export type BuilderMode = "design" | "analysis" | "simulation" | "live";

export type WorkflowLifecycle =
  | "draft"
  | "simulated"
  | "benchmarked"
  | "published"
  | "archived"
  | "soft_deleted";

export type NodePack =
  | "ai"
  | "backend"
  | "data"
  | "reliability"
  | "security"
  | "observability";

export type NodeFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "boolean"
  | "json"
  | "password";

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
}

export interface WorkflowMetadata {
  name: string;
  description?: string;
  mode?: BuilderMode;
  tags?: string[];
  assumptions?: string[];
  riskWarnings?: string[];
  suggestedScenarios?: string[];
}

export interface WorkflowGraph {
  version: "1.0";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: WorkflowMetadata;
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
  dependencyMode: "stub" | "safe_test" | "live";
  failureMode: "none" | "latency_spike" | "partial_outage" | "dependency_timeout";
  timeoutMs: number;
  queueDepth: number;
  assertionRules: AssertionRule[];
}

export interface NodeExecutionMetrics {
  latencyMs: number;
  tokenUsage: number;
  cost: number;
  warnings: string[];
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: "completed" | "failed" | "skipped";
  outputs: Record<string, unknown>;
  error?: string;
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
  defaultScenario: ScenarioDefinition;
  graph: WorkflowGraph;
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
}
