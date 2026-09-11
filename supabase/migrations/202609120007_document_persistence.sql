alter table public.document_versions
  add column if not exists content_checksum text,
  add column if not exists source text not null default 'legacy';

update public.document_versions
set content_checksum = encode(extensions.digest(pg_catalog.convert_to(markdown, 'UTF8'), 'sha256'), 'hex')
where content_checksum is null;

alter table public.document_versions
  alter column content_checksum set not null,
  add constraint document_versions_checksum_format check (content_checksum ~ '^[a-f0-9]{64}$'),
  add constraint document_versions_source check (source in ('user-edit', 'ai-generated', 'guest-migration', 'legacy'));

-- Compatibility for previously deployed server functions that append document
-- versions. New writes provide these values explicitly, while this trigger keeps
-- older guest migrations valid during a rolling deployment.
create or replace function public.prepare_document_version()
returns trigger language plpgsql set search_path = '' as $$
declare calculated_checksum text;
begin
  calculated_checksum := encode(extensions.digest(pg_catalog.convert_to(new.markdown, 'UTF8'), 'sha256'), 'hex');
  if new.content_checksum is null then new.content_checksum := calculated_checksum; end if;
  if new.content_checksum <> calculated_checksum then
    raise exception 'Document content checksum mismatch' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_document_version on public.document_versions;
create trigger prepare_document_version before insert on public.document_versions
for each row execute function public.prepare_document_version();

create unique index if not exists documents_one_per_diagram_idx on public.documents(diagram_id);

create table public.document_save_requests (
  diagram_id uuid not null references public.diagrams(id) on delete cascade,
  idempotency_key uuid not null,
  request_checksum text not null check (request_checksum ~ '^[a-f0-9]{64}$'),
  document_version integer not null check (document_version > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (diagram_id, idempotency_key)
);

alter table public.document_save_requests enable row level security;
revoke all on public.document_save_requests from anon, authenticated;

-- Documents are mutated only through guarded security-definer functions. This
-- prevents a browser client from advancing current_version without creating the
-- corresponding immutable version and audit record.
revoke insert, update, delete on public.documents, public.document_versions from authenticated;

create or replace function public.save_architecture_document(
  target_diagram uuid,
  base_document_version integer,
  target_diagram_version integer,
  target_ir_version integer,
  idempotency uuid,
  request_checksum text,
  document_markdown text,
  document_source text
)
returns table(document_version integer, diagram_version integer, ir_version integer, content_checksum text, replayed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  workspace uuid;
  current_diagram_version integer;
  current_ir_version integer;
  ir_version_id uuid;
  document_id uuid;
  current_document_version integer;
  next_document_version integer;
  markdown_checksum text;
  expected_request_checksum text;
  prior public.document_save_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if idempotency is null or base_document_version is null or base_document_version < 0
    or target_diagram_version is null or target_diagram_version < 1 or target_ir_version is null or target_ir_version < 1
    or request_checksum is null or request_checksum !~ '^[a-f0-9]{64}$' or document_markdown is null
    or document_source is null or document_source not in ('user-edit', 'ai-generated')
    or octet_length(document_markdown) > 1000000 then
    raise exception 'Invalid architecture document' using errcode = '22023';
  end if;
  markdown_checksum := encode(extensions.digest(pg_catalog.convert_to(document_markdown, 'UTF8'), 'sha256'), 'hex');
  expected_request_checksum := public.canonical_jsonb_sha256(jsonb_build_object(
    'baseDocumentVersion', base_document_version, 'diagramVersion', target_diagram_version,
    'irVersion', target_ir_version, 'markdown', document_markdown, 'source', document_source
  ));
  if request_checksum <> expected_request_checksum then
    raise exception 'Document request checksum mismatch' using errcode = '22023';
  end if;

  select d.current_version, d.current_ir_version, p.workspace_id
    into current_diagram_version, current_ir_version, workspace
    from public.diagrams d join public.projects p on p.id = d.project_id
   where d.id = target_diagram and p.deleted_at is null and public.can_edit_workspace(p.workspace_id)
   for update of d;
  if workspace is null then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;

  select * into prior from public.document_save_requests dsr
   where dsr.diagram_id = target_diagram and dsr.idempotency_key = idempotency;
  if prior.diagram_id is not null then
    if prior.request_checksum <> request_checksum then
      raise exception 'Idempotency key was reused with different document content' using errcode = '22023';
    end if;
    return query select prior.document_version, target_diagram_version, target_ir_version, markdown_checksum, true;
    return;
  end if;

  if current_diagram_version <> target_diagram_version or current_ir_version <> target_ir_version then
    raise exception 'Architecture version conflict' using errcode = '40001';
  end if;
  select aiv.id into ir_version_id from public.architecture_ir_versions aiv
   where aiv.diagram_id = target_diagram and aiv.version = target_ir_version;
  if ir_version_id is null then raise exception 'Architecture IR version is unavailable' using errcode = '40001'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_diagram::text));
  select d.id, d.current_version into document_id, current_document_version
    from public.documents d where d.diagram_id = target_diagram for update;
  if document_id is null then
    if base_document_version <> 0 then raise exception 'Document version conflict' using errcode = '40001'; end if;
    next_document_version := 1;
    insert into public.documents(diagram_id, current_version, created_by)
    values(target_diagram, next_document_version, auth.uid()) returning id into document_id;
  else
    if current_document_version <> base_document_version then raise exception 'Document version conflict' using errcode = '40001'; end if;
    next_document_version := current_document_version + 1;
    update public.documents set current_version = next_document_version, stale_at = null, updated_at = now() where id = document_id;
  end if;

  insert into public.document_versions(document_id, version, diagram_version, architecture_ir_version_id, markdown, content_checksum, source, created_by)
  values(document_id, next_document_version, target_diagram_version, ir_version_id, document_markdown, markdown_checksum, document_source, auth.uid());
  insert into public.document_save_requests(diagram_id, idempotency_key, request_checksum, document_version, created_by)
  values(target_diagram, idempotency, request_checksum, next_document_version, auth.uid());
  insert into public.audit_events(workspace_id, actor_id, action, target_type, target_id, metadata)
  values(workspace, auth.uid(), 'architecture.document.saved', 'diagram', target_diagram,
    jsonb_build_object('diagramVersion', target_diagram_version, 'irVersion', target_ir_version,
      'documentVersion', next_document_version, 'source', document_source, 'contentChecksum', markdown_checksum));
  return query select next_document_version, target_diagram_version, target_ir_version, markdown_checksum, false;
end;
$$;

revoke execute on function public.save_architecture_document(uuid, integer, integer, integer, uuid, text, text, text) from public, anon;
grant execute on function public.save_architecture_document(uuid, integer, integer, integer, uuid, text, text, text) to authenticated;
