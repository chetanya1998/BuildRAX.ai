begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(12);

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

select * from finish();
rollback;
