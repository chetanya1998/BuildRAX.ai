// Build gate: fails a Netlify production build when required configuration is
// missing, so a deploy can no longer go live with every guest request 503-ing.
// Deploy previews and branch deploys only warn. Run with Node type stripping
// (see the `config:check` npm script) so requirements stay in one TypeScript module.
import { checkRuntimeConfig, describeConfigProblems } from "../src/lib/config/runtime-requirements.ts";

const context = process.env.CONTEXT ?? "local";
const report = checkRuntimeConfig(process.env);

if (report.ok) {
  console.log(`BuildRAX configuration check passed (${context}, AI provider: ${report.aiProvider}).`);
  process.exit(0);
}

const summary = `BuildRAX configuration is incomplete for the "${context}" deploy context:\n${describeConfigProblems(report.problems)}\nSee docs/NETLIFY-ENVIRONMENT.md for values and scopes.`;

if (context !== "production") {
  console.warn(`${summary}\nContinuing because this is not a production build.`);
  process.exit(0);
}
if (process.env.BUILDRAX_SKIP_CONFIG_CHECK === "true") {
  console.warn(`${summary}\nBUILDRAX_SKIP_CONFIG_CHECK=true: deploying anyway. Affected features will return 503.`);
  process.exit(0);
}
console.error(`${summary}\nFailing the production build. Set the variables above (scopes must include Builds and Functions) or set BUILDRAX_SKIP_CONFIG_CHECK=true to override.`);
process.exit(1);
