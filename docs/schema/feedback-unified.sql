-- Unified review workflow: TWO intake queues (user ⚑ flags + build-detected issues) feeding ONE
-- pipeline. Build rows carry cited a/b/other candidates in payload; a reviewer ANSWERS them
-- (open → answered, pick recorded in `resolution`), the admin DECIDES (answered → resolved).
-- User flags skip the answering phase (open → resolved). Run after classroom.sql + classroom-rls.sql.

-- intake source + idempotent re-emission key + the reviewer's answer
alter table feedback add column if not exists source     text not null default 'user' check (source in ('user','build'));
alter table feedback add column if not exists stable_key text unique;          -- build rows only; rebuild upserts, resolved rows never resurrect
alter table feedback add column if not exists resolution jsonb;                -- { choice:'a'|'b'|…|'other', text, by, role, at }

-- build rows have no human author
alter table feedback alter column author_id drop not null;

-- widen the vocabulary: author 'build'; the four build kinds; the 'answered' phase
alter table feedback drop constraint if exists feedback_author_role_check;
alter table feedback add  constraint feedback_author_role_check check (author_role in ('student','reviewer','instructor','build'));
alter table feedback drop constraint if exists feedback_kind_check;
alter table feedback add  constraint feedback_kind_check check (kind in
  ('flag_wrong','flag_confusing','flag_grade','typo','propose_add','propose_reorder','propose_disputed','validate',
   'missing_answer','needs_native_confirm','dict_unconfirmed','dialect_question'));
alter table feedback drop constraint if exists feedback_status_check;
alter table feedback add  constraint feedback_status_check check (status in ('open','answered','resolved'));

-- THE REVIEWER'S DOOR (Native Review): reviewers see ONLY build-sourced rows, and their only
-- write is recording an answer on an open one. They never see user flags, never decide.
drop policy if exists fb_reviewer_read   on feedback;
drop policy if exists fb_reviewer_answer on feedback;
create policy fb_reviewer_read   on feedback for select to authenticated
  using (source = 'build' and has_role('reviewer'));
create policy fb_reviewer_answer on feedback for update to authenticated
  using (source = 'build' and status = 'open' and has_role('reviewer'))
  with check (source = 'build' and status = 'answered');

-- applyFix bumps the course version so cached bundles refresh (PostgREST can't do version+1;
-- security-definer RPC, admin-gated)
create or replace function bump_course_version(cid text) returns bigint
language sql security definer set search_path = public as
$$ update courses set version = version + 1 where id = cid returning version; $$;
revoke all on function bump_course_version(text) from public;
grant execute on function bump_course_version(text) to authenticated;
-- gate inside: only admins may actually bump
create or replace function bump_course_version(cid text) returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update courses set version = version + 1 where id = cid returning version into v;
  return v;
end $$;
