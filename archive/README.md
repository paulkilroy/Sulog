# Archive — retired content (2026-07-13)

Per Paul: the Peace Corps course is the ONLY live course; Tramp is the only
dictionary authority besides it.

- `bundled-courses/` — the original bundled JS courses (Frequency, Classic,
  Challenger, Challenger 2) built from Preply-era cards and the Gemini
  Challenger experiments. Saved progress for them remains in localStorage /
  Supabase under their course ids, unreachable but intact.
- `gen-seed.mjs` + `seed.sql` — the generator and seed for the retired DB
  content: the 'waray' (CH2) course tree, the word-bank dictionary, DB stories.
- `word-bank-dictionary.json` — the dictionary/meanings rows still deleted from
  the live DB. The teardown first removed everything not referenced by a PC
  lesson (283 rows), but "PC/Tramp only" means Tramp-backed words BELONG in the
  lexicon — so the same day, 183 Tramp-confirmed + 23 Tramp-headword words were
  restored. What remains here (77 rows) has no Tramp backing at all: cased
  phrase cards ("Pwede mo ako buligan?"), non-Tramp loan months, unverified
  course glosses.

To resurrect any of it: the files are complete; re-import and re-load.
