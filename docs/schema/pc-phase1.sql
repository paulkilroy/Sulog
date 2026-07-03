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

-- ================= Lesson 1 (no review — it's first) =================
insert into lesson_blocks (lesson_id,ord,type,payload) values
 ('pc-l1',1,'grammar','{"point":"I-Class Personal Pronouns mark the TOPIC","prose":"Waray has two kinds of pronoun in three classes. A I-Class Personal Pronoun marks the topic of an equational (verbless) sentence.","formula":"[ Adjective/Noun ] + [ I-Cl Personal Pronoun ]","chart":"sing: ako/ikaw/hiya  |  plur: kami(excl)/kita(incl)/kamo/hira"}'),
 ('pc-l1',2,'examples','{"expr":[101,102,103,104]}'),
 ('pc-l1',3,'note','{"text":"An equational sentence has NO verb — a noun/adjective is equated with the pronoun. Plural is carried by mga.","about":"mga"}'),
 ('pc-l1',4,'vocab','{"entries":["ako","ikaw","hiya","hira","kami","kita","tatay","makusog","Kristohanon"],"position":"post"}'),   -- pronouns REUSED from the shared dictionary
 ('pc-l1',5,'drill','{"kind":"recognition","modality":"mc","hint":"peek","items":[{"k":"expr","id":101},{"k":"expr","id":102}],"references":["grammar","examples","note","vocab"]}'),
 ('pc-l1',6,'drill','{"kind":"production","modality":"type","hint":"partial","direction":"both","items":[{"k":"expr","id":103}],"references":["grammar","examples","vocab"]}');
 -- ^ "direction":"both" = PC's bidirectional written exercise (Waray->Eng AND Eng->Waray in one set) — HICCUP: our drill.direction is single-valued.

-- ================= Lesson 2 (opens with retrieval Review) =================
insert into lesson_blocks (lesson_id,ord,type,payload) values
 ('pc-l2',1,'review','{"scope":"prev-lesson","mode":"reproduce-chart","prompt":"Write the I-Class Personal Pronoun chart from memory, then translate 10 sentences.","hint":"none"}'),
 -- ^ HICCUP: "reproduce the grammar chart from memory" is a review of a GRAMMAR block, not vocab items — no item refs, it recalls a chart.
 ('pc-l2',2,'grammar','{"point":"I-Class Markers","prose":"Proper nouns take hi/hira; common nouns take an / an mga. ngan = and.","formula":"[ Marker ] + [ Noun ]","chart":"proper: hi/hira | common: an/an mga"}'),
 ('pc-l2',3,'examples','{"expr":[102,104]}'),
 ('pc-l2',4,'note','{"text":"mga marks plural on common nouns; ngan links two nouns.","about":"mga"}'),
 ('pc-l2',5,'vocab','{"entries":["tatay","Kristohanon","mga"],"position":"post"}'),
 ('pc-l2',6,'drill','{"kind":"recognition","modality":"mc","hint":"peek","items":[{"k":"dict","w":"tatay"}],"references":["grammar","examples","note","vocab"]}'),
 ('pc-l2',7,'drill','{"kind":"production","modality":"type","hint":"none","direction":"both","items":[{"k":"expr","id":104}],"references":["grammar","vocab"]}');

-- ================= Lesson 10 — PHASE milestone (the gate) =================
insert into lesson_blocks (lesson_id,ord,type,payload) values
 ('pc-l10',1,'assessment','{"scope":"phase","pool":"all","select":"mixed","n":20,"threshold":0.8,"gate":true,"hint":"none","references":[],"on_fail":"remediate:review-flagged-lessons"}');
 -- consolidation + 20-item gated test + remediation routing. scope=phase, but it lives in a
 -- lesson under a milestone unit (pc-uR) — HICCUP: phase-level assessment has no home except a synthetic unit/lesson.
