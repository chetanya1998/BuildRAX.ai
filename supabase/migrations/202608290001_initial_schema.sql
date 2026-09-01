create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'editor', 'viewer');
create type public.finding_status as enum ('open', 'dismissed', 'fixed', 'outdated');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  avatar_url text check (char_length(avatar_url) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  created_by uuid not null references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diagrams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  current_version integer not null default 1 check (current_version > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diagram_versions (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.diagrams(id) on delete cascade,
  version integer not null check (version > 0),
  parent_version integer,
  payload jsonb not null,
  checksum text not null check (char_length(checksum) between 16 and 128),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (diagram_id, version)
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  diagram_id uuid references public.diagrams(id) on delete cascade,
  kind text not null check (kind in ('generation', 'change-plan', 'review', 'documentation')),
  provider text not null,
  model text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  error_class text,
  created_at timestamptz not null default now()
);

create table public.review_runs (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.diagrams(id) on delete cascade,
  diagram_version integer not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.review_findings (
  id uuid primary key default gen_random_uuid(),
  review_run_id uuid not null references public.review_runs(id) on delete cascade,
  lens text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  rationale text not null check (char_length(rationale) <= 1200),
  recommendation text not null check (char_length(recommendation) <= 1200),
  affected_objects jsonb not null default '[]'::jsonb,
  status public.finding_status not null default 'open',
  dismissal_note text check (char_length(dismissal_note) <= 500),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  diagram_id uuid not null references public.diagrams(id) on delete cascade,
  current_version integer not null default 1,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null,
  diagram_version integer not null,
  markdown text not null check (octet_length(markdown) <= 1000000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token_hash text not null unique,
  scope text not null default 'read' check (scope = 'read'),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.guest_migrations (
  idempotency_key uuid primary key,
  user_id uuid not null references public.profiles(id),
  project_id uuid not null references public.projects(id),
  diagram_id uuid not null references public.diagrams(id),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) <= 100),
  target_type text not null check (char_length(target_type) <= 80),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_hash text,
  event_name text not null check (char_length(event_name) <= 100),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (not (properties ? 'prompt' or properties ? 'prompt_text' or properties ? 'email'))
);

create index projects_workspace_idx on public.projects(workspace_id) where deleted_at is null;
create index diagrams_project_idx on public.diagrams(project_id);
create index diagram_versions_diagram_idx on public.diagram_versions(diagram_id, version desc);
create index review_runs_diagram_idx on public.review_runs(diagram_id, diagram_version);
create index documents_diagram_idx on public.documents(diagram_id);
create index audit_workspace_time_idx on public.audit_events(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid());
$$;

create or replace function public.can_edit_workspace(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and role in ('owner', 'editor'));
$$;

create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members where workspace_id = target_workspace and user_id = auth.uid() and role = 'owner');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare new_workspace uuid;
begin
  insert into public.profiles(id, display_name, avatar_url)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url');
  insert into public.workspaces(name, created_by) values('My workspace', new.id) returning id into new_workspace;
  insert into public.workspace_members(workspace_id, user_id, role) values(new_workspace, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.prevent_immutable_mutation()
returns trigger language plpgsql as $$ begin raise exception 'Immutable records cannot be changed'; end; $$;
create trigger immutable_diagram_versions before update or delete on public.diagram_versions for each row execute function public.prevent_immutable_mutation();
create trigger immutable_document_versions before update or delete on public.document_versions for each row execute function public.prevent_immutable_mutation();

create or replace function public.save_diagram_version(target_diagram uuid, base_version integer, new_payload jsonb, new_checksum text)
returns table(diagram_id uuid, version integer)
language plpgsql security invoker set search_path = '' as $$
declare current_record public.diagrams%rowtype;
begin
  select d.* into current_record from public.diagrams d join public.projects p on p.id = d.project_id
  where d.id = target_diagram and public.can_edit_workspace(p.workspace_id) for update;
  if current_record.id is null then raise exception 'Diagram not found or access denied' using errcode = '42501'; end if;
  if current_record.current_version <> base_version then raise exception 'Version conflict' using errcode = '40001'; end if;
  insert into public.diagram_versions(diagram_id, version, parent_version, payload, checksum, created_by)
  values(target_diagram, base_version + 1, base_version, new_payload, new_checksum, auth.uid());
  update public.diagrams set current_version = base_version + 1, title = left(new_payload->>'title', 160), updated_at = now() where id = target_diagram;
  return query select target_diagram, base_version + 1;
end;
$$;

create or replace function public.migrate_guest_draft(idempotency uuid, draft_title text, draft_payload jsonb, draft_checksum text)
returns table(project_id uuid, diagram_id uuid)
language plpgsql security invoker set search_path = '' as $$
declare member_workspace uuid; new_project uuid; new_diagram uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select gm.project_id, gm.diagram_id into new_project, new_diagram from public.guest_migrations gm where gm.idempotency_key = idempotency and gm.user_id = auth.uid();
  if new_project is not null then return query select new_project, new_diagram; return; end if;
  select wm.workspace_id into member_workspace from public.workspace_members wm where wm.user_id = auth.uid() and wm.role in ('owner', 'editor') order by wm.created_at limit 1;
  if member_workspace is null then raise exception 'Workspace unavailable'; end if;
  insert into public.projects(workspace_id, name, created_by) values(member_workspace, left(draft_title, 160), auth.uid()) returning id into new_project;
  insert into public.diagrams(project_id, title, current_version, created_by) values(new_project, left(draft_title, 160), 1, auth.uid()) returning id into new_diagram;
  insert into public.diagram_versions(diagram_id, version, payload, checksum, created_by) values(new_diagram, 1, draft_payload, draft_checksum, auth.uid());
  insert into public.guest_migrations(idempotency_key, user_id, project_id, diagram_id) values(idempotency, auth.uid(), new_project, new_diagram);
  return query select new_project, new_diagram;
end;
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.diagrams enable row level security;
alter table public.diagram_versions enable row level security;
alter table public.ai_runs enable row level security;
alter table public.review_runs enable row level security;
alter table public.review_findings enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.share_links enable row level security;
alter table public.guest_migrations enable row level security;
alter table public.audit_events enable row level security;
alter table public.analytics_events enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "workspace members read" on public.workspaces for select using (public.is_workspace_member(id));
create policy "workspace owners update" on public.workspaces for update using (public.is_workspace_owner(id));
create policy "members read members" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "owners manage members" on public.workspace_members for all using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy "members read projects" on public.projects for select using (public.is_workspace_member(workspace_id));
create policy "editors create projects" on public.projects for insert with check (public.can_edit_workspace(workspace_id) and created_by = auth.uid());
create policy "editors update projects" on public.projects for update using (public.can_edit_workspace(workspace_id));
create policy "members read diagrams" on public.diagrams for select using (exists(select 1 from public.projects p where p.id = project_id and public.is_workspace_member(p.workspace_id)));
create policy "editors manage diagrams" on public.diagrams for all using (exists(select 1 from public.projects p where p.id = project_id and public.can_edit_workspace(p.workspace_id))) with check (exists(select 1 from public.projects p where p.id = project_id and public.can_edit_workspace(p.workspace_id)));
create policy "members read versions" on public.diagram_versions for select using (exists(select 1 from public.diagrams d join public.projects p on p.id = d.project_id where d.id = diagram_id and public.is_workspace_member(p.workspace_id)));
create policy "editors insert versions" on public.diagram_versions for insert with check (created_by = auth.uid() and exists(select 1 from public.diagrams d join public.projects p on p.id = d.project_id where d.id = diagram_id and public.can_edit_workspace(p.workspace_id)));
create policy "members read reviews" on public.review_runs for select using (exists(select 1 from public.diagrams d join public.projects p on p.id = d.project_id where d.id = diagram_id and public.is_workspace_member(p.workspace_id)));
create policy "editors manage reviews" on public.review_runs for all using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "members read findings" on public.review_findings for select using (exists(select 1 from public.review_runs r join public.diagrams d on d.id = r.diagram_id join public.projects p on p.id = d.project_id where r.id = review_run_id and public.is_workspace_member(p.workspace_id)));
create policy "editors update findings" on public.review_findings for update using (exists(select 1 from public.review_runs r join public.diagrams d on d.id = r.diagram_id join public.projects p on p.id = d.project_id where r.id = review_run_id and public.can_edit_workspace(p.workspace_id)));
create policy "members read documents" on public.documents for select using (exists(select 1 from public.diagrams d join public.projects p on p.id = d.project_id where d.id = diagram_id and public.is_workspace_member(p.workspace_id)));
create policy "editors manage documents" on public.documents for all using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "members read document versions" on public.document_versions for select using (exists(select 1 from public.documents doc join public.diagrams d on d.id = doc.diagram_id join public.projects p on p.id = d.project_id where doc.id = document_id and public.is_workspace_member(p.workspace_id)));
create policy "editors insert document versions" on public.document_versions for insert with check (created_by = auth.uid());
create policy "members manage share links" on public.share_links for all using (exists(select 1 from public.projects p where p.id = project_id and public.can_edit_workspace(p.workspace_id))) with check (exists(select 1 from public.projects p where p.id = project_id and public.can_edit_workspace(p.workspace_id)));
create policy "users read own migrations" on public.guest_migrations for select using (user_id = auth.uid());
create policy "users insert own migrations" on public.guest_migrations for insert with check (user_id = auth.uid());
create policy "members read audit" on public.audit_events for select using (public.is_workspace_member(workspace_id));
create policy "users insert analytics" on public.analytics_events for insert with check (user_id is null or user_id = auth.uid());

grant execute on function public.save_diagram_version(uuid, integer, jsonb, text) to authenticated;
grant execute on function public.migrate_guest_draft(uuid, text, jsonb, text) to authenticated;
