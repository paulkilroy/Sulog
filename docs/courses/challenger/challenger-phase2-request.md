# Challenger course — generate Phase 2 (for Gemini)

You previously designed a Duolingo-style **Waray (Winaray)** course for an app called Sulog,
for **older English-speaking US adults relocating to Daram, Samar** (true beginners; practical
adult daily life; clear, gentle, confidence-building; warm and respectful). You produced the
full course map and detailed Phase 1. **Now produce the full detail for Phase 2.**

Keep the same `course` identity, the same standard-Waray-Samar-leaning dialect, the same gentle
pacing (~6–10 new words per unit, a couple of "words" lessons then practice), and the same JSON
output shape. Output **only** JSON.

## Phase 2 to detail — "Daily Life in the Neighborhood"
From your course map (fill these in full):
- **u6** Meeting the In-Laws — *Introduce yourself respectfully to extended family.*
- **u7** Everyday Objects in the Yard — *Ask for common household items outside or in the kitchen.*
- **u8** Where are You Going? (Kain ka?) — *Answer the common neighborhood passing greeting.*
- **u9** Talking About the Weather — *Comment on heat, rain, and wind.*
- **u10** Time of Day and Simple Tasks — *Coordinate basic daily times for chores or meetings.*
- **u11** Phase 2 Review & Celebration — *Combine early neighborhood conversations smoothly.*
  (For the review unit, recycle Phase 1 + Phase 2 words; introduce few or no new ones.)

## Already taught in Phase 1 — RECYCLE these, don't re-introduce them
greetings & identity: maupay, aga, kulop, gab-i, kamusta, ako, ikaw, hi
yes/no & locating: oo, diri, hain, aadi, aada, didto, hiya, dadi
home & family: balay, asawa, anak, nanay, tatay, akon, an, Balite
food & drink: gusto, tubig, kape, alayon, kaon, inom, kan-on, hin
counting & buying: usa, duha, tulo, pira, tagpira, palit, mapalit, pesos
Lean on these in Phase 2 sentences and stories so the learner keeps seeing them.

## One important refinement (since Phase 1)
The app drills **each `new_vocab` entry as its own flashcard** (Waray ⇄ English). So:
- Put **only translatable content words** in `new_vocab` — nouns, verbs, adjectives,
  question words, numbers. Each needs a real one- or two-word English `gloss`.
- Do **NOT** put bare grammatical **markers/particles** (like hi, an/in, hin, nga, ngan, ha,
  han) in `new_vocab` — a flashcard can't teach "the noun marker." Instead, **introduce those
  naturally inside your grammar `examples` and your story sentences**, where they have meaning
  in context. Explain them in `new_grammar.explain_en` if needed, but keep them out of `new_vocab`.

## Other rules (unchanged)
- Difficulty 1–5 per word (beginner units stay 1–2; avoid literary/"deep" Waray).
- `register`: spoken / school / literary. `samar_variant`: the Daram form if it differs (best guess ok).
- Spelling consistent between `new_vocab` and stories; lowercase lemmas; keep hyphens; use `ng`.
- Short, warm, real-life sentences. Stories use mostly already-taught words.

## JSON schema (same as before — return ONLY this object)
```json
{
  "phase_id": "p2",
  "detailed_units": [
    {
      "unit_id": "u6", "phase_id": "p2", "title": "", "theme": "", "cefr": "A1", "difficulty": 1,
      "can_do": "I can …",
      "new_grammar": [ { "point": "", "explain_en": "", "examples": [ { "war": "", "en": "" } ] } ],
      "new_vocab": [ { "lemma": "", "pos": "", "gloss": "", "difficulty": 1, "register": "spoken", "samar_variant": "", "note": "" } ],
      "lessons": [ { "lesson_id": "u6l1", "title": "", "type": "words", "teaches": ["lemma1","lemma2"], "grammar_focus": "" } ],
      "story": {
        "story_id": "u6s1", "title": "", "title_en": "",
        "sentences": [ { "war": "", "en": "" } ],
        "questions": [ { "q": "", "choices": ["","",""], "answer_index": 0 } ]
      }
    }
  ]
}
```

## Delivery
- Output only the JSON object (the `detailed_units` array for Phase 2, units u6–u11).
- If it's too long for one message, stop at a unit boundary and end with `"_continued": true`
  inside the JSON; we'll say "continue" and you resume with the next unit, same schema.
- We'll request Phase 3 the same way afterward.
