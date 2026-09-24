-- B08: expose deterministic pattern/rule evaluation as a resumable stage in
-- the complete generation workflow.

alter table public.generation_jobs
  drop constraint if exists generation_jobs_current_stage_check;
alter table public.generation_jobs
  add constraint generation_jobs_current_stage_check
  check (current_stage in ('accepted', 'evidence', 'requirements', 'context', 'rules', 'synthesis', 'validation', 'layout', 'published'));

alter table public.generation_job_stages
  drop constraint if exists generation_job_stages_stage_check;
alter table public.generation_job_stages
  add constraint generation_job_stages_stage_check
  check (stage in ('evidence', 'requirements', 'context', 'rules', 'synthesis', 'validation', 'layout'));

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
  if completed_stage not in ('evidence', 'requirements', 'context', 'rules', 'synthesis', 'validation', 'layout')
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

revoke execute on function public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.checkpoint_generation_job(uuid, uuid, integer, text, integer, jsonb, text)
  to service_role;
