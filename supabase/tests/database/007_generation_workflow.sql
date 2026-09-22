begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(8);

insert into public.generation_jobs(
  id, subject_key, idempotency_key, request_checksum, request_payload, mode
) values (
  '77777777-7777-4777-8777-777777777777', repeat('7', 64),
  '88888888-8888-4888-8888-888888888888', repeat('8', 64),
  '{"request":{"prompt":"Verify the complete generation workflow"},"mode":"deterministic"}'::jsonb,
  'deterministic'
);

select lives_ok(
  $$update public.generation_jobs set current_stage = 'rules' where id = '77777777-7777-4777-8777-777777777777'$$,
  'generation jobs accept the rules stage'
);
select throws_ok(
  $$update public.generation_jobs set current_stage = 'invented' where id = '77777777-7777-4777-8777-777777777777'$$,
  '23514', null, 'generation jobs reject unknown workflow stages'
);
select lives_ok(
  $$insert into public.generation_job_stages(job_id, stage, payload, checksum)
    values ('77777777-7777-4777-8777-777777777777', 'rules', '{"rules":[]}'::jsonb,
      public.canonical_jsonb_sha256('{"rules":[]}'::jsonb))$$,
  'generation checkpoints accept deterministic rules output'
);
select is(
  (select stage from public.generation_job_stages where job_id = '77777777-7777-4777-8777-777777777777'),
  'rules', 'the rules checkpoint is persisted'
);
select throws_ok(
  $$insert into public.generation_job_stages(job_id, stage, payload, checksum)
    values ('77777777-7777-4777-8777-777777777777', 'invented', '{}'::jsonb, repeat('0', 64))$$,
  '23514', null, 'generation checkpoints reject unknown stages'
);
select throws_ok(
  $$update public.generation_job_stages set payload = '{"rules":["forged"]}'::jsonb
    where job_id = '77777777-7777-4777-8777-777777777777' and stage = 'rules'$$,
  'P0001', 'Immutable IR versions cannot be changed', 'rules checkpoints remain immutable'
);
select ok(
  not has_function_privilege('authenticated', 'public.checkpoint_generation_job(uuid,uuid,integer,text,integer,jsonb,text)', 'EXECUTE'),
  'browser sessions cannot forge a rules checkpoint'
);
select ok(
  has_function_privilege('service_role', 'public.checkpoint_generation_job(uuid,uuid,integer,text,integer,jsonb,text)', 'EXECUTE'),
  'the service worker can publish workflow checkpoints'
);

select * from finish();
rollback;
