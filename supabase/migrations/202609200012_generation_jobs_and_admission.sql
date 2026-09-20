-- Durable, resumable generation jobs plus database-backed admission control.
-- Browser roles can read only their own authenticated jobs; all mutation is
-- performed by server routes holding the service role after identity checks.

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  subject_key text not null check (subject_key ~ '^[a-f0-9]{64}$'),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  idempotency_key uuid not null,
  request_checksum text not null check (request_checksum ~ '^[a-f0-9]{64}$'),
  request_payload jsonb not null check (jsonb_typeof(request_payload) = 'object' and octet_length(request_payload::text) <= 20000),
  mode text not null check (mode in ('auto', 'deterministic', 'provider')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  current_stage text not null default 'accepted' check (current_stage in ('accepted', 'evidence', 'requirements', 'context', 'rules', 'synthesis', 'validation', 'layout', 'published')),
  progress smallint not null default 0 check (progress between 0 and 100),
  run_version integer not null default 1 check (run_version > 0),
  attempts integer not null default 0 check (attempts between 0 and 12),
  estimated_cost_units integer not null default 0 check (estimated_cost_units between 0 and 1000000),
  actual_cost_units bigint not null default 0 check (actual_cost_units >= 0),
  cancel_requested boolean not null default false,
  lease_owner uuid,
  leased_until timestamptz,
  result_payload jsonb,
  result_checksum text check (result_checksum is null or result_checksum ~ '^[a-f0-9]{64}$'),
  error_class text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(subject_key, idempotency_key)
);

create index generation_jobs_queue_idx on public.generation_jobs(status, created_at);
create index generation_jobs_subject_idx on public.generation_jobs(subject_key, created_at desc);

create table public.generation_job_stages (
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  stage text not null check (stage in ('evidence', 'requirements', 'context', 'rules', 'synthesis', 'validation', 'layout')),
  payload jsonb not null,
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  completed_at timestamptz not null default now(),
  primary key(job_id, stage)
);

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

create table public.generation_rate_windows (
  scope_key text not null check (char_length(scope_key) between 1 and 200),
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  cost_units bigint not null default 0 check (cost_units >= 0),
  expires_at timestamptz not null,
  primary key(scope_key, bucket_start)
);
create index generation_rate_expiry_idx on public.generation_rate_windows(expires_at);

alter table public.generation_jobs enable row level security;
alter table public.generation_job_stages enable row level security;
alter table public.generation_capacity_leases enable row level security;
alter table public.generation_rate_windows enable row level security;

create policy "users read own generation jobs" on public.generation_jobs
  for select to authenticated using (user_id = auth.uid());
create policy "users read own generation stages" on public.generation_job_stages
  for select to authenticated using (exists (
    select 1 from public.generation_jobs gj where gj.id = job_id and gj.user_id = auth.uid()
  ));

revoke all on public.generation_jobs, public.generation_job_stages, public.generation_capacity_leases, public.generation_rate_windows from anon, authenticated;
grant select on public.generation_jobs, public.generation_job_stages to authenticated;
create trigger immutable_generation_job_stages before update or delete on public.generation_job_stages
  for each row execute function public.prevent_ir_version_mutation();

create or replace function public.consume_shared_rate_limit(
  target_scope text,
  request_limit integer,
  window_seconds integer,
  requested_cost_units integer default 0,
  cost_limit bigint default 1000000
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql security definer set search_path = '' as $$
declare
  bucket timestamptz;
  observed public.generation_rate_windows%rowtype;
begin
  if char_length(target_scope) < 1 or char_length(target_scope) > 200
    or request_limit < 1 or request_limit > 100000
    or window_seconds < 1 or window_seconds > 86400
    or requested_cost_units < 0 or cost_limit < requested_cost_units then
    raise exception 'Invalid shared rate limit request' using errcode = '22023';
  end if;
  delete from public.generation_rate_windows where expires_at < clock_timestamp() - interval '1 minute';
  bucket := to_timestamp(floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds);
  insert into public.generation_rate_windows(scope_key, bucket_start, request_count, cost_units, expires_at)
  values(target_scope, bucket, 1, requested_cost_units, bucket + make_interval(secs => window_seconds))
  on conflict (scope_key, bucket_start) do update
    set request_count = public.generation_rate_windows.request_count + 1,
        cost_units = public.generation_rate_windows.cost_units + requested_cost_units
    where public.generation_rate_windows.request_count < request_limit
      and public.generation_rate_windows.cost_units + requested_cost_units <= cost_limit
  returning * into observed;
  if observed.scope_key is null then
    return query select false, 0, greatest(1, ceil(extract(epoch from (bucket + make_interval(secs => window_seconds) - clock_timestamp())))::integer);
  else
    return query select true, greatest(0, request_limit - observed.request_count), greatest(1, ceil(extract(epoch from (observed.expires_at - clock_timestamp())))::integer);
  end if;
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
  cost_units integer default 0,
  request_limit integer default 5,
  window_seconds integer default 600,
  queue_limit integer default 100
)
returns table(job_id uuid, job_status text, job_progress integer, retry_after_seconds integer)
language plpgsql security definer set search_path = '' as $$
declare
  existing public.generation_jobs%rowtype;
  admission record;
  created public.generation_jobs%rowtype;
begin
  if target_subject !~ '^[a-f0-9]{64}$' or idempotency is null
    or request_checksum !~ '^[a-f0-9]{64}$'
    or request_checksum <> public.canonical_jsonb_sha256(request_payload)
    or generation_mode not in ('auto', 'deterministic', 'provider')
    or cost_units < 0 or queue_limit < 1 or queue_limit > 10000 then
    raise exception 'Invalid generation job request' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_subject));
  select * into existing from public.generation_jobs gj where gj.subject_key = target_subject and gj.idempotency_key = idempotency;
  if existing.id is not null then
    if existing.request_checksum <> request_checksum then raise exception 'Idempotency key conflict' using errcode = '22023'; end if;
    return query select existing.id, existing.status, existing.progress::integer, 0;
    return;
  end if;
  select * into admission from public.consume_shared_rate_limit('generation:' || target_subject, request_limit, window_seconds, cost_units, 1000000);
  if not admission.allowed then
    raise exception 'Shared generation rate limit exceeded:%', admission.retry_after_seconds using errcode = 'P0001';
  end if;
  if target_workspace is not null then
    select * into admission from public.consume_shared_rate_limit('generation:workspace:' || target_workspace::text, request_limit, window_seconds, cost_units, 1000000);
    if not admission.allowed then
      raise exception 'Shared workspace generation rate limit exceeded:%', admission.retry_after_seconds using errcode = 'P0001';
    end if;
  end if;
  if (select count(*) from public.generation_jobs where status in ('queued', 'running')) >= queue_limit then
    raise exception 'Generation queue capacity exceeded:%', 30 using errcode = 'P0001';
  end if;
  insert into public.generation_jobs(subject_key, user_id, workspace_id, idempotency_key, request_checksum, request_payload, mode, estimated_cost_units)
  values(target_subject, target_user, target_workspace, idempotency, request_checksum, request_payload, generation_mode, cost_units)
  returning * into created;
  return query select created.id, created.status, created.progress::integer, admission.retry_after_seconds;
end;
$$;

create or replace function public.lease_generation_job(
  worker_id uuid,
  target_job uuid,
  target_subject text,
  provider_name text,
  lease_seconds integer default 55,
  max_concurrency integer default 4,
  max_cost_units integer default 1000000
)
returns table(job_id uuid, request_payload jsonb, generation_mode text, resume_stage text, run_version integer, attempts integer)
language plpgsql security definer set search_path = '' as $$
declare target public.generation_jobs%rowtype;
begin
  if worker_id is null or target_job is null or target_subject !~ '^[a-f0-9]{64}$'
    or char_length(provider_name) not between 1 and 80 or lease_seconds not between 5 and 300
    or max_concurrency not between 1 and 1000 or max_cost_units < 0 then
    raise exception 'Invalid generation lease request' using errcode = '22023';
  end if;
  delete from public.generation_capacity_leases where leased_until <= clock_timestamp();
  update public.generation_jobs set status = case when cancel_requested then 'cancelled' else 'queued' end,
    lease_owner = null, leased_until = null, updated_at = clock_timestamp()
    where status = 'running' and leased_until <= clock_timestamp();
  select * into target from public.generation_jobs where id = target_job and subject_key = target_subject for update;
  if target.id is null or target.status <> 'queued' or target.cancel_requested then return; end if;
  if (select count(*) from public.generation_capacity_leases where provider = provider_name) >= max_concurrency
    or coalesce((select sum(cost_units) from public.generation_capacity_leases where provider = provider_name), 0) + target.estimated_cost_units > max_cost_units then
    return;
  end if;
  update public.generation_jobs as gj set status = 'running', lease_owner = worker_id,
    leased_until = clock_timestamp() + make_interval(secs => lease_seconds), attempts = gj.attempts + 1, updated_at = clock_timestamp()
    where gj.id = target.id returning gj.* into target;
  insert into public.generation_capacity_leases(job_id, provider, lease_owner, run_version, cost_units, leased_until)
  values(target.id, provider_name, worker_id, target.run_version, target.estimated_cost_units, target.leased_until);
  return query select target.id, target.request_payload, target.mode, target.current_stage, target.run_version, target.attempts;
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
declare target public.generation_jobs%rowtype; existing_checksum text;
begin
  if completed_stage not in ('evidence', 'requirements', 'context', 'rules', 'synthesis', 'validation', 'layout')
    or completed_progress not between 1 and 99 or stage_checksum <> public.canonical_jsonb_sha256(stage_payload) then
    raise exception 'Invalid generation checkpoint' using errcode = '22023';
  end if;
  select * into target from public.generation_jobs where id = target_job for update;
  if target.id is null or target.status <> 'running' or target.lease_owner <> worker_id
    or target.run_version <> expected_run_version or target.leased_until <= clock_timestamp() or target.cancel_requested then
    raise exception 'Stale generation worker' using errcode = '40001';
  end if;
  insert into public.generation_job_stages(job_id, stage, payload, checksum)
  values(target_job, completed_stage, stage_payload, stage_checksum) on conflict (job_id, stage) do nothing;
  select checksum into existing_checksum from public.generation_job_stages where job_id = target_job and stage = completed_stage;
  if existing_checksum <> stage_checksum then raise exception 'Generation checkpoint replay mismatch' using errcode = '22023'; end if;
  update public.generation_jobs set current_stage = completed_stage, progress = greatest(progress, completed_progress), updated_at = clock_timestamp()
    where id = target_job;
end;
$$;

create or replace function public.complete_generation_job(
  worker_id uuid,
  target_job uuid,
  expected_run_version integer,
  result_payload jsonb,
  result_checksum text
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if result_checksum <> public.canonical_jsonb_sha256(result_payload) then raise exception 'Invalid generation result checksum' using errcode = '22023'; end if;
  update public.generation_jobs set status = 'completed', current_stage = 'published', progress = 100,
    result_payload = complete_generation_job.result_payload, result_checksum = complete_generation_job.result_checksum,
    actual_cost_units = greatest(0, coalesce((complete_generation_job.result_payload #>> '{meta,usage,totalTokens}')::bigint, 0)),
    lease_owner = null, leased_until = null, completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = target_job and status = 'running' and lease_owner = worker_id and run_version = expected_run_version
      and leased_until > clock_timestamp() and not cancel_requested;
  get diagnostics changed = row_count;
  delete from public.generation_capacity_leases where job_id = target_job and lease_owner = worker_id and run_version = expected_run_version;
  if changed = 0 then raise exception 'Stale generation worker' using errcode = '40001'; end if;
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
    error_class = left(failure_class, 120), error_message = left(failure_message, 500), lease_owner = null,
    leased_until = null, updated_at = clock_timestamp()
    where id = target_job and status = 'running' and lease_owner = worker_id and run_version = expected_run_version;
  get diagnostics changed = row_count;
  delete from public.generation_capacity_leases where job_id = target_job and lease_owner = worker_id and run_version = expected_run_version;
  return changed = 1;
end;
$$;

create or replace function public.cancel_generation_job(target_job uuid, target_subject text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.generation_jobs set cancel_requested = true, status = 'cancelled', run_version = run_version + 1,
    lease_owner = null, leased_until = null, updated_at = clock_timestamp()
    where id = target_job and subject_key = target_subject and status in ('queued', 'running', 'failed');
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
    error_class = null, error_message = null, lease_owner = null, leased_until = null, updated_at = clock_timestamp()
    where id = target_job and subject_key = target_subject and status in ('failed', 'cancelled') and attempts < 12;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke execute on function public.consume_shared_rate_limit(text, integer, integer, integer, bigint),
  public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text, integer, integer, integer, integer),
  public.lease_generation_job(uuid, uuid, text, text, integer, integer, integer),
  public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text),
  public.complete_generation_job(uuid, uuid, integer, jsonb, text),
  public.fail_generation_job(uuid, uuid, integer, text, text),
  public.cancel_generation_job(uuid, text), public.retry_generation_job(uuid, text)
  from public, anon, authenticated;
grant execute on function public.consume_shared_rate_limit(text, integer, integer, integer, bigint),
  public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text, integer, integer, integer, integer),
  public.lease_generation_job(uuid, uuid, text, text, integer, integer, integer),
  public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text),
  public.complete_generation_job(uuid, uuid, integer, jsonb, text),
  public.fail_generation_job(uuid, uuid, integer, text, text),
  public.cancel_generation_job(uuid, text), public.retry_generation_job(uuid, text)
  to service_role;
