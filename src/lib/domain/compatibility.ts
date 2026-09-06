import type { ArchitectureNode, Connector } from "./schema";

const allowedTargets: Record<ArchitectureNode["category"], ArchitectureNode["category"][]> = {
  client: ["networking", "compute", "messaging", "security"],
  networking: ["compute", "messaging", "security", "networking"],
  compute: ["compute", "data", "messaging", "ai", "security", "devops"],
  data: ["compute", "ai", "devops", "data"],
  messaging: ["compute", "messaging", "devops"],
  ai: ["ai", "data", "compute", "devops"],
  security: ["client", "networking", "compute", "data", "ai", "devops"],
  devops: ["compute", "data", "messaging", "ai", "devops"],
};

export function validateConnection(source: ArchitectureNode, target: ArchitectureNode) {
  if (source.id === target.id) return { valid: false, reason: "Choose a different target." };
  if (!allowedTargets[source.category].includes(target.category)) {
    return { valid: false, reason: `${source.category} components do not normally connect directly to ${target.category}.` };
  }
  return { valid: true, reason: "Compatible semantic connection." };
}

export function validateConnectorReferences(connector: Connector, nodes: ArchitectureNode[]) {
  const source = nodes.find((node) => node.id === connector.source);
  const target = nodes.find((node) => node.id === connector.target);
  if (!source || !target) return { valid: false, reason: "Connector references a missing component." };
  return validateConnection(source, target);
}
