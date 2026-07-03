-- Sulog data model — ONE schema for any Waray course.
-- Core idea (proven against CH2 phrase-first + PC grammar-first): a lesson is an ordered
-- list of typed BLOCKS. Courses differ only in which blocks, in what order. See the two
-- load files (ch2-phase1.sql, pc-phase1.sql) for both mapped onto these tables.

-- ============================================================
-- SHARED WARAY CONTENT  (language-level; every course references it)
-- ============================================================

-- the lexicon: words + idiomatic set-phrases (anything with its OWN meaning)
create table dictionary (
  waray         text primary key,               -- stable id, unique per language (== our card id)
  kind          text not null check (kind in ('word','phrase')),
  meaning       text not null,
  pronunciation text,                            -- 'mah-OO-pigh'
  pos           text,                            -- part of speech (optional)
  root          text,                            -- lemma/root of an inflected word (optional)
  variants      text[]  not null default '{}',   -- alt / dialect spellings
  loan          text,                            -- null | 'Tagalog' | 'Spanish'
  confirmed     boolean not null default false   -- native-speaker (Ella) verified
);

-- composed sentences: worked examples, model sentences, drill items, story lines.
-- meaning is compositional (built from dictionary lexemes), NOT idiomatic.
create table expressions (
  id               bigserial primary key,
  waray            text not null,                -- the full sentence
  translation      text not null,
  alt_translations text[] not null default '{}', -- ambiguity-aware ("[or]" case)
  focus            text references dictionary(waray), -- lexeme it showcases (optional)
  components       text[] not null default '{}'  -- ordered dictionary refs (optional/derived)
);

-- reader stories (language-level; surfaced per learner by computed coverage)
create table stories (
  id text primary key, title text, title_en text
);
create table story_lines (
  story_id text not null references stories(id),
  ord int not null,
  expr_id bigint not null references expressions(id),
  primary key (story_id, ord)
);
create table story_questions (
  id bigserial primary key,
  story_id text not null references stories(id),
  q text not null, options text[] not null, answer int not null
);

-- ============================================================
-- COURSE STRUCTURE
-- ============================================================
create table courses (
  id text primary key, name text not null, lang text not null default 'war',
  methodology text                               -- 'phrase-first' | 'grammar-spine'
);
create table phases (
  id text primary key, course_id text not null references courses(id),
  ord int not null, name text not null, can_do text
);
create table units (
  id text primary key, phase_id text not null references phases(id),
  ord int not null, name text not null, theme text, can_do text
);
create table lessons (
  id text primary key, unit_id text not null references units(id),
  ord int not null, title text
);

-- ============================================================
-- THE FLEXIBLE LESSON BODY  (the load-bearing table)
-- ============================================================
create table lesson_blocks (
  id bigserial primary key,
  lesson_id text not null references lessons(id),
  ord int not null,
  type text not null check (type in
    ('review','grammar','examples','note','vocab','phrases','drill','story','assessment')),
  payload jsonb not null default '{}'
);
-- payload shapes (documented; validated in the app layer):
--  vocab      {"entries":["maupay","aga"], "position":"pre"|"post"}
--  phrases    {"items":[{"k":"dict","w":"Diri ako maaram"}|{"k":"expr","id":12}]}
--  grammar    {"point":"...","prose":"...","formula":"..."}
--  examples   {"expr":[12,13,14]}
--  note       {"text":"...","about":"mga"}
--  drill      {"kind":"recognition"|"production"|"transform",
--              "modality":"mc"|"listen"|"type"|"voice","hint":"peek"|"partial"|"none",
--              "direction":"wte"|"etw",
--              "items":[{"k":"dict","w":"..."}|{"k":"expr","id":..}],   -- recognition/production
--              "pairs":[{"from":12,"op":"->question","to":13}],         -- transform only
--              "references":["grammar","examples","note","vocab"]}
--  review     {"scope":"prev-lesson"|"prev-unit","items":[...]}
--  story      {"story_id":"u1s1"}
--  assessment {"scope":"unit"|"phase","pool":"apply-phrases"|"all","select":"hardest",
--              "n":10,"threshold":0.8,"gate":true,"hint":"none"}

-- ============================================================
-- PER-USER  (keyed by the Waray string — the stable id we already adopted)
-- ============================================================
create table progress (
  user_id uuid not null,
  waray   text not null,          -- word | phrase | sentence — the item's Waray form
  box int not null default 0, seen int not null default 0,
  wrong int not null default 0, recall int not null default 0,
  due timestamptz,
  primary key (user_id, waray)
);

create table review_questions (   -- native-speaker (Ella) queue
  id text primary key,
  course_id text,                 -- null / 'all' = language-wide
  topic text, q text not null, detail text,
  resolved boolean not null default false
);
