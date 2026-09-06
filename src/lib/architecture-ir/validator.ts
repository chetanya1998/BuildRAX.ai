import { catalogByType } from "@/lib/domain/catalog";
import { validateConnection } from "@/lib/domain/compatibility";
import { architectureIRSchema, type ArchitectureIR } from "./schema";

export type IRValidationFinding = {
  code: "SCHEMA_INVALID" | "DUPLICATE_COMPONENT_ID" | "DUPLICATE_FLOW_ID" | "FLOW_ENDPOINT_MISSING" | "SELF_FLOW" | "UNKNOWN_COMPONENT_TYPE" | "CATEGORY_MISMATCH" | "INCOMPATIBLE_FLOW" | "ASSUMPTION_TARGET_MISSING" | "ORPHAN_COMPONENT" | "DIRECT_CLIENT_DATA_ACCESS" | "EVENT_WITHOUT_CONSUMER" | "SENSITIVE_FLOW_UNENCRYPTED";
  severity: "error" | "warning";
  message: string;
  affectedIds: string[];
};

export type IRValidationResult = {
  valid: boolean;
  errors: IRValidationFinding[];
  warnings: IRValidationFinding[];
};

export function validateArchitectureIR(input: unknown): IRValidationResult {
  const parsed = architectureIRSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: [{ code: "SCHEMA_INVALID", severity: "error", message: "Architecture IR does not match the versioned contract.", affectedIds: [] }],
      warnings: [],
    };
  }
  const ir: ArchitectureIR = parsed.data;
  const errors: IRValidationFinding[] = [];
  const warnings: IRValidationFinding[] = [];
  const componentIds = new Set<string>();
  const flowIds = new Set<string>();
  const connected = new Set<string>();

  for (const component of ir.components) {
    if (componentIds.has(component.id)) errors.push({ code: "DUPLICATE_COMPONENT_ID", severity: "error", message: `Component ID ${component.id} is duplicated.`, affectedIds: [component.id] });
    componentIds.add(component.id);
    const catalogItem = catalogByType.get(component.semanticType);
    if (!catalogItem) errors.push({ code: "UNKNOWN_COMPONENT_TYPE", severity: "error", message: `${component.semanticType} is not in the trusted component catalog.`, affectedIds: [component.id] });
    else if (catalogItem.category !== component.category) errors.push({ code: "CATEGORY_MISMATCH", severity: "error", message: `${component.name} has the wrong semantic category.`, affectedIds: [component.id] });
  }

  for (const flow of ir.flows) {
    if (flowIds.has(flow.id)) errors.push({ code: "DUPLICATE_FLOW_ID", severity: "error", message: `Flow ID ${flow.id} is duplicated.`, affectedIds: [flow.id] });
    flowIds.add(flow.id);
    if (!componentIds.has(flow.source) || !componentIds.has(flow.target)) errors.push({ code: "FLOW_ENDPOINT_MISSING", severity: "error", message: `${flow.id} references a missing component.`, affectedIds: [flow.id, flow.source, flow.target] });
    if (flow.source === flow.target) errors.push({ code: "SELF_FLOW", severity: "error", message: `${flow.id} cannot connect a component to itself.`, affectedIds: [flow.id, flow.source] });
    connected.add(flow.source);
    connected.add(flow.target);
    const source = ir.components.find((item) => item.id === flow.source);
    const target = ir.components.find((item) => item.id === flow.target);
    if (source && target && source.id !== target.id) {
      const compatibility = validateConnection(source as Parameters<typeof validateConnection>[0], target as Parameters<typeof validateConnection>[1]);
      if (!compatibility.valid) errors.push({ code: "INCOMPATIBLE_FLOW", severity: "error", message: compatibility.reason, affectedIds: [flow.id, source.id, target.id] });
    }
    if (source?.category === "client" && target?.category === "data") warnings.push({ code: "DIRECT_CLIENT_DATA_ACCESS", severity: "warning", message: "A client connects directly to a datastore; add an authenticated service boundary.", affectedIds: [source.id, target.id] });
    if (["confidential", "restricted"].includes(flow.security.dataClassification) && !flow.security.encryption) warnings.push({ code: "SENSITIVE_FLOW_UNENCRYPTED", severity: "warning", message: "A sensitive flow has no declared transport encryption.", affectedIds: [flow.id] });
  }

  for (const assumption of ir.assumptions) {
    const missing = assumption.affectedComponents.filter((id) => !componentIds.has(id));
    if (missing.length) errors.push({ code: "ASSUMPTION_TARGET_MISSING", severity: "error", message: `${assumption.id} references missing components.`, affectedIds: [assumption.id, ...missing] });
  }

  for (const component of ir.components) {
    if (!connected.has(component.id)) warnings.push({ code: "ORPHAN_COMPONENT", severity: "warning", message: `${component.name} is not part of a flow.`, affectedIds: [component.id] });
    if (component.category === "messaging") {
      const hasInput = ir.flows.some((flow) => flow.target === component.id);
      const hasOutput = ir.flows.some((flow) => flow.source === component.id);
      if (hasInput && !hasOutput) warnings.push({ code: "EVENT_WITHOUT_CONSUMER", severity: "warning", message: `${component.name} receives work but has no consumer flow.`, affectedIds: [component.id] });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
