-- Classroom platform tables (judgment-table class — never touched by a content reload).
-- Additive: safe to run on the live DB. Run AFTER schema.sql; then classroom-rls.sql.
-- Data model: claude.ai TG2 doc (profiles · roles · classes · enrollment · feedback · coverage).

-- one row per signed-in user (mirrors auth.users; students may be anonymous with no row)
create table if not exists profiles (
  user_id      uuid primary key,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
);

-- stackable roles; "student" is the implicit default and never stored
create table if not exists user_roles (
  user_id    uuid not null references profiles(user_id) on delete cascade,
  role       text not null check (role in ('instructor','reviewer','admin')),
  granted_by uuid,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- request an elevated role; an admin approves
create table if not exists role_requests (
  id         bigserial primary key,
  user_id    uuid not null references profiles(user_id) on delete cascade,
  role       text not null check (role in ('instructor','reviewer')),
  note       text,
  status     text not null default 'pending' check (status in ('pending','approved','declined')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- a class (one per instructor for now) with an unguessable join code
create table if not exists classes (
  id            text primary key,
  instructor_id uuid not null references profiles(user_id),
  name          text not null,
  code          text not null unique,
  course_id     text not null references courses(id),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- student ↔ class (created by join_class(); see classroom-rls.sql)
create table if not exists enrollments (
  class_id   text not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(user_id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- THE unified queue: student flags + reviewer proposals -> an admin decides
create table if not exists feedback (
  id          bigserial primary key,
  author_id   uuid not null references profiles(user_id),
  author_role text not null check (author_role in ('student','reviewer','instructor')),
  kind        text not null check (kind in
                ('flag_wrong','flag_confusing','flag_grade','typo',
                 'propose_add','propose_reorder','propose_disputed','validate')),
  target_type text not null check (target_type in ('word','card','lesson','exercise','sentence')),
  target_ref  text not null,                       -- the waray / lesson_id / expr_id it's about
  class_id    text references classes(id) on delete set null,  -- set on a student flag -> routes to that instructor
  comment     text,
  payload     jsonb not null default '{}',         -- structured proposal (meaning,pos,pronunciation,register,variant,example,certainty | new_ord | dispute_reason)
  context     jsonb not null default '{}',         -- auto-captured (direction, given_answer, lesson, block)
  status      text not null default 'open' check (status in ('open','resolved')),
  decision    text check (decision in ('applied','rejected','edited')),
  decided_by  uuid,
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists feedback_open_idx  on feedback (status) where status = 'open';
create index if not exists feedback_class_idx on feedback (class_id);

-- "a reviewer went through this and found nothing wrong" — QA signal, NOT a content change
create table if not exists reviewer_coverage (
  reviewer_id uuid not null references profiles(user_id) on delete cascade,
  target_type text not null check (target_type in ('word','card','lesson','section')),
  target_ref  text not null,
  signal      text not null default 'passive' check (signal in ('passive','explicit')),  -- explicit ✓/✎ upgrades passive
  course_id   text not null,
  at          timestamptz not null default now(),
  primary key (reviewer_id, target_type, target_ref)
);

-- meanings gains the reversible "hidden from learners" layer (an approved flag_wrong sets it;
-- the row, its sources and provenance all stay — never a delete).
alter table meanings add column if not exists disputed boolean not null default false;
