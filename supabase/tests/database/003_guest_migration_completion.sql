begin;
create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('12121212-1212-4212-8212-121212121212', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'migration-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('13131313-1313-4313-8313-131313131313', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'migration-outsider@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.ai_runs(user_id, kind, provider, model, status, duration_ms, request_id, prompt_version, attempts)
values('12121212-1212-4212-8212-121212121212', 'generation', 'fixture', 'fixture', 'completed', 1,
  '14141414-1414-4414-8414-141414141414', 'architecture-v1', 1);

create temporary table complete_fixture as select
  '{"schemaVersion":"1.1.0","intent":{"title":"Complete migration","summary":"A complete migration fixture.","archetype":"general","trafficProfile":"unknown"},"requirements":{"functional":["Preserve the complete draft."],"nonFunctional":[]},"constraints":{"preferredStack":[],"cloudProvider":"","multiTenant":false,"dataSensitivity":"unspecified"},"components":[],"flows":[],"assumptions":[],"decisions":[],"provenance":{"strategy":"manual-edit","compilerVersion":"1.1.0","catalogVersion":"1.0.0"}}'::jsonb ir,
  '{"schemaVersion":"1.0.0","theme":"light","viewport":{"x":0,"y":0,"zoom":1},"components":[],"flows":[],"primitives":[],"layerOrder":[]}'::jsonb presentation,
  '{"schemaVersion":"1.0.0","id":"15151515-1515-4515-8515-151515151515","title":"Complete migration","version":1,"createdAt":"2026-09-11T00:00:00Z","updatedAt":"2026-09-11T00:00:00Z","theme":"light","viewport":{"x":0,"y":0,"zoom":1},"nodes":[],"primitives":[],"connectors":[],"assumptions":[]}'::jsonb diagram;
alter table complete_fixture add column origin jsonb;
update complete_fixture set origin = jsonb_build_object('ir', ir, 'presentation', presentation, 'diagram', diagram);
alter table complete_fixture
  add column request_hash text,
  add column ir_hash text,
  add column presentation_hash text,
  add column diagram_hash text,
  add column origin_hash text;
update complete_fixture set
  request_hash = public.canonical_jsonb_sha256(jsonb_build_object('ir', ir, 'presentation', presentation, 'diagram', diagram)),
  ir_hash = public.canonical_jsonb_sha256(ir),
  presentation_hash = public.canonical_jsonb_sha256(presentation),
  diagram_hash = public.canonical_jsonb_sha256(diagram),
  origin_hash = public.canonical_jsonb_sha256(origin);
grant select on complete_fixture to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '12121212-1212-4212-8212-121212121212', true);
select lives_ok($test$
  select * from public.migrate_guest_architecture_complete(
    '16161616-1616-4616-8616-161616161616',
    (select request_hash from complete_fixture),
    'Complete migration', (select ir from complete_fixture), (select ir_hash from complete_fixture),
    (select presentation from complete_fixture), (select presentation_hash from complete_fixture),
    (select diagram from complete_fixture), (select diagram_hash from complete_fixture),
    'manual-edit', '1.1.0', '1.0.0', '# Migrated document', (select origin from complete_fixture),
    (select origin_hash from complete_fixture), '14141414-1414-4414-8414-141414141414')
$test$, 'complete migration commits snapshot, document, and generation origin');

select is((select dv.markdown from public.document_versions dv join public.documents d on d.id=dv.document_id where d.diagram_id='15151515-1515-4515-8515-151515151515'), '# Migrated document', 'editable document is retained');
select is((select artifact_checksum from public.diagram_generation_origins where diagram_id='15151515-1515-4515-8515-151515151515'), (select origin_hash from complete_fixture), 'signed generation origin is retained');
select lives_ok($test$
  select * from public.migrate_guest_architecture_complete(
    '16161616-1616-4616-8616-161616161616',
    (select request_hash from complete_fixture),
    'Complete migration', (select ir from complete_fixture), (select ir_hash from complete_fixture),
    (select presentation from complete_fixture), (select presentation_hash from complete_fixture),
    (select diagram from complete_fixture), (select diagram_hash from complete_fixture),
    'manual-edit', '1.1.0', '1.0.0', '# Migrated document', (select origin from complete_fixture),
    (select origin_hash from complete_fixture), '14141414-1414-4414-8414-141414141414')
$test$, 'identical complete migration safely replays');
select is((select count(*)::integer from public.documents where diagram_id='15151515-1515-4515-8515-151515151515'), 1, 'replay does not duplicate the document');
select is((select count(*)::integer from public.diagram_generation_origins where diagram_id='15151515-1515-4515-8515-151515151515'), 1, 'replay does not duplicate generation lineage');

reset role;
select throws_ok($$delete from public.diagram_generation_origins where diagram_id='15151515-1515-4515-8515-151515151515'$$, 'P0001', 'Immutable IR versions cannot be changed', 'generation lineage is immutable');
set local role authenticated;
select set_config('request.jwt.claim.sub', '13131313-1313-4313-8313-131313131313', true);
select is((select count(*)::integer from public.diagram_generation_origins), 0, 'another workspace cannot read generation lineage');

select * from finish();
rollback;
