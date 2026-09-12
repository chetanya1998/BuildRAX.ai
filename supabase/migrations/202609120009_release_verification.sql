-- Day 7 release verification. Verification is read-only and privacy-safe.
-- Legacy payload cleanup is a separate, explicit operation that requires both
-- backup confirmation and the unchanged verification token returned here.

create or replace function public.verify_architecture_persistence()
returns table(
  total_diagram_versions bigint,
  linked_diagram_versions bigint,
  unlinked_diagram_versions bigint,
  orphan_ir_versions bigint,
  current_heads_missing bigint,
  artifact_checksum_mismatches bigint,
  diagram_checksum_mismatches bigint,
  invalid_hot_snapshots bigint,
  legacy_payload_rows bigint,
  verification_token text,
  ready boolean
)
language sql security definer stable set search_path = '' as $$
  with metrics as (
    select
      (select count(*) from public.diagram_versions) as total_versions,
      (select count(*) from public.diagram_version_artifacts) as linked_versions,
      (select count(*) from public.diagram_versions dv where not exists (
        select 1 from public.diagram_version_artifacts dva where dva.diagram_version_id = dv.id
      )) as unlinked_versions,
      (select count(*) from public.architecture_ir_versions aiv where not exists (
        select 1 from public.diagram_version_artifacts dva where dva.architecture_ir_version_id = aiv.id
      )) as orphan_ir,
      (select count(*) from public.diagrams d where d.current_version > 0 and not exists (
        select 1 from public.diagram_versions dv
        join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
        join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
        where dv.diagram_id = d.id and dv.version = d.current_version and aiv.version = d.current_ir_version
      )) as missing_heads,
      (select count(*) from public.artifact_blobs ab
        where ab.storage_state in ('hot', 'archiving', 'restore-failed')
          and (ab.hot_payload is null or public.canonical_jsonb_sha256(ab.hot_payload) <> ab.checksum)) as artifact_mismatches,
      (select count(*) from public.diagram_versions dv
        join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id
        join public.artifact_blobs ab on ab.id = dva.diagram_blob_id
        where dv.checksum <> ab.checksum) as diagram_mismatches,
      (select count(*) from public.diagram_version_artifacts dva
        join public.architecture_ir_versions aiv on aiv.id = dva.architecture_ir_version_id
        join public.artifact_blobs irb on irb.id = aiv.artifact_blob_id
        join public.artifact_blobs pb on pb.id = dva.presentation_blob_id
        join public.artifact_blobs db on db.id = dva.diagram_blob_id
        where irb.hot_payload is not null and pb.hot_payload is not null and db.hot_payload is not null
          and not public.is_well_formed_architecture_snapshot(irb.hot_payload, pb.hot_payload, db.hot_payload)) as invalid_snapshots,
      (select count(*) from public.diagram_versions where payload is not null) as legacy_rows,
      (select encode(extensions.digest(pg_catalog.convert_to(coalesce(string_agg(
        dv.id::text || ':' || dv.checksum || ':' || coalesce(dva.architecture_ir_version_id::text, 'missing') || ':' ||
        coalesce(dva.presentation_blob_id::text, 'missing') || ':' || coalesce(dva.diagram_blob_id::text, 'missing') || ':' || (dv.payload is not null)::text,
        ',' order by dv.diagram_id, dv.version), ''), 'UTF8'), 'sha256'), 'hex')
       from public.diagram_versions dv left join public.diagram_version_artifacts dva on dva.diagram_version_id = dv.id) as graph_token
  )
  select total_versions, linked_versions, unlinked_versions, orphan_ir, missing_heads,
    artifact_mismatches, diagram_mismatches, invalid_snapshots, legacy_rows, graph_token,
    unlinked_versions = 0 and orphan_ir = 0 and missing_heads = 0 and artifact_mismatches = 0
      and diagram_mismatches = 0 and invalid_snapshots = 0
  from metrics;
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
      where dva.diagram_version_id = old.id and ab.storage_state in ('hot', 'archived') and ab.checksum = old.checksum
    ) then return new;
  end if;
  raise exception 'Immutable records cannot be changed';
end;
$$;

create or replace function public.finalize_legacy_architecture_payloads(
  backup_confirmation text,
  expected_verification_token text
)
returns integer language plpgsql security definer set search_path = '' as $$
declare report record; cleared integer;
begin
  if backup_confirmation <> 'BACKUP_CONFIRMED' or expected_verification_token is null then
    raise exception 'Backup confirmation and verification token are required' using errcode = '22023';
  end if;
  select * into report from public.verify_architecture_persistence();
  if not report.ready then raise exception 'Architecture persistence verification failed' using errcode = 'P0001'; end if;
  if report.verification_token <> expected_verification_token then
    raise exception 'Architecture version graph changed after verification' using errcode = '40001';
  end if;
  update public.diagram_versions set payload = null where payload is not null;
  get diagnostics cleared = row_count;
  return cleared;
end;
$$;

-- New snapshot functions still populate the compatibility column while the
-- artifact link is assembled. Clear that duplicate immediately after the link
-- exists; the transaction remains atomic and the materialized artifact is the
-- single authoritative copy.
create or replace function public.clear_linked_diagram_compatibility_payload()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.diagram_versions set payload = null
   where id = new.diagram_version_id and payload is not null;
  return new;
end;
$$;

drop trigger if exists clear_linked_diagram_compatibility_payload on public.diagram_version_artifacts;
create trigger clear_linked_diagram_compatibility_payload
after insert on public.diagram_version_artifacts
for each row execute function public.clear_linked_diagram_compatibility_payload();

revoke execute on function public.verify_architecture_persistence(),
  public.finalize_legacy_architecture_payloads(text, text),
  public.clear_linked_diagram_compatibility_payload() from public, anon, authenticated;
grant execute on function public.verify_architecture_persistence(),
  public.finalize_legacy_architecture_payloads(text, text) to service_role;
