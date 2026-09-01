-- Day 1: tighten grants, close cross-workspace write paths, and make the
-- guest-migration operation safe when a client retries concurrently.

-- RLS is only one half of access control. Explicit table grants ensure the
-- anonymous key cannot reach private tables even if a future policy regresses.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant insert on table public.analytics_events to anon;

-- Functions are executable by PUBLIC by default in PostgreSQL. Keep only the
-- caller-facing RPCs and RLS helper functions callable by authenticated users.
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.can_edit_workspace(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.save_diagram_version(uuid, integer, jsonb, text) to authenticated;
grant execute on function public.migrate_guest_draft(uuid, text, jsonb, text) to authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- Project data is not readable after soft deletion. This avoids accidental
-- disclosure through direct API calls to known UUIDs.
drop policy "members read projects" on public.projects;
create policy "members read active projects" on public.projects
  for select to authenticated
  using (deleted_at is null and public.is_workspace_member(workspace_id));

drop policy "members read diagrams" on public.diagrams;
create policy "members read active project diagrams" on public.diagrams
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.is_workspace_member(p.workspace_id)
  ));

-- Review and documentation records must be scoped through the diagram's
-- workspace. The former creator-only policies allowed writes to a diagram UUID
-- without proving membership of its workspace.
drop policy "editors manage reviews" on public.review_runs;
create policy "editors insert review runs" on public.review_runs
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.diagrams d
      join public.projects p on p.id = d.project_id
      where d.id = diagram_id and p.deleted_at is null
        and public.can_edit_workspace(p.workspace_id)
    )
  );

create policy "editors update review runs" on public.review_runs
  for update to authenticated
  using (exists (
    select 1 from public.diagrams d
    join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null
      and public.can_edit_workspace(p.workspace_id)
  ))
  with check (exists (
    select 1 from public.diagrams d
    join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null
      and public.can_edit_workspace(p.workspace_id)
  ));

create policy "editors insert findings" on public.review_findings
  for insert to authenticated
  with check (exists (
    select 1 from public.review_runs r
    join public.diagrams d on d.id = r.diagram_id
    join public.projects p on p.id = d.project_id
    where r.id = review_run_id and p.deleted_at is null
      and public.can_edit_workspace(p.workspace_id)
  ));

drop policy "editors manage documents" on public.documents;
create policy "editors insert documents" on public.documents
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.diagrams d
      join public.projects p on p.id = d.project_id
      where d.id = diagram_id and p.deleted_at is null
        and public.can_edit_workspace(p.workspace_id)
    )
  );

create policy "editors update documents" on public.documents
  for update to authenticated
  using (exists (
    select 1 from public.diagrams d
    join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null
      and public.can_edit_workspace(p.workspace_id)
  ))
  with check (exists (
    select 1 from public.diagrams d
    join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null
      and public.can_edit_workspace(p.workspace_id)
  ));

create policy "editors delete documents" on public.documents
  for delete to authenticated
  using (exists (
    select 1 from public.diagrams d
    join public.projects p on p.id = d.project_id
    where d.id = diagram_id and p.deleted_at is null
      and public.can_edit_workspace(p.workspace_id)
  ));

drop policy "editors insert document versions" on public.document_versions;
create policy "editors insert document versions" on public.document_versions
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.documents doc
      join public.diagrams d on d.id = doc.diagram_id
      join public.projects p on p.id = d.project_id
      where doc.id = document_id and p.deleted_at is null
        and public.can_edit_workspace(p.workspace_id)
    )
  );

create index if not exists workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index if not exists projects_active_workspace_idx on public.projects(workspace_id) where deleted_at is null;

create or replace function public.save_diagram_version(target_diagram uuid, base_version integer, new_payload jsonb, new_checksum text)
returns table(diagram_id uuid, version integer)
language plpgsql security invoker set search_path = '' as $$
declare current_record public.diagrams%rowtype;
begin
  if jsonb_typeof(new_payload) <> 'object' or new_payload->>'id' <> target_diagram::text then
    raise exception 'Diagram payload does not match target diagram' using errcode = '22023';
  end if;

  select d.* into current_record from public.diagrams d join public.projects p on p.id = d.project_id
  where d.id = target_diagram and p.deleted_at is null and public.can_edit_workspace(p.workspace_id) for update;
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
  if idempotency is null or char_length(trim(draft_title)) = 0 or jsonb_typeof(draft_payload) <> 'object' then
    raise exception 'Invalid guest draft migration payload' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(idempotency::text));
  select gm.project_id, gm.diagram_id into new_project, new_diagram from public.guest_migrations gm where gm.idempotency_key = idempotency and gm.user_id = auth.uid();
  if new_project is not null then return query select new_project, new_diagram; return; end if;
  select wm.workspace_id into member_workspace from public.workspace_members wm where wm.user_id = auth.uid() and wm.role in ('owner', 'editor') order by wm.created_at limit 1;
  if member_workspace is null then raise exception 'Workspace unavailable'; end if;
  insert into public.projects(workspace_id, name, created_by) values(member_workspace, left(trim(draft_title), 160), auth.uid()) returning id into new_project;
  insert into public.diagrams(project_id, title, current_version, created_by) values(new_project, left(trim(draft_title), 160), 1, auth.uid()) returning id into new_diagram;
  insert into public.diagram_versions(diagram_id, version, payload, checksum, created_by) values(new_diagram, 1, draft_payload, draft_checksum, auth.uid());
  insert into public.guest_migrations(idempotency_key, user_id, project_id, diagram_id) values(idempotency, auth.uid(), new_project, new_diagram);
  return query select new_project, new_diagram;
end;
$$;
