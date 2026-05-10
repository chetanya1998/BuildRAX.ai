import { runWorkflowReview } from "@/lib/backend/review";
import { GraphAnalysis, WorkflowGraph } from "@/lib/graph/types";

export function analyzeGraph(graph: WorkflowGraph): GraphAnalysis {
  const review = runWorkflowReview(graph);
  return {
    score: Math.round(review.scores.overall / 10),
    feedback: review.summary,
    warnings: review.issues.filter((issue) => issue.severity !== "critical").map((issue) => issue.description),
    flaws: review.issues.filter((issue) => issue.severity === "critical").map((issue) => issue.description),
    suggestedScenarios: ["happy_path", "failure_path", "timeout", "load_estimate", "security_misuse"],
  };
}
