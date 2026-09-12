-- Day 6 archive and notification hardening. Failed archive uploads must never
-- make the still-valid hot artifact unreadable, and terminal/complete outcomes
-- must be visible to workspace owners without leaking project content to email.

create or replace function public.lease_artifact_archive_jobs(worker_id uuid, batch_size integer default 10)
returns table(job_id uuid, artifact_id uuid, workspace_id uuid, artifact_kind text, artifact_checksum text, artifact_payload jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  if worker_id is null then raise exception 'Worker ID required' using errcode = '22023'; end if;
  return query
  with candidates as (
    select aaj.id from public.artifact_archive_jobs aaj
     where (aaj.status = 'pending' or (aaj.status = 'leased' and aaj.leased_until < now()))
       and aaj.available_at <= now() and aaj.attempts < 12
     order by aaj.created_at
     for update skip locked limit greatest(1, least(batch_size, 25))
  ), leased as (
    update public.artifact_archive_jobs aaj set status = 'leased', attempts = attempts + 1,
      leased_until = now() + interval '5 minutes', lease_owner = worker_id, updated_at = now()
     from candidates where aaj.id = candidates.id returning aaj.id, aaj.artifact_blob_id
  ), marked as (
    update public.artifact_blobs ab set storage_state = 'archiving'
     from leased where ab.id = leased.artifact_blob_id and ab.storage_state in ('hot', 'archiving')
     returning leased.id as job_id, ab.id as artifact_id, ab.workspace_id, ab.kind, ab.checksum, ab.hot_payload
  ) select marked.job_id, marked.artifact_id, marked.workspace_id, marked.kind, marked.checksum, marked.hot_payload from marked;
end;
$$;

create or replace function public.complete_artifact_archive_job(worker_id uuid, target_job uuid, archive_path text, verified_checksum text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_artifact uuid;
begin
  select artifact_blob_id into target_artifact from public.artifact_archive_jobs
   where id = target_job and status = 'leased' and lease_owner = worker_id and leased_until > now() for update;
  if target_artifact is null then raise exception 'Archive lease unavailable' using errcode = '40001'; end if;
  update public.artifact_blobs set storage_state = 'archived', storage_path = archive_path,
    hot_payload = null, archived_at = now()
   where id = target_artifact and checksum = verified_checksum and storage_state = 'archiving';
  if not found then raise exception 'Artifact checksum or state mismatch' using errcode = '22023'; end if;
  update public.diagram_versions dv set payload = null
   from public.diagram_version_artifacts dva
   where dva.diagram_version_id = dv.id and dva.diagram_blob_id = target_artifact;
  update public.artifact_archive_jobs set status = 'completed', leased_until = null, lease_owner = null, updated_at = now()
   where id = target_job;

  -- Notify only when the entire version is cold; the deduplication key makes
  -- shared artifacts and repeated worker calls harmless.
  insert into public.user_notifications(user_id, kind, diagram_id, diagram_version, message, deduplication_key)
  select distinct wm.user_id, 'version-archived', d.id, dv.version,
    'A non-current architecture version moved to the secure archive and remains restorable.',
    'version-archived:' || wm.user_id::text || ':' || d.id::text || ':' || dv.version::text
    from public.diagram_version_artifacts dva
    join public.diagram_versions dv on dv.id = dva.diagram_version_id
    join public.diagrams d on d.id = dv.diagram_id and d.current_version <> dv.version
    join public.projects p on p.id = d.project_id and p.deleted_at is null
    join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.role = 'owner'
    join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
    join public.artifact_blobs irb on irb.id = aiv.artifact_blob_id
    join public.artifact_blobs pb on pb.id = dva.presentation_blob_id
    join public.artifact_blobs db on db.id = dva.diagram_blob_id
   where target_artifact in (aiv.artifact_blob_id, dva.presentation_blob_id, dva.diagram_blob_id)
     and irb.storage_state in ('hot', 'archived') and pb.storage_state = 'archived' and db.storage_state = 'archived'
  on conflict (deduplication_key) do nothing;
end;
$$;

create or replace function public.fail_artifact_archive_job(worker_id uuid, target_job uuid, failure_class text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_artifact uuid; attempt_count integer;
begin
  select artifact_blob_id, attempts into target_artifact, attempt_count from public.artifact_archive_jobs
   where id = target_job and status = 'leased' and lease_owner = worker_id for update;
  if target_artifact is null then return; end if;
  -- Upload failure never invalidates the verified hot copy.
  update public.artifact_blobs set storage_state = 'hot'
   where id = target_artifact and storage_state = 'archiving';
  update public.artifact_archive_jobs set status = case when attempt_count >= 12 then 'failed' else 'pending' end,
    available_at = now() + least(interval '6 hours', interval '30 seconds' * power(2, least(attempt_count, 10))),
    leased_until = null, lease_owner = null, last_error_class = left(coalesce(failure_class, 'unknown'), 120), updated_at = now()
   where id = target_job;

  if attempt_count >= 12 then
    insert into public.user_notifications(user_id, kind, diagram_id, diagram_version, message, deduplication_key)
    select distinct wm.user_id, 'archive-restore-failed', d.id, dv.version,
      'Secure archival is delayed. This version remains safely available in active storage.',
      'archive-delayed:' || wm.user_id::text || ':' || target_artifact::text
      from public.diagram_version_artifacts dva
      join public.diagram_versions dv on dv.id = dva.diagram_version_id
      join public.diagrams d on d.id = dv.diagram_id
      join public.projects p on p.id = d.project_id and p.deleted_at is null
      join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.role = 'owner'
      join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
     where target_artifact in (aiv.artifact_blob_id, dva.presentation_blob_id, dva.diagram_blob_id)
    on conflict (deduplication_key) do nothing;
  end if;
end;
$$;

create or replace function public.lease_notification_jobs(worker_id uuid, batch_size integer default 10)
returns table(job_id uuid, notification_id uuid, recipient_email text, notification_kind text)
language plpgsql security definer set search_path = '' as $$
begin
  if worker_id is null then raise exception 'Worker ID required' using errcode = '22023'; end if;
  return query
  with candidates as (
    select no.id from public.notification_outbox no
     where (no.status in ('pending', 'failed') or (no.status = 'sending' and no.leased_until < now()))
       and no.available_at <= now() and no.attempts < 12
     order by no.created_at for update skip locked limit greatest(1, least(batch_size, 25))
  ), leased as (
    update public.notification_outbox no set status = 'sending', attempts = attempts + 1,
      leased_until = now() + interval '5 minutes', lease_owner = worker_id, updated_at = now()
     from candidates where no.id = candidates.id returning no.id, no.notification_id
  ) select leased.id, leased.notification_id, au.email::text, un.kind
      from leased join public.user_notifications un on un.id = leased.notification_id
      join auth.users au on au.id = un.user_id
     where au.email is not null and pg_catalog.btrim(au.email) <> '';
end;
$$;

create or replace function public.complete_notification_job(worker_id uuid, target_job uuid, provider_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.notification_outbox set status = 'delivered', provider_message_id = left(provider_id, 240),
    leased_until = null, lease_owner = null, updated_at = now()
   where id = target_job and lease_owner = worker_id and status = 'sending' and leased_until > now();
  if not found then raise exception 'Notification lease unavailable' using errcode = '40001'; end if;
end;
$$;

create or replace function public.get_architecture_maintenance_health()
returns table(
  pending_archive_jobs bigint,
  failed_archive_jobs bigint,
  expired_archive_leases bigint,
  pending_notification_jobs bigint,
  exhausted_notification_jobs bigint,
  unreadable_artifacts bigint,
  oldest_archive_job_at timestamptz
)
language sql security definer stable set search_path = '' as $$
  select
    count(*) filter (where aaj.status = 'pending'),
    count(*) filter (where aaj.status = 'failed'),
    count(*) filter (where aaj.status = 'leased' and aaj.leased_until < now()),
    (select count(*) from public.notification_outbox no where no.status in ('pending', 'failed') and no.attempts < 12),
    (select count(*) from public.notification_outbox no where no.status = 'failed' and no.attempts >= 12),
    (select count(*) from public.artifact_blobs ab where ab.storage_state = 'restore-failed'),
    min(aaj.created_at) filter (where aaj.status in ('pending', 'leased'))
  from public.artifact_archive_jobs aaj;
$$;

revoke execute on function public.lease_artifact_archive_jobs(uuid, integer), public.complete_artifact_archive_job(uuid, uuid, text, text),
  public.fail_artifact_archive_job(uuid, uuid, text), public.lease_notification_jobs(uuid, integer),
  public.complete_notification_job(uuid, uuid, text), public.get_architecture_maintenance_health() from public, anon, authenticated;
grant execute on function public.lease_artifact_archive_jobs(uuid, integer), public.complete_artifact_archive_job(uuid, uuid, text, text),
  public.fail_artifact_archive_job(uuid, uuid, text), public.lease_notification_jobs(uuid, integer),
  public.complete_notification_job(uuid, uuid, text), public.get_architecture_maintenance_health() to service_role;
