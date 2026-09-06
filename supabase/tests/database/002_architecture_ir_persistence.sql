begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(26);

select ok((select relrowsecurity from pg_class where oid = 'public.artifact_blobs'::regclass), 'artifact blobs have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.architecture_ir_versions'::regclass), 'IR versions have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.diagram_version_artifacts'::regclass), 'artifact links have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.diagram_save_requests'::regclass), 'save requests have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.architecture_assets'::regclass), 'private asset verification records have RLS');
select ok(not has_table_privilege('authenticated', 'public.artifact_blobs', 'INSERT'), 'browser sessions cannot insert artifact blobs');
select ok(not has_table_privilege('authenticated', 'public.artifact_blobs', 'UPDATE'), 'browser sessions cannot mutate artifact blobs');
select ok(not has_table_privilege('authenticated', 'public.architecture_assets', 'INSERT'), 'browser sessions cannot forge verified private assets');
select is(public.canonical_jsonb_text('{"z":1,"a":{"y":2,"b":3}}'::jsonb), '{"a":{"b":3,"y":2},"z":1}', 'database canonical JSON matches the application encoder');
select is(public.canonical_jsonb_sha256('{"z":1,"a":{"y":2,"b":3}}'::jsonb), '10d6b907e50339871355376854e16e87112120f63b9ce9bca2913907cd2a124d', 'database and Web Crypto produce the same canonical checksum');

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ir-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ir-outsider@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

create temporary table architecture_fixture(
  ir jsonb, presentation_v1 jsonb, diagram_v1 jsonb, presentation_v2 jsonb, diagram_v2 jsonb,
  ir_hash text, presentation_v1_hash text, diagram_v1_hash text, presentation_v2_hash text, diagram_v2_hash text,
  guest_request_hash text, save_v1_request_hash text, save_v2_request_hash text,
  changed_diagram jsonb, changed_diagram_hash text, changed_request_hash text
);
insert into architecture_fixture(ir, presentation_v1, diagram_v1, presentation_v2, diagram_v2) values (
  '{"schemaVersion":"1.1.0","intent":{"title":"IR test","summary":"A complete blank test architecture.","archetype":"general","trafficProfile":"unknown"},"requirements":{"functional":["Allow a blank architecture."],"nonFunctional":[]},"constraints":{"preferredStack":[],"cloudProvider":"","multiTenant":false,"dataSensitivity":"unspecified"},"components":[],"flows":[],"assumptions":[],"decisions":[],"provenance":{"strategy":"manual-edit","compilerVersion":"1.1.0","catalogVersion":"1.0.0"}}'::jsonb,
  '{"schemaVersion":"1.0.0","theme":"light","viewport":{"x":0,"y":0,"zoom":1},"components":[],"flows":[],"primitives":[],"layerOrder":[]}'::jsonb,
  '{"schemaVersion":"1.0.0","id":"66666666-6666-4666-8666-666666666666","title":"IR persistence test","version":1,"createdAt":"2026-09-06T00:00:00Z","updatedAt":"2026-09-06T00:00:00Z","theme":"light","viewport":{"x":0,"y":0,"zoom":1},"nodes":[],"primitives":[],"connectors":[],"assumptions":[]}'::jsonb,
  '{"schemaVersion":"1.0.0","theme":"light","viewport":{"x":10,"y":0,"zoom":1},"components":[],"flows":[],"primitives":[],"layerOrder":[]}'::jsonb,
  '{"schemaVersion":"1.0.0","id":"66666666-6666-4666-8666-666666666666","title":"IR persistence test","version":2,"createdAt":"2026-09-06T00:00:00Z","updatedAt":"2026-09-06T00:00:01Z","theme":"light","viewport":{"x":10,"y":0,"zoom":1},"nodes":[],"primitives":[],"connectors":[],"assumptions":[]}'::jsonb
);
update architecture_fixture set
  ir_hash = public.canonical_jsonb_sha256(ir),
  presentation_v1_hash = public.canonical_jsonb_sha256(presentation_v1),
  diagram_v1_hash = public.canonical_jsonb_sha256(diagram_v1),
  presentation_v2_hash = public.canonical_jsonb_sha256(presentation_v2),
  diagram_v2_hash = public.canonical_jsonb_sha256(diagram_v2),
  guest_request_hash = public.canonical_jsonb_sha256(jsonb_build_object('ir', ir, 'presentation', presentation_v1, 'diagram', diagram_v1)),
  save_v1_request_hash = public.canonical_jsonb_sha256(jsonb_build_object('baseVersion', 1, 'baseIrVersion', 1, 'ir', ir, 'presentation', presentation_v1)),
  save_v2_request_hash = public.canonical_jsonb_sha256(jsonb_build_object('baseVersion', 1, 'baseIrVersion', 1, 'ir', ir, 'presentation', presentation_v2)),
  changed_diagram = jsonb_set(diagram_v1, '{title}', '"Changed"');
update architecture_fixture set changed_diagram_hash = public.canonical_jsonb_sha256(changed_diagram), changed_request_hash = public.canonical_jsonb_sha256(
  jsonb_build_object('ir', ir, 'presentation', presentation_v1, 'diagram', changed_diagram)
);
grant select on architecture_fixture to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select lives_ok($test$
  select * from public.migrate_guest_architecture(
    idempotency => '55555555-5555-4555-8555-555555555555',
    request_checksum => (select guest_request_hash from architecture_fixture),
    draft_title => 'IR persistence test',
    ir_payload => (select ir from architecture_fixture),
    ir_checksum => (select ir_hash from architecture_fixture),
    presentation_payload => (select presentation_v1 from architecture_fixture),
    presentation_checksum => (select presentation_v1_hash from architecture_fixture),
    diagram_payload => (select diagram_v1 from architecture_fixture),
    diagram_checksum => (select diagram_v1_hash from architecture_fixture),
    ir_provenance => 'manual-edit', compiler_version => '1.1.0', catalog_version => '1.0.0', ai_request_id => null
  )
$test$, 'guest migration atomically creates the artifact graph');

select results_eq(
  $$select count(*)::bigint from public.read_architecture_version('66666666-6666-4666-8666-666666666666', 1)$$,
  array[1::bigint],
  'owner can hydrate the current artifact graph'
);

select lives_ok($test$
  select * from public.migrate_guest_architecture(
    '55555555-5555-4555-8555-555555555555', (select guest_request_hash from architecture_fixture), 'IR persistence test',
    (select ir from architecture_fixture), (select ir_hash from architecture_fixture),
    (select presentation_v1 from architecture_fixture), (select presentation_v1_hash from architecture_fixture),
    (select diagram_v1 from architecture_fixture), (select diagram_v1_hash from architecture_fixture),
    'manual-edit', '1.1.0', '1.0.0', null
  )
$test$, 'identical guest migration replay returns the original result');

select throws_ok($test$
  select * from public.migrate_guest_architecture(
    '55555555-5555-4555-8555-555555555555', (select changed_request_hash from architecture_fixture), 'Changed request',
    (select ir from architecture_fixture), (select ir_hash from architecture_fixture),
    (select presentation_v1 from architecture_fixture), (select presentation_v1_hash from architecture_fixture),
    (select changed_diagram from architecture_fixture), (select changed_diagram_hash from architecture_fixture),
    'manual-edit', '1.1.0', '1.0.0', null
  )
$test$, '22023', 'Idempotency key was reused with different content', 'changed replay is rejected');

select lives_ok($test$
  select * from public.save_architecture_snapshot(
    '66666666-6666-4666-8666-666666666666', 1, 1,
    '88888888-8888-4888-8888-888888888888', (select save_v2_request_hash from architecture_fixture),
    (select ir from architecture_fixture), (select ir_hash from architecture_fixture),
    (select presentation_v2 from architecture_fixture), (select presentation_v2_hash from architecture_fixture),
    (select diagram_v2 from architecture_fixture), (select diagram_v2_hash from architecture_fixture),
    'manual-edit', '1.1.0', '1.0.0', null
  )
$test$, 'layout-only save creates a diagram checkpoint');

reset role;
select is((select current_version from public.diagrams where id = '66666666-6666-4666-8666-666666666666'), 2, 'diagram head advances');
select is((select current_ir_version from public.diagrams where id = '66666666-6666-4666-8666-666666666666'), 1, 'layout-only save reuses the IR head');
select is((select count(*)::integer from public.architecture_ir_versions where diagram_id = '66666666-6666-4666-8666-666666666666'), 1, 'layout save does not duplicate IR');

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select lives_ok($test$
  select public.persist_architecture_review(
    '66666666-6666-4666-8666-666666666666', 2, 1,
    '[{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","lens":"security","severity":"medium","rationale":"Encryption ownership is not explicit.","recommendation":"Assign key ownership.","affectedObjects":[]}]'::jsonb
  )
$test$, 'review is pinned to an exact IR and diagram version');
select lives_ok($test$
  select public.persist_architecture_document(
    '66666666-6666-4666-8666-666666666666', 2, 1, '# Architecture\n\nVersion-bound content.'
  )
$test$, 'documentation is pinned to an exact IR and diagram version');

reset role;
select is((select architecture_ir_version_id is not null from public.review_runs where diagram_id = '66666666-6666-4666-8666-666666666666' order by created_at desc limit 1), true, 'review stores the immutable IR link');
select is((select architecture_ir_version_id is not null from public.document_versions dv join public.documents d on d.id = dv.document_id where d.diagram_id = '66666666-6666-4666-8666-666666666666' order by dv.version desc limit 1), true, 'document stores the immutable IR link');

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select throws_ok($test$
  select * from public.save_architecture_snapshot(
    '66666666-6666-4666-8666-666666666666', 1, 1,
    '99999999-9999-4999-8999-999999999999', (select save_v1_request_hash from architecture_fixture),
    (select ir from architecture_fixture), (select ir_hash from architecture_fixture),
    (select presentation_v1 from architecture_fixture), (select presentation_v1_hash from architecture_fixture),
    (select diagram_v1 from architecture_fixture), (select diagram_v1_hash from architecture_fixture),
    'manual-edit', '1.1.0', '1.0.0', null
  )
$test$, '40001', 'Version conflict', 'stale save is rejected');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select throws_ok(
  $$select * from public.list_architecture_versions('66666666-6666-4666-8666-666666666666', 25, null)$$,
  '42501', 'Diagram not found or access denied', 'cross-tenant history is denied'
);

reset role;
select throws_ok(
  $$update public.architecture_ir_versions set provenance = 'restore' where diagram_id = '66666666-6666-4666-8666-666666666666'$$,
  'P0001', 'Immutable IR versions cannot be changed', 'IR history cannot be rewritten'
);
select results_eq(
  $$with scheduled as (select * from public.schedule_architecture_archives(now() + interval '31 days'))
    select count(*)::integer from public.artifact_archive_jobs aaj
    join public.diagram_version_artifacts dva on aaj.artifact_blob_id in (dva.presentation_blob_id, dva.diagram_blob_id)
    join public.diagram_versions dv on dv.id = dva.diagram_version_id
    join public.diagrams d on d.id = dv.diagram_id and d.current_version = dv.version
    cross join scheduled$$,
  array[0::integer],
  'current heads are excluded from archival'
);

select * from finish();
rollback;
