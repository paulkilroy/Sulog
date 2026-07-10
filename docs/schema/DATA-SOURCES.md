# Data model — sources of truth & how we load

One relational schema (`schema.sql`) holds any number of Waray courses. It runs live in Supabase
(Postgres). This doc is the map of **where every piece of data comes from** and **how it gets loaded**,
so "why is this word here?" always has an answer.

## The load pipeline

```
  SOURCE MATERIAL                 GENERATOR                    SQL                LIVE DB
  ───────────────                 ─────────                    ───                ───────
  challenger2/phase*.json    →    tools/gen-seed.mjs       →   seed.sql       ┐
  docs/dictionary/phrases.json                                                │
  docs/word-bank/phrase-idioms.json                                          ├→ Supabase
  docs/sources/peace-corps/pc-blocks.json  →    tools/gen-pc-seed.mjs    →   pc-seed.sql    ┘   (via psql /
  (Gemini extraction of the PC PDF)                                              reload-pc.mjs)
```

Load order: `schema.sql` → `seed.sql` (CH2) → `pc-seed.sql` (Peace Corps) → `rls.sql`.
Then the maintenance passes below (`dedup-dictionary.mjs`, `build-meanings.mjs`).

## Sources of truth, by data type

- **Course content** (lessons → blocks → drills): the per-course source JSON, generated into `*.sql`.
  CH2 (the "Frequency"/Challenger2 course) from `challenger2/phase*.json`; Peace Corps from
  `pc-blocks.json` (a Gemini extraction of the scanned PDF; the PDF is the ultimate authority).

- **The dictionary is a LEXICON, not a word-list of the lessons.** It's the *union* of every word
  that has appeared across all source materials — challenger2 phases, the survival phrases, the
  mined idioms, PC vocab, and historically the original `cards.js` flashcard deck and `classic.js`.
  Lessons reference a **subset** of it via `block_items`. **A word with no `block_items` referencing
  it ("unused") is a real lexicon entry that no current lesson happens to drill** — e.g. a story
  gloss, a deck word, or a spelling variant. It is *not* junk. (Genuine cruft — duplicate spellings,
  stale rows — is removed by the dedup pass below.)

- **Verification authority: `docs/sources/dictionaries/tramp.json`** — the Tramp-Zorc Waray-English
  dictionary (1991), re-OCR'd with Apple Vision (`tools/pdf-ocr-range.swift` + `parse-tramp-vision.mjs`):
  ~27k senses, 25k headwords, stress accents preserved. It is used **only to verify and enrich**, never
  to overwrite. **Our course words and meanings are the source of truth** — see the reconciliation policy.

- **Pronunciation stress**: the accents live in `dictionary.variants[]` and `scratchpad/accent-map.json`
  (stripped off headwords during dedup) and, authoritatively, in Tramp's accented headwords.

## Canonical headwords

Every dictionary headword (the `waray` primary key = the card id) is **lowercase, accent-free,
punctuation-free** — because Waray isn't typed with accents and stress belongs in the pronunciation
guide. Enforced by `canon()` in `gen-pc-seed.mjs`; existing data normalized by `tools/dedup-dictionary.mjs`
(which also merges case/accent twins like `tatay`/`Tátay`, folds dialect variants, re-points every FK,
and exports `accent-map.json`).

## Reconciliation policy (course ↔ Tramp)

`tools/build-meanings.mjs` cross-checks each course word against Tramp with a 3-tier matcher
(direct → affix-root → reverse-gloss) and sorts the result:

| outcome | meaning | action |
|---|---|---|
| **agree** | word found, gloss overlaps | confirm our meaning (no review) |
| **variant** | found under a different spelling | keep OUR spelling, store theirs in `variants[]` |
| **diverge** | found, gloss differs | **keep ours** (usually near-synonyms); flag outliers for Ella |
| **native-alt** | a different Waray word means the same | **keep ours**; note theirs for later |
| **gap** | not in Tramp | review (usually a loan / proper name) |

**We take the course's words and their definitions ("the black words").** Tramp confirms them, cleans
spelling, and supplies stress — it never replaces what we teach.

## Known history (why stale rows exist)

`seed.sql` is a *committed snapshot*. When the seed generator's inputs changed (e.g. it used to read
`cards.js`; it now reads `challenger2/phase*.json`), old words captured in `seed.sql` — like `buoton`,
an o/a spelling of `buotan` from the original deck — remained in the DB. These are legitimate vetted
words, just not drilled by any current lesson. Regenerating `seed.sql` from current sources, or the
dedup pass, cleans them over time.
