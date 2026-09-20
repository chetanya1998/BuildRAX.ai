begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(30);

create temp table generation_test_ids (
  first_job uuid,
  second_job uuid,
  first_worker uuid not null default '11111111-1111-4111-8111-111111111111',
  second_worker uuid not null default '22222222-2222-4222-8222-222222222222'
);
insert into generation_test_ids default values;

select ok((select relrowsecurity from pg_class where oid = 'public.generation_jobs'::regclass), 'generation jobs have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.generation_job_stages'::regclass), 'generation checkpoints have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.generation_capacity_leases'::regclass), 'capacity leases have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.generation_rate_windows'::regclass), 'shared rate windows have RLS');
select ok(not has_table_privilege('authenticated', 'public.generation_jobs', 'INSERT'), 'browser sessions cannot create generation jobs directly');
select ok(not has_table_privilege('authenticated', 'public.generation_jobs', 'UPDATE'), 'browser sessions cannot mutate generation jobs directly');
select ok(not has_table_privilege('authenticated', 'public.generation_job_stages', 'INSERT'), 'browser sessions cannot forge checkpoints');
select ok(not has_function_privilege('authenticated', 'public.create_generation_job(text,uuid,uuid,uuid,text,jsonb,text,integer,integer,integer,integer)', 'EXECUTE'), 'browser sessions cannot call server admission');
select ok(has_function_privilege('service_role', 'public.create_generation_job(text,uuid,uuid,uuid,text,jsonb,text,integer,integer,integer,integer)', 'EXECUTE'), 'service role can call server admission');

select results_eq(
  $$select allowed from public.consume_shared_rate_limit('test:single-window', 1, 600, 1, 1)$$,
  array[true],
  'first shared rate-limit request is admitted'
);
select results_eq(
  $$select allowed from public.consume_shared_rate_limit('test:single-window', 1, 600, 1, 1)$$,
  array[false],
  'request and cost ceilings reject a later request in the same shared window'
);

update generation_test_ids set first_job = (
  select job_id from public.create_generation_job(
    repeat('a', 64), null, null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic', 0, 5, 600, 10
  )
);
select ok((select first_job is not null from generation_test_ids), 'admission creates a durable generation job');

select results_eq(
  $$select job_id from public.create_generation_job(
    repeat('a', 64), null, null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic', 0, 5, 600, 10
  )$$,
  $$select first_job from generation_test_ids$$,
  'an idempotent replay returns the original job'
);
select is((select count(*)::integer from public.generation_jobs), 1, 'idempotent replay does not duplicate work');
select throws_ok(
  $$select * from public.create_generation_job(
    repeat('a', 64), null, null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A conflicting generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A conflicting generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic', 0, 5, 600, 10
  )$$,
  '22023', 'Idempotency key conflict', 'an idempotency key cannot be reused for different input'
);

select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids), repeat('a', 64),
    'deterministic', 55, 1, 10
  )),
  1,
  'one worker acquires the queued job lease'
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from generation_test_ids), (select first_job from generation_test_ids), repeat('a', 64),
    'deterministic', 55, 1, 10
  )),
  0,
  'a duplicate worker cannot acquire a running job'
);
select lives_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 1, 'evidence', 12, '{"schemaVersion":"evidence-ir-v1"}'::jsonb, public.canonical_jsonb_sha256('{"schemaVersion":"evidence-ir-v1"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ),
  'the active lease can publish an immutable checkpoint'
);
select is((select count(*)::integer from public.generation_job_stages), 1, 'the generation checkpoint is persisted');
select ok(public.cancel_generation_job((select first_job from generation_test_ids), repeat('a', 64)), 'the owning subject can cancel active work');
select is((select run_version from public.generation_jobs where id = (select first_job from generation_test_ids)), 2, 'cancellation invalidates the worker run version');
select throws_ok(
  format(
    $$select public.complete_generation_job('%s', '%s', 1, '{"result":"stale"}'::jsonb, public.canonical_jsonb_sha256('{"result":"stale"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ),
  '40001', 'Stale generation worker', 'a cancelled worker cannot publish a stale result'
);
select ok(public.retry_generation_job((select first_job from generation_test_ids), repeat('a', 64)), 'a cancelled job can be requeued');
select is((select count(*)::integer from public.generation_job_stages), 1, 'retry keeps valid completed checkpoints');

update generation_test_ids set second_job = (
  select job_id from public.create_generation_job(
    repeat('b', 64), null, null,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A second durable generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A second durable generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic', 0, 5, 600, 10
  )
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids), repeat('a', 64),
    'deterministic', 55, 1, 10
  )),
  1,
  'a retried job resumes under a fresh lease'
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from generation_test_ids), (select second_job from generation_test_ids), repeat('b', 64),
    'deterministic', 55, 1, 10
  )),
  0,
  'provider concurrency is enforced across subjects'
);
select is((select status from public.generation_jobs where id = (select second_job from generation_test_ids)), 'queued', 'capacity rejection leaves work safely queued');
select ok(
  public.complete_generation_job(
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids), 3,
    '{"meta":{"usage":{"totalTokens":42}},"artifact":{"status":"verified"}}'::jsonb,
    public.canonical_jsonb_sha256('{"meta":{"usage":{"totalTokens":42}},"artifact":{"status":"verified"}}'::jsonb)
  ),
  'the current worker can publish one validated result'
);
select is((select actual_cost_units from public.generation_jobs where id = (select first_job from generation_test_ids)), 42::bigint, 'actual gateway usage is persisted for metering');
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from generation_test_ids), (select second_job from generation_test_ids), repeat('b', 64),
    'deterministic', 55, 1, 10
  )),
  1,
  'publishing releases shared provider capacity for queued work'
);

select * from finish();
rollback;
