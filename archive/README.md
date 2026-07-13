# Archive — retired content (2026-07-13)

Per Paul: the Peace Corps course is the ONLY live course; Tramp is the only
dictionary authority besides it.

- `bundled-courses/` — the original bundled JS courses (Frequency, Classic,
  Challenger, Challenger 2) built from Preply-era cards and the Gemini
  Challenger experiments. Saved progress for them remains in localStorage /
  Supabase under their course ids, unreachable but intact.
- `gen-seed.mjs` + `seed.sql` — the generator and seed for the retired DB
  content: the 'waray' (CH2) course tree, the word-bank dictionary, DB stories.
- `word-bank-dictionary.json` — snapshot of the dictionary/meanings rows that
  were removed from the live DB (everything not referenced by the PC course).

To resurrect any of it: the files are complete; re-import and re-load.
