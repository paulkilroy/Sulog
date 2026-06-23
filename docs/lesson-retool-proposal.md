# Lesson retool — Words vs Apply (proposal)

**Status:** proposal for review, 2026-06-23. Makes the **words → application**
split explicit and consistent across every unit, and is the vehicle for adding
phrase lessons to the units that currently lack them (Colors, Days/Months, Body,
Numbers, Nature, God & worship, Church & belief, Get around).

## The model

Every unit is built from up to two clearly-labelled blocks:

### ① Words — learn the new vocabulary
- 1–3 lessons, ~6–8 new words each.
- **Drill = the full ladder** (today's `LESSON_PARTS`, unchanged):
  Recognize (W→E pick) → Reverse (E→W pick) → Recall (W→E type) → Produce (E→W type).
- Goal: lock form + meaning, both directions. *Get the words right first.*

### ② Apply / Mastery — use those words in sentences  *(later & grammar units only)*
- 1–2 lessons of **attested phrase cards** (mined from sources, see
  `docs/phrase-expansion-proposal.md`).
- **Drill = production-first**, because the words are already known from ①.
  "Go right into English → Waray." (Exact step list = the open decision below.)
- Goal: compose, not decode. This is where "I spoke to the pastor / we walked to
  church" lives.

### Words-only units (no ②)
Pure vocabulary lists with nothing to compose yet:
**Count to 100 · Name colors · Say where it hurts (body) · Days & months ·
Get around (vehicles) · Talk about nature & animals.**
These keep only ①. (Get around could earn an ② later if we mine travel sentences.)

### Unit page
Shows the two blocks as labelled groups — **① Words** then **② Apply** — with ②
unlocking after ① is done. A unit with no ② just shows Words.

---

## What changes in the engine
- Tag each lesson with `kind: "words" | "apply"`.
- The 4-part stepper picks its step list by kind: `WORDS_PARTS` (today's 4) vs
  `APPLY_PARTS` (production-focused, see below).
- `LearnView`/`LessonView` render the ①/② grouping and labels.
- No change to the SRS, unit reviews, or card ids.

## What changes in the content
- **Split mixed lessons.** Units that today cram words + phrases into one lesson
  (e.g. "The pronouns" = `ako…hira` *and* `Amerikano ako`) split into a Words
  lesson and an Apply lesson.
- **Add Apply lessons** to the theme units that lack them, from mined sentences.
- Pure-vocab units are untouched except the ① label.

---

## Worked example

### Before — "Say who's who" (today, one mixed lesson)
- _The pronouns:_ ako · ikaw / ka · hiya · kita · kami · kamo · hira · **Amerikano ako** · **Babaye ka** · **Makusog hiya**

### After — "Say who's who" (Words + Apply)
**① Words — "The pronouns":** ako · ikaw / ka · hiya · kita · kami · kamo · hira
**② Apply — "Saying who you are":** Amerikano ako (I am American) · Babaye ka (You are a woman) · Makusog hiya (He is strong) · _+ mined: Estudyante kami (We are students), Pilipino hira (They are Filipinos)_

### After — "God & worship" (was Words-only, now gets ②)
**① Words:** Diyos · Ginoo · Jesu Kristo · espiritu · simba · ampo · wali · bendisyon · gugma · kasingkasing
**② Apply — "Faith in sentences":** Nasimba kami (We worship) [PC] · Diyos-diyos (idol) [PC] · Ini nga uran, bendisyon ini han Ginoo (This rain is a blessing from the Lord) [CHED]

### After — "Name colors" (stays Words-only)
**① Words:** itom · busag · pula · asul · darag · berde   _(no ② — nothing to compose)_

---

## Decisions (locked 2026-06-23)

1. **② Apply drill = ONE step:** type the Waray from the English (Produce). No
   warm-up — the words were already learned in ①. A miss still triggers the
   existing remediation loop (MC→type help) so it's "type right away," not
   "no safety net." `APPLY_PARTS = [{ dir:"etw", mode:"type", label:"Produce" }]`.
2. **① Words drill = unchanged** full 4-step ladder.
3. **Unit review = phrases-only:** the graded review tests the ② Apply phrases
   (the real mastery bar); ① words are proven by finishing the Words lessons.
4. **Free navigation:** within a unit, lessons can be done in any order / skipped —
   relax the "previous lesson must be done" gate so you can jump around before the
   review.
5. **Words-only units** keep ① only (no review needed / a light ① recap at most).

## Retooled sample — what it'll look like

### "Say who's who" (split a mixed lesson)
**① Words — "The pronouns":** ako · ikaw / ka · hiya · kita · kami · kamo · hira
**② Apply — "Saying who you are"** _(type the Waray):_ Amerikano ako (I am American) · Babaye ka (You are a woman) · Makusog hiya (He is strong) · Estudyante kami (We are students) · Pilipino hira (They are Filipinos) — all from PC L1

### "Do it: now / will / did" (add Apply from the course)
**① Words — "Eat & go" / "Buy & drink":** (the verb forms, unchanged)
**② Apply — "Verbs in sentences"** _(type the Waray):_ Nakaon hiya (He's eating) · Matindog kita (We'll stand) · Nasimba kami (We're worshipping) · Mapalit hira hin isda ha merkado (They'll buy fish at the market) — all PC L5–6

### "God & worship" (was Words-only → now gets Apply)
**① Words:** Diyos · Ginoo · Jesu Kristo · espiritu · simba · ampo · wali · bendisyon · gugma · kasingkasing
**② Apply — "Faith in sentences"** _(type the Waray):_ Nasimba kami (We worship) [PC] · Diyos-diyos (idol) [PC] · Ini nga uran, bendisyon ini han Ginoo (This rain is a blessing from the Lord) [CHED 📖]

### "Name colors" (stays Words-only)
**① Words:** itom · busag · pula · asul · darag · berde   _(no ②, no review — nothing to compose)_

## Build order (once approved)
1. **Engine:** add `kind` to lessons; `APPLY_PARTS` (1 step); render ①/② groups;
   relax intra-unit lesson gating; make the unit review pull from ② only.
2. **Content:** split mixed lessons into Words/Apply; append mined phrase cards to
   the theme units that lack them (faith, cooking, travel, nature, …), each
   source-tagged; pure-vocab units untouched.
3. Regenerate `docs/frequency-curriculum-expanded.md` to show the full result.
