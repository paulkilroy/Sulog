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
- Cross-course CEFR-ish proficiency estimate (the home-card progress meter)
- Reader (Bloom stories), pronunciation guides, browser speech recognition (Filipino locale)

## Commands

| Command | What it does |
|---|---|
| `npm run all` | Full pipeline: generate course SQL → reload DB → enrich + verify → build app |
| `npm run bootstrap` | EMPTY database only: create schema + RLS + triggers + judgment tables |
| `npm run check` | REPRODUCIBILITY ALARM: rebuild into a scratch schema, diff vs live, fail on drift |
| `npm run course` | Regenerate the course SQL (`docs/schema/pc-course.sql`) from the Gemini extraction |
| `npm run reload` | Load the course SQL into the live DB (guarded), bump the course version, regen `/verify` |
| `npm run preview` | Regenerate the `/verify` site from the live DB |
| `npm run build` | Build the app: `src/sulog.jsx` → `index.html` |

DB tools read `SUPABASE_DB_URL` from the gitignored **`.env.local`** (see `.env.example`).
**Never commit credentials.** After `npm run all`, commit + push — Vercel deploys `main`.

New here? Read **HANDOFF.md** — golden rules, architecture map, pitfalls, backlog.

## Data model

The whole app is one relational model (DB: `docs/schema/schema.sql`; the app loads a denormalized
projection of it). Definitions of every term, plus the canonical vocabulary, live in the schema
header — this is the reader-friendly view.

### The hierarchy

```
COURSE  — the whole product ("Peace Corps Waray")
  │       bundles the three branches below
  │
  ├─ CURRICULUM — the ordered learning path
  │   └─ PHASE — a top-level stage
  │       └─ UNIT — a themed "can-do" group ("At the airport")
  │           ├─ LESSON — one teaching step (an ordered list of typed blocks)
  │           │   ├─ STEP / BLOCK — a playable piece: guide · vocab · drill · review · story
  │           │   └─ GATE — the test that ends the lesson (pass to proceed)
  │           └─ REVIEW — spaced check across the unit's items
  │
  ├─ DICTIONARY — the catalogue of words + idiomatic phrases (headword + pronunciation);
  │               a word's meaning(s) live in `meanings` (one row per sense)
  │
  └─ STORIES — reader texts (Waray paragraphs + multiple-choice comprehension questions);
               a unit can end on one as a capstone
```

### What a "card" is

A **card** is any *drilled item* (an app-side name — there's no `card` table; a card is a
`block_item` that gets quizzed, drilled **both directions**, so either side can be the answer).
Every card is **one of three things**, decided by *where its meaning lives*:

| Card is a… | Meaning is… | Backed by | Example |
|---|---|---|---|
| single word | its own | `dictionary` | `libro` → "book" |
| idiomatic phrase | its own (not the sum of parts) | `dictionary` | `may ada` → "there is / has" |
| composed sentence | built from its words | `expressions` | `Maupay nga aga` → "Good morning" |

`block_items` enforces this (exactly one of `dict_waray` / `expr_id`). So word & idiom cards are
backed by the dictionary; **sentence cards are backed by `expressions`, not the dictionary**; and
**many dictionary words are never cards** (catalogued but never drilled — e.g. `libro`, which only
appears inside example sentences).

### topic (a card's subject label)

A card also carries a **topic** — a subject tag (*Greetings, Airport, Meals…*). It's assigned by
**first-touch** (the first lesson to introduce a word owns its topic, forever), so function words
like `mga` inherit an arbitrary one. Topic does exactly two jobs: (1) the little category tag on
each drill card, and (2) supplying same-topic **distractors** (wrong answers) for multiple-choice
questions. The curriculum is the real structure; topic is a weak secondary grouping.

### Vocabulary

| Term | Means | Was called |
|---|---|---|
| **CARDS** | the flat list of all cards | `SEED` |
| **card** | one drilled item (word / idiom / sentence) | — |
| **topic** | a card's subject label | `deck` |
| **pronunciation** | the spoken guide (CAPS = stressed syllable) | `say` |
| **definition** | a Waray word's meaning | `gloss` / `GLOSS` |

All renamed in code (`SEED→CARDS`, `deck→topic`, `say→pronunciation`, `GLOSS/GLOSS_FIX →
DEFINITIONS/DEFINITION_FIX`). One deliberate exception: a dictionary entry's meaning field stays
`meaning` in code — it mirrors the DB `meanings` column and is read/written across the classroom
mutation path, so "definition" is only the prose term for it. DB column names are unchanged; the
app matches them at its boundary (`src/data/remote.js`).

## A note on page numbers (important)

The book is a 114-page scan. Everything in the pipeline is keyed on the **scan index** — the
physical page order 1…114 — carried through the derived files as `ocr-boxes/ocr-p<N>.json`,
`pages/page_<N>.png`, and the `===PAGE <N>===` markers in `peace-corps-full-ocr.txt`.

The book's own **printed page numbers are NOT unique**: the print run restarts, so 94/95/96 each
appear twice (scan pages 94–96 are Lesson 20's review test; scan pages 97–99 reprint "94/95/96"
as Lesson 21). **No build step ever keys on the printed number** — only on the scan index — so the
duplication can't misroute content. `gen-course-preview.mjs` emits a build warning listing any
printed number carried by more than one scan page, as a standing reminder to cross-reference scans
by index, never by the number in the page corner.

## The Peace Corps pipeline, step by step

Everything below is rebuildable from the committed sources. The ONE non-mechanical step is the
Gemini extraction (same prompt ≠ same output), which is why its result is committed as
source-of-truth. The root source is `docs/sources/peace-corps/peace-corps-waray-lessons.pdf`
(114-page scan, committed).

**Capture (Tier 0 — rare; only when a scan/source improves; outputs committed):**

1. **`tools/pdf-render.swift`** → `pages/page_<N>.png` (derived, gitignored). Renders each PDF page
   to a 2× PNG via PDFKit. `swift tools/pdf-render.swift <pdf> <from> <to> docs/sources/peace-corps/pages`
2. **`tools/ocr-boxes.swift`** → `ocr-boxes/ocr-p<N>.json` (committed, 114 files). Apple Vision OCR
   per page, keeping LINE GEOMETRY (text + normalized bounding box). Powers the `/verify` overlay
   sectioning. Accents preserved; no language correction.
3. **`tools/pdf-ocr-range.swift`** → `peace-corps-full-ocr.txt` (committed). The same Vision OCR
   rendered in memory, flattened to text with `===PAGE <N>===` markers (N = scan index). Powers the
   verbatim source-check and the lesson↔scan-page mapping.
4. **Gemini extraction** → `pc-blocks.json` (committed — NOT re-derivable). The scanned pages were
   read by Gemini (`tools/pc-extract.mjs`), which returned each lesson as typed blocks: `grammar` /
   `note` / `examples` / `oral_exercise` / `written_exercise` / `vocab`. This output contains
   occasional hallucinations — the later stages defend against them; never trust it over the OCR.

**Content build (Tier 1 — `npm run all`; deterministic, from committed sources + judgment tables):**

5. **`tools/gen-pc-course.mjs`** (`pc-blocks.json` → `docs/schema/pc-course.sql`). A deterministic
   generator producing the `courses` / `phases` / `units` / `lessons` / `lesson_blocks` /
   `block_items` / `expressions` / `dictionary` rows. Beyond transcription it:
   - splits paradigm lessons into a/b (chart + recognition vs vocab + production)
   - routes drills by WHAT VARIES: paradigm-varying → recognition multiple-choice; vocab-varying
     `oral_exercise`s are DROPPED (teacher-led); `written_exercise`s → typed production, both ways
   - derives each lesson's exit test: the book prints it as the "Review" OPENING the next lesson, so
     it becomes the prior lesson's assessment gate (Review-Test lessons and the final lesson gate
     their own written test)
   - `repairExpr()` fixes extraction defects at one place — swapped English/Waray fields, "1."
     numbering, "[or]" answer-key alternates, Q&A dialog rows, OCR typos
   - the `FABRICATED` reject set (from `rejected-sentences.json`) drops confirmed Gemini inventions
     ("Madig-on hiya", the "hin duró" scrambles) — add to it as new ones are caught against the OCR
   - proximity guard: an exit test may only cover CONTENT words taught by that lesson
   - `MARKER_GLOSS`: canonical learner-facing definitions for the closed marker/pronoun sets
   - **Build warning:** it prints every practice block it prunes as empty (source had items but none
     were usable — a Waray or English answer side was blank), naming the lesson, count, and the
     source instruction, so an extraction gap can't disappear silently.

6. **`tools/reload-pc.mjs`** (`pc-course.sql` → live Supabase). One transaction: delete the old `pc-*`
   rows, load the fresh course SQL, purge stale PC-only `dictionary` rows (scoped so it can never
   touch the shared word bank / other courses), bump `courses.version` — every connected app
   auto-refetches its cached course. Guards: refuses a wrong DB (project-ref check), a truncated
   file, or one with fewer lessons than live (`--force` to override). Then runs the deterministic
   enrichment, in confirmation-authority order:
   `build-meanings --apply` (Tramp verification) → `sync-meaning-overrides` (homograph senses) →
   `fill-pronunciation --apply` (guides) → `confirm-from-book --apply` (book-print verification) →
   `replay-confirmations` (durable human judgments back over fresh content) → step 7 (preview) →
   `gen-confirm-candidates` (bake cited options for the remaining review queue) → `rls-smoke`.

7. **`tools/gen-course-preview.mjs`** (live DB + OCR + scans → `docs/preview/verify/`). The review
   site: one page per lesson + index, committed and served at `/verify/`.
   - LEFT: the scans with PROVENANCE OVERLAYS — each scan page is sectioned at the book's printed
     headings (plus every `lesson_blocks` grammar-block title, fuzzy-matched to survive OCR garble).
     Each box is color-linked to the `lesson_blocks` row it became; grey = `oral_exercise`s
     deliberately not ingested; exit-test boxes are attributed to the right lesson ("L4 exam (prev)"
     vs "L5 exam"). Click a box/block/legend row to filter; panes scroll independently.
   - RIGHT: the course as the app plays it — per-item direction badges (WAR→ENG / ENG→WAR), full
     multiple-choice option sets (the app's own distractor rules), and a per-sentence ✓-in-book /
     ✎-generated source check against the OCR.
   - `tools/audit-sections.mjs` re-checks the sectioning against the `lesson_blocks` titles — run it
     after changing anchors.

**App build (Tier 2 — `npm run build`; esbuild only, no DB touch):**

8. **`build.sh`** (`src/sulog.jsx` → `index.html`). esbuild bundles React + the app into ONE
   self-contained file; injects the Supabase URL, publishable key, and a build stamp (UTC time +
   git hash — visible in the app footer). Edit `src/sulog.jsx`, never `index.html`.
9. **Deploy:** push to `main` → Vercel runs `npm run build` and serves `index.html` + `/verify/`.
   (`vercel.json` copies `docs/preview/verify` into the deployment — the verify site is regenerated
   locally by the pipeline, not on Vercel, because steps 1–2 need macOS.)

### How a definition enters the dictionary (the authority rule)

A live `dictionary` definition (the `meaning` column) must be vouched by the **Peace Corps book** or
**Tramp** — nothing else. Definitions authored anywhere else (the retired Preply/Challenger decks,
Wikivoyage, Duolingo/CHED gap fills, AI compiles) live only in `archive/word-bank-dictionary.json`,
never in the live DB.

1. **ENTER.** Words + definitions come ONLY from the PC book, read by the Gemini extraction (the one
   allowed AI role: a READER of the book where the scan/OCR is rough — always cited as "Gemini ·
   Peace Corps scan", never an author). `repairExpr`, `FABRICATED`, `MARKER_GLOSS`, and
   `meaning-overrides.json` clean and normalize at one place. Every row lands `confirmed=false`.
2. **AUTO-CONFIRM** (two independent verifiers, run inside `npm run reload`):
   - *Tramp agreement* — the definition matches Tramp's printed entry
     (`tools/build-meanings.mjs` → `sources += 'tramp'`, `confirmed`).
   - *Book-print match* — the (word, definition) pair appears verbatim in the book's own OCR text
     (`tools/confirm-from-book.mjs` → `confirmed` on the book's authority: the AI reading was faithful).
3. **REPLAY.** `native_confirmations` — the durable judgment table (never touched by content
   rebuilds, same class as `ella_answers` and `progress`) — is replayed over the fresh dictionary:
   every past human Confirm comes back, `confirmed_by='ella'`.
4. **QUEUE.** Whatever survives all three is the honest residue: it renders in the app's review queue
   as cited multiple choice (`tools/gen-confirm-candidates.mjs` bakes the options — the definition's
   actual origin vs Tramp's printed entry vs "my own") with a pronunciation-guide prefill. A human
   Confirm writes `confirmed=true`.

### Building from scratch (empty database)

The build is TIERED so a code change never re-runs expensive capture, and a wiped database is fully
recoverable:

- **Tier 0 — capture** (rare; run only when a source/scan improves): Vision OCR of the book and of
  Tramp, the Gemini reading of the scans. Outputs are COMMITTED (`ocr-boxes/`, `full-ocr.txt`,
  `tramp.json`, `pc-blocks.json`) — they never regenerate on a code change.
- **Tier 1 — content build** (`npm run all`): deterministic, from committed sources + judgment
  tables. Run `npm run bootstrap` first if the database is empty (schema + RLS + triggers + judgment
  tables), then `npm run all` rebuilds everything: generate course SQL → load → Tramp verification →
  homograph senses → pronunciation guides → book verification → replay native confirmations → verify
  site → confirm candidates → RLS smoke.
- **Tier 2 — app build** (`npm run build`): esbuild only, no DB touch.
- **`npm run check` proves it**: rebuilds the whole content DB into a throwaway `scratch` schema from
  committed sources + judgment tables and diffs it against live, table by table. Any hand-edit that a
  rebuild wouldn't reproduce fails the check — run it after any manual DB surgery, and move whatever
  it flags into `docs/dictionary/lexicon-extras.json`, `meaning-overrides.json`, `pc-course.sql`'s source,
  or a judgment table.

Two classes of tables: **CONTENT** (`courses` / `lessons` / `dictionary` / `meanings` /
`expressions` — disposable, fully re-derived by Tier 1) and **JUDGMENT** (`native_confirmations`,
`ella_answers`, per-user `progress` — permanent, never touched by rebuilds, replayed over fresh
content). Every confirmed `dictionary` row carries `confirmed_by` (`'tramp'` | `'book'` | `'ella'`)
so provenance is queryable, and a human Confirm in the app writes the durable judgment record, not
just the content row.

### Database

Schema in `docs/schema/schema.sql` (one relational model for any Waray course: `courses` → `phases`
→ `units` → `lessons` → typed `lesson_blocks` → `block_items`, plus a shared `dictionary` and
per-sense `meanings`). After creating tables also run `sync-guards.sql` (stale-write triggers) and
`rls.sql` (row-level security). Full data provenance: `docs/schema/DATA-SOURCES.md`.

### Where things live

| Path | What |
|---|---|
| `src/sulog.jsx` | the whole app (single file, ~4500 lines) |
| `src/courses/` | course registry + the localStorage cache for the DB course |
| `src/data/remote.js` | Supabase reads + the DB-course → engine adapter |
| `docs/sources/peace-corps/` | PDF, OCR text, Vision boxes, Gemini extraction |
| `docs/schema/` | schema, course SQL, RLS, sync guards, data-sources doc |
| `docs/preview/verify/` | the generated course-vs-book review site |
| `tools/` | every pipeline stage above |

Progress is localStorage-first; signed-in users sync to Supabase (merge on pull, guarded upserts on
push). The publishable key in the bundle is public by design — RLS protects data.
