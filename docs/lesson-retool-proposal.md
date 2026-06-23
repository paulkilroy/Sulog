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

## The one decision I need: the Apply drill (② step list)

You said "go right into English → Waray" but weren't sure of the exact shape.
Three options for what the Apply stepper does (Words ① always stays the full 4):

- **A · Production-only (2 steps):** Build (E→W pick) → Produce (E→W type).
  Fastest; pure output. Assumes ① already gave you comprehension.
- **B · Understand-then-produce (2 steps):** Understand (W→E pick) → Produce (E→W type).
  One comprehension check (the *phrase* is new even if the words aren't), then output.
- **C · Fuller (3 steps):** Understand (W→E pick) → Build (E→W pick) → Produce (E→W type).
  Most scaffolding; closest to the Words ladder.

My lean: **B** — a single "do you get the whole sentence" check, then straight to
typing it in Waray. Light, but doesn't throw you at production cold.

## Other open questions
- **Cap:** ~4–6 sentence cards per Apply lesson, one Apply lesson per theme unit?
- **Unit review:** keep graded review at the unit level (covers both ① and ②), or
  only test ② phrases in the review since ① is the easier half?
