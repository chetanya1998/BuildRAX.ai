-- Durable, resumable generation jobs. Admission control and signed guest
-- identities are introduced separately by O01.

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  subject_key text not null check (subject_key ~ '^[a-f0-9]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  idempotency_key uuid not null,
  request_checksum text not null check (request_checksum ~ '^[a-f0-9]{64}$'),
  request_payload jsonb not null check (jsonb_typeof(request_payload) = 'object' and octet_length(request_payload::text) <= 20000),
  mode text not null check (mode in ('auto', 'deterministic', 'provider')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  current_stage text not null default 'accepted' check (current_stage in ('accepted', 'evidence', 'requirements', 'context', 'synthesis', 'validation', 'layout', 'published')),
  progress smallint not null default 0 check (progress between 0 and 100),
  run_version integer not null default 1 check (run_version > 0),
  attempts integer not null default 0 check (attempts between 0 and 12),
  cancel_requested boolean not null default false,
  lease_owner uuid,
  leased_until timestamptz,
  result_payload jsonb check (result_payload is null or (jsonb_typeof(result_payload) = 'object' and octet_length(result_payload::text) <= 2000000)),
  result_checksum text check (result_checksum is null or result_checksum ~ '^[a-f0-9]{64}$'),
  error_class text check (error_class is null or char_length(error_class) <= 120),
  error_message text check (error_message is null or char_length(error_message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(subject_key, idempotency_key)
);

create index generation_jobs_queue_idx on public.generation_jobs(status, created_at);
create index generation_jobs_subject_idx on public.generation_jobs(subject_key, created_at desc);

create table public.generation_job_stages (
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  stage text not null check (stage in ('evidence', 'requirements', 'context', 'synthesis', 'validation', 'layout')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 1000000),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  completed_at timestamptz not null default now(),
  primary key(job_id, stage)
);

alter table public.generation_jobs enable row level security;
alter table public.generation_job_stages enable row level security;

create policy "users read own generation jobs" on public.generation_jobs
  for select to authenticated using (user_id = auth.uid());
create policy "users read own generation stages" on public.generation_job_stages
  for select to authenticated using (exists (
    select 1 from public.generation_jobs gj where gj.id = job_id and gj.user_id = auth.uid()
  ));

revoke all on public.generation_jobs, public.generation_job_stages from anon, authenticated;
grant select on public.generation_jobs, public.generation_job_stages to authenticated;
create trigger immutable_generation_job_stages before update or delete on public.generation_job_stages
  for each row execute function public.prevent_ir_version_mutation();

create or replace function public.create_generation_job(
  target_subject text,
  target_user uuid,
  target_workspace uuid,
  idempotency uuid,
  request_checksum text,
  request_payload jsonb,
  generation_mode text
)
returns table(job_id uuid, job_status text, job_progress integer)
language plpgsql security definer set search_path = '' as $$
declare existing public.generation_jobs%rowtype; created public.generation_jobs%rowtype;
begin
  if target_user is null or target_subject !~ '^[a-f0-9]{64}$'
    or target_subject <> encode(extensions.digest(convert_to('user:' || target_user::text, 'UTF8'), 'sha256'), 'hex')
    or idempotency is null or request_checksum !~ '^[a-f0-9]{64}$'
    or request_checksum <> public.canonical_jsonb_sha256(request_payload)
    or generation_mode not in ('auto', 'deterministic', 'provider') then
    raise exception 'Invalid generation job request' using errcode = '22023';
  end if;
  if target_workspace is not null and not exists (
    select 1 from public.workspace_members wm where wm.workspace_id = target_workspace and wm.user_id = target_user and wm.role in ('owner', 'editor')
  ) then
    raise exception 'Invalid generation workspace' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_subject));
  select * into existing from public.generation_jobs gj where gj.subject_key = target_subject and gj.idempotency_key = idempotency;
  if existing.id is not null then
    if existing.request_checksum <> request_checksum then raise exception 'Idempotency key conflict' using errcode = '22023'; end if;
    return query select existing.id, existing.status, existing.progress::integer;
    return;
  end if;
  insert into public.generation_jobs(subject_key, user_id, workspace_id, idempotency_key, request_checksum, request_payload, mode)
  values(target_subject, target_user, target_workspace, idempotency, request_checksum, request_payload, generation_mode)
  returning * into created;
  return query select created.id, created.status, created.progress::integer;
end;
$$;

create or replace function public.lease_generation_job(
  worker_id uuid,
  target_job uuid,
  target_subject text,
  lease_seconds integer default 55
)
returns table(job_id uuid, request_payload jsonb, generation_mode text, resume_stage text, run_version integer, attempts integer)
language plpgsql security definer set search_path = '' as $$
declare target public.generation_jobs%rowtype;
begin
  if worker_id is null or target_job is null or target_subject !~ '^[a-f0-9]{64}$' or lease_seconds not between 5 and 300 then
    raise exception 'Invalid generation lease request' using errcode = '22023';
  end if;
  update public.generation_jobs set status = case when cancel_requested then 'cancelled' else 'queued' end,
    lease_owner = null, leased_until = null, updated_at = clock_timestamp()
    where status = 'running' and leased_until <= clock_timestamp();
  select * into target from public.generation_jobs where id = target_job and subject_key = target_subject for update;
  if target.id is null or target.status <> 'queued' or target.cancel_requested or target.attempts >= 12 then return; end if;
  update public.generation_jobs as gj set status = 'running', lease_owner = worker_id,
    leased_until = clock_timestamp() + make_interval(secs => lease_seconds), attempts = gj.attempts + 1, updated_at = clock_timestamp()
    where gj.id = target.id returning gj.* into target;
  return query select target.id, target.request_payload, target.mode, target.current_stage, target.run_version, target.attempts;
end;
$$;

create or replace function public.list_queued_generation_jobs(batch_limit integer default 2)
returns table(id uuid, subject_key text)
language plpgsql security definer set search_path = '' as $$
begin
  if batch_limit not between 1 and 10 then raise exception 'Invalid generation batch limit' using errcode = '22023'; end if;
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
declare target public.generation_jobs%rowtype; existing_checksum text;
begin
  if completed_stage not in ('evidence', 'requirements', 'context', 'synthesis', 'validation', 'layout')
    or completed_progress not between 1 and 99 or jsonb_typeof(stage_payload) <> 'object'
    or octet_length(stage_payload::text) > 1000000 or stage_checksum <> public.canonical_jsonb_sha256(stage_payload) then
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
  update public.generation_jobs set
    current_stage = case when completed_progress >= progress then completed_stage else current_stage end,
    progress = greatest(progress, completed_progress), updated_at = clock_timestamp()
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
  if jsonb_typeof(result_payload) <> 'object' or octet_length(result_payload::text) > 2000000
    or result_checksum <> public.canonical_jsonb_sha256(result_payload) then
    raise exception 'Invalid generation result checksum or payload' using errcode = '22023';
  end if;
  if not exists (select 1 from public.generation_job_stages where job_id = target_job and stage = 'layout') then
    raise exception 'Generation layout checkpoint is missing' using errcode = '22023';
  end if;
  update public.generation_jobs set status = 'completed', current_stage = 'published', progress = 100,
    result_payload = complete_generation_job.result_payload, result_checksum = complete_generation_job.result_checksum,
    lease_owner = null, leased_until = null, completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = target_job and status = 'running' and lease_owner = worker_id and run_version = expected_run_version
      and leased_until > clock_timestamp() and not cancel_requested;
  get diagnostics changed = row_count;
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
    leased_until = null, completed_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = target_job and status = 'running' and lease_owner = worker_id and run_version = expected_run_version
      and leased_until > clock_timestamp() and not cancel_requested;
  get diagnostics changed = row_count;
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
  return changed = 1;
end;
$$;

create or replace function public.retry_generation_job(target_job uuid, target_subject text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.generation_jobs set cancel_requested = false, status = 'queued', run_version = run_version + 1,
    error_class = null, error_message = null, lease_owner = null, leased_until = null, completed_at = null, updated_at = clock_timestamp()
    where id = target_job and subject_key = target_subject and status in ('failed', 'cancelled') and attempts < 12;
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke execute on function public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text),
  public.list_queued_generation_jobs(integer),
  public.lease_generation_job(uuid, uuid, text, integer),
  public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text),
  public.complete_generation_job(uuid, uuid, integer, jsonb, text),
  public.fail_generation_job(uuid, uuid, integer, text, text),
  public.cancel_generation_job(uuid, text), public.retry_generation_job(uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_generation_job(text, uuid, uuid, uuid, text, jsonb, text),
  public.list_queued_generation_jobs(integer),
  public.lease_generation_job(uuid, uuid, text, integer),
  public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text),
  public.complete_generation_job(uuid, uuid, integer, jsonb, text),
  public.fail_generation_job(uuid, uuid, integer, text, text),
  public.cancel_generation_job(uuid, text), public.retry_generation_job(uuid, text)
  to service_role;
