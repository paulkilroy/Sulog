# Sulog — Waray review

A personal, Duolingo-style app for learning Waray-Waray, built for relocating to Daram, Samar.
One self-contained page (`index.html`), backed by Supabase for course content and cross-device
progress sync.

**Live:** https://sulog-two.vercel.app/ (the old GitHub Pages URL redirects here)
**Course-vs-book review:** https://sulog-two.vercel.app/verify/

## Features
- One course: Peace Corps Waray, database-driven (the original bundled courses live in `archive/`)
- Waray↔English drills: multiple choice, type, listen, speak; block-aware lessons for the
  grammar-spine (Peace Corps) course — teach → learn words → drill → graded exit test
- Spaced repetition (Leitner) + a "Needs work" queue (with manual dismiss)
- Per-user progress sync to Supabase (Google sign-in); server-side stale-write guards
- Cross-course CEFR-ish proficiency estimate (the rising tide on the home card)
- Reader (Bloom stories), pronunciation guides, browser speech recognition (Filipino locale)

## Commands

| Command | What it does |
|---|---|
| `npm run all` | The full pipeline: seed → reload DB → regen verify site → build app |
| `npm run seed` | Regenerate `docs/schema/pc-seed.sql` from the Gemini extraction |
| `npm run reload` | Load the seed into the live DB (guarded), bump the course version, regen `/verify` |
| `npm run preview` | Regenerate the `/verify` site from the live DB |
| `npm run build` | Build the app: `src/sulog.jsx` → `index.html` |

DB tools read `SUPABASE_DB_URL` from gitignored **`.env.local`** (see `.env.example`).
**Never commit credentials.** After `npm run all`, commit + push — Vercel deploys `main`.

New here? Read **HANDOFF.md** — golden rules, architecture map, pitfalls, backlog.

## The Peace Corps pipeline, step by step

Everything below is rebuildable from the committed sources. The ONE non-mechanical step is the
Gemini extraction (same prompt ≠ same output), which is why its result is committed as
source-of-truth.

```
 docs/sources/peace-corps/peace-corps-waray-lessons.pdf        ← ROOT SOURCE (114 pages, committed)
   │
   ├─ 1. tools/pdf-render.swift ──────→ pages/page_N.png       (derived; gitignored)
   │      Renders each PDF page to a 2× PNG via PDFKit.
   │      `swift tools/pdf-render.swift <pdf> <from> <to> docs/sources/peace-corps/pages`
   │
   ├─ 2. tools/ocr-boxes.swift ───────→ ocr-boxes/ocr-pN.json  (committed, 114 files)
   │      Apple Vision OCR per page, keeping LINE GEOMETRY (text + normalized bounding box).
   │      Powers the /verify overlay carving. Accents preserved; no language correction.
   │
   ├─ 3. tools/pdf-ocr-range.swift ───→ peace-corps-full-ocr.txt  (committed)
   │      Same Vision OCR but rendered in memory, flattened to text with ===PAGE N=== markers.
   │      Powers the verbatim source-check and the lesson↔page mapping.
   │
   └─ 4. Gemini extraction ───────────→ pc-blocks.json         (committed — NOT re-derivable)
          The scanned pages were fed to Gemini (tools/pc-extract.mjs) which returned each
          lesson as typed blocks: grammar / note / examples / oral_exercise / written_exercise /
          vocab. This output contains occasional hallucinations — the later stages defend
          against them; never trust it over the OCR.

 5. tools/gen-pc-seed.mjs  (pc-blocks.json → docs/schema/pc-seed.sql)
      Deterministic generator. What it does beyond transcription:
      • splits paradigm lessons into a/b (chart+recognition vs vocab+production)
      • routes drills by WHAT VARIES: paradigm-varying → recognition MC; vocab-varying oral
        exercises are DROPPED (teacher-led); written exercises → typed production, both ways
      • harvests each lesson's exam: the book prints it as the "Review" OPENING the next
        lesson; it becomes the prior lesson's assessment gate (Review-Test lessons and the
        final lesson gate their own written test)
      • repairExpr(): fixes extraction defects at one funnel — swapped English/Waray fields,
        "1." exercise numbering, "[or]" answer-key alternates, Q&A dialog rows, OCR typos
      • FABRICATED set: rejects known Gemini inventions ("Madig-on hiya", the "hin duró"
        scrambles) — add to it as new ones are confirmed against the OCR
      • proximity guard: an exam may only test CONTENT words taught by that lesson
      • MARKER_GLOSS: canonical learner-facing glosses for the closed marker/pronoun sets

 6. tools/reload-pc.mjs  (pc-seed.sql → live Supabase)
      One transaction: delete the old pc-* rows, load the fresh seed, purge stale PC-only
      dictionary rows (scoped so it can never touch the shared word bank / other courses),
      bump courses.version — every connected app auto-refetches its cached course.
      Guards: refuses a wrong DB (project-ref check), a truncated seed, or a seed with fewer
      lessons than live (--force to override). Then runs, in order: step 7 (preview),
      confirm-from-book (auto-confirm against the book's print), gen-confirm-candidates
      (bake cited options for the remaining queue into the bundle), rls-smoke.

 7. tools/gen-course-preview.mjs  (live DB + OCR + scans → docs/preview/verify/)
      The review site: one page per lesson + index, committed and served at /verify/.
      • LEFT: the scans with PROVENANCE OVERLAYS — pages are carved into sections at the
        book's printed headings (plus every DB grammar-block title, fuzzy-matched to survive
        OCR garble). Each box is color-linked to the course block it became; grey = oral
        exercises deliberately not ingested; exam boxes are attributed to the right lesson
        ("L4 exam (prev)" vs "L5 exam"). Click a box/block/legend row to filter; panes
        scroll independently.
      • RIGHT: the course as the app plays it — per-item direction badges (WAR→ENG /
        ENG→WAR), full multiple-choice option sets (the app's own distractor rules), and a
        per-sentence ✓-in-book / ✎-synth source check against the OCR.
      • tools/audit-carve.mjs re-checks the carving against the DB block titles — run it
        after changing anchors.

 8. build.sh  (src/sulog.jsx → index.html)
      esbuild bundles React + the app into ONE self-contained file; injects the Supabase URL,
      publishable key, and a build stamp (UTC time + git hash — visible in the app footer).
      Edit src/sulog.jsx, never index.html.

 9. Deploy: push to main → Vercel runs `npm run build` and serves index.html + /verify/.
      (vercel.json copies docs/preview/verify into the deployment — the verify site is
      regenerated locally by the pipeline, not on Vercel, because steps 1–2 need macOS.)
```

### How a definition enters the dictionary (the authority rule)

A live dictionary definition must be vouched by the **Peace Corps book** or **Tramp** —
nothing else. Definitions authored anywhere else (the retired Preply/Challenger decks,
Wikivoyage, Duolingo/CHED gap fills, AI compiles) live only in
`archive/word-bank-dictionary.json`, never in the live DB.

```
 1. ENTER    Words + definitions come ONLY from the PC book, read by the Gemini extraction
             (the one allowed AI role: a READER of the book where the scan/OCR is rough —
             always cited as "Gemini · Peace Corps scan", never an author). repairExpr,
             FABRICATED, MARKER_GLOSS and gloss-overrides.json clean/normalize at the funnel.
             Every row lands UNCONFIRMED.
 2. AUTO-CONFIRM (two independent verifiers, run inside `npm run reload`)
      a. Tramp agreement   — the definition matches Tramp's printed entry
                             (tools/build-meanings.mjs → sources += tramp, confirmed)
      b. Book-print match  — the (word, definition) pair appears verbatim in the book's own
                             OCR text (tools/confirm-from-book.mjs → confirmed on the book's
                             authority: the AI reading was faithful)
 3. QUEUE    Whatever survives both is the honest residue: it renders in the app's review
             queue as cited multiple choice (tools/gen-confirm-candidates.mjs bakes the
             options — the definition's actual origin vs Tramp's printed entry vs "my own")
             with a pronunciation-guide prefill. A human Confirm writes confirmed=true.
```

### Database

Schema in `docs/schema/schema.sql` (one relational model for any Waray course: courses →
phases → units → lessons → typed lesson_blocks → block_items, plus a shared dictionary and
per-sense `meanings`). After creating tables also run `sync-guards.sql` (stale-write triggers)
and `rls.sql` (row-level security). Full data provenance: `docs/schema/DATA-SOURCES.md`.

### Where things live

| Path | What |
|---|---|
| `src/sulog.jsx` | the whole app (single file, ~4500 lines) |
| `src/courses/` | course registry + the localStorage cache for the DB course |
| `src/data/remote.js` | Supabase reads + the DB-course → engine adapter |
| `docs/sources/peace-corps/` | PDF, OCR text, Vision boxes, Gemini extraction |
| `docs/schema/` | schema, seeds, RLS, sync guards, data-sources doc |
| `docs/preview/verify/` | the generated course-vs-book review site |
| `tools/` | every pipeline stage above |

Progress is localStorage-first; signed-in users sync to Supabase (merge on pull, guarded
upserts on push). The publishable key in the bundle is public by design — RLS protects data.
