create table public.diagram_generation_origins (
  diagram_id uuid primary key references public.diagrams(id) on delete cascade,
  ai_run_id uuid not null references public.ai_runs(id),
  artifact jsonb not null,
  artifact_checksum text not null check (artifact_checksum ~ '^[a-f0-9]{64}$'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.diagram_generation_origins enable row level security;
revoke all on public.diagram_generation_origins from anon, authenticated;
grant select on public.diagram_generation_origins to authenticated;
create policy "members read generation origins" on public.diagram_generation_origins for select using (
  exists(select 1 from public.diagrams d join public.projects p on p.id = d.project_id
    where d.id = diagram_id and public.is_workspace_member(p.workspace_id))
);
create trigger immutable_diagram_generation_origins before update or delete on public.diagram_generation_origins
  for each row execute function public.prevent_ir_version_mutation();

create or replace function public.migrate_guest_architecture_complete(
  idempotency uuid, request_checksum text, draft_title text,
  ir_payload jsonb, ir_checksum text, presentation_payload jsonb, presentation_checksum text,
  diagram_payload jsonb, diagram_checksum text, ir_provenance text,
  compiler_version text, catalog_version text, document_markdown text,
  generation_origin jsonb default null, generation_origin_checksum text default null,
  generation_request_id uuid default null
)
returns table(project_id uuid, diagram_id uuid, version integer, ir_version integer, document_version integer)
language plpgsql security definer set search_path = '' as $$
declare
  migrated record;
  doc_id uuid;
  ir_id uuid;
  run_id uuid;
begin
  if document_markdown is null or octet_length(document_markdown) > 1000000 then
    raise exception 'Invalid migrated document' using errcode = '22023';
  end if;
  if (generation_origin is null) <> (generation_origin_checksum is null)
    or (generation_origin is null) <> (generation_request_id is null) then
    raise exception 'Incomplete generation origin' using errcode = '22023';
  end if;
  if generation_origin is not null and (
    jsonb_typeof(generation_origin) <> 'object'
    or generation_origin_checksum <> public.canonical_jsonb_sha256(generation_origin)
    or octet_length(generation_origin::text) > 1000000
  ) then raise exception 'Invalid generation origin' using errcode = '22023'; end if;

  select * into migrated from public.migrate_guest_architecture(
    idempotency, request_checksum, draft_title, ir_payload, ir_checksum,
    presentation_payload, presentation_checksum, diagram_payload, diagram_checksum,
    ir_provenance, compiler_version, catalog_version, null
  );

  select d.id into doc_id from public.documents d where d.diagram_id = migrated.diagram_id for update;
  if doc_id is null then
    insert into public.documents(diagram_id, current_version, created_by)
    values(migrated.diagram_id, 1, auth.uid()) returning id into doc_id;
    select aiv.id into ir_id from public.architecture_ir_versions aiv
      where aiv.diagram_id = migrated.diagram_id and aiv.version = migrated.ir_version;
    insert into public.document_versions(document_id, version, diagram_version, architecture_ir_version_id, markdown, created_by)
    values(doc_id, 1, migrated.version, ir_id, document_markdown, auth.uid());
  end if;

  if generation_origin is not null then
    select ar.id into run_id from public.ai_runs ar
      where ar.request_id = generation_request_id and ar.user_id = auth.uid();
    if run_id is null then raise exception 'Generation provenance is unavailable' using errcode = '22023'; end if;
    insert into public.diagram_generation_origins(diagram_id, ai_run_id, artifact, artifact_checksum, created_by)
    values(migrated.diagram_id, run_id, generation_origin, generation_origin_checksum, auth.uid())
    on conflict (diagram_id) do nothing;
    if not exists(select 1 from public.diagram_generation_origins dgo where dgo.diagram_id = migrated.diagram_id
      and dgo.artifact_checksum = generation_origin_checksum and dgo.ai_run_id = run_id) then
      raise exception 'Generation origin replay mismatch' using errcode = '22023';
    end if;
    update public.ai_runs set diagram_id = migrated.diagram_id where id = run_id;
  end if;

  insert into public.audit_events(workspace_id, actor_id, action, target_type, target_id, metadata)
  select p.workspace_id, auth.uid(), 'architecture.guest-migration-verified', 'diagram', migrated.diagram_id,
    jsonb_build_object('documentVersion', 1, 'generationOrigin', generation_origin is not null)
    from public.diagrams d join public.projects p on p.id = d.project_id where d.id = migrated.diagram_id;
  return query select migrated.project_id, migrated.diagram_id, migrated.version, migrated.ir_version, 1;
end;
$$;

revoke execute on function public.migrate_guest_architecture_complete(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, text, jsonb, text, uuid) from public, anon;
grant execute on function public.migrate_guest_architecture_complete(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, text, jsonb, text, uuid) to authenticated;
