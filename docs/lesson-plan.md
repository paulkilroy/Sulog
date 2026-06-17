# Sulog — cohesive lesson plan (Duolingo-style path)

Goal: replace the "5 random words then a hard sentence" feel with a **scaffolded
path** where each lesson builds on the last (new word → immediately reused in a
phrase with words you already know), and you finish a lesson by *producing*, not
just recognizing.

## Lesson model — 4 parts (the difficulty ramp)
Each lesson has a small pool of items (mostly new + 1–2 carried over). Clear 4
parts in order; clearing all 4 earns the lesson's "crown" and unlocks the next:

1. **Recognize** — Waray → English, multiple choice
2. **Reverse** — English → Waray, multiple choice
3. **Recall** — Waray → English, typed
4. **Produce** — English → Waray, typed, no hints ← the finish line

Grading is **lenient** (decision): ignore case/punctuation, forgive ~1 typo
(Levenshtein), and for Waray answers accept o↔u and e↔i (Waray spelling treats
them as the same sound). Implemented in `checkAnswer(input, target, waray)`.

## Cumulative structure
- Units ordered: Survival → Pronouns → People → Describing → "X is Y"
  (composition) → Verbs → Time → Things & places → Weather → Questions →
  Invitations (theme). Composition lessons come *after* their building blocks.
- Composition cards reuse earlier vocab (`mahusay` → `Makusog hiya`;
  `baktas`+`buwas` → future-tense sentences).
- Interleaving: later lessons pull a couple of earlier items as MC distractors.
- SRS underneath: finishing lesson items still feeds the Leitner boxes; **Needs
  Work** + per-unit review are how you "come back to areas."

## UI / navigation (decision: path primary, keep Practice)
- **Learn path** = a vertical list of Units → lesson nodes, each showing parts
  done (0–4); locked until the previous lesson is complete; current one says
  "Continue."
- **Lesson screen** = a 4-part stepper; tap the next unfinished part to play it.
- **Review anywhere**: any completed lesson is replayable; Needs Work stays.
- **Home** keeps the dashboard (tide, streak, 14-day tracker) and gains a
  **Continue learning** CTA. The old deck/mode setup lives on as **Practice**.

## Build phases
1. **Engine + path + 4 parts + lenient checker**, over the *existing* cards
   regrouped into a first-cut curriculum (no new vocab). ← current
2. **Author glue + composition cards**: possessives, particles (hi/it/hin/ha/
   nga), question words, before/after, numbers, days, and word→phrase builders.
3. **Polish**: crowns/decay, "practice weak spots," test-out to skip ahead, and
   sync lesson progress to the gist.

## Data shapes
- `CURRICULUM`: `[{ id, name, hint, lessons: [{ id, title, items: [waray…] }] }]`
  (items reference existing cards by their Waray text).
- `LESSON_PARTS`: the 4 `{ dir, mode, label }` steps above.
- Progress: `waray:lessons` → `{ [lessonId]: partsCompleted 0–4 }`.
