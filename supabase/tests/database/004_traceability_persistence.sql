begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(21);

select ok((select relrowsecurity from pg_class where oid = 'public.diagram_version_traceability'::regclass), 'traceability links have RLS');
select ok(not has_table_privilege('authenticated', 'public.diagram_version_traceability', 'INSERT'), 'browser sessions cannot insert traceability links');
select ok(not has_table_privilege('authenticated', 'public.diagram_version_traceability', 'UPDATE'), 'browser sessions cannot rewrite traceability links');
select ok(not has_function_privilege('authenticated', 'public.link_architecture_traceability(uuid,integer,jsonb,text,jsonb,text)', 'EXECUTE'), 'browser sessions cannot call the internal linker');
select ok(has_function_privilege('authenticated', 'public.save_architecture_snapshot_v2(uuid,integer,integer,uuid,text,jsonb,text,jsonb,text,jsonb,text,text,text,text,jsonb,text,jsonb,text,uuid)', 'EXECUTE'), 'editors can call the traceable save wrapper');
select ok(has_function_privilege('authenticated', 'public.migrate_guest_architecture_v2(uuid,text,text,jsonb,text,jsonb,text,jsonb,text,text,text,text,jsonb,text,jsonb,text,uuid)', 'EXECUTE'), 'users can migrate a traceable guest architecture');
select ok(has_function_privilege('authenticated', 'public.migrate_guest_architecture_complete_v2(uuid,text,text,jsonb,text,jsonb,text,jsonb,text,text,text,text,text,jsonb,text,jsonb,text,jsonb,text,uuid)', 'EXECUTE'), 'users can migrate complete traceable guest state');
select ok(has_function_privilege('authenticated', 'public.read_architecture_traceability(uuid,integer)', 'EXECUTE'), 'members can request linked traceability');
select matches(
  (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.artifact_blobs'::regclass and conname = 'artifact_blobs_kind_check'),
  'evidence-ir.*requirement-ir',
  'artifact allow-list includes evidence and requirement IR'
);
select ok(exists(select 1 from pg_trigger where tgrelid = 'public.diagram_version_traceability'::regclass and tgname = 'immutable_diagram_version_traceability'), 'traceability links are immutable');

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select throws_ok(
  $$select * from public.read_architecture_traceability('66666666-6666-4666-8666-666666666666', 1)$$,
  '42501', 'Diagram not found or access denied', 'unrelated or missing diagrams do not expose traceability'
);
reset role;

select ok(has_function_privilege('authenticated', 'public.read_architecture_version(uuid,integer)', 'EXECUTE'), 'legacy architecture readers remain available');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('77777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trace-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('88888888-8888-4888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'trace-outsider@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

create temporary table traceability_fixture as select
  '{"schemaVersion":"1.1.0","intent":{"title":"Traceability test","summary":"A traceable test architecture.","archetype":"general","trafficProfile":"unknown"},"requirements":{"functional":["Retain traceability."],"nonFunctional":[]},"constraints":{"preferredStack":[],"cloudProvider":"","multiTenant":false,"dataSensitivity":"unspecified"},"components":[],"flows":[],"assumptions":[],"decisions":[],"provenance":{"strategy":"manual-edit","compilerVersion":"1.1.0","catalogVersion":"1.0.0"}}'::jsonb ir,
  '{"schemaVersion":"1.0.0","theme":"light","viewport":{"x":0,"y":0,"zoom":1},"components":[],"flows":[],"primitives":[],"layerOrder":[]}'::jsonb presentation,
  '{"schemaVersion":"1.0.0","id":"99999999-9999-4999-8999-999999999999","title":"Traceability test","version":1,"createdAt":"2026-09-20T00:00:00Z","updatedAt":"2026-09-20T00:00:00Z","theme":"light","viewport":{"x":0,"y":0,"zoom":1},"nodes":[],"primitives":[],"connectors":[],"assumptions":[]}'::jsonb diagram,
  '{"schemaVersion":"1.0.0","sourceSetId":"eset_traceability","sources":[{"id":"src_traceability","type":"input","label":"Test input"}],"items":[]}'::jsonb evidence,
  '{"schemaVersion":"1.0.0","requirementSetId":"rset_traceability","items":[{"id":"req_traceability","kind":"functional","statement":"Retain traceability.","state":"stated","origin":"user-provided","confidence":1,"evidenceRefs":[],"architectureRefs":[]}],"conflicts":[]}'::jsonb requirements;
alter table traceability_fixture add column ir_hash text, add column presentation_hash text, add column diagram_hash text,
  add column evidence_hash text, add column requirements_hash text, add column request_hash text,
  add column changed_evidence jsonb, add column changed_evidence_hash text, add column changed_request_hash text;
update traceability_fixture set
  ir_hash = public.canonical_jsonb_sha256(ir), presentation_hash = public.canonical_jsonb_sha256(presentation),
  diagram_hash = public.canonical_jsonb_sha256(diagram), evidence_hash = public.canonical_jsonb_sha256(evidence),
  requirements_hash = public.canonical_jsonb_sha256(requirements),
  changed_evidence = jsonb_set(evidence, '{items}', '[{"id":"ev_changed","claim":"Changed.","category":"unknown","origin":"ai-suggestion","verification":"unknown","confidence":0,"locations":[]}]'::jsonb),
  request_hash = public.canonical_jsonb_sha256(jsonb_build_object(
    'ir', ir, 'presentation', presentation, 'diagram', diagram,
    'traceability', jsonb_build_object('schemaVersion', '1.0.0', 'evidence', evidence, 'requirements', requirements)
  ));
update traceability_fixture set
  changed_evidence_hash = public.canonical_jsonb_sha256(changed_evidence),
  changed_request_hash = public.canonical_jsonb_sha256(jsonb_build_object(
    'ir', ir, 'presentation', presentation, 'diagram', diagram,
    'traceability', jsonb_build_object('schemaVersion', '1.0.0', 'evidence', changed_evidence, 'requirements', requirements)
  ));
grant select on traceability_fixture to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
select lives_ok($test$
  select * from public.migrate_guest_architecture_v2(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', (select request_hash from traceability_fixture), 'Traceability test',
    (select ir from traceability_fixture), (select ir_hash from traceability_fixture),
    (select presentation from traceability_fixture), (select presentation_hash from traceability_fixture),
    (select diagram from traceability_fixture), (select diagram_hash from traceability_fixture),
    'manual-edit', '1.1.0', '1.0.0',
    (select evidence from traceability_fixture), (select evidence_hash from traceability_fixture),
    (select requirements from traceability_fixture), (select requirements_hash from traceability_fixture), null
  )
$test$, 'traceable guest migration atomically persists both traceability artifacts');
select results_eq(
  $$select count(*)::bigint from public.read_architecture_traceability('99999999-9999-4999-8999-999999999999', 1)$$,
  array[1::bigint], 'owner can read linked traceability'
);
select is((select evidence_payload from public.read_architecture_traceability('99999999-9999-4999-8999-999999999999', 1)),
  (select evidence from traceability_fixture), 'evidence payload round-trips exactly');
select is((select requirement_payload from public.read_architecture_traceability('99999999-9999-4999-8999-999999999999', 1)),
  (select requirements from traceability_fixture), 'requirement payload round-trips exactly');
select lives_ok($test$
  select * from public.migrate_guest_architecture_v2(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', (select request_hash from traceability_fixture), 'Traceability test',
    (select ir from traceability_fixture), (select ir_hash from traceability_fixture),
    (select presentation from traceability_fixture), (select presentation_hash from traceability_fixture),
    (select diagram from traceability_fixture), (select diagram_hash from traceability_fixture),
    'manual-edit', '1.1.0', '1.0.0',
    (select evidence from traceability_fixture), (select evidence_hash from traceability_fixture),
    (select requirements from traceability_fixture), (select requirements_hash from traceability_fixture), null
  )
$test$, 'identical traceability migration safely replays');

reset role;
select is((select count(*)::integer from public.diagram_version_traceability), 1, 'replay does not duplicate traceability links');

set local role authenticated;
select set_config('request.jwt.claim.sub', '77777777-7777-4777-8777-777777777777', true);
select throws_ok($test$
  select * from public.migrate_guest_architecture_v2(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select changed_request_hash from traceability_fixture), 'Traceability test',
    (select ir from traceability_fixture), (select ir_hash from traceability_fixture),
    (select presentation from traceability_fixture), (select presentation_hash from traceability_fixture),
    (select diagram from traceability_fixture), (select diagram_hash from traceability_fixture),
    'manual-edit', '1.1.0', '1.0.0',
    (select changed_evidence from traceability_fixture), (select changed_evidence_hash from traceability_fixture),
    (select requirements from traceability_fixture), (select requirements_hash from traceability_fixture), null
  )
$test$, '22023', 'Traceability replay mismatch', 'an idempotency key cannot be replayed with different traceability');

select set_config('request.jwt.claim.sub', '88888888-8888-4888-8888-888888888888', true);
select throws_ok(
  $$select * from public.read_architecture_traceability('99999999-9999-4999-8999-999999999999', 1)$$,
  '42501', 'Diagram not found or access denied', 'another workspace cannot read traceability'
);

reset role;
select throws_ok(
  $$update public.diagram_version_traceability set evidence_blob_id = requirement_blob_id$$,
  'P0001', 'Immutable IR versions cannot be changed', 'traceability links cannot be rewritten'
);

select * from finish();
rollback;
