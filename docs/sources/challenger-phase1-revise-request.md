# Revise & expand Phase 1 — "Challenger / Daram" Waray course (build on your own design)

You previously designed a Duolingo-style **Waray-Waray (Winaray)** course — "Challenger /
Daram" — for the Sulog app. You produced a full course map, a detailed **Phase 1**, and later a
detailed **Phase 2**. **This is a revision of your own Phase 1 — build on it, don't start over.**

## Why we're revising
Your Phase 1 leans heavily on **nouns** and doesn't yet give the learner the high-frequency
**function vocabulary** needed to build simple sentences. Expand it so that by the end of Phase 1
a beginner can actually **say and understand basic everyday sentences**, not just name things.

## Continuity constraint (important)
Your **Phase 2 recycles Phase 1's words**, so **keep teaching all of the current Phase 1
vocabulary listed below.** You may **re-sequence and re-group** it and add new units around it,
but **don't drop** words later phases depend on. You own the additions, the grouping, and the order.

### Your current Phase 1 — build on this
- **Unit 1 — Greetings & Your Name:** maupay (good), aga (morning), kulop (afternoon),
  gab-i (evening/night), ako (I), ikaw (you), kamusta (how are you / hello)
- **Unit 2 — Finding People & Yes/No:** oo (yes), diri (no/not), hain (where), hiya (he/she),
  aadi (here), aada (there), didto (over there), dadi (come here)
- **Unit 3 — Your House & Family:** asawa (spouse), anak (child), nanay (mother), tatay (father),
  balay (house/home), akon (my/mine), Balite (a village in Daram)
- **Unit 4 — Food & Drink:** gusto (want/like), tubig (water), kape (coffee), alayon (please/kindly),
  kaon (eat), inom (drink), kan-on (cooked rice)
- **Unit 5 — Counting & Buying:** usa (one), duha (two), tulo (three), pira (how many),
  tagpira (how much each), palit (buy), mapalit (will buy), pesos (pesos)

## What to ADD (stated as categories on purpose — you choose the actual Daram/Samar words & forms)
- **Fuller everyday pronoun coverage** — enough of the spoken pronoun system that a beginner can
  say and understand simple "I / you / we / they + want / go / like" sentences. Spread pronouns
  across several small lessons and **partner them** so each lesson is immediately usable, not
  memorized in isolation.
- **Basic time expressions** — times of day and everyday "when" deixis, whatever is most natural
  and frequent in Daram.
- **Core response & politeness words** — the yes/no/answer/please words, **co-located with the
  questions they answer**, so a unit can hold a small back-and-forth exchange.

## The learner
An **older English-speaking US citizen** (50s–70s, often retiring to or building a life in the
Philippines) learning Waray to **live in Daram, Samar**. A true beginner. Design for them:
practical real adult life (family & in-laws, the home, the market, money, health, church,
neighbors, getting around); clear and respectful, not childish or fast; explain grammar plainly
in small steps with plenty of review; confidence-building, short wins, gentle pace; warm tone.

## How a unit is built (fill these, in this order)
For each unit: a concrete **"I can…" goal**, then
1. **a few `type:"words"` lessons** introducing the unit's new words + 1–2 grammar points,
2. **one or more `type:"apply"` phrase lessons** that combine the unit's words into short real
   sentences/dialogues with **no brand-new vocabulary** — this is where grammatical glue (noun
   markers, pronoun enclitics, linkers) lives in context,
3. **the unit's story** (read it using what's been learned so far), then
4. *(the app auto-builds the **unit review** from the unit's words in **type-to-produce** mode —
   you don't write it; just keep a unit's new words to a reviewable size).*

The app turns **each taught word** into a ladder of drills (recognize → recall → produce), which
is why every word needs a clean gloss. You supply words + phrases + the story; the app builds drills.

## How stories work
One short, connected story per unit, **after** its teaching lessons, built from this unit's and
earlier units' words (spiral review). English per sentence + 2–3 multiple-choice questions.

## Pacing (tuned for older beginners)
- **Phase 1 total:** ~6–7 units, ~55–65 new content words.
- **Per "words" lesson:** ~3–5 new content words (smaller is better early).
- **Per unit:** ~6–10 new words + 1–2 grammar points, a couple of "words" lessons then an "apply".

## New requirements since your first design (apply these)
1. **Markers are NOT vocabulary.** Put only translatable content words in `new_vocab` — nouns,
   verbs, adjectives, question words, numbers, **and pronouns** (pronouns translate, so they
   belong). Do **NOT** put bare grammatical markers/particles (an/in, hi, hin, nga, ngan, ha, han)
   in `new_vocab` — a flashcard can't teach "the noun marker." Introduce them inside grammar
   examples, the apply phrases, and the story.
2. **Per-word example (required).** For **every** `new_vocab` entry include a short `example` —
   the word used in a natural 2–4 word mini-phrase — so the flashcard can show the word in context
   instead of a bare gloss. This matters most for pronouns/function words. Provide `example.war`
   (the phrase), `example.focus` (the exact token in that phrase that *is* this word, for
   highlighting), and `example.en` (a natural English reading of the whole phrase that makes the
   word's meaning clear). Use already-taught or same-unit words in the phrase.
3. **Confidence flag.** Mark any word whose Daram/Samar form you're unsure about with
   `"confirm": true` so a native speaker can check it.

## Metadata & spelling
Difficulty 1–5 (beginners stay 1–2; avoid literary/"deep" Waray). `register`: spoken/school/
literary. `samar_variant`: the Daram form if it differs (best guess fine). Lowercase lemmas,
keep hyphens (`may-ada`), use `ng` (not `ñg`), spell a word the same way in `new_vocab` and stories.

## Deliver
Output **only** the JSON object — the `detailed_units` array for the revised **Phase 1** (phase_id
`p1`). If too long for one message, stop at a unit boundary and end with `"_continued": true`
inside the JSON; we'll say "continue" and you resume in the same schema.

```json
{
  "phase_id": "p1",
  "detailed_units": [
    {
      "unit_id": "u1", "phase_id": "p1", "title": "", "theme": "", "cefr": "A0",
      "difficulty": 1, "can_do": "I can …",
      "new_grammar": [ { "point": "", "explain_en": "", "examples": [ { "war": "", "en": "" } ] } ],
      "new_vocab": [
        { "lemma": "", "pos": "", "gloss": "",
          "example": { "war": "", "focus": "", "en": "" },
          "difficulty": 1, "register": "spoken", "samar_variant": "", "confirm": false, "note": "" }
      ],
      "lessons": [
        { "lesson_id": "u1l1", "title": "", "type": "words", "teaches": ["lemma1","lemma2"], "grammar_focus": "" },
        { "lesson_id": "u1l3", "title": "", "type": "apply", "phrases": [ { "war": "", "en": "" } ] }
      ],
      "story": {
        "story_id": "u1s1", "title": "", "title_en": "",
        "sentences": [ { "war": "", "en": "" } ],
        "questions": [ { "q": "", "choices": ["","",""], "answer_index": 0 } ]
      }
    }
  ]
}
```
