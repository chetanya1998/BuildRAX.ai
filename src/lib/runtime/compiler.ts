import { ENTERPRISE_BLUEPRINTS } from "@/lib/graph/blueprints";
import { PromptCompileResult } from "@/lib/graph/types";

function pickBlueprint(prompt: string) {
  const normalized = prompt.toLowerCase();
  return (
    ENTERPRISE_BLUEPRINTS.find((blueprint) =>
      blueprint.tags.some((tag) => normalized.includes(tag.toLowerCase()))
    ) || ENTERPRISE_BLUEPRINTS[0]
  );
}

export async function compilePromptToGraph(prompt: string): Promise<PromptCompileResult> {
  const blueprint = pickBlueprint(prompt);
  const graph = {
    ...blueprint.graph,
    metadata: {
      ...blueprint.graph.metadata,
      name: `Prompt Build: ${prompt.slice(0, 48)}`,
      description: prompt,
      assumptions: [
        `Mapped prompt to curated blueprint "${blueprint.name}".`,
        "Dependency integrations default to stub mode until a safe environment is configured.",
      ],
      riskWarnings: [
        "Review auth, rate limiting, and fallback nodes before live execution.",
        "Validate generated service topology against actual data contracts.",
      ],
      suggestedScenarios: [
        "latency spike on primary dependency",
        "queue backlog under burst traffic",
        "LLM semantic quality regression",
      ],
    },
  };

  return {
    graph,
    assumptions: graph.metadata.assumptions || [],
    unresolvedDependencies: blueprint.requiredConnectors,
    riskWarnings: graph.metadata.riskWarnings || [],
    suggestedScenarios: graph.metadata.suggestedScenarios || [],
  };
}
