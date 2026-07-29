-- Sulog data model — ONE schema for any Waray course.
-- Core idea (proven against CH2 phrase-first + PC grammar-first): a lesson is an ordered
-- list of typed BLOCKS. Courses differ only in which blocks, in what order. See the two
-- load files (ch2-phase1.sql, pc-phase1.sql) for both mapped onto these tables.
--
-- WHERE THE DATA COMES FROM and how it's loaded (sources of truth, the course-build pipeline, the
-- dictionary-is-a-lexicon rule, Tramp reconciliation): see docs/schema/DATA-SOURCES.md.

-- ============================================================
-- SHARED WARAY CONTENT  (language-level; every course references it)
-- ============================================================

-- the lexicon: words + idiomatic set-phrases (anything with its OWN meaning)
create table dictionary (
  waray         text primary key,               -- stable id, unique per language (== our card id)
  kind          text not null check (kind in ('word','phrase')),
  meaning       text not null,
  pronunciation text,                            -- 'mah-OO-pigh' (display guide the learner reads)
  spoken        text,                            -- TTS override: what to FEED the speech engine (e.g. mga→'manga'); null = read the raw Waray
  pos           text,                            -- part of speech (optional)
  root          text,                            -- lemma/root of an inflected word (optional)
  variants      text[]  not null default '{}',   -- alt / dialect spellings
  loan          text,                            -- null | 'Tagalog' | 'Spanish'
  confirmed     boolean not null default false,  -- a verifier vouched for this definition
  confirmed_by  text                             -- WHO: 'tramp' | 'book' (print match) | 'ella'
);

-- one row per SENSE of a word. The dictionary holds the headword (+ canonical spelling and
-- pronunciation); meanings hold WHAT IT MEANS. A word may carry several confirmed senses (homographs).
-- Meanings are MERGED (one row per distinct definition) — but a merged definition can be asserted by MANY
-- sources at once, so `sources` is an ARRAY, not a scalar (a single column would clobber: if PC and
-- CH2 both wrote "father", last-write-wins loses that both agree). Sources: course ids ('pc'; 'waray'
-- = the RETIRED original course, kept as provenance even though the course itself was archived),
-- 'tramp' (the authoritative dictionary agreed), 'ella' (native-speaker confirmed). More independent
-- sources = higher confidence. Reconciliation = confirming a row, never a second definition in `dictionary`.
-- To ask "which courses DRILL this word / where", use the word_usage view (bottom of file).
create table meanings (
  id        bigserial primary key,
  waray     text not null references dictionary(waray) on delete cascade,
  meaning   text not null,
  pos       text,
  pronunciation text,                             -- per-SENSE stress ("kee-TAH" we vs "KEE-tah" see) — Waray stress is phonemic, so homograph senses can sound different; the dictionary card carries the primary sense's guide
  sources   text[] not null default '{}',        -- who asserts this sense (course ids, 'tramp', 'ella')
  confirmed boolean not null default false,       -- this sense is native-speaker verified
  ord       int not null default 1,               -- display order; 1 = primary
  unique (waray, meaning)
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
  methodology text,                              -- 'phrase-first' | 'grammar-spine'
  version bigint not null default 0              -- bumped on every reload; the app auto-refreshes its cache when this grows
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
-- THE FLEXIBLE LESSON BODY  (the load-bearing table) — fully relational, no jsonb.
-- Single-table inheritance: one row per block; only the columns for its `type` are used.
-- The one genuinely list-shaped thing (which words/sentences a block uses) is a real
-- child table with real FKs -> block_items.
-- ============================================================
create table lesson_blocks (
  id        bigserial primary key,
  lesson_id text not null references lessons(id),
  ord       int  not null,
  type      text not null check (type in
    ('review','grammar','note','vocab','phrases','drill','story','assessment')),  -- 'examples' removed: book examples become recognition drills, never their own block
  -- GUIDE content (grammar / examples / note) — a chart is just a markdown table in body_md
  title     text,
  body_md   text,
  formula   text,
  footnote  text,                                        -- a book footnote that annotates THIS section — shown as a subtle "*" tip on every question in a drill/vocab block (guide footnotes fold into body_md instead)
  about     text references dictionary(waray),          -- note is "about" a lexeme (e.g. mga)
  -- DRILL config
  drill_kind      text check (drill_kind      in ('recognition','production','transform')),
  drill_modality  text check (drill_modality  in ('mc','listen','type','voice','cloze')),  -- cloze = pick the marker/particle
  drill_hint      text check (drill_hint      in ('peek','partial','none')),
  drill_direction text check (drill_direction in ('wte','etw','both')),
  -- ASSESSMENT config (the gate)
  assess_scope     text check (assess_scope in ('unit','phase')),
  assess_pool      text,
  assess_select    text,
  assess_n         int,
  assess_threshold numeric,
  assess_gate      boolean,
  -- REVIEW (points back at a prior block) / STORY
  review_target bigint references lesson_blocks(id),
  review_mode   text,
  story_id      text references stories(id),
  unique (lesson_id, ord)
);
-- Practice drills expose their lesson's guide blocks as reference buttons BY DEFAULT
-- (derived, not stored); the assessment gate exposes none (drill_hint / assess handles it).

-- items a block uses: vocab entries, drill items, example refs, phrase refs.
-- EXACTLY ONE of dict_waray / expr_id is set — both are REAL foreign keys, DB-enforced.
create table block_items (
  id         bigserial primary key,
  block_id   bigint not null references lesson_blocks(id) on delete cascade,
  ord        int not null,
  dict_waray text   references dictionary(waray),      -- a word or idiomatic phrase
  expr_id    bigint references expressions(id),        -- a composed sentence
  role       text check (role in ('teach','item','example','phrase')),
  check ( (dict_waray is not null)::int + (expr_id is not null)::int = 1 ),
  unique (block_id, ord)
);
-- (transform drills, when we add them, get a from/to pair: add pair_expr_id to block_items.)

-- ============================================================
-- PER-USER  (keyed by the Waray string — the stable id we already adopted)
-- NOTE: after creating these tables, ALSO run sync-guards.sql (stale-write triggers — the client
-- pushes blind upserts, and the guards stop an out-of-date device from regressing any row) and
-- rls.sql (row-level security). Both are idempotent.
-- Progress is namespaced per course (a word can sit in two courses' decks with
-- independent SRS state). All four tables mirror the app's localStorage records
-- 1:1 so the sync layer is a straight column<->field map (no lossy JSON blobs).
-- `last`/`due` are ms-epoch integers (the app's clock), not timestamptz.
-- ============================================================
create table progress (
  user_id   uuid not null,
  course_id text not null,        -- which course's deck (per-course SRS)
  waray     text not null,        -- word | phrase | sentence — the item's Waray form (stable card id)
  box int not null default 0, seen int not null default 0,
  n_right int not null default 0, -- correct count ("right" is a SQL reserved word)
  wrong int not null default 0, streak int not null default 0, recall int not null default 0,
  last bigint not null default 0, -- ms epoch of last attempt (merge/recency key)
  due  bigint not null default 0, -- ms epoch when the card is next due
  pinned boolean not null default false,
  primary key (user_id, course_id, waray)
);

-- lesson completion: parts cleared (monotonic 0..N). id is the app's course lesson id.
create table lesson_progress (
  user_id uuid not null,
  course_id text not null,
  lesson_id text not null,
  parts int not null default 0,
  last bigint not null default 0,
  primary key (user_id, course_id, lesson_id)
);

-- unit review results: best score, sticky pass, last run.
create table unit_progress (
  user_id uuid not null,
  course_id text not null,
  unit_id text not null,
  best int not null default 0,
  passed boolean not null default false,
  last int not null default 0,    -- last run's score
  at text not null default '',    -- 'YYYY-MM-DD' of last run
  primary key (user_id, course_id, unit_id)
);

-- day-streak: count + last active day + the per-day activity set. `days` is genuinely
-- a set of dates, so jsonb is its natural shape (not an opaque state blob).
create table user_streak (
  user_id uuid not null,
  course_id text not null,
  count int not null default 0,
  last text not null default '',  -- 'YYYY-MM-DD' of last active day
  days jsonb not null default '{}',
  primary key (user_id, course_id)
);

create table review_questions (   -- native-speaker (Ella) queue
  id text primary key,
  course_id text,                 -- null / 'all' = language-wide
  topic text, q text not null, detail text,
  resolved boolean not null default false
);

-- ============================================================
-- CONVENIENCE VIEW
-- ============================================================

-- "where is this word?" — which courses drill it, in which lessons, how often. The dictionary is a
-- LEXICON (superset of the lessons); a row with courses = '{}' is a real word no current lesson drills
-- (a phrase, story definition, or legacy deck word), not junk. Usage here ≈ where a word's meaning came from.
--   e.g.  select * from word_usage where waray = 'ako';   -> courses {pc,waray}, lessons {...}, drilled 5x
create or replace view word_usage as
  select d.waray, d.meaning, d.kind, d.confirmed, d.variants,
    array_remove(array_agg(distinct co.id), null) as courses,
    array_remove(array_agg(distinct l.id),  null) as lessons,
    count(bi.*)                                    as times_drilled
  from dictionary d
  left join block_items   bi on bi.dict_waray = d.waray
  left join lesson_blocks lb on lb.id = bi.block_id
  left join lessons       l  on l.id  = lb.lesson_id
  left join units         u  on u.id  = l.unit_id
  left join phases        p  on p.id  = u.phase_id
  left join courses       co on co.id = p.course_id
  group by d.waray, d.meaning, d.kind, d.confirmed, d.variants;
