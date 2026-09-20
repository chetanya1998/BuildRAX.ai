-- Add immutable Evidence IR and Requirement IR artifacts without replacing the
-- existing architecture snapshot graph. Legacy diagram versions intentionally
-- have no traceability row and remain readable without fabricated evidence.

alter table public.artifact_blobs drop constraint if exists artifact_blobs_kind_check;
alter table public.artifact_blobs add constraint artifact_blobs_kind_check
  check (kind in ('architecture-ir', 'diagram-presentation', 'materialized-diagram', 'evidence-ir', 'requirement-ir'));

create table public.diagram_version_traceability (
  diagram_version_id uuid primary key references public.diagram_versions(id) on delete cascade,
  evidence_blob_id uuid not null references public.artifact_blobs(id),
  requirement_blob_id uuid not null references public.artifact_blobs(id),
  created_at timestamptz not null default now()
);

alter table public.diagram_version_traceability enable row level security;
create policy "members read diagram traceability" on public.diagram_version_traceability
  for select to authenticated using (exists (
    select 1 from public.diagram_versions dv
    join public.diagrams d on d.id = dv.diagram_id
    join public.projects p on p.id = d.project_id
    where dv.id = diagram_version_id and p.deleted_at is null and public.is_workspace_member(p.workspace_id)
  ));
revoke all on public.diagram_version_traceability from anon, authenticated;
grant select on public.diagram_version_traceability to authenticated;
create trigger immutable_diagram_version_traceability before update or delete on public.diagram_version_traceability
  for each row execute function public.prevent_ir_version_mutation();

create or replace function public.link_architecture_traceability(
  target_diagram uuid,
  target_version integer,
  evidence_payload jsonb,
  evidence_checksum text,
  requirement_payload jsonb,
  requirement_checksum text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  workspace uuid;
  diagram_version_id uuid;
  evidence_blob uuid;
  requirement_blob uuid;
  existing_evidence_checksum text;
  existing_requirement_checksum text;
begin
  if auth.uid() is null
    or jsonb_typeof(evidence_payload) <> 'object'
    or jsonb_typeof(requirement_payload) <> 'object'
    or evidence_payload->>'schemaVersion' <> '1.0.0'
    or requirement_payload->>'schemaVersion' <> '1.0.0'
    or evidence_checksum !~ '^[a-f0-9]{64}$'
    or requirement_checksum !~ '^[a-f0-9]{64}$'
    or evidence_checksum <> public.canonical_jsonb_sha256(evidence_payload)
    or requirement_checksum <> public.canonical_jsonb_sha256(requirement_payload)
    or octet_length(evidence_payload::text) + octet_length(requirement_payload::text) > 512000 then
    raise exception 'Invalid architecture traceability payload' using errcode = '22023';
  end if;

  select p.workspace_id, dv.id into workspace, diagram_version_id
    from public.diagram_versions dv
    join public.diagrams d on d.id = dv.diagram_id
    join public.projects p on p.id = d.project_id and p.deleted_at is null
   where d.id = target_diagram and dv.version = target_version and public.can_edit_workspace(p.workspace_id);
  if diagram_version_id is null then raise exception 'Architecture version not found or access denied' using errcode = '42501'; end if;

  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(workspace, 'evidence-ir', evidence_payload->>'schemaVersion', evidence_checksum, octet_length(evidence_payload::text), evidence_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null
  returning id into evidence_blob;

  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(workspace, 'requirement-ir', requirement_payload->>'schemaVersion', requirement_checksum, octet_length(requirement_payload::text), requirement_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null
  returning id into requirement_blob;

  insert into public.diagram_version_traceability(diagram_version_id, evidence_blob_id, requirement_blob_id)
  values(diagram_version_id, evidence_blob, requirement_blob)
  on conflict on constraint diagram_version_traceability_pkey do nothing;

  select eb.checksum, rb.checksum into existing_evidence_checksum, existing_requirement_checksum
    from public.diagram_version_traceability dvt
    join public.artifact_blobs eb on eb.id = dvt.evidence_blob_id
    join public.artifact_blobs rb on rb.id = dvt.requirement_blob_id
   where dvt.diagram_version_id = diagram_version_id;
  if existing_evidence_checksum <> evidence_checksum or existing_requirement_checksum <> requirement_checksum then
    raise exception 'Traceability replay mismatch' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.link_architecture_traceability(uuid, integer, jsonb, text, jsonb, text) from public, anon, authenticated;

create or replace function public.save_architecture_snapshot_v2(
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
  evidence_payload jsonb,
  evidence_checksum text,
  requirement_payload jsonb,
  requirement_checksum text,
  ai_request_id uuid default null
)
returns table(diagram_id uuid, version integer, ir_version integer, ir_changed boolean, saved_ir_checksum text, saved_diagram_checksum text)
language plpgsql security definer set search_path = '' as $$
declare
  saved record;
  legacy_checksum text;
begin
  if request_checksum <> public.canonical_jsonb_sha256(jsonb_build_object(
    'baseVersion', base_version, 'baseIrVersion', base_ir_version, 'ir', ir_payload, 'presentation', presentation_payload,
    'traceability', jsonb_build_object('schemaVersion', '1.0.0', 'evidence', evidence_payload, 'requirements', requirement_payload)
  )) then raise exception 'Architecture traceability checksum mismatch' using errcode = '22023'; end if;
  legacy_checksum := public.canonical_jsonb_sha256(jsonb_build_object(
    'baseVersion', base_version, 'baseIrVersion', base_ir_version, 'ir', ir_payload, 'presentation', presentation_payload
  ));
  select * into saved from public.save_architecture_snapshot(
    target_diagram, base_version, base_ir_version, idempotency, legacy_checksum,
    ir_payload, ir_checksum, presentation_payload, presentation_checksum,
    diagram_payload, diagram_checksum, ir_provenance, compiler_version, catalog_version, ai_request_id
  );
  perform public.link_architecture_traceability(target_diagram, saved.version, evidence_payload, evidence_checksum, requirement_payload, requirement_checksum);
  return query select saved.diagram_id, saved.version, saved.ir_version, saved.ir_changed, saved.saved_ir_checksum, saved.saved_diagram_checksum;
end;
$$;

revoke execute on function public.save_architecture_snapshot_v2(uuid, integer, integer, uuid, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, jsonb, text, jsonb, text, uuid) from public, anon;
grant execute on function public.save_architecture_snapshot_v2(uuid, integer, integer, uuid, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, jsonb, text, jsonb, text, uuid) to authenticated;

create or replace function public.migrate_guest_architecture_v2(
  idempotency uuid,
  request_checksum text,
  draft_title text,
  ir_payload jsonb,
  ir_checksum text,
  presentation_payload jsonb,
  presentation_checksum text,
  diagram_payload jsonb,
  diagram_checksum text,
  ir_provenance text,
  compiler_version text,
  catalog_version text,
  evidence_payload jsonb,
  evidence_checksum text,
  requirement_payload jsonb,
  requirement_checksum text,
  ai_request_id uuid default null
)
returns table(project_id uuid, diagram_id uuid, version integer, ir_version integer)
language plpgsql security definer set search_path = '' as $$
declare
  migrated record;
  legacy_checksum text;
begin
  if request_checksum <> public.canonical_jsonb_sha256(jsonb_build_object(
    'ir', ir_payload, 'presentation', presentation_payload, 'diagram', diagram_payload,
    'traceability', jsonb_build_object('schemaVersion', '1.0.0', 'evidence', evidence_payload, 'requirements', requirement_payload)
  )) then raise exception 'Architecture traceability checksum mismatch' using errcode = '22023'; end if;
  legacy_checksum := public.canonical_jsonb_sha256(jsonb_build_object('ir', ir_payload, 'presentation', presentation_payload, 'diagram', diagram_payload));
  select * into migrated from public.migrate_guest_architecture(
    idempotency, legacy_checksum, draft_title, ir_payload, ir_checksum,
    presentation_payload, presentation_checksum, diagram_payload, diagram_checksum,
    ir_provenance, compiler_version, catalog_version, ai_request_id
  );
  perform public.link_architecture_traceability(migrated.diagram_id, migrated.version, evidence_payload, evidence_checksum, requirement_payload, requirement_checksum);
  return query select migrated.project_id, migrated.diagram_id, migrated.version, migrated.ir_version;
end;
$$;

revoke execute on function public.migrate_guest_architecture_v2(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, jsonb, text, jsonb, text, uuid) from public, anon;
grant execute on function public.migrate_guest_architecture_v2(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, jsonb, text, jsonb, text, uuid) to authenticated;

create or replace function public.migrate_guest_architecture_complete_v2(
  idempotency uuid,
  request_checksum text,
  draft_title text,
  ir_payload jsonb,
  ir_checksum text,
  presentation_payload jsonb,
  presentation_checksum text,
  diagram_payload jsonb,
  diagram_checksum text,
  ir_provenance text,
  compiler_version text,
  catalog_version text,
  document_markdown text,
  evidence_payload jsonb,
  evidence_checksum text,
  requirement_payload jsonb,
  requirement_checksum text,
  generation_origin jsonb default null,
  generation_origin_checksum text default null,
  generation_request_id uuid default null
)
returns table(project_id uuid, diagram_id uuid, version integer, ir_version integer, document_version integer)
language plpgsql security definer set search_path = '' as $$
declare
  migrated record;
  legacy_checksum text;
begin
  if request_checksum <> public.canonical_jsonb_sha256(jsonb_build_object(
    'ir', ir_payload, 'presentation', presentation_payload, 'diagram', diagram_payload,
    'traceability', jsonb_build_object('schemaVersion', '1.0.0', 'evidence', evidence_payload, 'requirements', requirement_payload)
  )) then raise exception 'Architecture traceability checksum mismatch' using errcode = '22023'; end if;
  legacy_checksum := public.canonical_jsonb_sha256(jsonb_build_object('ir', ir_payload, 'presentation', presentation_payload, 'diagram', diagram_payload));
  select * into migrated from public.migrate_guest_architecture_complete(
    idempotency, legacy_checksum, draft_title, ir_payload, ir_checksum,
    presentation_payload, presentation_checksum, diagram_payload, diagram_checksum,
    ir_provenance, compiler_version, catalog_version, document_markdown,
    generation_origin, generation_origin_checksum, generation_request_id
  );
  perform public.link_architecture_traceability(migrated.diagram_id, migrated.version, evidence_payload, evidence_checksum, requirement_payload, requirement_checksum);
  return query select migrated.project_id, migrated.diagram_id, migrated.version, migrated.ir_version, migrated.document_version;
end;
$$;

revoke execute on function public.migrate_guest_architecture_complete_v2(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, text, jsonb, text, jsonb, text, jsonb, text, uuid) from public, anon;
grant execute on function public.migrate_guest_architecture_complete_v2(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, text, jsonb, text, jsonb, text, jsonb, text, uuid) to authenticated;

create or replace function public.read_architecture_traceability(target_diagram uuid, target_version integer)
returns table(
  evidence_payload jsonb,
  requirement_payload jsonb,
  evidence_artifact_id uuid,
  requirement_artifact_id uuid,
  evidence_state text,
  requirement_state text,
  evidence_checksum text,
  requirement_checksum text
)
language plpgsql security definer set search_path = '' stable as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.diagrams d join public.projects p on p.id = d.project_id
     where d.id = target_diagram and p.deleted_at is null and public.is_workspace_member(p.workspace_id)
  ) then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;
  return query
    select eb.hot_payload, rb.hot_payload, eb.id, rb.id, eb.storage_state, rb.storage_state, eb.checksum, rb.checksum
      from public.diagram_versions dv
      join public.diagram_version_traceability dvt on dvt.diagram_version_id = dv.id
      join public.artifact_blobs eb on eb.id = dvt.evidence_blob_id
      join public.artifact_blobs rb on rb.id = dvt.requirement_blob_id
     where dv.diagram_id = target_diagram and dv.version = target_version;
end;
$$;

revoke execute on function public.read_architecture_traceability(uuid, integer) from public, anon;
grant execute on function public.read_architecture_traceability(uuid, integer) to authenticated;
