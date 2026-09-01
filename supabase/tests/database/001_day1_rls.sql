begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(10);

create temp table test_ids (
  owner_id uuid not null,
  outsider_id uuid not null,
  workspace_id uuid,
  outsider_workspace_id uuid,
  project_id uuid not null,
  outsider_project_id uuid not null,
  diagram_id uuid not null,
  review_id uuid not null,
  document_id uuid not null
);

insert into test_ids(owner_id, outsider_id, project_id, outsider_project_id, diagram_id, review_id, document_id)
values (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select owner_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'day1-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now() from test_ids
union all
select outsider_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'day1-outsider@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now() from test_ids;

update test_ids set
  workspace_id = (select workspace_id from public.workspace_members where user_id = owner_id),
  outsider_workspace_id = (select workspace_id from public.workspace_members where user_id = outsider_id);

insert into public.projects(id, workspace_id, name, created_by)
select project_id, workspace_id, 'Day 1 owner project', owner_id from test_ids
union all
select outsider_project_id, outsider_workspace_id, 'Day 1 outsider project', outsider_id from test_ids;

insert into public.diagrams(id, project_id, title, created_by)
select diagram_id, project_id, 'Day 1 diagram', owner_id from test_ids;

insert into public.review_runs(id, diagram_id, diagram_version, created_by)
select review_id, diagram_id, 1, owner_id from test_ids;

insert into public.documents(id, diagram_id, created_by)
select document_id, diagram_id, owner_id from test_ids;

select ok((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), 'projects has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.diagram_versions'::regclass), 'diagram_versions has RLS enabled');

set local role authenticated;
select set_config('request.jwt.claim.sub', (select owner_id::text from test_ids), true);
select results_eq(
  $$select count(*)::bigint from public.projects where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  array[1::bigint],
  'workspace owner can read their project'
);
select lives_ok(
  $$select * from public.save_diagram_version('cccccccc-cccc-cccc-cccc-cccccccccccc', 1, jsonb_build_object('id', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'title', 'Saved by owner'), '0123456789abcdef')$$,
  'workspace owner can create a new version'
);
select throws_ok(
  $$select * from public.save_diagram_version('cccccccc-cccc-cccc-cccc-cccccccccccc', 2, jsonb_build_object('id', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'title', 'Wrong id'), '0123456789abcdef')$$,
  '22023',
  'Diagram payload does not match target diagram',
  'diagram RPC rejects a payload for another diagram'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select outsider_id::text from test_ids), true);
select results_eq(
  $$select count(*)::bigint from public.projects where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  array[0::bigint],
  'non-member cannot read another workspace project'
);
select throws_ok(
  $$insert into public.review_runs(id, diagram_id, diagram_version, created_by) values ('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, '22222222-2222-2222-2222-222222222222')$$,
  '42501',
  'new row violates row-level security policy for table "review_runs"',
  'non-member cannot create a review for another workspace diagram'
);
select throws_ok(
  $$insert into public.documents(id, diagram_id, created_by) values ('88888888-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222')$$,
  '42501',
  'new row violates row-level security policy for table "documents"',
  'non-member cannot create documentation for another workspace diagram'
);
select results_eq(
  $$with attempted as (update public.projects set name = 'Attempted takeover' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id) select count(*)::bigint from attempted$$,
  array[0::bigint],
  'non-member cannot update another workspace project'
);
select throws_ok(
  $$select * from public.save_diagram_version('cccccccc-cccc-cccc-cccc-cccccccccccc', 2, jsonb_build_object('id', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'title', 'Attempted takeover'), '0123456789abcdef')$$,
  '42501',
  'Diagram not found or access denied',
  'non-member cannot save another workspace diagram'
);

select * from finish();
rollback;
