-- Row-Level Security for Supabase. Run in the SQL Editor AFTER schema.sql + seed.sql.
-- Policy: course content is world-readable (even signed-out); only the admin
-- (paulkilroy@gmail.com, via Google auth) can edit; progress is private per user.
-- (auth.jwt()/auth.uid() are Supabase-provided — this file is not validated in bare pglite.)

create or replace function is_admin() returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'paulkilroy@gmail.com'
$$;

-- content tables: everyone SELECTs; only the admin writes
do $$
declare t text;
begin
  foreach t in array array[
    'dictionary','expressions','stories','story_lines','story_questions',
    'courses','phases','units','lessons','lesson_blocks','block_items','review_questions'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (true)', t||'_read', t);
    execute format('create policy %I on %I for all to authenticated using (is_admin()) with check (is_admin())', t||'_admin', t);
  end loop;
end $$;

-- progress: each signed-in learner reads & writes ONLY their own rows
alter table progress enable row level security;
create policy progress_self on progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
