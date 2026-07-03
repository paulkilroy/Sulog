# CEFR-aligned curriculum blueprint (parked reference)

**Status:** parked idea, NOT built. Source: a Gemini response, saved 2026-06-22.

**Why saved / intent:** Paul likes Sulog's current *methodology* — the
sections → units → 4-part lessons structure, the SRS, the scaffolding. What he
wants to potentially retool is the **word/phrase lists themselves**: re-derive
them from a **frequency-first**, CEFR-style "can-do" progression rather than the
current source-driven lists (Peace Corps course + dictionary). This doc is the
candidate blueprint to come back to if/when we rebuild the curriculum content.

Keep the lesson/unit engine; swap the *content selection strategy*.

---

## 1. Chronological content roadmap

Teach high-utility communication first (not grammar tables or the whole
alphabet). Mimics modern apps: speak on day one.

### Phase 1 — Immediate Survival (CEFR A1.1)
- **Goal:** speak on day one.
- **Content:** essential greetings; yes / no / please / thank you; asking for
  the bathroom; basic numbers (1–10); identifying immediate family.
- **Grammar:** present tense of the most critical auxiliaries ("to be", "to
  have", "to want"), only in 1st-person ("I want") and 2nd-person ("Do you
  have?") forms.

### Phase 2 — Everyday Environments (CEFR A1.2)
- **Goal:** navigate basic physical spaces.
- **Content:** food & ordering at a restaurant; telling time; basic colors;
  directions (left, right, straight); common objects (phone, keys, money).
- **Grammar:** subject pronouns (I, you, he, she, we, they); basic plurals;
  standard word order (Subject–Verb–Object).

### Phase 3 — Routine and Self (CEFR A2.1)
- **Goal:** describe daily life and personal background.
- **Content:** weather; clothing; hobbies; professions; days of the week.
- **Grammar:** standard present-tense conjugations; possessive adjectives (my,
  your, their); basic descriptive-adjective placement.

### Phase 4 — Expanding Time (CEFR A2.2)
- **Goal:** talk about things not happening right now.
- **Content:** travel arrangements; health / illness symptoms; shopping;
  emotional states.
- **Grammar:** one simple past tense (preterite or perfect) and a basic future
  construction ("going to" + verb).

---

## 2. Core curriculum design strategy

Four foundational rules to bake into the core algorithm:

| Rule | Implementation method | Purpose |
|---|---|---|
| **Frequency First** | Pull from a linguistic frequency dictionary of the target language. Teach the top 100 most common words first. | Maximizes reading comprehension instantly. |
| **Implicit Grammar** | Introduce patterns via color-coding or word-chunk puzzles, not raw conjugation charts. | Keeps it gamified and low-friction. |
| **The i + 1 Principle** | Every new sentence contains exactly one unknown word, surrounded by already-mastered words. | Lets users guess the new word from context. |
| **Spaced Repetition (SRS)** | Re-test learned words at expanding intervals (e.g. 1, 3, 7, 14 days). | Moves vocabulary into long-term memory. |

---

## 3. Handling unfamiliar writing systems

For non-Latin scripts (Cyrillic, Arabic, Devanagari): don't create a massive
alphabet bottleneck up front. Interleave the script gradually — teach 3–5
characters alongside words that use only those characters. Or use phonetic
transliteration (Romanization) for the first ~3 units to build conversational
confidence, then transition to native script.

*(N.B. Waray uses the Latin alphabet, so this section is largely moot for Sulog —
kept for completeness.)*

---

## Offered follow-ups (from the source, not yet done)
- Prototype syllabus outline for Unit 1.
- How to build a simple SRS algorithm. *(Sulog already has Leitner SRS.)*
- Advice on structuring translations for under-resourced languages.

---

## Notes for a future Sulog rebuild
- **Frequency-first is the big change.** Sulog's lists are currently
  source-driven (Peace Corps + dictionary). A real Waray frequency list would
  re-rank what gets taught first. Open question: is there a usable Waray
  frequency corpus? (See the PLD corpus noted in `waray-speech-to-text` memory —
  it's audio, but the broader Philippine-language corpora repos might yield
  frequency data.)
- **i + 1 sentence construction** would change how phrase cards are written:
  each phrase should introduce exactly one new word over the prior lesson.
- **Can-do milestones** (CEFR's genuinely useful part) map onto Sulog's unit
  headers: "after this you can ___". Borrow these; skip the A1/A2 *labels* (no
  Waray exam to validate them against).
- Keep: the sections → units → 4-part lesson engine, the remediation loop, the
  graded unit review, the SRS. Retool: the actual vocab/phrase selection.
