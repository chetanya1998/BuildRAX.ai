begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(41);

create temp table generation_test_ids (
  owner_id uuid not null default '33333333-3333-3333-3333-333333333333',
  outsider_id uuid not null default '44444444-4444-4444-4444-444444444444',
  subject_key text,
  first_job uuid,
  second_job uuid,
  first_worker uuid not null default '11111111-1111-4111-8111-111111111111',
  second_worker uuid not null default '22222222-2222-4222-8222-222222222222'
);
insert into generation_test_ids default values;
grant select on generation_test_ids to authenticated;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select owner_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'jobs-owner@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now() from generation_test_ids
union all
select outsider_id, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'jobs-outsider@example.test', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now() from generation_test_ids;

update generation_test_ids set subject_key = encode(extensions.digest(convert_to('user:' || owner_id::text, 'UTF8'), 'sha256'), 'hex');

select ok((select relrowsecurity from pg_class where oid = 'public.generation_jobs'::regclass), 'generation jobs have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.generation_job_stages'::regclass), 'generation checkpoints have RLS');
select ok(not has_table_privilege('authenticated', 'public.generation_jobs', 'INSERT'), 'browser sessions cannot create generation jobs directly');
select ok(not has_table_privilege('authenticated', 'public.generation_jobs', 'UPDATE'), 'browser sessions cannot mutate generation jobs directly');
select ok(not has_table_privilege('authenticated', 'public.generation_job_stages', 'INSERT'), 'browser sessions cannot forge checkpoints');
select ok(not has_function_privilege('authenticated', 'public.create_generation_job(text,uuid,uuid,uuid,text,jsonb,text)', 'EXECUTE'), 'browser sessions cannot call job creation');
select ok(has_function_privilege('service_role', 'public.create_generation_job(text,uuid,uuid,uuid,text,jsonb,text)', 'EXECUTE'), 'service role can create jobs');
select ok(not has_function_privilege('authenticated', 'public.list_queued_generation_jobs(integer)', 'EXECUTE'), 'browser sessions cannot enumerate the worker queue');
select ok(has_function_privilege('service_role', 'public.list_queued_generation_jobs(integer)', 'EXECUTE'), 'service role can read a bounded worker batch');

update generation_test_ids set first_job = (
  select job_id from public.create_generation_job(
    (select subject_key from generation_test_ids),
    (select owner_id from generation_test_ids),
    null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic'
  )
);
select ok((select first_job is not null from generation_test_ids), 'creation returns a durable generation job');

select results_eq(
  $$select job_id from public.create_generation_job(
    (select subject_key from generation_test_ids),
    (select owner_id from generation_test_ids), null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A durable architecture generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic')$$,
  $$select first_job from generation_test_ids$$,
  'an idempotent replay returns the original job'
);
select is((select count(*)::integer from public.generation_jobs), 1, 'idempotent replay does not duplicate work');
select throws_ok(
  $$select * from public.create_generation_job(
    (select subject_key from generation_test_ids),
    (select owner_id from generation_test_ids), null,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    public.canonical_jsonb_sha256('{"request":{"prompt":"A conflicting generation request"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"A conflicting generation request"},"mode":"deterministic"}'::jsonb,
    'deterministic')$$,
  '22023', 'Idempotency key conflict', 'an idempotency key cannot be reused for different input'
);
select throws_ok(
  $$select * from public.create_generation_job(
    repeat('f', 64), (select owner_id from generation_test_ids), null,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Invalid identity binding"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"Invalid identity binding"},"mode":"deterministic"}'::jsonb,
    'deterministic')$$,
  '22023', 'Invalid generation job request', 'the database rejects a subject not bound to its user'
);

select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids), (select subject_key from generation_test_ids), 55
  )), 1, 'one worker acquires the queued job lease'
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from generation_test_ids), (select first_job from generation_test_ids), (select subject_key from generation_test_ids), 55
  )), 0, 'a duplicate worker cannot acquire a running job'
);
select lives_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 1, 'evidence', 14, '{"schemaVersion":"1.0.0"}'::jsonb, public.canonical_jsonb_sha256('{"schemaVersion":"1.0.0"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ), 'the active lease can publish an immutable checkpoint'
);
select is((select count(*)::integer from public.generation_job_stages), 1, 'the generation checkpoint is persisted');
select lives_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 1, 'evidence', 14, '{"schemaVersion":"1.0.0"}'::jsonb, public.canonical_jsonb_sha256('{"schemaVersion":"1.0.0"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ), 'an identical checkpoint replay is idempotent'
);
select throws_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 1, 'evidence', 14, '{"schemaVersion":"different"}'::jsonb, public.canonical_jsonb_sha256('{"schemaVersion":"different"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ), '22023', 'Generation checkpoint replay mismatch', 'a checkpoint cannot be replaced with different content'
);
select lives_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 1, 'layout', 94, '{"artifact":"ready"}'::jsonb, public.canonical_jsonb_sha256('{"artifact":"ready"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ), 'the active worker can publish the final checkpoint'
);
select ok(public.cancel_generation_job((select first_job from generation_test_ids), (select subject_key from generation_test_ids)), 'the owning subject can cancel active work');
select is((select run_version from public.generation_jobs where id = (select first_job from generation_test_ids)), 2, 'cancellation invalidates the worker run version');
select throws_ok(
  format(
    $$select public.complete_generation_job('%s', '%s', 1, '{"result":"stale"}'::jsonb, public.canonical_jsonb_sha256('{"result":"stale"}'::jsonb))$$,
    (select first_worker from generation_test_ids), (select first_job from generation_test_ids)
  ), '40001', 'Stale generation worker', 'a cancelled worker cannot publish a stale result'
);
select ok(public.retry_generation_job((select first_job from generation_test_ids), (select subject_key from generation_test_ids)), 'a cancelled job can be requeued');
select is((select count(*)::integer from public.generation_job_stages), 2, 'retry keeps valid completed checkpoints');
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from generation_test_ids), (select first_job from generation_test_ids), (select subject_key from generation_test_ids), 55
  )), 1, 'a retried job resumes under a fresh lease'
);
select is((select run_version from public.generation_jobs where id = (select first_job from generation_test_ids)), 3, 'retry runs under a new version');
select lives_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 3, 'layout', 94, '{"artifact":"ready"}'::jsonb, public.canonical_jsonb_sha256('{"artifact":"ready"}'::jsonb))$$,
    (select second_worker from generation_test_ids), (select first_job from generation_test_ids)
  ), 'the resumed worker can publish the layout checkpoint'
);
select ok(
  public.complete_generation_job(
    (select second_worker from generation_test_ids), (select first_job from generation_test_ids), 3,
    '{"artifact":{"status":"verified"}}'::jsonb,
    public.canonical_jsonb_sha256('{"artifact":{"status":"verified"}}'::jsonb)
  ), 'the current worker can publish one validated result'
);
select is((select status from public.generation_jobs where id = (select first_job from generation_test_ids)), 'completed', 'the job reaches completed status');
select is(public.cancel_generation_job((select first_job from generation_test_ids), (select subject_key from generation_test_ids)), false, 'completed work cannot be cancelled');
select is(public.retry_generation_job((select first_job from generation_test_ids), (select subject_key from generation_test_ids)), false, 'completed work cannot be retried');

set local role authenticated;
select set_config('request.jwt.claim.sub', (select owner_id::text from generation_test_ids), true);
select is((select count(*)::integer from public.generation_jobs), 1, 'the owner can read their generation job through RLS');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select outsider_id::text from generation_test_ids), true);
select is((select count(*)::integer from public.generation_jobs), 0, 'another user cannot read the generation job');
select is((select count(*)::integer from public.generation_job_stages), 0, 'another user cannot read generation checkpoints');

reset role;
update generation_test_ids set second_job = (
  select job_id from public.create_generation_job(
    (select subject_key from generation_test_ids),
    (select owner_id from generation_test_ids), null,
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Recover an expired generation lease"},"mode":"deterministic"}'::jsonb),
    '{"request":{"prompt":"Recover an expired generation lease"},"mode":"deterministic"}'::jsonb,
    'deterministic'
  )
);
select ok((select second_job is not null from generation_test_ids), 'a second durable job is created for lease recovery');
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from generation_test_ids), (select second_job from generation_test_ids), (select subject_key from generation_test_ids), 55
  )), 1, 'the second job obtains a lease before simulated interruption'
);
update public.generation_jobs set leased_until = clock_timestamp() - interval '1 second' where id = (select second_job from generation_test_ids);
select is(
  public.fail_generation_job(
    (select first_worker from generation_test_ids), (select second_job from generation_test_ids), 1, 'late_worker', 'stale failure'
  ), false, 'an expired worker cannot overwrite job status with a late failure'
);
select results_eq(
  $$select id from public.list_queued_generation_jobs(2) where id = (select second_job from generation_test_ids)$$,
  $$select second_job from generation_test_ids$$,
  'the bounded queue reader recovers an expired worker lease'
);
select is((select status from public.generation_jobs where id = (select second_job from generation_test_ids)), 'queued', 'expired work returns to queued status');

select * from finish();
rollback;
