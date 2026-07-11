-- Native-speaker answers, one row per review-queue question id (synth-<slug> for missing
-- exercise answers; the dialect question ids for usage calls). Written from the app's Ella
-- review queue (admin-gated by RLS); harvested back into the course by tools/harvest-ella.mjs.
-- Run in the SQL editor AFTER rls.sql (needs is_admin()). Idempotent.
create table if not exists ella_answers (
  id     text primary key,
  answer text not null,
  at     timestamptz not null default now()
);
alter table ella_answers enable row level security;
drop policy if exists ella_answers_read   on ella_answers;
drop policy if exists ella_answers_insert on ella_answers;
drop policy if exists ella_answers_update on ella_answers;
create policy ella_answers_read   on ella_answers for select using (true);
create policy ella_answers_insert on ella_answers for insert with check (is_admin());
create policy ella_answers_update on ella_answers for update using (is_admin()) with check (is_admin());
