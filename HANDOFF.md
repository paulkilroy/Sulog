# Sulog — developer handoff

Hands off **Sulog**, a personal Waray-Waray review app, to whoever develops it next
(usually Claude in VS Code). Read this and **README.md** (the build pipeline) before
changing anything.

---

## 1. What this is

Sulog ("the tide") is a Duolingo-style app one learner (Paul) uses to learn Waray for
relocating to Daram, Samar. Identity is grounded in the Zumarraga Channel — the rising-tide
mastery motif, dark sea/sun palette.

- **App**: one self-contained `index.html`, built from `src/sulog.jsx`, deployed on Vercel
  (https://sulog-two.vercel.app; the old GitHub Pages URL redirects there).
- **Backend**: Supabase (Postgres + PostgREST + Google OAuth). Course content is
  world-readable; per-user progress is RLS-protected. The publishable key ships in the
  bundle by design.
- **Courses**: ONE course — Peace Corps Waray (id `pc`), database-driven: fetched from
  Supabase, adapted to the engine shape, and cached in localStorage. The original bundled
  JS courses (Frequency, Classic, Challenger 1+2) were retired 2026-07-13 to
  `archive/bundled-courses/` (resurrection notes in `archive/README.md`).
  See README for the full PDF→DB pipeline.
- **Review site**: https://sulog-two.vercel.app/verify/ — every lesson side-by-side with
  the scanned book, provenance overlays, direction badges, MC options, source checks.
  Regenerate with `npm run preview`; it's part of `npm run reload`.

---

## 2. THE GOLDEN RULES

1. **Edit `src/sulog.jsx`. Never hand-edit `index.html`** — it's a generated artifact.
2. **Never commit credentials.** The Postgres connection string lives in gitignored
   `.env.local` (`SUPABASE_DB_URL=...`); tools read it via `node --env-file`. The
   publishable anon key is public; the DB password and any service key are not.
3. **Card ids are the Waray string itself** (`prog` is keyed by it). They are STABLE across
   content edits — do not reintroduce positional ids. Legacy `cN` ids migrate on load.
4. **`npm run reload` mutates the production DB** (there is only prod). It's transactional
   and guarded (wrong-project / truncated-seed / shrinking-seed refusals), but treat it
   with respect. The dictionary purge is deliberately scoped to PC-referenced rows — an
   earlier broad sweep destroyed 415 shared word-bank rows (recovered). Don't widen it.
5. **Never trust the Gemini extraction (`pc-blocks.json`) over the book's OCR.** It
   hallucinates (see `FABRICATED` in `tools/gen-pc-seed.mjs`). Confirm against
   `peace-corps-full-ocr.txt` or the scans before treating a sentence as book truth.
6. Terminology: the `say` field is the **pronunciation guide** (not "respelling").

---

## 3. Repo layout

```
├── index.html            # BUILT artifact (gitignored; built locally and by Vercel). Never edit.
├── src/
│   ├── sulog.jsx          # THE APP. ~4500 lines, single React tree. Edit here.
│   ├── supabase.js        # client, auth, pullProgress/pushProgress
│   ├── data/remote.js     # DB reads (paginated!), dbCourseToBundled adapter
│   └── courses/           # course registry + localStorage cache for the DB course
├── tools/                # the whole content pipeline (see README step-by-step)
├── docs/schema/          # schema.sql, seeds, rls.sql, sync-guards.sql, DATA-SOURCES.md
├── docs/sources/         # PDF, OCR text, Vision boxes, pc-blocks.json, dictionaries
├── docs/preview/verify/  # generated course-vs-book site (committed, served at /verify/)
├── build.sh              # src/sulog.jsx -> index.html (esbuild; injects env + build stamp)
└── vercel.json           # buildCommand: app build + copy verify site into dist/
```

---

## 4. Workflows

```bash
npm install            # once
npm run build          # app only: src/sulog.jsx -> index.html
npm run all            # content pipeline + app: seed -> reload DB -> regen /verify -> build
git commit && git push # Vercel deploys main (~1 min). Build stamp visible in the app.
```

The build stamp (`UTC time | git hash`) in the app footer confirms which deploy you're on —
check it before debugging "my fix isn't there" (browser caches bite; hard-refresh).

---

## 5. Architecture map (src/sulog.jsx)

One file: data → helpers → App → views → styles (one `<style>` block, CSS variables,
dark-green theme). No router, no state library; `App` owns state, views get a `ctx` object.

**Courses & engine**
- Engine shape: `{id, name, seed:[[deck,waray,english,sub,say]], forgotten, curriculum}`.
- DB-course lessons play the adapted block ladder (teach → drills → gate).
- DB courses carry per-lesson `steps` (teach / vocab / drill blocks) and per-unit `gates`
  (graded exams, bidirectional). `startStep` / `startGate` build sessions; bidirectional
  sessions use a per-card `dirMap` (gate split = paradigm words W→E, sentences E→W).
- DB course flow: `fetchCourseBundled` → `cacheDbCourse` (localStorage) → synchronous boot
  via `getCourse`. `courses.version` (bumped by every reload) auto-refreshes stale caches
  on boot. Cache-write failures are surfaced — don't reintroduce silent `catch {}` +
  unconditional `location.reload()` (infinite-loop hazard).

**Grading (`checkAnswer`) — deliberately asymmetric; don't "simplify" it**
- TYPED Waray: strict word-by-word (short words get zero slack — `ka` ≠ `kamo`).
- SPOKEN Waray (`spoken=true`): lenient phrase-level — the recognizer has no Waray locale.
- English: lenient whole-phrase. Waray o/u and e/i fold as equal everywhere.

**Spaced repetition / Needs work**
- Per-card stat `{box, seen, right, wrong, streak, recall, last, due, pinned}`;
  `BOX_DAYS` Leitner intervals; `applyResult`.
- "Needs work" = pinned OR (missed AND `recall < NW_RECOVER`); `recall` counts COLD typed
  recalls only. `dismissNeedsWork` = manual graduation (sets `recall`, unpins).

**Sync (Supabase, replaces the old gist system entirely)**
- localStorage-first; signed-in: one pull at boot (client-side merge), then debounced
  pushes. Auto-push arms ONLY after a successful pull (a failed pull must not enable
  pushes — that clobbered streaks once).
- The DB has BEFORE UPDATE triggers (`sync-guards.sql`) refusing stale writes: progress
  rows older than stored are skipped, lesson parts monotonic, unit best/passed sticky,
  streak days unioned. Defense-in-depth: keep both layers.

**Speech**
- `speak()` prefers a real Filipino/Tagalog voice on raw Waray, else reads the
  pronunciation guide with the default voice. STT listens in Filipino; grading of anything
  recognizer-produced must pass `spoken=true`.

**Data access (src/data/remote.js)**
- PostgREST caps responses at ~1000 rows: any table that can exceed it MUST use
  `fetchAll()` (paginated) **with a stable `.order()`** — unordered pagination silently
  drops rows at page boundaries.

---

## 6. Conventions & pitfalls

- One file, `ctx` prop-drilling, lucide-react icons, Fraunces/Outfit fonts, mobile-first
  (root capped 480px). All CSS in the `Styles()` block.
- Dark theme: `<button>`/inputs don't inherit color — set `color` explicitly or you get
  black-on-dark (this class of bug has recurred; check new UI on the dark background).
- `.ws-input:focus` etc. must keep dark backgrounds (white-on-white history).
- Progress keys are namespaced per course (`sulog:<courseId>:prog` …).
- `history` is localStorage-only (not synced) and capped; `backfillRecall` derives recall
  from it once.
- The verify site and the app must agree: the preview computes directions/distractors with
  the same rules the app uses — if you change `pickDistractors`, `startGate`, or drill
  routing, update `tools/gen-course-preview.mjs` to match, run `tools/audit-carve.mjs`,
  and `npm run preview`.

---

## 7. Domain notes

- Waray phonology: 3 vowels (o=u, e=i in spelling), phonemic stress, hyphen = glottal
  stop; pronunciation guides use CAPS for the stressed syllable (`mah-OO-pigh`).
- The authoritative dictionary is `docs/sources/dictionaries/tramp.json` (27k senses,
  Vision-OCR'd, accents kept). Course glosses reconcile against it via
  `tools/build-meanings.mjs` (3-tier matcher → `meanings` table with `sources[]`).
- Grammar-critical short words: pronouns `ako/ikaw·ka/hiya/kita/kami/kamo/hira`, II-class
  possessives (`nakon/ko` full/short pairs), markers `an/hi/ni/han/hin/ha/kan`,
  demonstratives `ini/iton/adto`. The book's design: I/II/III class paradigms, then verbs
  (ma-/mag- actor focus), linkers/particles, negators, commands.
- The book prints each lesson's exam as the "Review" OPENING the next lesson — in the
  course it's the PRIOR lesson's exit gate. Oral exercises are teacher-led substitution
  drills and are deliberately NOT ingested (grey on the verify site).

---

## 8. Backlog / known open items

- **Synth-sentence audit**: ~420 drill/exam sentences are Gemini renderings not verbatim
  in the OCR — only confirmed fabrications are rejected so far. The verify site's ✎ marks
  are the worklist.
- Native-speaker (Ella) review queue: dictionary confirmations, BFC story corrections,
  madig-on/makusog-style gloss questions.
- PC pronunciation guides are filled by `tools/fill-pronunciation.mjs` (Tramp stress →
  default rule → phrase composition from word guides); homograph senses carry per-sense
  stress in `meanings.pronunciation`.
- From the last deep review, still open: `checkAnswer` edge cases (slash-in-phrase,
  fully-parenthesized targets), gate retry grade inflation ("Review missed" can pass a
  failed gate), `fetchReviewList` 1000-row cap, sequences never `setval`'d, RLS smoke
  test, repo-size hygiene (committed index.html history), Tramp dictionary redistribution
  rights.
- L15 has no exit gate (the book's review for it was fabricated by extraction; nothing
  real to test against). Could hand-author from the book's English prompts with Ella.

---

## 9. Sanity checks after a change

```bash
npm run build                      # must succeed; open index.html locally
# in the app: home tide renders; a lesson step plays; typed grading echoes visibly;
#             course switch to Peace Corps works; Needs work dismiss (✕) works
npm run preview                    # if you touched content/pipeline: regen + eyeball /verify
node --env-file=.env.local tools/audit-carve.mjs   # if you touched carve anchors
```

Edit the source, build, push. The tide does the rest.
