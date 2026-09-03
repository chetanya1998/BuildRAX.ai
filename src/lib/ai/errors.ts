export class AIOutputError extends Error {
  readonly code = "invalid_model_output" as const;

  constructor(message = "The model did not return a usable architecture.") {
    super(message);
    this.name = "AIOutputError";
  }
}

export class AISemanticValidationError extends Error {
  readonly code = "semantic_validation_failed" as const;

  constructor(public readonly reasons: string[]) {
    super("The generated architecture did not satisfy BuildRAX semantic rules.");
    this.name = "AISemanticValidationError";
  }
}

export function classifyAIError(error: unknown) {
  if (error instanceof AIOutputError || error instanceof AISemanticValidationError) return error.code;
  if (error instanceof Error && error.name === "APIConnectionTimeoutError") return "provider_timeout";
  if (error instanceof Error && /timeout/i.test(error.message)) return "provider_timeout";
  if (error instanceof Error && /rate limit/i.test(error.message)) return "provider_rate_limited";
  return "provider_failure";
}
