-- O01: shared request windows, signed guest-compatible jobs, and provider
-- concurrency/cost admission. All mutable entrypoints remain service-role only.

alter table public.generation_jobs alter column user_id drop not null;
alter table public.generation_jobs
  add column estimated_cost_units integer not null default 0 check (estimated_cost_units between 0 and 1000000),
  add column actual_cost_units bigint not null default 0 check (actual_cost_units >= 0);

create table public.generation_rate_windows (
  scope_key text not null check (char_length(scope_key) between 1 and 200),
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  cost_units bigint not null default 0 check (cost_units >= 0),
  expires_at timestamptz not null,
  primary key(scope_key, bucket_start)
);
create index generation_rate_expiry_idx on public.generation_rate_windows(expires_at);

create table public.generation_capacity_leases (
  job_id uuid primary key references public.generation_jobs(id) on delete cascade,
  provider text not null check (char_length(provider) between 1 and 80),
  lease_owner uuid not null,
  run_version integer not null,
  cost_units integer not null default 0 check (cost_units >= 0),
  leased_until timestamptz not null,
  created_at timestamptz not null default now()
);
create index generation_capacity_provider_idx on public.generation_capacity_leases(provider, leased_until);

alter table public.generation_rate_windows enable row level security;
alter table public.generation_capacity_leases enable row level security;
revoke all on public.generation_rate_windows, public.generation_capacity_leases from public, anon, authenticated;

create or replace function public.consume_shared_rate_limits(
  scope_requests jsonb,
  window_seconds integer,
  requested_cost_units integer default 0
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = '' as $$
declare
  bucket timestamptz;
  bucket_end timestamptz;
  request jsonb;
  requested_scope text;
  request_limit integer;
  cost_limit bigint;
  observed public.generation_rate_windows%rowtype;
  minimum_remaining integer := 2147483647;
  retry_seconds integer;
begin
  if jsonb_typeof(scope_requests) <> 'array' or jsonb_array_length(scope_requests) not between 1 and 8
    or window_seconds not between 1 and 86400
    or requested_cost_units not between 0 and 1000000 then
    raise exception 'Invalid shared rate limit request' using errcode = '22023';
  end if;

  bucket := to_timestamp(floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds);
  bucket_end := bucket + make_interval(secs => window_seconds);
  retry_seconds := greatest(1, ceil(extract(epoch from (bucket_end - clock_timestamp())))::integer);

  -- Acquire every scope lock in a stable order so the decision and all writes
  -- are one transaction: a rejected provider scope cannot consume user quota.
  for request in
    select value from jsonb_array_elements(scope_requests) order by value->>'scope'
  loop
    requested_scope := request->>'scope';
    request_limit := (request->>'requestLimit')::integer;
    cost_limit := (request->>'costLimit')::bigint;
    if requested_scope is null or char_length(requested_scope) not between 1 and 200
      or request_limit not between 1 and 100000
      or cost_limit < requested_cost_units or cost_limit > 1000000000 then
      raise exception 'Invalid shared rate limit scope' using errcode = '22023';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('rate:' || requested_scope));
  end loop;

  delete from public.generation_rate_windows
    where expires_at <= clock_timestamp()
      and scope_key in (select value->>'scope' from jsonb_array_elements(scope_requests));

  for request in select value from jsonb_array_elements(scope_requests)
  loop
    requested_scope := request->>'scope';
    request_limit := (request->>'requestLimit')::integer;
    cost_limit := (request->>'costLimit')::bigint;
    select * into observed from public.generation_rate_windows
      where scope_key = requested_scope and bucket_start = bucket;
    if observed.scope_key is not null
      and (observed.request_count >= request_limit or observed.cost_units + requested_cost_units > cost_limit) then
      return query select false, 0, retry_seconds;
      return;
    end if;
    observed := null;
  end loop;

  for request in select value from jsonb_array_elements(scope_requests)
  loop
    requested_scope := request->>'scope';
    request_limit := (request->>'requestLimit')::integer;
    insert into public.generation_rate_windows(scope_key, bucket_start, request_count, cost_units, expires_at)
    values(requested_scope, bucket, 1, requested_cost_units, bucket_end)
    on conflict (scope_key, bucket_start) do update
      set request_count = public.generation_rate_windows.request_count + 1,
          cost_units = public.generation_rate_windows.cost_units + requested_cost_units,
          expires_at = excluded.expires_at
    returning * into observed;
    minimum_remaining := least(minimum_remaining, greatest(0, request_limit - observed.request_count));
  end loop;

  return query select true, minimum_remaining, retry_seconds;
end;
$$;

create or replace function public.create_generation_job(
  target_subject text,
  target_user uuid,
  target_workspace uuid,
  idempotency uuid,
  request_checksum text,
  request_payload jsonb,
  generation_mode text,
  estimated_cost_units integer,
  subject_request_limit integer,
  workspace_request_limit integer,
  window_seconds integer,
  queue_limit integer
)
returns table(job_id uuid, job_status text, job_progress integer, retry_after_seconds integer)
language plpgsql security definer set search_path = '' as $$
declare
  existing public.generation_jobs%rowtype;
  created public.generation_jobs%rowtype;
  admission record;
  scopes jsonb;
begin
  if target_subject !~ '^[a-f0-9]{64}$' or idempotency is null
    or request_checksum !~ '^[a-f0-9]{64}$'
    or request_checksum <> public.canonical_jsonb_sha256(request_payload)
    or generation_mode not in ('auto', 'deterministic', 'provider')
    or estimated_cost_units not between 0 and 1000000
    or subject_request_limit not between 1 and 100000
    or workspace_request_limit not between 1 and 100000
    or window_seconds not between 1 and 86400
    or queue_limit not between 1 and 10000
    or (target_user is null and target_workspace is not null) then
    raise exception 'Invalid generation job request' using errcode = '22023';
  end if;
  if target_user is not null
    and target_subject <> encode(extensions.digest(convert_to('user:' || target_user::text, 'UTF8'), 'sha256'), 'hex') then
    raise exception 'Invalid generation job request' using errcode = '22023';
  end if;
  if target_workspace is not null and not exists (
    select 1 from public.workspace_members wm
      where wm.workspace_id = target_workspace and wm.user_id = target_user and wm.role in ('owner', 'editor')
  ) then
    raise exception 'Invalid generation workspace' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('generation-queue'));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('generation-subject:' || target_subject));
  select * into existing from public.generation_jobs gj
    where gj.subject_key = target_subject and gj.idempotency_key = idempotency;
  if existing.id is not null then
    if existing.request_checksum <> request_checksum then
      raise exception 'Idempotency key conflict' using errcode = '22023';
    end if;
    return query select existing.id, existing.status, existing.progress::integer, 0;
    return;
  end if;

  scopes := jsonb_build_array(jsonb_build_object(
    'scope', 'generation:subject:' || target_subject,
    'requestLimit', subject_request_limit,
    'costLimit', 1000000000
  ));
  if target_workspace is not null then
    scopes := scopes || jsonb_build_array(jsonb_build_object(
      'scope', 'generation:workspace:' || target_workspace::text,
      'requestLimit', workspace_request_limit,
      'costLimit', 1000000000
    ));
  end if;
  select * into admission from public.consume_shared_rate_limits(scopes, window_seconds, estimated_cost_units);
  if not admission.allowed then
    raise exception 'Shared generation rate limit exceeded:%', admission.retry_after_seconds using errcode = 'P0001';
  end if;
  if (select count(*) from public.generation_jobs where status = 'queued') >= queue_limit then
    raise exception 'Generation queue capacity exceeded:%', 30 using errcode = 'P0001';
  end if;

  insert into public.generation_jobs(
    subject_key, user_id, workspace_id, idempotency_key, request_checksum,
    request_payload, mode, estimated_cost_units
  ) values(
    target_subject, target_user, target_workspace, idempotency, request_checksum,
    request_payload, generation_mode, estimated_cost_units
  ) returning * into created;
  return query select created.id, created.status, created.progress::integer, admission.retry_after_seconds;
end;
$$;

-- Preserve B07's SQL call shape for migrations/tests while routing it through
-- the same O01 admission transaction. The app uses the expanded signature.
create or replace function public.create_generation_job(
  target_subject text, target_user uuid, target_workspace uuid, idempotency uuid,
  request_checksum text, request_payload jsonb, generation_mode text
)
returns table(job_id uuid, job_status text, job_progress integer)
language sql security definer set search_path = '' as $$
  select job_id, job_status, job_progress
    from public.create_generation_job(
      target_subject, target_user, target_workspace, idempotency, request_checksum,
      request_payload, generation_mode, 0, 100000, 100000, 600, 10000
    );
$$;

create or replace function public.lease_generation_job(
  worker_id uuid,
  target_job uuid,
  target_subject text,
  provider_name text,
  lease_seconds integer,
  max_concurrency integer,
  max_cost_units integer
)
returns table(job_id uuid, request_payload jsonb, generation_mode text, resume_stage text, run_version integer, attempts integer)
language plpgsql security definer set search_path = '' as $$
declare target public.generation_jobs%rowtype;
begin
  if worker_id is null or target_job is null or target_subject !~ '^[a-f0-9]{64}$'
    or char_length(provider_name) not between 1 and 80 or lease_seconds not between 5 and 300
    or max_concurrency not between 1 and 1000 or max_cost_units not between 0 and 1000000 then
    raise exception 'Invalid generation lease request' using errcode = '22023';
  end if;
  delete from public.generation_capacity_leases where leased_until <= clock_timestamp();
  update public.generation_jobs set status = case when cancel_requested then 'cancelled' else 'queued' end,
    lease_owner = null, leased_until = null, updated_at = clock_timestamp()
    where status = 'running' and leased_until <= clock_timestamp();

  select * into target from public.generation_jobs
    where id = target_job and subject_key = target_subject for update;
  if target.id is null or target.status <> 'queued' or target.cancel_requested or target.attempts >= 12 then return; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('generation-provider:' || provider_name));
  if (select count(*) from public.generation_capacity_leases where provider = provider_name) >= max_concurrency
    or coalesce((select sum(cost_units) from public.generation_capacity_leases where provider = provider_name), 0)
      + target.estimated_cost_units > max_cost_units then
    return;
  end if;

  update public.generation_jobs as gj set status = 'running', lease_owner = worker_id,
    leased_until = clock_timestamp() + make_interval(secs => lease_seconds),
    attempts = gj.attempts + 1, updated_at = clock_timestamp()
    where gj.id = target.id returning gj.* into target;
  insert into public.generation_capacity_leases(job_id, provider, lease_owner, run_version, cost_units, leased_until)
    values(target.id, provider_name, worker_id, target.run_version, target.estimated_cost_units, target.leased_until);
  return query select target.id, target.request_payload, target.mode, target.current_stage, target.run_version, target.attempts;
end;
$$;

create or replace function public.lease_generation_job(
  worker_id uuid, target_job uuid, target_subject text, lease_seconds integer default 55
)
returns table(job_id uuid, request_payload jsonb, generation_mode text, resume_stage text, run_version integer, attempts integer)
language sql security definer set search_path = '' as $$
  select * from public.lease_generation_job(worker_id, target_job, target_subject, 'deterministic', lease_seconds, 4, 100);
$$;

create or replace function public.list_queued_generation_jobs(batch_limit integer default 2)
returns table(id uuid, subject_key text)
language plpgsql security definer set search_path = '' as $$
begin
  if batch_limit not between 1 and 10 then raise exception 'Invalid generation batch limit' using errcode = '22023'; end if;
  delete from public.generation_capacity_leases where leased_until <= clock_timestamp();
  update public.generation_jobs set status = case when cancel_requested then 'cancelled' else 'queued' end,
    lease_owner = null, leased_until = null, updated_at = clock_timestamp()
    where status = 'running' and leased_until <= clock_timestamp();
  return query select gj.id, gj.subject_key from public.generation_jobs gj
    where gj.status = 'queued' order by gj.created_at asc limit batch_limit;
end;
$$;

create or replace function public.checkpoint_generation_job(
  worker_id uuid,
  target_job uuid,
  expected_run_version integer,
  completed_stage text,
  completed_progress integer,
  stage_payload jsonb,
  stage_checksum text
)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.generation_jobs%rowtype; existing_checksum text; renewed_until timestamptz;
begin
  if completed_stage not in ('evidence', 'requirements', 'context', 'synthesis', 'validation', 'layout')
    or completed_progress not between 1 and 99 or jsonb_typeof(stage_payload) <> 'object'
    or octet_length(stage_payload::text) > 1000000
    or stage_checksum <> public.canonical_jsonb_sha256(stage_payload) then
    raise exception 'Invalid generation checkpoint' using errcode = '22023';
  end if;
  select * into target from public.generation_jobs where id = target_job for update;
  if target.id is null or target.status <> 'running' or target.lease_owner <> worker_id
    or target.run_version <> expected_run_version or target.leased_until <= clock_timestamp() or target.cancel_requested then
    raise exception 'Stale generation worker' using errcode = '40001';
  end if;
  insert into public.generation_job_stages(job_id, stage, payload, checksum)
    values(target_job, completed_stage, stage_payload, stage_checksum)
    on conflict (job_id, stage) do nothing;
  select checksum into existing_checksum from public.generation_job_stages
    where job_id = target_job and stage = completed_stage;
  if existing_checksum <> stage_checksum then
    raise exception 'Generation checkpoint replay mismatch' using errcode = '22023';
  end if;
  renewed_until := clock_timestamp() + interval '55 seconds';
  update public.generation_jobs set
    current_stage = case when completed_progress >= progress then completed_stage else current_stage end,
    progress = greatest(progress, completed_progress), leased_until = renewed_until, updated_at = clock_timestamp()
    where id = target_job;
  update public.generation_capacity_leases set leased_until = renewed_until
    where job_id = target_job and lease_owner = worker_id and run_version = expected_run_version;
end;
$$;

create or replace function public.complete_generation_job(
  worker_id uuid, target_job uuid, expected_run_version integer,
  result_payload jsonb, result_checksum text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer; metered_tokens bigint := 0;
begin
  if jsonb_typeof(result_payload) <> 'object' or octet_length(result_payload::text) > 2000000
    or result_checksum <> public.canonical_jsonb_sha256(result_payload) then
    raise exception 'Invalid generation result checksum or payload' using errcode = '22023';
  end if;
  if not exists (select 1 from public.generation_job_stages where job_id = target_job and stage = 'layout') then
    raise exception 'Generation layout checkpoint is missing' using errcode = '22023';
  end if;
  if coalesce(result_payload #>> '{meta,usage,totalTokens}', '') ~ '^[0-9]{1,12}$' then
    metered_tokens := (result_payload #>> '{meta,usage,totalTokens}')::bigint;
  end if;
  update public.generation_jobs set status = 'completed', current_stage = 'published', progress = 100,
    result_payload = complete_generation_job.result_payload, result_checksum = complete_generation_job.result_checksum,
    actual_cost_units = metered_tokens, lease_owner = null, leased_until = null,
    completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = target_job and status = 'running' and lease_owner = worker_id
      and run_version = expected_run_version and leased_until > clock_timestamp() and not cancel_requested;
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'Stale generation worker' using errcode = '40001'; end if;
  delete from public.generation_capacity_leases
    where job_id = target_job and lease_owner = worker_id and run_version = expected_run_version;
  return true;
end;
$$;

create or replace function public.fail_generation_job(
  worker_id uuid, target_job uuid, expected_run_version integer, failure_class text, failure_message text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.generation_jobs set status = case when cancel_requested then 'cancelled' else 'failed' end,
    error_class = left(failure_class, 120), error_message = left(failure_message, 500),
    lease_owner = null, leased_until = null, completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = target_job and status = 'running' and lease_owner = worker_id
      and run_version = expected_run_version and leased_until > clock_timestamp() and not cancel_requested;
  get diagnostics changed = row_count;
  if changed = 1 then
    delete from public.generation_capacity_leases
      where job_id = target_job and lease_owner = worker_id and run_version = expected_run_version;
  end if;
  return changed = 1;
end;
$$;

create or replace function public.cancel_generation_job(target_job uuid, target_subject text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.generation_jobs set cancel_requested = true, status = 'cancelled', run_version = run_version + 1,
    lease_owner = null, leased_until = null, completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = target_job and subject_key = target_subject and status in ('queued', 'running');
  get diagnostics changed = row_count;
  if changed = 1 then delete from public.generation_capacity_leases where job_id = target_job; end if;
  return changed = 1;
end;
$$;

create or replace function public.retry_generation_job(target_job uuid, target_subject text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.generation_jobs set cancel_requested = false, status = 'queued', run_version = run_version + 1,
    error_class = null, error_message = null, lease_owner = null, leased_until = null,
    completed_at = null, updated_at = clock_timestamp()
    where id = target_job and subject_key = target_subject and status in ('failed', 'cancelled') and attempts < 12;
  get diagnostics changed = row_count;
  if changed = 1 then delete from public.generation_capacity_leases where job_id = target_job; end if;
  return changed = 1;
end;
$$;

revoke execute on function public.consume_shared_rate_limits(jsonb, integer, integer),
  public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text, integer, integer, integer, integer, integer),
  public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text),
  public.lease_generation_job(uuid, uuid, text, text, integer, integer, integer),
  public.lease_generation_job(uuid, uuid, text, integer),
  public.list_queued_generation_jobs(integer),
  public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text),
  public.complete_generation_job(uuid, uuid, integer, jsonb, text),
  public.fail_generation_job(uuid, uuid, integer, text, text),
  public.cancel_generation_job(uuid, text), public.retry_generation_job(uuid, text)
  from public, anon, authenticated;
grant execute on function public.consume_shared_rate_limits(jsonb, integer, integer),
  public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text, integer, integer, integer, integer, integer),
  public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text),
  public.lease_generation_job(uuid, uuid, text, text, integer, integer, integer),
  public.lease_generation_job(uuid, uuid, text, integer),
  public.list_queued_generation_jobs(integer),
  public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text),
  public.complete_generation_job(uuid, uuid, integer, jsonb, text),
  public.fail_generation_job(uuid, uuid, integer, text, text),
  public.cancel_generation_job(uuid, text), public.retry_generation_job(uuid, text)
  to service_role;
