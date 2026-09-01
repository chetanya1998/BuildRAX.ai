-- Day 2: make guest migration and public sharing safe to use from the
-- application. All caller access remains RLS- or token-scoped.

create or replace function public.migrate_guest_draft(idempotency uuid, draft_title text, draft_payload jsonb, draft_checksum text)
returns table(project_id uuid, diagram_id uuid)
language plpgsql security invoker set search_path = '' as $$
declare member_workspace uuid; new_project uuid; new_diagram uuid; existing_project uuid; existing_diagram uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if idempotency is null
    or char_length(trim(draft_title)) = 0
    or jsonb_typeof(draft_payload) <> 'object'
    or nullif(draft_payload->>'id', '') is null then
    raise exception 'Invalid guest draft migration payload' using errcode = '22023';
  end if;

  -- A local draft ID is already a client-generated UUID. Preserving it makes
  -- the immutable diagram payload and the persisted diagram row agree.
  new_diagram := (draft_payload->>'id')::uuid;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(idempotency::text));

  select gm.project_id, gm.diagram_id into existing_project, existing_diagram
    from public.guest_migrations gm
   where gm.idempotency_key = idempotency and gm.user_id = auth.uid();
  if existing_project is not null then
    return query select existing_project, existing_diagram;
    return;
  end if;

  select wm.workspace_id into member_workspace
    from public.workspace_members wm
   where wm.user_id = auth.uid() and wm.role in ('owner', 'editor')
   order by wm.created_at
   limit 1;
  if member_workspace is null then raise exception 'Workspace unavailable' using errcode = '22023'; end if;

  insert into public.projects(workspace_id, name, created_by)
  values(member_workspace, left(trim(draft_title), 160), auth.uid())
  returning id into new_project;

  insert into public.diagrams(id, project_id, title, current_version, created_by)
  values(new_diagram, new_project, left(trim(draft_title), 160), 1, auth.uid());

  insert into public.diagram_versions(diagram_id, version, payload, checksum, created_by)
  values(new_diagram, 1, draft_payload, draft_checksum, auth.uid());

  insert into public.guest_migrations(idempotency_key, user_id, project_id, diagram_id)
  values(idempotency, auth.uid(), new_project, new_diagram);

  return query select new_project, new_diagram;
end;
$$;

-- A share token is presented only as a hash. The function returns a single
-- current diagram snapshot, and only while the link is active and its project
-- is not soft-deleted. It deliberately exposes no internal IDs beyond the
-- viewer's read-only diagram route.
create or replace function public.read_shared_diagram(target_token_hash text)
returns table(project_id uuid, project_name text, diagram_id uuid, diagram_title text, diagram_payload jsonb)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, d.id, d.title, dv.payload
    from public.share_links sl
    join public.projects p on p.id = sl.project_id
    join public.diagrams d on d.project_id = p.id
    join public.diagram_versions dv on dv.diagram_id = d.id and dv.version = d.current_version
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
