begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public, auth;

select plan(27);

create temp table admission_test_ids (
  first_job uuid,
  second_job uuid,
  third_job uuid,
  first_worker uuid not null default 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  second_worker uuid not null default 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);
insert into admission_test_ids default values;

select ok((select relrowsecurity from pg_class where oid = 'public.generation_rate_windows'::regclass), 'shared rate windows have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.generation_capacity_leases'::regclass), 'provider capacity leases have RLS');
select ok(not has_table_privilege('authenticated', 'public.generation_rate_windows', 'SELECT'), 'browser sessions cannot inspect shared counters');
select ok(not has_table_privilege('authenticated', 'public.generation_capacity_leases', 'SELECT'), 'browser sessions cannot inspect provider leases');
select ok(not has_function_privilege('authenticated', 'public.consume_shared_rate_limits(jsonb,integer,integer)', 'EXECUTE'), 'browser sessions cannot consume arbitrary shared scopes');
select ok(has_function_privilege('service_role', 'public.consume_shared_rate_limits(jsonb,integer,integer)', 'EXECUTE'), 'service role can enforce shared scopes');

select is(
  (select allowed from public.consume_shared_rate_limits(
    '[{"scope":"test:subject","requestLimit":1,"costLimit":5},{"scope":"test:provider","requestLimit":2,"costLimit":5}]'::jsonb,
    60, 2
  )), true, 'one transaction admits all available scopes'
);
select is(
  (select allowed from public.consume_shared_rate_limits(
    '[{"scope":"test:subject","requestLimit":1,"costLimit":5},{"scope":"test:provider","requestLimit":2,"costLimit":5}]'::jsonb,
    60, 2
  )), false, 'one exhausted scope rejects the complete admission request'
);
select is((select request_count from public.generation_rate_windows where scope_key = 'test:subject'), 1, 'the rejected request does not consume subject quota');
select is((select request_count from public.generation_rate_windows where scope_key = 'test:provider'), 1, 'the rejected request does not partially consume provider quota');

update admission_test_ids set first_job = (
  select job_id from public.create_generation_job(
    repeat('a', 64), null, null,
    '11111111-1111-4111-8111-111111111111',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Signed guest generation one"},"mode":"provider"}'::jsonb),
    '{"request":{"prompt":"Signed guest generation one"},"mode":"provider"}'::jsonb,
    'provider', 1, 5, 100, 600, 10
  )
);
select ok((select first_job is not null from admission_test_ids), 'a signed guest subject can create a durable job without a user row');
select is((select user_id from public.generation_jobs where id = (select first_job from admission_test_ids)), null, 'guest jobs remain detached from authenticated user records');
select results_eq(
  $$select job_id from public.create_generation_job(
    repeat('a', 64), null, null,
    '11111111-1111-4111-8111-111111111111',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Signed guest generation one"},"mode":"provider"}'::jsonb),
    '{"request":{"prompt":"Signed guest generation one"},"mode":"provider"}'::jsonb,
    'provider', 1, 5, 100, 600, 10)$$,
  $$select first_job from admission_test_ids$$,
  'idempotent job replay bypasses duplicate admission consumption'
);

select throws_ok(
  $$select * from public.create_generation_job(
    repeat('b', 64), null, null,
    '22222222-2222-4222-8222-222222222222',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Queue overflow"},"mode":"provider"}'::jsonb),
    '{"request":{"prompt":"Queue overflow"},"mode":"provider"}'::jsonb,
    'provider', 1, 5, 100, 600, 1)$$,
  'P0001', 'Generation queue capacity exceeded:30', 'queue admission rejects beyond the configured backlog'
);

update admission_test_ids set second_job = (
  select job_id from public.create_generation_job(
    repeat('b', 64), null, null,
    '22222222-2222-4222-8222-222222222222',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Provider capacity two"},"mode":"provider"}'::jsonb),
    '{"request":{"prompt":"Provider capacity two"},"mode":"provider"}'::jsonb,
    'provider', 1, 5, 100, 600, 10
  )
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from admission_test_ids), (select first_job from admission_test_ids), repeat('a', 64), 'openai', 55, 1, 10
  )), 1, 'the first worker reserves shared provider capacity'
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from admission_test_ids), (select second_job from admission_test_ids), repeat('b', 64), 'openai', 55, 1, 10
  )), 0, 'provider concurrency exhaustion leaves later work queued'
);
select is((select status from public.generation_jobs where id = (select second_job from admission_test_ids)), 'queued', 'capacity exhaustion reports honest queued state');
select ok(public.cancel_generation_job((select first_job from admission_test_ids), repeat('a', 64)), 'cancelling running work succeeds');
select is((select count(*)::integer from public.generation_capacity_leases), 0, 'cancellation immediately releases provider capacity');
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select second_worker from admission_test_ids), (select second_job from admission_test_ids), repeat('b', 64), 'openai', 55, 1, 10
  )), 1, 'queued work can acquire capacity after release'
);

select ok(public.cancel_generation_job((select second_job from admission_test_ids), repeat('b', 64)), 'the second capacity lease can be cancelled');
update admission_test_ids set third_job = (
  select job_id from public.create_generation_job(
    repeat('c', 64), null, null,
    '33333333-3333-4333-8333-333333333333',
    public.canonical_jsonb_sha256('{"request":{"prompt":"Cost bounded provider work"},"mode":"provider"}'::jsonb),
    '{"request":{"prompt":"Cost bounded provider work"},"mode":"provider"}'::jsonb,
    'provider', 2, 5, 100, 600, 10
  )
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from admission_test_ids), (select third_job from admission_test_ids), repeat('c', 64), 'openai', 55, 4, 1
  )), 0, 'a job stays queued when its reservation exceeds the shared cost ceiling'
);
select is(
  (select count(*)::integer from public.lease_generation_job(
    (select first_worker from admission_test_ids), (select third_job from admission_test_ids), repeat('c', 64), 'openai', 55, 4, 10
  )), 1, 'the job starts when concurrency and cost capacity are both available'
);
select lives_ok(
  format(
    $$select public.checkpoint_generation_job('%s', '%s', 1, 'layout', 94, '{"artifact":"ready"}'::jsonb, public.canonical_jsonb_sha256('{"artifact":"ready"}'::jsonb))$$,
    (select first_worker from admission_test_ids), (select third_job from admission_test_ids)
  ), 'the admitted worker can publish its final checkpoint'
);
select ok(
  public.complete_generation_job(
    (select first_worker from admission_test_ids), (select third_job from admission_test_ids), 1,
    '{"artifact":{"status":"verified"},"meta":{"usage":{"totalTokens":42}}}'::jsonb,
    public.canonical_jsonb_sha256('{"artifact":{"status":"verified"},"meta":{"usage":{"totalTokens":42}}}'::jsonb)
  ), 'the admitted worker can publish one current result'
);
select is((select actual_cost_units from public.generation_jobs where id = (select third_job from admission_test_ids)), 42::bigint, 'completion meters actual gateway usage');
select is((select count(*)::integer from public.generation_capacity_leases), 0, 'completion releases shared provider capacity');

select * from finish();
rollback;
