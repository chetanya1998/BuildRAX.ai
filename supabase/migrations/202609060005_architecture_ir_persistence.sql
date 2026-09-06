-- Architecture IR persistence. Semantic IR and visual presentation are stored
-- as independently checksummed artifacts and committed as one diagram version.

alter table public.diagrams
  add column if not exists current_ir_version integer not null default 0
  check (current_ir_version >= 0);

alter table public.diagram_versions alter column payload drop not null;

alter table public.guest_migrations
  add column if not exists request_checksum text check (request_checksum is null or request_checksum ~ '^[a-f0-9]{64}$');

create table public.artifact_blobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('architecture-ir', 'diagram-presentation', 'materialized-diagram')),
  schema_version text not null check (char_length(schema_version) between 1 and 40),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  byte_size integer not null check (byte_size between 2 and 1000000),
  hot_payload jsonb,
  storage_state text not null default 'hot' check (storage_state in ('hot', 'archiving', 'archived', 'restore-failed')),
  storage_path text check (storage_path is null or char_length(storage_path) between 1 and 1000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, kind, checksum),
  check (
    (storage_state = 'hot' and hot_payload is not null and storage_path is null)
    or (storage_state in ('archiving', 'restore-failed') and hot_payload is not null)
    or (storage_state = 'archived' and hot_payload is null and storage_path is not null and archived_at is not null)
  )
);

create table public.architecture_ir_versions (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.diagrams(id) on delete cascade,
  version integer not null check (version > 0),
  parent_version integer,
  artifact_blob_id uuid not null references public.artifact_blobs(id),
  provenance text not null check (provenance in ('deterministic-template', 'ai-proposal', 'manual-edit', 'legacy-migration', 'restore')),
  compiler_version text not null check (char_length(compiler_version) between 1 and 40),
  catalog_version text not null check (char_length(catalog_version) between 1 and 40),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (diagram_id, version)
);

create table public.diagram_version_artifacts (
  diagram_version_id uuid primary key references public.diagram_versions(id) on delete cascade,
  architecture_ir_version_id uuid not null references public.architecture_ir_versions(id),
  presentation_blob_id uuid not null references public.artifact_blobs(id),
  diagram_blob_id uuid not null references public.artifact_blobs(id),
  compiler_version text not null check (char_length(compiler_version) between 1 and 40),
  catalog_version text not null check (char_length(catalog_version) between 1 and 40),
  created_at timestamptz not null default now()
);

create table public.diagram_save_requests (
  diagram_id uuid not null references public.diagrams(id) on delete cascade,
  idempotency_key uuid not null,
  request_checksum text not null check (request_checksum ~ '^[a-f0-9]{64}$'),
  diagram_version integer not null check (diagram_version > 0),
  ir_version integer not null check (ir_version > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (diagram_id, idempotency_key)
);

create table public.ai_run_artifacts (
  ai_run_id uuid primary key references public.ai_runs(id) on delete cascade,
  architecture_ir_version_id uuid not null references public.architecture_ir_versions(id),
  created_at timestamptz not null default now()
);

alter table public.review_runs
  add column if not exists architecture_ir_version_id uuid references public.architecture_ir_versions(id),
  add column if not exists stale_at timestamptz;

alter table public.document_versions
  add column if not exists architecture_ir_version_id uuid references public.architecture_ir_versions(id);

alter table public.documents
  add column if not exists stale_at timestamptz;

create table public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('version-archive-warning', 'version-archived', 'archive-restore-failed')),
  diagram_id uuid references public.diagrams(id) on delete cascade,
  diagram_version integer,
  message text not null check (char_length(message) between 1 and 500),
  deduplication_key text not null unique check (char_length(deduplication_key) between 1 and 240),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.user_notifications(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'delivered', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 12),
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_owner uuid,
  provider_message_id text check (provider_message_id is null or char_length(provider_message_id) <= 240),
  last_error_class text check (last_error_class is null or char_length(last_error_class) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artifact_archive_jobs (
  id uuid primary key default gen_random_uuid(),
  artifact_blob_id uuid not null unique references public.artifact_blobs(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'leased', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 12),
  available_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_owner uuid,
  last_error_class text check (last_error_class is null or char_length(last_error_class) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.architecture_rate_windows (
  scope_key text not null check (char_length(scope_key) between 3 and 160),
  bucket_start timestamptz not null,
  request_count integer not null check (request_count between 1 and 10000),
  primary key (scope_key, bucket_start)
);

create table public.architecture_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  diagram_id uuid not null,
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$'),
  storage_path text not null check (char_length(storage_path) between 1 and 1000),
  byte_size integer not null check (byte_size between 1 and 3000000),
  content_type text not null check (content_type in ('image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml')),
  verified_at timestamptz not null default now(),
  unique(workspace_id, diagram_id, checksum),
  unique(storage_path)
);

create index architecture_ir_versions_diagram_idx on public.architecture_ir_versions(diagram_id, version desc);
create index artifact_blobs_archive_idx on public.artifact_blobs(storage_state, created_at) where storage_state = 'hot';
create index diagram_save_requests_created_idx on public.diagram_save_requests(created_at);
create index user_notifications_user_idx on public.user_notifications(user_id, created_at desc);
create index notification_outbox_available_idx on public.notification_outbox(status, available_at);
create index artifact_archive_jobs_available_idx on public.artifact_archive_jobs(status, available_at);
create index architecture_assets_diagram_idx on public.architecture_assets(workspace_id, diagram_id);

alter table public.artifact_blobs enable row level security;
alter table public.architecture_ir_versions enable row level security;
alter table public.diagram_version_artifacts enable row level security;
alter table public.diagram_save_requests enable row level security;
alter table public.ai_run_artifacts enable row level security;
alter table public.user_notifications enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.artifact_archive_jobs enable row level security;
alter table public.architecture_rate_windows enable row level security;
alter table public.architecture_assets enable row level security;

create policy "members read artifact metadata" on public.artifact_blobs
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "members read ir versions" on public.architecture_ir_versions
  for select to authenticated
  using (exists (
    select 1 from public.diagrams d join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null and public.is_workspace_member(p.workspace_id)
  ));

create policy "members read diagram artifact links" on public.diagram_version_artifacts
  for select to authenticated
  using (exists (
    select 1 from public.diagram_versions dv
    join public.diagrams d on d.id = dv.diagram_id
    join public.projects p on p.id = d.project_id
    where dv.id = diagram_version_id and p.deleted_at is null and public.is_workspace_member(p.workspace_id)
  ));

create policy "editors read own save requests" on public.diagram_save_requests
  for select to authenticated
  using (created_by = auth.uid() and exists (
    select 1 from public.diagrams d join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null and public.can_edit_workspace(p.workspace_id)
  ));

create policy "users read linked ai artifacts" on public.ai_run_artifacts
  for select to authenticated
  using (exists (select 1 from public.ai_runs ar where ar.id = ai_run_id and ar.user_id = auth.uid()));

create policy "users read own notifications" on public.user_notifications
  for select to authenticated using (user_id = auth.uid());
create policy "users mark own notifications read" on public.user_notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.artifact_blobs, public.architecture_ir_versions, public.diagram_version_artifacts,
  public.diagram_save_requests, public.ai_run_artifacts, public.user_notifications,
  public.notification_outbox, public.artifact_archive_jobs, public.architecture_rate_windows,
  public.architecture_assets from anon, authenticated;
grant select on public.architecture_ir_versions, public.diagram_version_artifacts,
  public.diagram_save_requests, public.ai_run_artifacts to authenticated;
grant select, update(read_at) on public.user_notifications to authenticated;

drop trigger if exists immutable_diagram_versions on public.diagram_versions;

-- This mirrors the application's key-sorted, whitespace-free JSON encoder so
-- checksums remain portable between Web Crypto and PostgreSQL.
create or replace function public.canonical_jsonb_text(input jsonb)
returns text language sql immutable strict set search_path = '' as $$
  select case jsonb_typeof(input)
    when 'object' then '{' || coalesce((
      select string_agg(to_jsonb(entry.key)::text || ':' || public.canonical_jsonb_text(entry.value), ',' order by entry.key)
      from jsonb_each(input) entry
    ), '') || '}'
    when 'array' then '[' || coalesce((
      select string_agg(public.canonical_jsonb_text(entry.value), ',' order by entry.ordinality)
      from jsonb_array_elements(input) with ordinality entry(value, ordinality)
    ), '') || ']'
    else input::text
  end;
$$;

create or replace function public.canonical_jsonb_sha256(input jsonb)
returns text language sql immutable strict set search_path = '' as $$
  select encode(extensions.digest(convert_to(public.canonical_jsonb_text(input), 'UTF8'), 'sha256'), 'hex');
$$;

revoke execute on function public.canonical_jsonb_text(jsonb), public.canonical_jsonb_sha256(jsonb) from public, anon, authenticated;

-- Backfill every legacy snapshot before new writes are enabled. Legacy semantic
-- data is inferred only from the validated diagram fields; no prompt is stored.
do $$
declare
  item record;
  workspace uuid;
  legacy_ir jsonb;
  legacy_presentation jsonb;
  ir_checksum text;
  presentation_checksum text;
  diagram_checksum text;
  ir_blob uuid;
  presentation_blob uuid;
  diagram_blob uuid;
  ir_version_id uuid;
begin
  for item in
    select dv.*, d.project_id
      from public.diagram_versions dv join public.diagrams d on d.id = dv.diagram_id
     where dv.payload is not null
     order by dv.diagram_id, dv.version
  loop
    select p.workspace_id into workspace from public.projects p where p.id = item.project_id;

    legacy_ir := jsonb_build_object(
      'schemaVersion', '1.1.0',
      'intent', jsonb_build_object(
        'title', coalesce(nullif(item.payload->>'title', ''), 'Untitled architecture'),
        'summary', 'Preserve the behavior represented by this migrated architecture diagram.',
        'archetype', 'general',
        'trafficProfile', 'unknown'
      ),
      'requirements', jsonb_build_object(
        'functional', jsonb_build_array('Preserve the represented system behavior and typed data flows.'),
        'nonFunctional', '[]'::jsonb
      ),
      'constraints', jsonb_build_object(
        'preferredStack', '[]'::jsonb,
        'cloudProvider', '',
        'multiTenant', false,
        'dataSensitivity', 'unspecified'
      ),
      'components', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'id', node->>'id',
          'semanticType', node->>'semanticType',
          'category', node->>'category',
          'name', coalesce(nullif(node->>'name', ''), node->>'semanticType'),
          'description', coalesce(nullif(node->>'description', ''), nullif(node->>'name', ''), node->>'semanticType'),
          'responsibilities', coalesce(node->'responsibilities', '[]'::jsonb),
          'technology', nullif(node->>'technology', ''),
          'provider', nullif(node->>'provider', ''),
          'environment', coalesce(nullif(node->>'environment', ''), 'agnostic')
        ))) from jsonb_array_elements(coalesce(item.payload->'nodes', '[]'::jsonb)) node
      ), '[]'::jsonb),
      'flows', coalesce((
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'id', flow->>'id',
          'source', flow->>'source',
          'sourcePort', coalesce(nullif(flow->>'sourcePort', ''), 'out'),
          'target', flow->>'target',
          'targetPort', coalesce(nullif(flow->>'targetPort', ''), 'in'),
          'type', flow->>'type',
          'label', coalesce(nullif(flow->>'label', ''), flow->>'type'),
          'protocol', nullif(flow->>'protocol', ''),
          'direction', coalesce(nullif(flow->>'direction', ''), 'unidirectional'),
          'security', jsonb_build_object(
            'authentication', coalesce(flow->>'authentication', ''),
            'encryption', coalesce(flow->>'encryption', ''),
            'dataClassification', coalesce(nullif(flow->>'dataClassification', ''), 'unspecified')
          ),
          'resilience', jsonb_build_object(
            'retryPolicy', coalesce(flow->>'retryPolicy', ''),
            'latencyTarget', coalesce(flow->>'latency', '')
          )
        ))) from jsonb_array_elements(coalesce(item.payload->'connectors', '[]'::jsonb)) flow
      ), '[]'::jsonb),
      'assumptions', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', assumption->>'id',
          'type', coalesce(nullif(assumption->>'type', ''), 'general'),
          'text', assumption->>'text',
          'confidence', coalesce((assumption->>'confidence')::numeric, 0.5),
          'affectedComponents', coalesce(assumption->'affectedObjects', '[]'::jsonb)
        )) from jsonb_array_elements(coalesce(item.payload->'assumptions', '[]'::jsonb)) assumption
      ), '[]'::jsonb),
      'decisions', '[]'::jsonb,
      'provenance', jsonb_build_object(
        'strategy', 'legacy-migration',
        'compilerVersion', '1.1.0',
        'catalogVersion', '1.0.0'
      )
    );

    legacy_presentation := jsonb_build_object(
      'schemaVersion', '1.0.0',
      'theme', coalesce(nullif(item.payload->>'theme', ''), 'light'),
      'viewport', coalesce(item.payload->'viewport', jsonb_build_object('x', 0, 'y', 0, 'zoom', 1)),
      'components', coalesce((
        select jsonb_agg(jsonb_build_object(
          'componentId', node->>'id',
          'position', coalesce(node->'position', jsonb_build_object('x', 0, 'y', 0)),
          'dimensions', coalesce(node->'dimensions', jsonb_build_object('width', 220, 'height', 112)),
          'zIndex', 0
        )) from jsonb_array_elements(coalesce(item.payload->'nodes', '[]'::jsonb)) node
      ), '[]'::jsonb),
      'flows', coalesce((
        select jsonb_agg(jsonb_build_object(
          'flowId', flow->>'id',
          'sourcePort', coalesce(nullif(flow->>'sourcePort', ''), 'out'),
          'targetPort', coalesce(nullif(flow->>'targetPort', ''), 'in'),
          'style', coalesce(nullif(flow->>'style', ''), 'solid'),
          'routing', coalesce(nullif(flow->>'routing', ''), 'orthogonal'),
          'labelPosition', 0.5,
          'zIndex', 0
        )) from jsonb_array_elements(coalesce(item.payload->'connectors', '[]'::jsonb)) flow
      ), '[]'::jsonb),
      'primitives', coalesce(item.payload->'primitives', '[]'::jsonb),
      'layerOrder', '[]'::jsonb
    );

    ir_checksum := public.canonical_jsonb_sha256(legacy_ir);
    presentation_checksum := public.canonical_jsonb_sha256(legacy_presentation);
    diagram_checksum := public.canonical_jsonb_sha256(item.payload);

    insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
    values(workspace, 'architecture-ir', '1.1.0', ir_checksum, octet_length(legacy_ir::text), legacy_ir)
    on conflict (workspace_id, kind, checksum) do update set checksum = excluded.checksum returning id into ir_blob;
    insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
    values(workspace, 'diagram-presentation', '1.0.0', presentation_checksum, octet_length(legacy_presentation::text), legacy_presentation)
    on conflict (workspace_id, kind, checksum) do update set checksum = excluded.checksum returning id into presentation_blob;
    insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
    values(workspace, 'materialized-diagram', coalesce(item.payload->>'schemaVersion', '1.0.0'), diagram_checksum, octet_length(item.payload::text), item.payload)
    on conflict (workspace_id, kind, checksum) do update set checksum = excluded.checksum returning id into diagram_blob;

    insert into public.architecture_ir_versions(diagram_id, version, parent_version, artifact_blob_id, provenance, compiler_version, catalog_version, created_by, created_at)
    values(item.diagram_id, item.version, item.parent_version, ir_blob, 'legacy-migration', '1.1.0', '1.0.0', item.created_by, item.created_at)
    returning id into ir_version_id;
    insert into public.diagram_version_artifacts(diagram_version_id, architecture_ir_version_id, presentation_blob_id, diagram_blob_id, compiler_version, catalog_version, created_at)
    values(item.id, ir_version_id, presentation_blob, diagram_blob, '1.1.0', '1.0.0', item.created_at);
    update public.diagram_versions set checksum = diagram_checksum where id = item.id;
  end loop;

  update public.diagrams d set current_ir_version = coalesce((
    select max(aiv.version) from public.architecture_ir_versions aiv where aiv.diagram_id = d.id
  ), 0);
end;
$$;

create or replace function public.prevent_diagram_version_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise exception 'Immutable records cannot be deleted'; end if;
  if old.payload is not null and new.payload is null
    and old.id = new.id and old.diagram_id = new.diagram_id and old.version = new.version
    and old.parent_version is not distinct from new.parent_version
    and old.checksum = new.checksum and old.created_by = new.created_by and old.created_at = new.created_at
    and exists (
      select 1 from public.diagram_version_artifacts dva
      join public.artifact_blobs ab on ab.id = dva.diagram_blob_id
      where dva.diagram_version_id = old.id and ab.storage_state = 'archived' and ab.checksum = old.checksum
    ) then
    return new;
  end if;
  raise exception 'Immutable records cannot be changed';
end;
$$;

create trigger immutable_diagram_versions before update or delete on public.diagram_versions
  for each row execute function public.prevent_diagram_version_mutation();

create or replace function public.prevent_ir_version_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Immutable IR versions cannot be changed'; end; $$;
create trigger immutable_architecture_ir_versions before update or delete on public.architecture_ir_versions
  for each row execute function public.prevent_ir_version_mutation();
create trigger immutable_diagram_version_artifacts before update or delete on public.diagram_version_artifacts
  for each row execute function public.prevent_ir_version_mutation();
create trigger immutable_ai_run_artifacts before update or delete on public.ai_run_artifacts
  for each row execute function public.prevent_ir_version_mutation();

create or replace function public.is_well_formed_architecture_snapshot(ir_payload jsonb, presentation_payload jsonb, diagram_payload jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(ir_payload) <> 'object' or jsonb_typeof(presentation_payload) <> 'object' or jsonb_typeof(diagram_payload) <> 'object'
    or ir_payload->>'schemaVersion' <> '1.1.0' or presentation_payload->>'schemaVersion' <> '1.0.0'
    or jsonb_typeof(ir_payload->'intent') <> 'object' or jsonb_typeof(ir_payload->'requirements') <> 'object'
    or jsonb_typeof(ir_payload->'constraints') <> 'object' or jsonb_typeof(ir_payload->'provenance') <> 'object'
    or jsonb_typeof(ir_payload->'assumptions') <> 'array' or jsonb_typeof(ir_payload->'decisions') <> 'array'
    or jsonb_typeof(ir_payload->'components') <> 'array' or jsonb_typeof(ir_payload->'flows') <> 'array'
    or jsonb_typeof(ir_payload->'requirements'->'functional') <> 'array'
    or jsonb_array_length(ir_payload->'requirements'->'functional') = 0
    or nullif(trim(ir_payload->'intent'->>'title'), '') is null
    or nullif(trim(ir_payload->'intent'->>'summary'), '') is null
    or ir_payload->'provenance'->>'strategy' not in ('deterministic-template', 'ai-proposal', 'manual-edit', 'legacy-migration', 'restore')
    or jsonb_typeof(presentation_payload->'components') <> 'array' or jsonb_typeof(presentation_payload->'flows') <> 'array'
    or jsonb_typeof(presentation_payload->'viewport') <> 'object' or jsonb_typeof(presentation_payload->'primitives') <> 'array'
    or jsonb_typeof(presentation_payload->'layerOrder') <> 'array'
    or jsonb_typeof(diagram_payload->'nodes') <> 'array' or jsonb_typeof(diagram_payload->'connectors') <> 'array'
    or jsonb_typeof(diagram_payload->'primitives') <> 'array' or jsonb_typeof(diagram_payload->'assumptions') <> 'array'
    or jsonb_typeof(diagram_payload->'viewport') <> 'object' or nullif(diagram_payload->>'id', '') is null
    or nullif(trim(diagram_payload->>'title'), '') is null
    or octet_length(ir_payload::text) > 256000 or octet_length(presentation_payload::text) > 1000000
    or octet_length(diagram_payload::text) > 1000000 or ir_payload::text ~ '[<>]'
  then return false; end if;

  if exists (
    select 1 from (
      (select value->>'id' id from jsonb_array_elements(ir_payload->'components')
       except select value->>'id' from jsonb_array_elements(diagram_payload->'nodes'))
      union all
      (select value->>'id' from jsonb_array_elements(diagram_payload->'nodes')
       except select value->>'id' from jsonb_array_elements(ir_payload->'components'))
      union all
      (select value->>'id' from jsonb_array_elements(ir_payload->'flows')
       except select value->>'id' from jsonb_array_elements(diagram_payload->'connectors'))
      union all
      (select value->>'id' from jsonb_array_elements(diagram_payload->'connectors')
       except select value->>'id' from jsonb_array_elements(ir_payload->'flows'))
      union all
      (select value->>'id' from jsonb_array_elements(ir_payload->'components')
       except select value->>'componentId' from jsonb_array_elements(presentation_payload->'components'))
      union all
      (select value->>'id' from jsonb_array_elements(ir_payload->'flows')
       except select value->>'flowId' from jsonb_array_elements(presentation_payload->'flows'))
      union all
      (select value->>'componentId' from jsonb_array_elements(presentation_payload->'components')
       except select value->>'id' from jsonb_array_elements(ir_payload->'components'))
      union all
      (select value->>'flowId' from jsonb_array_elements(presentation_payload->'flows')
       except select value->>'id' from jsonb_array_elements(ir_payload->'flows'))
    ) mismatch
  ) then return false; end if;

  if exists (
    select 1 from jsonb_array_elements(ir_payload->'flows') flow
     where nullif(flow->>'source', '') is null or nullif(flow->>'target', '') is null
       or nullif(flow->>'sourcePort', '') is null or nullif(flow->>'targetPort', '') is null
       or not exists (select 1 from jsonb_array_elements(ir_payload->'components') component where component->>'id' = flow->>'source')
       or not exists (select 1 from jsonb_array_elements(ir_payload->'components') component where component->>'id' = flow->>'target')
       or not exists (
         select 1 from jsonb_array_elements(diagram_payload->'connectors') connector
          where connector->>'id' = flow->>'id' and connector->>'source' = flow->>'source'
            and connector->>'target' = flow->>'target'
            and connector->>'sourcePort' = flow->>'sourcePort' and connector->>'targetPort' = flow->>'targetPort'
       )
  ) then return false; end if;

  if (select count(*) from jsonb_array_elements(ir_payload->'components')) <>
     (select count(distinct value->>'id') from jsonb_array_elements(ir_payload->'components'))
    or (select count(*) from jsonb_array_elements(ir_payload->'flows')) <>
       (select count(distinct value->>'id') from jsonb_array_elements(ir_payload->'flows'))
  then return false; end if;
  return true;
exception when others then return false;
end;
$$;

revoke execute on function public.is_well_formed_architecture_snapshot(jsonb, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.enforce_architecture_persistence_rate_limit(
  target_workspace uuid,
  target_diagram uuid,
  target_user uuid
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  bucket timestamptz := date_trunc('minute', clock_timestamp());
  observed integer;
  workspace_shard integer := mod(abs(hashtextextended(target_diagram::text, 0)), 16);
begin
  insert into public.architecture_rate_windows(scope_key, bucket_start, request_count)
  values('user:' || target_user::text, bucket, 1)
  on conflict (scope_key, bucket_start) do update set request_count = public.architecture_rate_windows.request_count + 1
    where public.architecture_rate_windows.request_count < 120
  returning request_count into observed;
  if observed is null then raise exception 'Persistence rate limit exceeded' using errcode = 'P0001'; end if;

  observed := null;
  insert into public.architecture_rate_windows(scope_key, bucket_start, request_count)
  values('workspace:' || target_workspace::text || ':' || workspace_shard::text, bucket, 1)
  on conflict (scope_key, bucket_start) do update set request_count = public.architecture_rate_windows.request_count + 1
    where public.architecture_rate_windows.request_count < 250
  returning request_count into observed;
  if observed is null then raise exception 'Workspace persistence rate limit exceeded' using errcode = 'P0001'; end if;
end;
$$;

revoke execute on function public.enforce_architecture_persistence_rate_limit(uuid, uuid, uuid) from public, anon, authenticated;

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

  select d, p.workspace_id into current_record, workspace
    from public.diagrams d join public.projects p on p.id = d.project_id
   where d.id = target_diagram and p.deleted_at is null and public.can_edit_workspace(p.workspace_id)
   for update of d;
  if current_record.id is null then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;

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
    update public.review_runs set stale_at = now()
     where diagram_id = target_diagram and stale_at is null
       and architecture_ir_version_id is distinct from next_ir_id;
    update public.documents set stale_at = now()
     where diagram_id = target_diagram and stale_at is null;
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

create or replace function public.migrate_guest_architecture(
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
  ai_request_id uuid default null
)
returns table(project_id uuid, diagram_id uuid, version integer, ir_version integer)
language plpgsql security definer set search_path = '' as $$
declare
  member_workspace uuid;
  new_project uuid;
  new_diagram uuid;
  existing_project uuid;
  existing_diagram uuid;
  ir_blob uuid;
  presentation_blob uuid;
  diagram_blob uuid;
  ir_id uuid;
  diagram_version_id uuid;
  run_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if idempotency is null or request_checksum !~ '^[a-f0-9]{64}$' or char_length(trim(draft_title)) = 0
    or nullif(diagram_payload->>'id', '') is null
    or not public.is_well_formed_architecture_snapshot(ir_payload, presentation_payload, diagram_payload) then
    raise exception 'Invalid guest architecture migration payload' using errcode = '22023';
  end if;
  if ir_checksum <> public.canonical_jsonb_sha256(ir_payload)
    or presentation_checksum <> public.canonical_jsonb_sha256(presentation_payload)
    or diagram_checksum <> public.canonical_jsonb_sha256(diagram_payload)
    or request_checksum <> public.canonical_jsonb_sha256(jsonb_build_object(
      'ir', ir_payload, 'presentation', presentation_payload, 'diagram', diagram_payload
    )) then
    raise exception 'Guest architecture checksum mismatch' using errcode = '22023';
  end if;
  new_diagram := (diagram_payload->>'id')::uuid;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(idempotency::text));
  select gm.project_id, gm.diagram_id into existing_project, existing_diagram from public.guest_migrations gm
   where gm.idempotency_key = idempotency and gm.user_id = auth.uid();
  if existing_project is not null then
    if (select gm.request_checksum from public.guest_migrations gm where gm.idempotency_key = idempotency) is distinct from request_checksum then
      raise exception 'Idempotency key was reused with different content' using errcode = '22023';
    end if;
    return query select existing_project, existing_diagram, 1, 1; return;
  end if;

  select wm.workspace_id into member_workspace from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.role in ('owner', 'editor') order by wm.created_at limit 1;
  if member_workspace is null then raise exception 'Workspace unavailable' using errcode = '22023'; end if;
  perform public.enforce_architecture_persistence_rate_limit(member_workspace, new_diagram, auth.uid());

  insert into public.projects(workspace_id, name, created_by)
  values(member_workspace, left(trim(draft_title), 160), auth.uid()) returning id into new_project;
  insert into public.diagrams(id, project_id, title, current_version, current_ir_version, created_by)
  values(new_diagram, new_project, left(trim(draft_title), 160), 1, 1, auth.uid());

  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(member_workspace, 'architecture-ir', coalesce(ir_payload->>'schemaVersion', 'unknown'), ir_checksum, octet_length(ir_payload::text), ir_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null returning id into ir_blob;
  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(member_workspace, 'diagram-presentation', coalesce(presentation_payload->>'schemaVersion', 'unknown'), presentation_checksum, octet_length(presentation_payload::text), presentation_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null returning id into presentation_blob;
  insert into public.artifact_blobs(workspace_id, kind, schema_version, checksum, byte_size, hot_payload)
  values(member_workspace, 'materialized-diagram', coalesce(diagram_payload->>'schemaVersion', 'unknown'), diagram_checksum, octet_length(diagram_payload::text), diagram_payload)
  on conflict (workspace_id, kind, checksum) do update set hot_payload = excluded.hot_payload,
    storage_state = 'hot', storage_path = null, archived_at = null returning id into diagram_blob;

  insert into public.architecture_ir_versions(diagram_id, version, artifact_blob_id, provenance, compiler_version, catalog_version, created_by)
  values(new_diagram, 1, ir_blob, ir_provenance, compiler_version, catalog_version, auth.uid()) returning id into ir_id;
  insert into public.diagram_versions(diagram_id, version, payload, checksum, created_by)
  values(new_diagram, 1, diagram_payload, diagram_checksum, auth.uid()) returning id into diagram_version_id;
  insert into public.diagram_version_artifacts(diagram_version_id, architecture_ir_version_id, presentation_blob_id, diagram_blob_id, compiler_version, catalog_version)
  values(diagram_version_id, ir_id, presentation_blob, diagram_blob, compiler_version, catalog_version);
  if ai_request_id is not null then
    select id into run_id from public.ai_runs where request_id = ai_request_id and user_id = auth.uid();
    if run_id is null then raise exception 'Generation provenance is unavailable' using errcode = '22023'; end if;
    update public.ai_runs set diagram_id = new_diagram where id = run_id;
    insert into public.ai_run_artifacts(ai_run_id, architecture_ir_version_id)
    values(run_id, ir_id) on conflict (ai_run_id) do nothing;
  end if;
  insert into public.guest_migrations(idempotency_key, user_id, project_id, diagram_id, request_checksum)
  values(idempotency, auth.uid(), new_project, new_diagram, request_checksum);
  insert into public.audit_events(workspace_id, actor_id, action, target_type, target_id, metadata)
  values(member_workspace, auth.uid(), 'architecture.guest-migrated', 'diagram', new_diagram, jsonb_build_object('diagramVersion', 1, 'irVersion', 1));
  return query select new_project, new_diagram, 1, 1;
end;
$$;

create or replace function public.schedule_architecture_archives(reference_time timestamptz default now())
returns table(notifications_created integer, jobs_created integer)
language plpgsql security definer set search_path = '' as $$
declare notice_count integer := 0; job_count integer := 0;
begin
  with owners_to_notify as (
    select distinct wm.user_id, d.id diagram_id, dv.version
      from public.diagram_versions dv
      join public.diagrams d on d.id = dv.diagram_id and d.current_version <> dv.version
      join public.projects p on p.id = d.project_id and p.deleted_at is null
      join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.role = 'owner'
     where dv.created_at <= reference_time - interval '23 days'
  ), inserted as (
    insert into public.user_notifications(user_id, kind, diagram_id, diagram_version, message, deduplication_key)
    select user_id, 'version-archive-warning', diagram_id, version,
      'A non-current architecture version will move to the secure archive in seven days.',
      'archive-warning:' || user_id::text || ':' || diagram_id::text || ':' || version::text
      from owners_to_notify
    on conflict (deduplication_key) do nothing returning id
  ), outboxed as (
    insert into public.notification_outbox(notification_id) select id from inserted
    on conflict (notification_id) do nothing returning id
  ) select count(*) into notice_count from inserted;

  with candidates as (
    select distinct ab.id
      from public.diagram_versions dv
      join public.diagrams d on d.id = dv.diagram_id and d.current_version <> dv.version
      join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
      join public.artifact_blobs ab on ab.id in (dva.presentation_blob_id, dva.diagram_blob_id)
     where dv.created_at <= reference_time - interval '30 days' and ab.storage_state = 'hot'
       and not exists (
         select 1 from public.diagram_version_artifacts current_link
         join public.diagram_versions current_dv on current_dv.id = current_link.diagram_version_id
         join public.diagrams current_d on current_d.id = current_dv.diagram_id and current_d.current_version = current_dv.version
         where ab.id in (current_link.presentation_blob_id, current_link.diagram_blob_id)
       )
       and exists (
         select 1 from public.user_notifications n
          where n.diagram_id = d.id and n.diagram_version = dv.version
            and n.kind = 'version-archive-warning' and n.created_at <= reference_time - interval '7 days'
       )
    union
    select distinct ab.id
      from public.architecture_ir_versions aiv
      join public.diagrams d on d.id = aiv.diagram_id and d.current_ir_version <> aiv.version
      join public.artifact_blobs ab on ab.id = aiv.artifact_blob_id
     where aiv.created_at <= reference_time - interval '30 days' and ab.storage_state = 'hot'
       and not exists (
         select 1 from public.architecture_ir_versions current_ir
         join public.diagrams current_d on current_d.id = current_ir.diagram_id and current_d.current_ir_version = current_ir.version
         where current_ir.artifact_blob_id = ab.id
       )
       and exists (
         select 1 from public.user_notifications n
          where n.diagram_id = d.id and n.kind = 'version-archive-warning'
            and n.created_at <= reference_time - interval '7 days'
       )
  ), inserted as (
    insert into public.artifact_archive_jobs(artifact_blob_id) select id from candidates
    on conflict (artifact_blob_id) do update set status = 'pending', attempts = 0,
      available_at = now(), leased_until = null, lease_owner = null, last_error_class = null, updated_at = now()
      where public.artifact_archive_jobs.status = 'completed'
    returning id
  ) select count(*) into job_count from inserted;
  return query select notice_count, job_count;
end;
$$;

create or replace function public.lease_artifact_archive_jobs(worker_id uuid, batch_size integer default 10)
returns table(job_id uuid, artifact_id uuid, workspace_id uuid, artifact_kind text, artifact_checksum text, artifact_payload jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  if worker_id is null then raise exception 'Worker ID required' using errcode = '22023'; end if;
  return query
  with candidates as (
    select aaj.id from public.artifact_archive_jobs aaj
     where (aaj.status = 'pending' or (aaj.status = 'leased' and aaj.leased_until < now()))
       and aaj.available_at <= now()
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
end;
$$;

create or replace function public.fail_artifact_archive_job(worker_id uuid, target_job uuid, failure_class text)
returns void language plpgsql security definer set search_path = '' as $$
declare target_artifact uuid; attempt_count integer;
begin
  select artifact_blob_id, attempts into target_artifact, attempt_count from public.artifact_archive_jobs
   where id = target_job and status = 'leased' and lease_owner = worker_id for update;
  if target_artifact is null then return; end if;
  update public.artifact_blobs set storage_state = case when attempt_count >= 12 then 'restore-failed' else 'hot' end
   where id = target_artifact and storage_state = 'archiving';
  update public.artifact_archive_jobs set status = case when attempt_count >= 12 then 'failed' else 'pending' end,
    available_at = now() + least(interval '6 hours', interval '30 seconds' * power(2, least(attempt_count, 10))),
    leased_until = null, lease_owner = null, last_error_class = left(failure_class, 120), updated_at = now()
   where id = target_job;
end;
$$;

create or replace function public.lease_notification_jobs(worker_id uuid, batch_size integer default 10)
returns table(job_id uuid, notification_id uuid, recipient_email text, notification_kind text)
language plpgsql security definer set search_path = '' as $$
begin
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
      join auth.users au on au.id = un.user_id;
end;
$$;

create or replace function public.complete_notification_job(worker_id uuid, target_job uuid, provider_id text default null)
returns void language sql security definer set search_path = '' as $$
  update public.notification_outbox set status = 'delivered', provider_message_id = left(provider_id, 240),
    leased_until = null, lease_owner = null, updated_at = now()
   where id = target_job and lease_owner = worker_id and status = 'sending';
$$;

create or replace function public.fail_notification_job(worker_id uuid, target_job uuid, failure_class text)
returns void language sql security definer set search_path = '' as $$
  update public.notification_outbox set status = 'failed', last_error_class = left(failure_class, 120),
    available_at = now() + least(interval '6 hours', interval '30 seconds' * power(2, least(attempts, 10))),
    leased_until = null, lease_owner = null, updated_at = now()
   where id = target_job and lease_owner = worker_id and status = 'sending';
$$;

create or replace function public.list_architecture_versions(target_diagram uuid, page_size integer default 25, before_version integer default null)
returns table(
  version integer,
  parent_version integer,
  ir_version integer,
  diagram_checksum text,
  ir_checksum text,
  presentation_state text,
  diagram_state text,
  ir_state text,
  created_at timestamptz,
  created_by uuid
)
language plpgsql security definer set search_path = '' stable as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.diagrams d join public.projects p on p.id = d.project_id
     where d.id = target_diagram and p.deleted_at is null and public.is_workspace_member(p.workspace_id)
  ) then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;
  return query
    select dv.version, dv.parent_version, aiv.version, dblob.checksum, irblob.checksum,
      pblob.storage_state, dblob.storage_state, irblob.storage_state, dv.created_at, dv.created_by
      from public.diagram_versions dv
      join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
      join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
      join public.artifact_blobs pblob on pblob.id = dva.presentation_blob_id
      join public.artifact_blobs dblob on dblob.id = dva.diagram_blob_id
      join public.artifact_blobs irblob on irblob.id = aiv.artifact_blob_id
     where dv.diagram_id = target_diagram and (before_version is null or dv.version < before_version)
     order by dv.version desc limit greatest(1, least(page_size, 100));
end;
$$;

create or replace function public.read_architecture_version(target_diagram uuid, target_version integer)
returns table(
  diagram_version integer,
  ir_version integer,
  ir_payload jsonb,
  presentation_payload jsonb,
  diagram_payload jsonb,
  ir_artifact_id uuid,
  presentation_artifact_id uuid,
  diagram_artifact_id uuid,
  ir_state text,
  presentation_state text,
  diagram_state text,
  ir_checksum text,
  presentation_checksum text,
  diagram_checksum text,
  created_at timestamptz
)
language plpgsql security definer set search_path = '' stable as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.diagrams d join public.projects p on p.id = d.project_id
     where d.id = target_diagram and p.deleted_at is null and public.is_workspace_member(p.workspace_id)
  ) then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;
  return query
    select dv.version, aiv.version, irblob.hot_payload, pblob.hot_payload, dblob.hot_payload,
      irblob.id, pblob.id, dblob.id, irblob.storage_state, pblob.storage_state, dblob.storage_state,
      irblob.checksum, pblob.checksum, dblob.checksum, dv.created_at
      from public.diagram_versions dv
      join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
      join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
      join public.artifact_blobs irblob on irblob.id = aiv.artifact_blob_id
      join public.artifact_blobs pblob on pblob.id = dva.presentation_blob_id
      join public.artifact_blobs dblob on dblob.id = dva.diagram_blob_id
     where dv.diagram_id = target_diagram and dv.version = target_version;
end;
$$;

create or replace function public.persist_architecture_review(
  target_diagram uuid,
  target_diagram_version integer,
  target_ir_version integer,
  findings_payload jsonb
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  workspace uuid;
  ir_version_id uuid;
  review_id uuid;
  finding jsonb;
begin
  if auth.uid() is null or jsonb_typeof(findings_payload) <> 'array'
    or jsonb_array_length(findings_payload) > 100 or octet_length(findings_payload::text) > 256000 then
    raise exception 'Invalid review payload' using errcode = '22023';
  end if;
  select p.workspace_id, aiv.id into workspace, ir_version_id
    from public.diagram_versions dv
    join public.diagrams d on d.id = dv.diagram_id
    join public.projects p on p.id = d.project_id and p.deleted_at is null
    join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
    join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
   where d.id = target_diagram and dv.version = target_diagram_version
     and aiv.version = target_ir_version and public.can_edit_workspace(p.workspace_id);
  if ir_version_id is null then raise exception 'Architecture version not found or access denied' using errcode = '42501'; end if;

  insert into public.review_runs(diagram_id, diagram_version, architecture_ir_version_id, stale_at, created_by)
  values(target_diagram, target_diagram_version, ir_version_id, null, auth.uid()) returning id into review_id;
  for finding in select value from jsonb_array_elements(findings_payload)
  loop
    if finding->>'severity' not in ('critical', 'high', 'medium', 'low', 'info')
      or nullif(trim(finding->>'lens'), '') is null
      or nullif(trim(finding->>'rationale'), '') is null
      or nullif(trim(finding->>'recommendation'), '') is null
      or octet_length(coalesce(finding->>'rationale', '')) > 1200
      or octet_length(coalesce(finding->>'recommendation', '')) > 1200
      or jsonb_typeof(finding->'affectedObjects') <> 'array' then
      raise exception 'Invalid review finding' using errcode = '22023';
    end if;
    insert into public.review_findings(id, review_run_id, lens, severity, rationale, recommendation, affected_objects, status)
    values(coalesce((finding->>'id')::uuid, gen_random_uuid()), review_id, left(finding->>'lens', 80), finding->>'severity',
      finding->>'rationale', finding->>'recommendation', finding->'affectedObjects', 'open');
  end loop;
  insert into public.audit_events(workspace_id, actor_id, action, target_type, target_id, metadata)
  values(workspace, auth.uid(), 'architecture.review.created', 'diagram', target_diagram,
    jsonb_build_object('diagramVersion', target_diagram_version, 'irVersion', target_ir_version, 'findingCount', jsonb_array_length(findings_payload)));
  return review_id;
exception when invalid_text_representation then
  raise exception 'Invalid review finding identifier' using errcode = '22023';
end;
$$;

create or replace function public.persist_architecture_document(
  target_diagram uuid,
  target_diagram_version integer,
  target_ir_version integer,
  document_markdown text
)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  workspace uuid;
  ir_version_id uuid;
  document_id uuid;
  next_version integer;
begin
  if auth.uid() is null or nullif(trim(document_markdown), '') is null or octet_length(document_markdown) > 1000000 then
    raise exception 'Invalid architecture document' using errcode = '22023';
  end if;
  select p.workspace_id, aiv.id into workspace, ir_version_id
    from public.diagram_versions dv
    join public.diagrams d on d.id = dv.diagram_id
    join public.projects p on p.id = d.project_id and p.deleted_at is null
    join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
    join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
   where d.id = target_diagram and dv.version = target_diagram_version
     and aiv.version = target_ir_version and public.can_edit_workspace(p.workspace_id);
  if ir_version_id is null then raise exception 'Architecture version not found or access denied' using errcode = '42501'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(target_diagram::text));
  select id, current_version into document_id, next_version from public.documents
   where diagram_id = target_diagram for update;
  if document_id is null then
    insert into public.documents(diagram_id, current_version, created_by)
    values(target_diagram, 1, auth.uid()) returning id into document_id;
    next_version := 1;
  else
    next_version := next_version + 1;
    update public.documents set current_version = next_version, stale_at = null, updated_at = now() where id = document_id;
  end if;
  insert into public.document_versions(document_id, version, diagram_version, architecture_ir_version_id, markdown, created_by)
  values(document_id, next_version, target_diagram_version, ir_version_id, document_markdown, auth.uid());
  insert into public.audit_events(workspace_id, actor_id, action, target_type, target_id, metadata)
  values(workspace, auth.uid(), 'architecture.document.created', 'diagram', target_diagram,
    jsonb_build_object('diagramVersion', target_diagram_version, 'irVersion', target_ir_version, 'documentVersion', next_version));
  return next_version;
end;
$$;

revoke execute on function public.save_architecture_snapshot(uuid, integer, integer, uuid, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, uuid) from public, anon;
grant execute on function public.save_architecture_snapshot(uuid, integer, integer, uuid, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, uuid) to authenticated;
revoke execute on function public.migrate_guest_architecture(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, uuid) from public, anon;
grant execute on function public.migrate_guest_architecture(uuid, text, text, jsonb, text, jsonb, text, jsonb, text, text, text, text, uuid) to authenticated;
revoke execute on function public.list_architecture_versions(uuid, integer, integer) from public, anon;
grant execute on function public.list_architecture_versions(uuid, integer, integer) to authenticated;
revoke execute on function public.read_architecture_version(uuid, integer) from public, anon;
grant execute on function public.read_architecture_version(uuid, integer) to authenticated;
revoke execute on function public.persist_architecture_review(uuid, integer, integer, jsonb),
  public.persist_architecture_document(uuid, integer, integer, text) from public, anon;
grant execute on function public.persist_architecture_review(uuid, integer, integer, jsonb),
  public.persist_architecture_document(uuid, integer, integer, text) to authenticated;
-- Legacy mutation RPCs cannot produce the IR/presentation artifact graph and
-- are deliberately disabled once the backfill has completed.
revoke execute on function public.save_diagram_version(uuid, integer, jsonb, text),
  public.migrate_guest_draft(uuid, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.schedule_architecture_archives(timestamptz) from public, anon, authenticated;
grant execute on function public.schedule_architecture_archives(timestamptz) to service_role;
revoke execute on function public.lease_artifact_archive_jobs(uuid, integer), public.complete_artifact_archive_job(uuid, uuid, text, text),
  public.fail_artifact_archive_job(uuid, uuid, text), public.lease_notification_jobs(uuid, integer),
  public.complete_notification_job(uuid, uuid, text), public.fail_notification_job(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.lease_artifact_archive_jobs(uuid, integer), public.complete_artifact_archive_job(uuid, uuid, text, text),
  public.fail_artifact_archive_job(uuid, uuid, text), public.lease_notification_jobs(uuid, integer),
  public.complete_notification_job(uuid, uuid, text), public.fail_notification_job(uuid, uuid, text) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('architecture-version-archive', 'architecture-version-archive', false, 1000000, array['application/json', 'application/gzip'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('architecture-assets', 'architecture-assets', false, 10000000, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
