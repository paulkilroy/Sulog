# Design a Waray course from scratch — "Challenger" course (for ChatGPT)

You are an expert teacher of **Waray-Waray (Winaray)** and a curriculum designer. Design a
complete **Duolingo-style beginner-to-intermediate Waray course** for a language app.

**Start completely fresh.** Use your *own* knowledge of Waray, your *own* sense of what's
common and useful, and generate your *own* example sentences and stories. Don't assume any
existing word list, frequency data, or prior course — this is a clean-slate design that you
own end to end. Be creative, and **embrace basic, everyday, spoken Waray** — the language a
real person actually uses day to day.

The only thing fixed is the **output format** (the JSON schema below), because a program will
read your design and turn it into the app.

## The learner
An **older English-speaking US citizen** (think 50s–70s, often retiring to or building a life
in the Philippines) learning Waray to **live in Daram, Samar**. A true beginner. Design for
this audience specifically:
- **Practical, real adult life** — family and in-laws, the home, the market, money, health
  and the clinic, church, neighbors, getting around town. Not school-kid or teen content.
- **Clear and respectful, not childish or fast.** Explain grammar plainly in English, in
  small steps, with plenty of review. Assume no prior language-learning background and no
  familiarity with linguistic jargon.
- **Confidence-building.** Short wins, lots of recycling of earlier words, gentle pace. The
  goal is real usable phrases for daily life, not gamified pressure.
- Warm and encouraging in tone — these are adults who want to connect with family and
  community in their new home.

## Model it on Duolingo
Borrow what makes Duolingo work, adapted for Waray:
- **Bite-sized lessons** grouped into **units**, units grouped into **sections/phases**, with
  a clear thematic arc (greetings → family → food → market → directions → …).
- Each unit has a concrete **"I can…" goal** and teaches a small, focused set of new words +
  one or two grammar ideas.
- **Lots of reuse / spiral review** — later units recycle earlier vocabulary.
- A short **story** per unit that a learner can read using what they've learned so far
  (comprehensible input). This is *your* design responsibility — write the story to fit the
  level, don't reach for words far beyond what the unit has taught.
- Keep it **fun, warm, and practical**, with real-life situations.

*(If you have specific Duolingo course-structure references you'd like to follow, apply them —
but feel free to improve on them for Waray.)*

## How the course is structured (so you know what you're filling)

The app is a stack of nested blocks. Top to bottom:

**1. Section / Phase** — a big thematic milestone (e.g. "First Words", "Around Town",
"Family & Home"). Groups ~4–8 units and represents a level jump. Ends with a larger
**checkpoint review** covering its units.

**2. Unit** — one focused theme with a single concrete **"I can…" goal** (e.g. "Greet people
and say my name"). A unit is the main unit of progress. Inside a unit, in this order:
   - **a few teaching lessons** that introduce and drill the unit's new words + 1–2 grammar
     points (`type: "words"`),
   - then **an apply lesson** that combines those words into phrases/short dialogues with no
     brand-new vocabulary (`type: "apply"`),
   - then **the unit's story** (read it using what's been learned so far),
   - then **a unit review** (see "How review works").

**3. Lesson** — the bite-sized block a learner completes in one short sitting (~3–5 min for
this audience). It holds a handful of items (aim ~5–8). You author lessons via the `lessons`
array; the app expands each taught word into exercises automatically (see next).

**4. Exercise / card** — the atomic practice item. The app turns **each taught word** into a
short ladder of exercises by itself: first **recognize** it (Waray → English), then **recall**
it (English → Waray, with help, then cold). This is why every `new_vocab` item needs a clean
`gloss` — that one entry becomes several exercises. The apply lessons and the story then put
those words into context. *You don't write individual exercises — you supply the words (with
glosses) and the sentences; the app builds the drills.*

## How stories work
- **One story per unit**, placed **after** the unit's teaching lessons, so the learner meets
  it already knowing (most of) its words — reading as a confidence-building payoff.
- Keep it **short and connected** (a few sentences early on), built from this unit's and
  earlier units' vocabulary. Provide an English translation per sentence and 2–3 multiple-
  choice comprehension questions.
- Stories are also **spiral review in disguise**: they re-expose earlier words in fresh
  context. Lean into recycling old vocabulary, not just the newest words.

## How review works (you mostly don't author this — but design *for* it)
- **Unit review:** the app auto-generates a review at the end of each unit from that unit's
  taught words, in **recall ("produce") mode** — so the learner proves they can summon the
  words, not just recognize them. You don't write it; just **keep a unit's new words to a
  reviewable size** (see pacing) so the checkpoint is meaningful.
- **Spaced / spiral review:** the app also resurfaces individual weak words over time on its
  own. Help it by **recycling earlier vocabulary** in later units' apply lessons and stories.
- **Section checkpoint:** a larger mixed review at the end of each phase. Again auto-built from
  the phase's words — your job is just sensible unit sizing and ordering.

## Pacing (tuned for older adult beginners)
- **Unit:** ~6–10 new words + 1–2 grammar points. Smaller is better early.
- **Lessons per unit:** ~3–5 (a couple of "words" lessons, then one "apply").
- **Items per lesson:** ~5–8.
- **Phase:** ~4–8 units. Recycle earlier words heavily; favor a gentle, confident climb.

## Helpful metadata to include (for the app)
- **Difficulty 1–5** per word/unit: 1 = core survival vocab (nanay, tubig, kaon); 2 = common
  everyday; 3 = school/civic; 4 = literary/uncommon; 5 = rare/archaic. Keep beginner units in
  1–2; avoid literary/"deep" Waray early.
- **Register** per word: spoken / school / literary.
- **Samar variant** (optional): where a Samar/Daram speaker would naturally say something
  different from the general/standard form, note it. (Best guess is fine.)

## Spelling
Be internally consistent: lowercase lemmas, keep hyphens (`may-ada`), use `ng` (not `ñg`), and
spell a word the same way in `new_vocab` and in the stories.

## What to deliver (two parts, in ONE JSON object)
1. `course_map` — the **entire course arc**, compact: every phase and unit with id, title,
   level, and a one-line can-do (aim for a full A0→B1 journey, ~6–10 phases / ~30–50 units).
2. `detailed_units` — the **full detail for Phase 1 only**, following the unit schema below
   (grammar, vocab, lessons, one story with questions). We'll ask for later phases afterward.

## JSON schema

```json
{
  "course": {
    "id": "challenger",
    "name": "string",
    "description": "string (1–2 sentences)",
    "dialect_base": "standard Waray, Samar-leaning",
    "level_range": "A0–B1",
    "total_phases": 0,
    "total_units": 0,
    "design_notes": "string (how you ordered things, your approach)"
  },

  "course_map": [
    {
      "phase_id": "p1",
      "phase_title": "string",
      "phase_goal": "string (one line)",
      "units": [
        { "unit_id": "u1", "title": "string", "cefr": "A0", "difficulty": 1,
          "can_do": "one-line 'I can…' goal" }
      ]
    }
  ],

  "detailed_units": [
    {
      "unit_id": "u1",
      "phase_id": "p1",
      "title": "string",
      "theme": "string",
      "cefr": "A0",
      "difficulty": 1,
      "can_do": "I can …",

      "new_grammar": [
        { "point": "short name, e.g. 'present actor focus (nag-)'",
          "explain_en": "1–3 sentence English explanation",
          "examples": [ { "war": "Nagkaon hira.", "en": "They ate." } ] }
      ],

      "new_vocab": [
        { "lemma": "nanay", "pos": "noun", "gloss": "mother",
          "difficulty": 1, "register": "spoken",
          "samar_variant": "", "note": "" }
      ],

      "lessons": [
        { "lesson_id": "u1l1", "title": "string",
          "type": "words",            /* "words" = teach new vocab; "apply" = practice/review */
          "teaches": ["nanay","tatay"],   /* lemmas this lesson focuses on */
          "grammar_focus": "optional short string" }
      ],

      "story": {
        "story_id": "u1s1",
        "title": "string (Waray)",
        "title_en": "string (English)",
        "sentences": [
          { "war": "Hi Ana in bata.", "en": "Ana is a child." }
        ],
        "questions": [
          { "q": "English comprehension question",
            "choices": ["A", "B", "C"], "answer_index": 0 }
        ]
      }
    }
  ]
}
```

## Worked mini-example (format only — your real Unit 1 should be fuller)
> Hi Ana in bata. Aada hiya ha balay. Aadi hi Nanay ngan hi Tatay. Nagkaon hira. Uminom hira hin tubig.

Short, warm, everyday — built from words a Unit-1 learner would know.

## Delivery rules
- Output **only** the JSON object, nothing before or after.
- Fill `total_phases`/`total_units` to match `course_map`.
- If Phase 1 detail is too long for one message, stop at a unit boundary and end with
  `"_continued": true` inside the JSON; we'll say "continue" and you resume in the same schema.
- Short sentences early; let stories grow as the course progresses.
