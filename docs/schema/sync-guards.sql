-- Server-side stale-write guards for the per-user progress tables.
--
-- WHY: the client pushes with a blind upsert (pushProgress). The client-side merge runs only at
-- the initial pull, so a device that has been open for hours (stale rows in memory) upserts its
-- entire map over anything a second device wrote in the meantime — row-level last-push-wins with
-- old data. These BEFORE UPDATE triggers make the DATABASE refuse regressions, so no client state
-- can ever move a row backwards, whatever the client does (stale device, imported old backup...).
-- Semantics mirror the app's own merge rules (mergeProg / mergeUnits / mergeStreak in sulog.jsx).
--
-- Idempotent. Run in the Supabase SQL editor (or psql) after schema.sql. Inserts are unaffected.

-- progress: per-card recency is `last` (ms epoch of the last attempt). A write dated before the
-- stored row is a stale device — skip it entirely (returning NULL cancels the UPDATE).
create or replace function progress_guard() returns trigger language plpgsql as $$
begin
  if new.last < old.last then return null; end if;
  return new;
end $$;
drop trigger if exists progress_no_stale on progress;
create trigger progress_no_stale before update on progress
  for each row execute function progress_guard();

-- lesson_progress: parts cleared is monotonic (you never un-clear a lesson step).
create or replace function lesson_progress_guard() returns trigger language plpgsql as $$
begin
  new.parts := greatest(new.parts, old.parts);
  new.last  := greatest(new.last, old.last);
  return new;
end $$;
drop trigger if exists lesson_progress_no_stale on lesson_progress;
create trigger lesson_progress_no_stale before update on lesson_progress
  for each row execute function lesson_progress_guard();

-- unit_progress: best score is monotonic, passed is sticky; last/at describe the NEWER run
-- (at is 'YYYY-MM-DD', so string comparison is chronological).
create or replace function unit_progress_guard() returns trigger language plpgsql as $$
begin
  new.best   := greatest(new.best, old.best);
  new.passed := new.passed or old.passed;
  if new.at < old.at then new.last := old.last; new.at := old.at; end if;
  return new;
end $$;
drop trigger if exists unit_progress_no_stale on unit_progress;
create trigger unit_progress_no_stale before update on unit_progress
  for each row execute function unit_progress_guard();

-- user_streak: `days` is a set — union it, never lose a day. count/last follow the newer-dated
-- write ONLY (count may legitimately RESET to 1 after a gap, so greatest(count) would be wrong;
-- a write dated before the stored one is a stale device — skip).
create or replace function user_streak_guard() returns trigger language plpgsql as $$
begin
  if new.last < old.last then return null; end if;
  new.days := old.days || new.days;
  return new;
end $$;
drop trigger if exists user_streak_no_stale on user_streak;
create trigger user_streak_no_stale before update on user_streak
  for each row execute function user_streak_guard();
