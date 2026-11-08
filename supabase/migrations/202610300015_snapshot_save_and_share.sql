-- Qualify column names that overlap with the RPC's diagram_id return field.
create or replace function public.save_architecture_snapshot(
  target_diagram uuid,
  base_version integer,
  base_ir_version integer,
  idempotency uuid,
  request_checksum text,
  ir_payload jsonb,
  ir_checksum text,
  presentation_payload jsonb,
  presentation_checksum text,
  diagram_payload jsonb,
  diagram_checksum text,
  ir_provenance text,
  compiler_version text,
  catalog_version text,
  ai_request_id uuid default null
)
returns table(diagram_id uuid, version integer, ir_version integer, ir_changed boolean, saved_ir_checksum text, saved_diagram_checksum text)
language plpgsql security definer set search_path = '' as $$
declare
  current_record public.diagrams%rowtype;
  existing_request public.diagram_save_requests%rowtype;
  workspace uuid;
  ir_blob uuid;
  presentation_blob uuid;
  diagram_blob uuid;
  current_ir_id uuid;
  current_ir_checksum text;
  next_ir_version integer;
  next_ir_id uuid;
  next_diagram_version integer;
  next_diagram_version_id uuid;
  semantic_changed boolean;
  run_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if idempotency is null or request_checksum !~ '^[a-f0-9]{64}$'
    or ir_checksum !~ '^[a-f0-9]{64}$' or presentation_checksum !~ '^[a-f0-9]{64}$'
    or diagram_checksum !~ '^[a-f0-9]{64}$'
    or diagram_payload->>'id' <> target_diagram::text
    or not public.is_well_formed_architecture_snapshot(ir_payload, presentation_payload, diagram_payload) then
    raise exception 'Invalid architecture snapshot payload' using errcode = '22023';
  end if;
  if ir_checksum <> public.canonical_jsonb_sha256(ir_payload)
    or presentation_checksum <> public.canonical_jsonb_sha256(presentation_payload)
    or diagram_checksum <> public.canonical_jsonb_sha256(diagram_payload)
    or request_checksum <> public.canonical_jsonb_sha256(jsonb_build_object(
      'baseVersion', base_version, 'baseIrVersion', base_ir_version,
      'ir', ir_payload, 'presentation', presentation_payload
    )) then
    raise exception 'Architecture snapshot checksum mismatch' using errcode = '22023';
  end if;

  select d.* into current_record
    from public.diagrams d join public.projects p on p.id = d.project_id
   where d.id = target_diagram and p.deleted_at is null and public.can_edit_workspace(p.workspace_id)
   for update of d;
  if current_record.id is null then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;
  select p.workspace_id into workspace from public.projects p where p.id = current_record.project_id;

  select * into existing_request from public.diagram_save_requests dsr
   where dsr.diagram_id = target_diagram and dsr.idempotency_key = idempotency;
  if existing_request.diagram_id is not null then
    if existing_request.request_checksum <> request_checksum then
      raise exception 'Idempotency key was reused with different content' using errcode = '22023';
    end if;
    return query select target_diagram, existing_request.diagram_version, existing_request.ir_version,
      false, ir_checksum, diagram_checksum;
    return;
  end if;

  perform public.enforce_architecture_persistence_rate_limit(workspace, target_diagram, auth.uid());

  if current_record.current_version <> base_version or current_record.current_ir_version <> base_ir_version then
    raise exception 'Version conflict' using errcode = '40001';
  end if;

  if base_ir_version > 0 then
    select aiv.id, ab.checksum into current_ir_id, current_ir_checksum
      from public.architecture_ir_versions aiv join public.artifact_blobs ab on ab.id = aiv.artifact_blob_id
     where aiv.diagram_id = target_diagram and aiv.version = base_ir_version;
    if current_ir_id is null then raise exception 'Current IR version is unavailable' using errcode = '40001'; end if;
  end if;

  semantic_changed := base_ir_version = 0 or current_ir_checksum is distinct from ir_checksum;
  if semantic_changed then
    insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
    values(workspace, 'architecture-ir', coalesce(ir_payload->>'schemaVersion', 'unknown'), ir_checksum, octet_length(ir_payload::text), ir_payload)
    on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
      storage_state = 'hot', storage_path = null, archived_at = null
    returning id into ir_blob;
    next_ir_version := base_ir_version + 1;
    insert into public.architecture_ir_versions(diagram_id, version, parent_version, artifact_blob_id, provenance, compiler_version, catalog_version, created_by)
    values(target_diagram, next_ir_version, nullif(base_ir_version, 0), ir_blob, ir_provenance, compiler_version, catalog_version, auth.uid())
    returning id into next_ir_id;
    update public.review_runs rr set stale_at = now()
     where rr.diagram_id = target_diagram and rr.stale_at is null
       and rr.architecture_ir_version_id is distinct from next_ir_id;
    update public.documents doc set stale_at = now()
     where doc.diagram_id = target_diagram and doc.stale_at is null;
  else
    next_ir_version := base_ir_version;
    next_ir_id := current_ir_id;
  end if;

  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(workspace, 'diagram-presentation', coalesce(presentation_payload->>'schemaVersion', 'unknown'), presentation_checksum, octet_length(presentation_payload::text), presentation_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null
  returning id into presentation_blob;

  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(workspace, 'materialized-diagram', coalesce(diagram_payload->>'schemaVersion', 'unknown'), diagram_checksum, octet_length(diagram_payload::text), diagram_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null
  returning id into diagram_blob;

  next_diagram_version := base_version + 1;
  insert into public.diagram_versions(diagram_id, version, parent_version, payload, checksum, created_by)
  values(target_diagram, next_diagram_version, base_version, diagram_payload, diagram_checksum, auth.uid())
  returning id into next_diagram_version_id;

  insert into public.diagram_version_artifacts(diagram_version_id, architecture_ir_version_id, presentation_blob_id, diagram_blob_id, compiler_version, catalog_version)
  values(next_diagram_version_id, next_ir_id, presentation_blob, diagram_blob, compiler_version, catalog_version);

  update public.diagrams set current_version = next_diagram_version, current_ir_version = next_ir_version,
    title = left(diagram_payload->>'title', 160), updated_at = now() where id = target_diagram;

  insert into public.diagram_save_requests(diagram_id, idempotency_key, request_checksum, diagram_version, ir_version, created_by)
  values(target_diagram, idempotency, request_checksum, next_diagram_version, next_ir_version, auth.uid());

  if ai_request_id is not null then
    select id into run_id from public.ai_runs where request_id = ai_request_id and user_id = auth.uid();
    if run_id is not null then
      insert into public.ai_run_artifacts(ai_run_id, architecture_ir_version_id)
      values(run_id, next_ir_id) on conflict (ai_run_id) do nothing;
    end if;
  end if;

  insert into public.audit_events(workspace_id, actor_id, action, target_type, target_id, metadata)
  values(workspace, auth.uid(), 'architecture.snapshot.saved', 'diagram', target_diagram,
    jsonb_build_object('diagramVersion', next_diagram_version, 'irVersion', next_ir_version, 'semanticChanged', semantic_changed));

  return query select target_diagram, next_diagram_version, next_ir_version, semantic_changed, ir_checksum, diagram_checksum;
end;
$$;

-- Read the canonical materialized artifact; retain compatibility with unlinked legacy versions.
create or replace function public.read_shared_diagram(target_token_hash text)
returns table(project_id uuid, project_name text, diagram_id uuid, diagram_title text, diagram_payload jsonb)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, d.id, d.title, coalesce(ab.hot_payload, dv.payload)
    from public.share_links sl
    join public.projects p on p.id = sl.project_id
    join public.diagrams d on d.project_id = p.id
    join public.diagram_versions dv on dv.diagram_id = d.id and dv.version = d.current_version
    left join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
    left join public.artifact_blobs ab on ab.id = dva.diagram_blob_id
   where sl.token_hash = target_token_hash
     and sl.scope = 'read'
     and sl.revoked_at is null
     and (sl.expires_at is null or sl.expires_at > now())
     and p.deleted_at is null
   order by d.updated_at desc
   limit 1;
$$;

revoke all on function public.read_shared_diagram(text) from public;
grant execute on function public.read_shared_diagram(text) to anon, authenticated;

