/**
 * Single source of truth for the deployment configuration BuildRAX needs.
 *
 * This module is imported by `next.config.ts` (build gate), `src/instrumentation.ts`
 * (startup log) and `/api/health`, so it must stay free of server-only and
 * framework imports. It reports variable names, never values.
 */

export const runtimeCapabilities = ["guestAccess", "accounts", "shareLinks", "liveAI", "generationWorker", "archiveMaintenance"] as const;
export type RuntimeCapability = (typeof runtimeCapabilities)[number];

type Environment = Record<string, string | undefined>;

export type EnvRequirement = {
  name: string;
  /** Capabilities that stop working when this variable is missing or invalid. */
  capabilities: RuntimeCapability[];
  /** Exposed to the browser and inlined at build time. */
  public: boolean;
  minLength?: number;
  /** Optional variables only become required when this returns true. */
  requiredWhen?: (env: Environment) => boolean;
  purpose: string;
};

const SECRET_MIN_LENGTH = 32;
const enabled = (name: string) => (env: Environment) => env[name] === "true";

export const envRequirements: EnvRequirement[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", capabilities: ["guestAccess", "accounts", "shareLinks"], public: true, purpose: "Supabase project URL for sign-in, saving and shared request limits." },
  { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", capabilities: ["accounts", "shareLinks"], public: true, purpose: "Supabase browser key (RLS-protected) for sign-in and saved projects." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", capabilities: ["guestAccess", "accounts", "shareLinks"], public: false, purpose: "Server-only Supabase key for shared rate limits, generation jobs and private assets." },
  { name: "RATE_LIMIT_HMAC_SECRET", capabilities: ["guestAccess"], public: false, minLength: SECRET_MIN_LENGTH, purpose: "Signs guest sessions and rate-limit fingerprints. Without it every guest request fails." },
  { name: "GENERATION_RECEIPT_SECRET", capabilities: ["guestAccess"], public: false, minLength: SECRET_MIN_LENGTH, purpose: "Signs generation receipts so guest drafts can be migrated on sign-in." },
  { name: "SHARE_TOKEN_PEPPER", capabilities: ["shareLinks"], public: false, minLength: SECRET_MIN_LENGTH, purpose: "Protects stored share-link hashes." },
  { name: "OPENAI_API_KEY", capabilities: ["liveAI"], public: false, requiredWhen: () => false, purpose: "Optional. Enables model generation; the deterministic generator is used without it." },
  { name: "GENERATION_WORKER_SECRET", capabilities: ["generationWorker"], public: false, minLength: SECRET_MIN_LENGTH, requiredWhen: enabled("GENERATION_WORKER_ENABLED"), purpose: "Authenticates the scheduled generation worker. Required only when GENERATION_WORKER_ENABLED=true." },
  { name: "ARCHIVE_WORKER_SECRET", capabilities: ["archiveMaintenance"], public: false, minLength: SECRET_MIN_LENGTH, requiredWhen: enabled("ARCHIVE_MAINTENANCE_ENABLED"), purpose: "Authenticates scheduled archive maintenance. Required only when ARCHIVE_MAINTENANCE_ENABLED=true." },
  { name: "RESEND_API_KEY", capabilities: ["archiveMaintenance"], public: false, requiredWhen: enabled("ARCHIVE_MAINTENANCE_ENABLED"), purpose: "Sends archive notice emails. Required only when ARCHIVE_MAINTENANCE_ENABLED=true." },
  { name: "ARCHIVE_NOTICE_FROM_EMAIL", capabilities: ["archiveMaintenance"], public: false, requiredWhen: enabled("ARCHIVE_MAINTENANCE_ENABLED"), purpose: "Sender address for archive notices. Required only when ARCHIVE_MAINTENANCE_ENABLED=true." },
];

export type ConfigProblem = { name: string; reason: "missing" | "too-short"; capabilities: RuntimeCapability[] };

export type RuntimeConfigReport = {
  ok: boolean;
  problems: ConfigProblem[];
  capabilities: Record<RuntimeCapability, boolean>;
  aiProvider: "openai" | "deterministic";
};

export function checkRuntimeConfig(env: Environment): RuntimeConfigReport {
  const problems: ConfigProblem[] = [];
  const capabilities = Object.fromEntries(runtimeCapabilities.map((capability) => [capability, true])) as Record<RuntimeCapability, boolean>;
  for (const requirement of envRequirements) {
    const value = env[requirement.name]?.trim();
    const required = requirement.requiredWhen ? requirement.requiredWhen(env) : true;
    const problem = !value ? "missing" : requirement.minLength && value.length < requirement.minLength ? "too-short" : null;
    if (problem) requirement.capabilities.forEach((capability) => { capabilities[capability] = false; });
    if (problem && required) problems.push({ name: requirement.name, reason: problem, capabilities: requirement.capabilities });
  }
  // Worker capabilities are only meaningful once they are switched on.
  if (env.GENERATION_WORKER_ENABLED !== "true") capabilities.generationWorker = false;
  if (env.ARCHIVE_MAINTENANCE_ENABLED !== "true") capabilities.archiveMaintenance = false;
  return { ok: problems.length === 0, problems, capabilities, aiProvider: env.OPENAI_API_KEY ? "openai" : "deterministic" };
}

export function describeConfigProblems(problems: ConfigProblem[]) {
  return problems.map((problem) => {
    const requirement = envRequirements.find((item) => item.name === problem.name);
    const reason = problem.reason === "too-short" ? `must be at least ${requirement?.minLength} characters` : "is not set";
    return `- ${problem.name} ${reason} (affects: ${problem.capabilities.join(", ")})`;
  }).join("\n");
}
