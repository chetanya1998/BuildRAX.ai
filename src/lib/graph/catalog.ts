import { BUILD_RAX_NODE_CATALOG, BUILD_RAX_RECOMMENDED_MVP } from "@/lib/data/buildraxCatalog";
import { NodeDefinition, NodeFieldDefinition, NodePack } from "./types";

type RawNode = (typeof BUILD_RAX_NODE_CATALOG)[number];

const UNIQUE_BUILD_RAX_NODE_CATALOG = BUILD_RAX_NODE_CATALOG.filter(
  (node, index, catalog) => catalog.findIndex((item) => item.id === node.id) === index
);

const packColors: Record<NodePack, string> = {
  entry_point: "bg-blue-500/12 text-blue-200 border-blue-400/25",
  auth_security: "bg-rose-500/12 text-rose-200 border-rose-400/25",
  data_layer: "bg-emerald-500/12 text-emerald-200 border-emerald-400/25",
  messaging_queue: "bg-amber-500/12 text-amber-200 border-amber-400/25",
  external_service: "bg-violet-500/12 text-violet-200 border-violet-400/25",
  monitoring_operations: "bg-cyan-500/12 text-cyan-200 border-cyan-400/25",
  custom: "bg-slate-500/12 text-slate-200 border-slate-400/25",
};

const iconByRole: Record<string, string> = {
  trigger: "MousePointerClick",
  gateway: "Route",
  api_endpoint: "Globe2",
  validator: "ListChecks",
  guard: "ShieldCheck",
  decision_maker: "GitBranch",
  processor: "Cpu",
  transformer: "RefreshCw",
  state_controller: "Workflow",
  reliability_controller: "ShieldAlert",
  storage_reader: "Database",
  storage_writer: "DatabaseZap",
  atomic_state_manager: "BadgeCheck",
  cache: "TimerReset",
  file_storage: "HardDrive",
  async_buffer: "ListTree",
  background_processor: "Cog",
  failure_store: "ArchiveX",
  event_distributor: "RadioTower",
  consistency_guard: "Link2",
  distributed_transaction_controller: "Network",
  ai_inference: "BrainCircuit",
  ai_input_builder: "MessageSquareCode",
  vector_generator: "Binary",
  retrieval: "Search",
  safety_validator: "ShieldQuestion",
  external_side_effect: "PlugZap",
  billing_state_manager: "CreditCard",
  usage_meter: "Gauge",
  balance_state_manager: "WalletCards",
  communication: "Send",
  realtime_channel: "Radio",
  observer: "Activity",
  operations_response: "BellRing",
  availability_monitor: "HeartPulse",
  exporter: "FileCode2",
  governance_action: "Landmark",
  compliance_observer: "ScrollText",
  user_defined_component: "Puzzle",
};

function packFor(category: string, role: string): NodePack {
  if (category === "Triggers" || category === "API & Routing") return "entry_point";
  if (category === "Auth & Security") return "auth_security";
  if (category === "Database & Storage") return "data_layer";
  if (category === "Async & Events") return "messaging_queue";
  if (category === "Observability & Ops") return "monitoring_operations";
  if (category === "Custom") return "custom";
  if (["observer", "operations_response", "availability_monitor", "compliance_observer"].includes(role)) return "monitoring_operations";
  if (["external_side_effect", "billing_state_manager", "usage_meter", "balance_state_manager", "communication", "ai_inference"].includes(role)) return "external_service";
  return "custom";
}

function asPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function fieldsFor(raw: RawNode): NodeFieldDefinition[] {
  const profile = raw.default_simulation_profile;
  return [
    { name: "label", label: "Label", type: "text", defaultValue: raw.name },
    { name: "node_role", label: "Role", type: "text", defaultValue: raw.role, description: "Traffic role used by review, simulation, and exports." },
    { name: "input_contract", label: "Input Contract", type: "json", defaultValue: asPrettyJson(raw.input_contract) },
    { name: "output_contract", label: "Output Contract", type: "json", defaultValue: asPrettyJson(raw.output_contract) },
    { name: "avg_latency_ms", label: "Avg Latency", type: "number", defaultValue: profile.avg_latency_ms },
    { name: "p95_latency_ms", label: "P95 Latency", type: "number", defaultValue: profile.p95_latency_ms },
    { name: "failure_rate", label: "Failure Rate", type: "number", defaultValue: profile.failure_rate },
    { name: "max_rps", label: "Max RPS", type: "number", defaultValue: profile.max_rps },
    { name: "cost_per_request_usd", label: "Cost / Request", type: "number", defaultValue: profile.cost_per_request_usd },
    { name: "security_requirements", label: "Security Requirements", type: "textarea", defaultValue: raw.security_requirements.join("\n") },
    { name: "possible_outcomes", label: "Possible Outcomes", type: "textarea", defaultValue: raw.possible_outcomes.join("\n") },
    { name: "traffic_behavior", label: "Traffic Behavior", type: "json", defaultValue: asPrettyJson(raw.traffic_behavior) },
    { name: "export_mapping", label: "Export Mapping", type: "json", defaultValue: asPrettyJson(raw.export_mapping) },
  ];
}

function toDefinition(raw: RawNode): NodeDefinition {
  const pack = packFor(raw.category, raw.role);
  return {
    type: raw.id,
    title: raw.name,
    displayName: raw.name,
    description: `${raw.what_it_is} ${raw.what_it_does}`,
    pack,
    category: raw.category,
    icon: iconByRole[raw.role] || "Box",
    colorClass: packColors[pack],
    inputs: raw.traffic_behavior.accepts_traffic && raw.role === "trigger" ? [] : [{ id: "default", label: "In", schema: "json" }],
    outputs: raw.traffic_behavior.forwards_traffic ? [{ id: "default", label: "Out", schema: "json" }] : [],
    fields: fieldsFor(raw),
    previewFields: ["node_role", "avg_latency_ms", "p95_latency_ms"],
    capabilities: { design: true, analyze: true, simulate: true, execute: false },
    reviewChecks: [
      ...raw.security_requirements,
      ...raw.confidence_requirements.map((item) => `confidence_${item}_required`),
    ],
    simulationBehavior: raw.traffic_behavior.changes_state
      ? "Mutates state and contributes consistency/idempotency risk."
      : raw.traffic_behavior.can_queue
        ? "Buffers load and contributes queue depth."
        : raw.traffic_behavior.can_block_traffic
          ? "Can reject or block traffic."
          : raw.what_it_does,
  };
}

export const NODE_DEFINITIONS: NodeDefinition[] = UNIQUE_BUILD_RAX_NODE_CATALOG.map(toDefinition);
export const BACKEND_NODE_TYPES = UNIQUE_BUILD_RAX_NODE_CATALOG.map((node) => node.id);
export const PRODUCTION_NODE_TYPES = BACKEND_NODE_TYPES;
export type BackendNodeType = (typeof BACKEND_NODE_TYPES)[number];

export const NODE_PACK_ORDER: NodePack[] = [
  "entry_point",
  "auth_security",
  "data_layer",
  "messaging_queue",
  "external_service",
  "monitoring_operations",
  "custom",
];

export const NODE_DEFINITION_MAP: Record<string, NodeDefinition> = Object.fromEntries(
  NODE_DEFINITIONS.map((definition) => [definition.type, definition])
);

export const LAUNCH_NODE_COUNT = BUILD_RAX_RECOMMENDED_MVP.launch_nodes_count;
export const LAUNCH_TEMPLATE_COUNT = BUILD_RAX_RECOMMENDED_MVP.launch_templates_count;
export const MVP_TEMPLATE_IDS = [...BUILD_RAX_RECOMMENDED_MVP.mvp_template_ids];

export function getRawNodeDefinition(type: string) {
  return BUILD_RAX_NODE_CATALOG.find((node) => node.id === type);
}

export function getNodeDefinition(type: string) {
  return NODE_DEFINITION_MAP[type];
}

export function getDefaultNodeData(type: string) {
  const definition = getNodeDefinition(type);
  if (!definition) return { label: type };
  return Object.fromEntries(
    definition.fields.map((definitionField) => [
      definitionField.name,
      definitionField.defaultValue ?? (definitionField.type === "boolean" ? false : ""),
    ])
  );
}

export function getNodePackLabel(pack: string) {
  return pack
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const FEATURE_FLAGS = {
  ai_architect: false,
  ai_review: false,
  ai_code_export: false,
  ai_doc_generation: false,
  visual_builder: true,
  workflow_review: true,
  simulation_sandbox: true,
  mermaid_sandbox: true,
  template_library: true,
  export_center: true,
  custom_nodes: true,
  guest_mode: true,
};
