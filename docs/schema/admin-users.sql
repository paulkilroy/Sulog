-- Admin "Users" board: one row per REGISTERED user with sign-up provider + roles + usage stats.
-- Provider (google vs email link) lives in auth.users, which PostgREST never exposes — hence a
-- SECURITY DEFINER function, hard-gated to admins. (Anonymous users leave no server trace at all,
-- so they can't be listed — they exist only in their own device's localStorage until they sign in.)
create or replace function admin_list_users()
returns table (
  user_id     uuid,
  email       text,
  display_name text,
  provider    text,          -- 'google' | 'email' (magic link)
  joined      date,
  last_seen   timestamptz,   -- latest of last sign-in / last practice day
  roles       text[],
  streak      int,           -- current streak counter
  active_days int,           -- distinct practice days ever
  answers     bigint,        -- lifetime drill answers (from the days rollup; legacy numeric handled)
  mastered    int,           -- words at box >= 4
  words       int,           -- words touched
  lessons     int,           -- lessons with any progress
  units_passed int
) language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  return query
  select u.id, u.email::text, p.display_name,
    coalesce(u.raw_app_meta_data->>'provider', 'email'),
    u.created_at::date,
    greatest(coalesce(u.last_sign_in_at, u.created_at),
             coalesce(nullif(s.last_day, '')::timestamptz, u.created_at)),
    coalesce(r.rr, '{}'),
    coalesce(s.streak, 0)::int, coalesce(s.active_days, 0)::int, coalesce(s.answers, 0)::bigint,
    coalesce(pr.mastered, 0)::int, coalesce(pr.words, 0)::int,
    coalesce(l.n, 0)::int, coalesce(un.n, 0)::int
  from auth.users u
  left join profiles p on p.user_id = u.id
  left join lateral (
    select array_agg(x) rr from (
      select ur.role x from user_roles ur where ur.user_id = u.id
      union select 'admin' where u.email = 'paulkilroy@gmail.com'   -- super-admin is by email, not a role row
    ) t) r on true
  left join lateral (
    select max(us.count) streak, max(us.last) last_day,
           count(distinct d.key) active_days,
           sum(case when jsonb_typeof(d.value) = 'number' then (d.value)::text::int
                    else coalesce((d.value->>'n')::int, 0) end) answers
    from user_streak us left join lateral jsonb_each(us.days) d on true
    where us.user_id = u.id) s on true
  left join lateral (
    select count(*) words, count(*) filter (where pg.box >= 4) mastered
    from progress pg where pg.user_id = u.id) pr on true
  left join lateral (select count(*) n from lesson_progress lp where lp.user_id = u.id and lp.parts > 0) l on true
  left join lateral (select count(*) n from unit_progress up where up.user_id = u.id and up.passed) un on true
  order by 6 desc;
end $$;
revoke all on function admin_list_users() from public;
grant execute on function admin_list_users() to authenticated;
