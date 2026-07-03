-- CH2 Phase 1 loaded onto schema.sql. Unit 1 in full (real data); u2–u5 follow the
-- identical pattern (stubbed). Phrase-first: NO study prefix — every lesson is the
-- shared drill tail: vocab(teach) -> drill(mc) -> drill(type).

-- ---- course / phase / units ----
insert into courses values ('ch2','Waray (Challenger 2)','war','phrase-first');
insert into phases  values ('ch2-p1','ch2',1,'First Steps in Daram','greet, family, home, food, numbers');
insert into units values
  ('u1','ch2-p1',1,'Greetings, Time & Pronouns','greetings','I can greet someone and say who I am, any time of day'),
  ('u2','ch2-p1',2,'Family, Respect & Pointers',null,null),          -- (stub) same shape
  ('u3','ch2-p1',3,'House & Daily Actions',null,null),
  ('u4','ch2-p1',4,'Food, Drinks & Requests',null,null),
  ('u5','ch2-p1',5,'Numbers & Money',null,null);

-- ---- dictionary: u1 WORDS ----
insert into dictionary (waray,kind,meaning,pronunciation,pos,confirmed) values
  ('maupay','word','good','mah-OO-pigh','adj',true),
  ('aga','word','morning','AH-gah','noun',true),
  ('udto','word','noon','OOD-to','noun',true),
  ('kulop','word','afternoon','KOO-lop','noun',true),
  ('gab-i','word','evening/night','GAB-ee','noun',true),
  ('yana','word','now','YAH-nah','adv',true),
  ('kanina','word','earlier','kah-NEE-nah','adv',true),
  ('niyan','word','later','nee-YAN','adv',true),
  ('kamusta','word','how are you','kah-moos-TAH','greeting',true),
  ('ako','word','I','ah-KAW','pron',true),
  ('ikaw','word','you (sg)','ee-KOW','pron',true),
  ('hiya','word','he/she','HEE-yah','pron',true),
  ('hira','word','they','HEE-rah','pron',true),
  ('kami','word','we (exclusive)','kah-MEE','pron',true),
  ('kita','word','we (inclusive)','kee-TAH','pron',true),
  ('kamo','word','you (plural)','kah-MAW','pron',true);

-- ---- dictionary: u1 survival PHRASES (idiomatic — own meaning) ----
insert into dictionary (waray,kind,meaning,pronunciation,loan,confirmed) values
  ('Diri ako maaram','phrase','I don''t know','DEE-ree ah-KAW mah-AH-ram',null,true),
  ('Waray ako makabaro','phrase','I don''t understand','wah-RIGH ah-KAW mah-kah-BAH-ro',null,true),
  ('Naintindihan ko','phrase','I understand','nah-een-tin-dee-HAHN ko',null,true),
  ('Naintindihan nimo?','phrase','Do you understand?','nah-een-tin-dee-HAHN NEE-mo',null,true),
  ('Hinay-hinay la','phrase','Slowly, please','HEE-nigh HEE-nigh lah',null,true),
  ('Damo nga salamat','phrase','Thank you very much','DAH-mo ngah sah-LAH-mat',null,true),
  ('Pasensya na','phrase','Sorry / excuse me','pah-SEN-syah nah',null,true),
  ('Walang anuman','phrase','You''re welcome','wah-LANG ah-noo-MAN','Tagalog',false),  -- pron pending Ella
  ('Pwede mo ako buligan?','phrase','Can you help me?','PWEH-deh mo ah-KAW boo-LEE-gan',null,true);

-- ---- expressions: u1 apply GREETINGS (compositional — NOT idiomatic) ----
insert into expressions (id,waray,translation,focus) values
  (1,'Maupay nga aga, hi Maria.','Good morning, Maria.','maupay'),
  (2,'Kamusta ka yana?','How are you now?','kamusta'),
  (3,'Maupay ako yana.','I am good now.','ako'),
  (4,'Maupay hira kanina.','They were good earlier.','hira'),
  (5,'Maupay kita niyan!','We''ll be good later!','kita'),
  (6,'Maupay nga gab-i, hi Juan.','Good evening, Juan.','gab-i');

-- ---- story ----
insert into stories values ('u1s1','Kamusta Kita?','How Are We?');
insert into expressions (id,waray,translation) values          -- story lines are expressions too
  (7,'Maupay nga aga, hi Ana.','Good morning, Ana.'),
  (8,'Kamusta ka yana?','How are you now?'),
  (9,'Maupay ako! Kamusta kamo?','I am good! How are you (all)?');  -- (illustrative — 3-line story)
insert into story_lines values ('u1s1',1,7),('u1s1',2,8),('u1s1',3,9);
insert into story_questions (story_id,q,options,answer) values
  ('u1s1','What time of day is it?', array['aga','gab-i','udto'], 0);

-- ---- lessons ----
insert into lessons values
  ('u1l1','u1',1,'Times of Day'),
  ('u1l2','u1',2,'Pronouns & Identity'),
  ('u1l3','u1',3,'Putting it Together'),
  ('u1l4','u1',4,'When you''re stuck'),
  ('u1-rev','u1',5,'Unit Review'),
  ('u1-story','u1',6,'Story');

-- ---- lesson_blocks: the shared drill tail, per lesson ----
insert into lesson_blocks (lesson_id,ord,type,payload) values
 -- u1l1 Times of Day
 ('u1l1',1,'vocab', '{"entries":["maupay","aga","udto","kulop","gab-i","yana","kanina","niyan"],"position":"pre"}'),
 ('u1l1',2,'drill', '{"kind":"recognition","modality":"mc","hint":"peek","items":[{"k":"dict","w":"aga"},{"k":"dict","w":"udto"}],"references":["vocab"]}'),
 ('u1l1',3,'drill', '{"kind":"production","modality":"type","hint":"partial","direction":"etw","items":[{"k":"dict","w":"aga"}],"references":["vocab"]}'),
 -- u1l2 Pronouns
 ('u1l2',1,'vocab', '{"entries":["kamusta","ako","ikaw","hiya","hira","kami","kita","kamo"],"position":"pre"}'),
 ('u1l2',2,'drill', '{"kind":"recognition","modality":"mc","hint":"peek","items":[{"k":"dict","w":"ako"},{"k":"dict","w":"kita"}],"references":["vocab"]}'),
 ('u1l2',3,'drill', '{"kind":"production","modality":"type","hint":"partial","direction":"etw","items":[{"k":"dict","w":"kamo"}],"references":["vocab"]}'),
 -- u1l3 apply greetings (items are EXPRESSIONS)
 ('u1l3',1,'phrases','{"items":[{"k":"expr","id":1},{"k":"expr","id":2},{"k":"expr","id":3},{"k":"expr","id":4},{"k":"expr","id":5},{"k":"expr","id":6}]}'),
 ('u1l3',2,'drill', '{"kind":"recognition","modality":"mc","hint":"peek","items":[{"k":"expr","id":2}],"references":["phrases"]}'),
 ('u1l3',3,'drill', '{"kind":"production","modality":"voice","hint":"none","direction":"etw","items":[{"k":"expr","id":1}],"references":["phrases"]}'),
 -- u1l4 survival (items are DICTIONARY phrases)
 ('u1l4',1,'phrases','{"items":[{"k":"dict","w":"Diri ako maaram"},{"k":"dict","w":"Waray ako makabaro"},{"k":"dict","w":"Walang anuman"}]}'),
 ('u1l4',2,'drill', '{"kind":"recognition","modality":"mc","hint":"peek","items":[{"k":"dict","w":"Diri ako maaram"}],"references":["phrases"]}'),
 -- u1 review (the gate) + story
 ('u1-rev',1,'assessment','{"scope":"unit","pool":"apply-phrases","select":"hardest","n":10,"threshold":0.8,"gate":true,"hint":"none","references":[]}'),
 ('u1-story',1,'story','{"story_id":"u1s1"}');

-- u2..u5: same three-block tail per word/apply lesson + a unit-review assessment + a story.
-- (omitted for brevity — mechanical.)
