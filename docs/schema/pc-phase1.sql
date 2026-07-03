-- Peace Corps Phase 1 (Lessons 1–10) onto the SAME schema.sql. Grammar-first: each
-- lesson carries the STUDY PREFIX (review/grammar/examples/note) before the shared drill
-- tail. Assessment is a PHASE milestone (L10), not per-unit; no stories.
-- KEY: PC references the SAME dictionary rows CH2 already loaded (ako, hiya, kita…) —
-- one lexicon, two courses. Only PC-specific words are inserted here.

insert into courses values ('pc','Peace Corps Waray','war','grammar-spine');
insert into phases  values ('pc-p1','pc',1,'Foundations (Lessons 1–10)','equational sentences & the three pronoun classes');
-- PC has no native "unit" layer → one teaching unit + a milestone unit (hierarchy flexes).
insert into units values
  ('pc-u1','pc-p1',1,'Equational sentences & pronoun classes','pronoun classes I/II/III, markers, demonstratives',null),
  ('pc-uR','pc-p1',2,'Review milestone (L10)',null,null);

-- ---- PC-specific dictionary words (pronouns ako/ikaw/hiya/hira/kami/kita already exist from CH2) ----
insert into dictionary (waray,kind,meaning,pronunciation,pos,confirmed) values
  ('tatay','word','father','TAH-tigh','noun',false),
  ('makusog','word','strong','mah-KOO-sog','adj',false),
  ('Kristohanon','word','Christian','kris-to-HAH-non','noun',false),  -- missionary-register lexicon
  ('mga','word','plural marker','mangah','particle',false);

-- ---- PC example / model sentences (compositional -> expressions) ----
insert into expressions (id,waray,translation,focus) values
  (101,'Makusog ako.','I am strong.','ako'),
  (102,'Kristohanon hiya.','He/She is a Christian.','hiya'),
  (103,'Kristohanon kita.','We are Christians.','kita'),          -- singular|plural taught together
  (104,'Tatay hiya.','He is a father.','tatay');

-- ---- lessons (PC lesson == a Sulog lesson; block sequence carries the whole thing) ----
insert into lessons values
  ('pc-l1','pc-u1',1,'Lesson 1 — I-Class Personal Pronouns'),
  ('pc-l2','pc-u1',2,'Lesson 2 — I-Class Markers'),
  -- pc-l3 … pc-l9 same shape (stub)
  ('pc-l10','pc-uR',1,'Lesson 20-style Review Test');

-- ---- lesson_blocks (relational; explicit ids for block_items FKs) ----
-- Lesson 1 — study prefix (no review; it's first) then the shared tail
insert into lesson_blocks (id,lesson_id,ord,type,title,body_md,formula) values
  (101,'pc-l1',1,'grammar','I-Class Personal Pronouns mark the TOPIC',
       'Waray has two kinds of pronoun in three classes. A I-Class Personal Pronoun marks the topic of a verbless (equational) sentence.'
       || E'\n\n| | singular | plural |\n|--|--|--|\n| 1 | ako | kami (excl) / kita (incl) |\n| 2 | ikaw | kamo |\n| 3 | hiya | hira |',
       '[ Adjective/Noun ] + [ I-Cl Personal Pronoun ]'),
  (108,'pc-l2',2,'grammar','I-Class Markers',
       'Proper nouns take hi/hira; common nouns take an / an mga. ngan = and.'
       || E'\n\n| | proper | common |\n|--|--|--|\n| sing | hi | an |\n| plur | hira | an mga |',
       '[ Marker ] + [ Noun ]');
insert into lesson_blocks (id,lesson_id,ord,type,body_md,about) values
  (103,'pc-l1',3,'note','An equational sentence has NO verb — a noun/adjective is equated with the pronoun. Plural is carried by mga.','mga'),
  (110,'pc-l2',4,'note','mga marks plural on common nouns; ngan links two nouns.','mga');
insert into lesson_blocks (id,lesson_id,ord,type) values
  (102,'pc-l1',2,'examples'), (104,'pc-l1',4,'vocab'),
  (109,'pc-l2',3,'examples'), (111,'pc-l2',5,'vocab');
insert into lesson_blocks (id,lesson_id,ord,type,drill_kind,drill_modality,drill_hint,drill_direction) values
  (105,'pc-l1',5,'drill','recognition','mc'  ,'peek'   ,null  ),
  (106,'pc-l1',6,'drill','production' ,'type','partial','both'),   -- 'both' = bidirectional (we already do E->W then W->E)
  (112,'pc-l2',6,'drill','recognition','mc'  ,'peek'   ,null  ),
  (113,'pc-l2',7,'drill','production' ,'type','none'   ,'both');
-- Lesson 2 opens with a REVIEW that points back at Lesson 1's grammar block (a real FK, not "items")
insert into lesson_blocks (id,lesson_id,ord,type,review_target,review_mode) values
  (107,'pc-l2',1,'review',101,'reproduce-chart');
-- Lesson 10 — PHASE milestone gate (lives in the synthetic milestone unit pc-uR)
insert into lesson_blocks (id,lesson_id,ord,type,assess_scope,assess_pool,assess_select,assess_n,assess_threshold,assess_gate) values
  (114,'pc-l10',1,'assessment','phase','all','mixed',20,0.8,true);

-- ---- block_items: examples ref expressions, vocab refs dictionary — all real FKs ----
insert into block_items (block_id,ord,expr_id,role) values
  (102,1,101,'example'),(102,2,102,'example'),(102,3,103,'example'),(102,4,104,'example'),
  (105,1,101,'item'),(105,2,102,'item'),   (106,1,103,'item'),
  (109,1,102,'example'),(109,2,104,'example'),   (113,1,104,'item');
insert into block_items (block_id,ord,dict_waray,role) values
  (104,1,'ako','teach'),(104,2,'ikaw','teach'),(104,3,'hiya','teach'),(104,4,'hira','teach'),
  (104,5,'kami','teach'),(104,6,'kita','teach'),(104,7,'tatay','teach'),(104,8,'makusog','teach'),(104,9,'Kristohanon','teach'),
  (111,1,'tatay','teach'),(111,2,'Kristohanon','teach'),(111,3,'mga','teach'),
  (112,1,'tatay','item');
-- review (107) points at a block, not items; assessment (114) pool is dynamic — neither uses block_items.
