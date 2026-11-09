import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Intentionally fixed local container names; never reads application credentials.
const target = "buildrax-day16-acceptance";
function sql(input) {
  return execFileSync("docker", ["exec", "-i", target, "psql", "-X", "-U", "supabase_admin", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"], { input, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
}
const migrations = readdirSync("supabase/migrations").filter((file) => file.endsWith(".sql")).sort();
const migrationSql = migrations.map((file) => readFileSync(`supabase/migrations/${file}`, "utf8")).join("\n");
const fingerprint = createHash("sha256").update(migrationSql).digest("hex");
if (sql("select to_regclass('public.diagrams');").trim() === "") {
  const platformSchemas = execFileSync("docker", ["exec", "supabase_db_buildrax-mvp", "pg_dump", "-U", "postgres", "-d", "postgres", "--schema-only", "--schema=auth", "--schema=storage", "--no-owner"], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  // The application migration recreates this trigger after its public function.
  const schemas = platformSchemas.replace(/^CREATE TRIGGER on_auth_user_created .*;$/m, "");
  sql(`begin; drop schema auth cascade; drop schema storage cascade;\n${schemas}\n${migrationSql}\ncreate schema day16_test; create table day16_test.bootstrap(fingerprint text); insert into day16_test.bootstrap values ('${fingerprint}'); commit;`);
  console.log(`Applied ${migrations.length} migrations to disposable database`);
}
assert(sql("select to_regclass('day16_test.bootstrap');").trim(), "Recreate the disposable container: no migration fingerprint recorded.");
assert.equal(sql("select fingerprint from day16_test.bootstrap;").trim(), fingerprint, "Migrations changed: recreate the disposable container before testing.");
let total = 0;
for (const file of readdirSync("supabase/tests/database").filter((file) => file.endsWith(".sql")).sort()) {
  const result = sql(readFileSync(`supabase/tests/database/${file}`, "utf8"));
  const planned = Number(result.match(/^1\.\.(\d+)$/m)?.[1]);
  const passed = (result.match(/^ok \d+/gm) ?? []).length;
  assert(!/^not ok /m.test(result), `${file}: ${result}`);
  assert(planned > 0 && planned === passed, `${file}: ${passed}/${planned} assertions completed\n${result}`);
  total += passed;
  console.log(`${file}: ${passed} passed (transaction rolled back)`);
}
console.log(`Database assertions: ${total} passed`);
