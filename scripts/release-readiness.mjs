import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
const findings = [];
const secretPatterns = [
  ["Supabase secret key", /sb_secret_[A-Za-z0-9_-]{16,}/g],
  ["OpenAI-style secret key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ["private key material", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["populated server secret", /(?:SUPABASE_SERVICE_ROLE_KEY|ARCHIVE_WORKER_SECRET|GENERATION_RECEIPT_SECRET)[ \t]*=[ \t]*[^\s#]+/g],
  ["client-exposed secret variable", /NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY)[A-Z0-9_]*/g],
];

for (const file of tracked) {
  if (file === "package-lock.json" || file.startsWith("audit-artifacts/")) continue;
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  for (const [label, pattern] of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) findings.push(`${file}: possible ${label}`);
  }
}

const migrations = tracked.filter((file) => /^supabase\/migrations\/\d{12}_[a-z0-9_]+\.sql$/.test(file)).sort();
const names = migrations.map((file) => file.split("/").at(-1));
const timestamps = names.map((name) => name.slice(0, 12));
if (new Set(timestamps).size !== timestamps.length) findings.push("supabase/migrations: duplicate migration timestamp");

const requiredMigrations = [
  "202609060005_architecture_ir_persistence.sql",
  "202609120007_document_persistence.sql",
  "202609120008_archive_delivery_hardening.sql",
  "202609120009_release_verification.sql",
  "202609150010_fix_guest_migration_origin_conflict.sql",
];
for (const name of requiredMigrations) {
  if (!names.includes(name)) findings.push(`supabase/migrations: required migration missing: ${name}`);
}

if (findings.length) {
  console.error("Release readiness scan failed:\n" + findings.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Release readiness scan passed (${tracked.length} repository files, ${migrations.length} uniquely timestamped migrations).`);
