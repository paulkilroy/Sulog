-- Row-level security for the classroom tables. Run AFTER classroom.sql + rls.sql.
-- Idempotent (drop-if-exists before each policy). The publishable key ships in every browser,
-- so these rules are the whole defense.

-- role helpers ------------------------------------------------------------
-- ALL of these are SECURITY DEFINER on purpose: a policy that queries another RLS-protected
-- table re-enters that table's policies, which can recurse forever (enrollments <-> classes,
-- user_roles <-> is_admin). Running as the definer bypasses RLS inside the check. They only
-- ever answer a yes/no about the CALLER (auth.uid()), so nothing leaks.
create or replace function has_role(r text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = r)
$$;

-- admin = the bootstrap super-admin email OR anyone granted the admin role (so promotions work)
create or replace function is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'paulkilroy@gmail.com'
      or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
$$;

create or replace function is_class_instructor(p_class text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes c where c.id = p_class and c.instructor_id = auth.uid())
$$;

create or replace function is_enrolled(p_class text) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from enrollments e where e.class_id = p_class and e.student_id = auth.uid())
$$;

create or replace function teaches_student(p_student uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from enrollments e join classes c on c.id = e.class_id
                 where e.student_id = p_student and c.instructor_id = auth.uid())
$$;

-- join a class by code: resolves code -> class, enrolls the caller. SECURITY DEFINER so a
-- student never needs direct SELECT on classes (codes stay unguessable, not enumerable).
create or replace function join_class(p_code text) returns text language plpgsql security definer
  set search_path = public as $$
declare cid text;
begin
  select id into cid from classes where code = p_code and active;
  if cid is null then raise exception 'no active class with that code'; end if;
  insert into profiles (user_id) values (auth.uid()) on conflict do nothing;
  insert into enrollments (class_id, student_id) values (cid, auth.uid()) on conflict do nothing;
  return cid;
end $$;

-- profiles: self read/write; admin reads all -------------------------------
alter table profiles enable row level security;
drop policy if exists profiles_self on profiles;
drop policy if exists profiles_admin_read on profiles;
create policy profiles_self       on profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_admin_read on profiles for select using (is_admin());

-- user_roles: self read; only admin grants ---------------------------------
alter table user_roles enable row level security;
drop policy if exists user_roles_self_read on user_roles;
drop policy if exists user_roles_admin on user_roles;
create policy user_roles_self_read on user_roles for select to authenticated using (user_id = auth.uid());
create policy user_roles_admin     on user_roles for all using (is_admin()) with check (is_admin());

-- role_requests: self insert + read own; admin reads/decides ---------------
alter table role_requests enable row level security;
drop policy if exists role_req_own on role_requests;
drop policy if exists role_req_insert on role_requests;
drop policy if exists role_req_admin on role_requests;
create policy role_req_own    on role_requests for select to authenticated using (user_id = auth.uid() or is_admin());
create policy role_req_insert on role_requests for insert to authenticated with check (user_id = auth.uid());
create policy role_req_admin  on role_requests for update using (is_admin()) with check (is_admin());

-- classes: instructor manages own; enrolled students read; admin all -------
alter table classes enable row level security;
drop policy if exists classes_read on classes;
drop policy if exists classes_instructor on classes;
create policy classes_read       on classes for select to authenticated using (
  instructor_id = auth.uid() or is_admin() or is_enrolled(classes.id));
create policy classes_instructor on classes for all to authenticated
  using (instructor_id = auth.uid() or is_admin()) with check (instructor_id = auth.uid() or is_admin());

-- enrollments: student reads own; instructor reads their class; writes via join_class() -----
alter table enrollments enable row level security;
drop policy if exists enroll_student on enrollments;
drop policy if exists enroll_instructor on enrollments;
drop policy if exists enroll_admin on enrollments;
create policy enroll_student    on enrollments for select to authenticated using (student_id = auth.uid());
create policy enroll_instructor on enrollments for select to authenticated using (
  is_admin() or is_class_instructor(enrollments.class_id));
create policy enroll_admin      on enrollments for all using (is_admin()) with check (is_admin());

-- feedback: author inserts; instructor reads their class's flags; admin decides all ---------
alter table feedback enable row level security;
drop policy if exists fb_insert on feedback;
drop policy if exists fb_author_read on feedback;
drop policy if exists fb_instructor_read on feedback;
drop policy if exists fb_admin on feedback;
create policy fb_insert          on feedback for insert to authenticated with check (author_id = auth.uid());
create policy fb_author_read     on feedback for select to authenticated using (author_id = auth.uid());
create policy fb_instructor_read on feedback for select to authenticated using (
  class_id is not null and is_class_instructor(feedback.class_id));
create policy fb_admin           on feedback for all using (is_admin()) with check (is_admin());

-- reviewer_coverage: reviewer writes own; admin + instructor read (feeds quality) ----------
alter table reviewer_coverage enable row level security;
drop policy if exists rc_self on reviewer_coverage;
drop policy if exists rc_staff_read on reviewer_coverage;
create policy rc_self       on reviewer_coverage for all to authenticated using (reviewer_id = auth.uid()) with check (reviewer_id = auth.uid());
create policy rc_staff_read on reviewer_coverage for select to authenticated using (is_admin() or has_role('instructor'));

-- progress tables: keep the owner-only policy from rls.sql AND add instructor read for
-- students enrolled in their class (RLS combines SELECT policies with OR).
do $$ declare t text; begin
  foreach t in array array['progress','lesson_progress','unit_progress','user_streak'] loop
    execute format('drop policy if exists %I on %I', t||'_instructor_read', t);
    execute format('create policy %I on %I for select to authenticated using (teaches_student(%I.user_id))', t||'_instructor_read', t, t);
  end loop;
end $$;
