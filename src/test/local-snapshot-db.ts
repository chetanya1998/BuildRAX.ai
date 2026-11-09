import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect } from "vitest";
import { canonicalSha256, type ArchitectureSnapshot } from "@/lib/architecture-ir/snapshot";

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const json = (value: unknown) => `${quote(JSON.stringify(value))}::jsonb`;

/** Real SQL roles/RPCs against the disposable container; every fixture rolls back. */
export async function verifyLocalSnapshotPersistence(first: ArchitectureSnapshot, second: ArchitectureSnapshot) {
  const owner = randomUUID(); const outsider = randomUUID(); const token = randomUUID();
  const payload = (snapshot: ArchitectureSnapshot) => [json(snapshot.ir), quote(snapshot.checksums.ir), json(snapshot.presentation), quote(snapshot.checksums.presentation), json(snapshot.materializedDiagram), quote(snapshot.checksums.diagram), quote(snapshot.ir.provenance.strategy), quote("1.1.0"), quote("1.0.0"), "null"].join(",");
  const read = (version: number) => `public.read_architecture_version('${first.diagramId}', ${version})`;
  const migrationHash = quote(await canonicalSha256({ ir: first.ir, presentation: first.presentation, diagram: first.materializedDiagram }));
  const saveHash = quote(await canonicalSha256({ baseVersion: 1, baseIrVersion: 1, ir: second.ir, presentation: second.presentation }));
  const sql = `begin;
    create extension if not exists pgtap with schema extensions;
    set local search_path = extensions, public, auth;
    select plan(11);
    insert into auth.users(id, email, raw_user_meta_data) values
      ('${owner}', '${owner}@day16.example.test', '{}'), ('${outsider}', '${outsider}@day16.example.test', '{}');
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '${owner}', true);
    select lives_ok($call$ select * from public.migrate_guest_architecture('${randomUUID()}', ${migrationHash}, 'Day 16 verification', ${payload(first)}) $call$, 'owner migrates version one');
    select is((select ir_payload from ${read(1)}), ${json(first.ir)}, 'semantic fields survive database read-back');
    select lives_ok($call$ select * from public.save_architecture_snapshot('${first.diagramId}', 1, 1, '${randomUUID()}', ${saveHash}, ${payload(second)}) $call$, 'owner saves version two');
    select is((select diagram_payload from ${read(1)}), ${json(first.materializedDiagram)}, 'old version remains immutable');
    select is((select presentation_payload from ${read(2)}), ${json(second.presentation)}, 'presentation fields survive read-back');
    select is((select diagram_payload from ${read(2)}), ${json(second.materializedDiagram)}, 'new version preserves complete diagram');
    select is((select current_ir_version from public.diagrams where id = '${first.diagramId}'), ${second.irVersion}, 'semantic version changes only when semantic content changes');
    insert into public.share_links(project_id, token_hash, created_by)
      select project_id, '${token}', '${owner}' from public.diagrams where id = '${first.diagramId}';
    set local role anon;
    select set_config('request.jwt.claim.sub', '', true);
    select is((select diagram_payload from public.read_shared_diagram('${token}')), ${json(second.materializedDiagram)}, 'share returns current read-only diagram');
    select is((select count(*) from public.read_shared_diagram('wrong-token')), 0::bigint, 'invalid share token reveals nothing');
    select ok(not has_function_privilege('anon', 'public.save_architecture_snapshot(uuid,integer,integer,uuid,text,jsonb,text,jsonb,text,jsonb,text,text,text,text,uuid)', 'EXECUTE'), 'anonymous share cannot write a snapshot');
    set local role authenticated;
    select set_config('request.jwt.claim.sub', '${outsider}', true);
    select throws_ok($call$ select * from ${read(2)} $call$, '42501', 'Diagram not found or access denied', 'outsider cannot read private version');
    select * from finish();
    rollback;`;
  const processResult = spawnSync("docker", ["exec", "-i", "buildrax-day16-acceptance", "psql", "-X", "-U", "supabase_admin", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-At"], { input: sql, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  const result = processResult.stdout + processResult.stderr;
  expect(processResult.status, result).toBe(0);
  expect(result, result).not.toMatch(/^not ok /m);
  expect(result.match(/^ok \d+/gm), result).toHaveLength(11);
}
