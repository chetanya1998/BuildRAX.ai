import { checkRuntimeConfig, describeConfigProblems } from "@/lib/config/runtime-requirements";

/** Logs missing production configuration once per server instance so a broken deploy is visible in function logs. */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const report = checkRuntimeConfig(process.env);
  if (report.ok) return;
  console.error(`BuildRAX configuration incomplete. Affected features will return 503 until these are set:\n${describeConfigProblems(report.problems)}\nSee docs/NETLIFY-ENVIRONMENT.md.`);
}
