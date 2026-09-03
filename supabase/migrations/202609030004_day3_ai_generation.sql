-- Day 3: privacy-safe operational audit fields for AI requests. Prompt text,
-- model output and credentials are intentionally never stored in this table.

alter table public.ai_runs
  add column if not exists request_id uuid,
  add column if not exists prompt_version text not null default 'architecture-v1',
  add column if not exists attempts integer not null default 1 check (attempts between 1 and 2);

create unique index if not exists ai_runs_request_id_unique
  on public.ai_runs (request_id)
  where request_id is not null;

create policy "users read own ai runs"
  on public.ai_runs for select
  using (user_id = auth.uid());

create policy "users record own ai runs"
  on public.ai_runs for insert
  with check (user_id = auth.uid());
