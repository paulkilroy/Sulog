# Sulog — developer handoff

This document hands off **Sulog**, a personal Waray-Waray (the language of Samar,
Philippines) review app, to whoever picks up development next (e.g. Claude running in
VS Code / Claude Code). Read this top to bottom before changing anything.

---

## 1. What this is, and who it's for

Sulog ("the tide") is a single-page, Duolingo-style review app one learner (Paul) uses
to study Waray between weekly Preply lessons. It is intentionally **one self-contained
file** with **no backend**. Identity is grounded in Daram, Samar / the Zumarraga Channel —
hence the rising-tide mastery motif and the sea/sun palette.

Core capabilities already built and working:
- Waray↔English in five modes: multiple choice, type, flashcard (self-grade), listen, speak.
- Spaced repetition (Leitner boxes) + a "Needs work" queue.
- **Record your own voice** on any card; it overrides the (rough) browser text-to-speech.
- Adjustable playback speed + an "adaptive" speed that scales with per-card mastery.
- A pronunciation reference screen ("How Waray sounds").
- **Backup & sync:** JSON export/import, plus **GitHub Gist cloud sync** (auto-pull on open,
  debounced auto-push on change) so progress follows the learner across devices.

---

## 2. THE GOLDEN RULE

**Edit `src/sulog.jsx`. Never hand-edit `index.html`.**

`index.html` is a *generated build artifact*: React + react-dom + lucide-react + the whole
app, bundled and minified by esbuild, then inlined into an HTML shell. Editing it by hand
will be silently overwritten the next time anyone builds. All real work happens in the
source, then you rebuild.

---

## 3. Repo layout

```
.
├── index.html        # BUILT artifact. Committed so GitHub Pages can serve it. Do not edit by hand.
├── src/
│   └── sulog.jsx      # THE SOURCE. ~2100 lines, single React component tree. Edit here.
├── build.sh          # src/sulog.jsx -> index.html (esbuild bundle + HTML shell)
├── package.json      # deps (react, react-dom, lucide-react) + esbuild; `npm run build`
├── .nojekyll         # tells GitHub Pages to serve files as-is (skip Jekyll)
├── .gitignore        # ignores node_modules/, logs, etc.
├── README.md
└── HANDOFF.md        # this file
```

---

## 4. Build & deploy workflow

```bash
npm install          # once: pulls react, react-dom, lucide-react, esbuild
npm run build        # regenerate index.html from src/sulog.jsx  (alias for: bash build.sh)
git commit -am "message" && git push   # commit + push to origin/main
```

Deploy target is **GitHub Pages**, repo `paulkilroy/Sulog`, serving from `main` / root.
Live URL: **https://paulkilroy.github.io/Sulog/** (capital S, trailing slash; path is
case-sensitive). Pages redeploys automatically ~1 min after each push — no Action to babysit.

`build.sh` aborts if the bundle ever contains a literal `</script>` (which would break the
inlined HTML). If you add a dependency that injects that string, switch to a non-inlined
`<script src>` approach instead.

**Typical loop:** edit `src/sulog.jsx` → `npm run build` → eyeball it → `git commit -am "what changed" && git push`.

---

## 5. Architecture map (all inside `src/sulog.jsx`)

It's one file, organized top-to-bottom: data → helpers → root component → views → styles.

**Data (top of file)**
- `SEED` — array of `[deck, waray, english, subtext, say]` rows (~150 cards). `say` is the
  English-reader phonetic respelling (e.g. `mah-OO-pigh`).
- `DECKS` — deck key → {name, short, hint}. Keys: `greet`, `week1`, `verbs`, `invite`.
- `FORGOTTEN` — a `Set` of Waray strings Paul historically missed; those cards start flagged.

**Spaced repetition / stats**
- A per-card stat: `{ box, seen, right, wrong, streak, last, due, hasAudio, pinned }`.
- `BOX_DAYS = [0,1,2,4,9,18]` — Leitner intervals per box (0–5).
- `applyResult(st, correct)` — correct ⇒ `box+1` (max 5); wrong ⇒ `box=0`; recomputes `due`.
- `isDue(st)`, `masteryPct(st)`.
- `needsWorkCard(st)` — **important, was a bug fix.** A card is "needs work" only if pinned,
  OR `seen>0 && box===0` (i.e. the *most recent* attempt was a miss). Getting a card right
  once moves it to box 1 and clears it. Do NOT revert this to `box<=1`.

**Persistence — `store` wrapper**
- Async get/set over `localStorage` with an in-memory fallback (`mem`).
- Keys: `waray:prog`, `waray:streak`, `waray:settings`, `waray:audioIndex`,
  and one `waray:audio:<cardId>` per recording (base64 data URL).
- NOTE: in the original claude.ai artifact build this wrapped `window.storage` instead.
  This repo's source is the **standalone/localStorage** version. Keep it that way.

**Cloud sync (GitHub Gist)**
- `GIST_FILE = "sulog-progress.json"`, one private gist holds `{app, v, prog, streak, audio}`.
- `gistApi()` — fetch wrapper with a 15s AbortController timeout and human-readable errors.
  If the host blocks the call it throws "Couldn't reach GitHub from here…". (That is exactly
  why the app can't sync *inside* the claude.ai artifact sandbox — its CSP blocks
  `api.github.com`. On GitHub Pages / any real host it works.)
- In `App`: `connectGist`, `syncPull`, `syncPush`, `disconnectGist`, plus `applyCloud()`
  which merges cloud↔local (per-card by most-recent `last`; audio union, local wins).
- Auto-pull once on open (if connected); auto-push debounced 2.5s after any prog/streak/audio change.
- Token is stored in `settings.sync.token` (localStorage). It only needs the **`gist`** scope.

**Component tree**
- `App` — root: loads state, owns `prog/audio/streak/settings/session`, exposes everything via
  a `ctx` object passed to views. View routing is a simple `view` string switch.
- **Lesson path** (scaffolded curriculum): `CURRICULUM` is **sections → units → lessons**
  (e.g. section "Survival Kit" → unit "Greetings" → lesson "Times of day"); lesson items are
  Waray text + `LESSON_PARTS` (the 4 escalating steps: WE-mc, EW-mc, WE-type, EW-type). Progress
  in `waray:lessons` (lessonId → parts done 0–4). Views `LearnView` (the path) and
  `LessonView` (4-part stepper) reuse `SessionView` for each part. See `docs/lesson-plan.md`.
  NOTE: card ids are positional (`c{index}`) — only **append** to `SEED`, never insert/reorder,
  or you shift ids and corrupt saved `prog`/`audio`.
- Views: `HomeView` (TideHero, streak chips, CTAs, decks, Distribution, ConstellationGrid),
  `SetupView`, `SessionView` (+ `buildQueue`, `CardReview`, `SpeakCard`, `Verdict`,
  `SelfGrade`, `SessionDone`), `NeedsWorkView`, `BrowseView` (+ `BrowseRow`),
  `BackupView` (export/import + gist sync UI), `PronounceView` (rules + speed control).
- Shared: `TopBar`, `SectionLabel`, `Bar`, and `Styles` (all CSS in one `<style>` block).

**Speech**
- `speak(arg, rate)` + `loadVoices()`. If a real Filipino/Tagalog voice exists, it speaks raw
  Waray with it; otherwise it speaks the **respelling** (`say`) through the default voice, since
  that's written to be read by an English voice. Words are comma-joined so they don't run
  together. `playCard()` prefers a saved user recording; falls back to `speak`.

---

## 6. Conventions & constraints

- **One file, no router, no state library.** State is `useState`/`useRef` in `App`, passed down
  via `ctx`. Keep it that way unless there's a strong reason.
- **All CSS lives in the `Styles()` `<style>` block** using CSS variables (`--sea`, `--tide`,
  `--sun`, `--coral`, `--jade`, `--shell`, …). No Tailwind, no CSS modules.
- **Icons:** `lucide-react` only.
- **Fonts:** Fraunces (display + Waray words) and Outfit (UI), pulled via `@import` in the style
  block. They need network at runtime; offline they degrade to system fonts.
- **Mobile-first:** the root is capped at 480px and centered. Test at phone width.
- **No browser-storage exotica beyond localStorage.** Audio base64 can be large; localStorage
  caps ~5MB/origin. If that becomes a problem, move `waray:audio:*` to IndexedDB — the gist
  remains the canonical copy regardless.

---

## 7. Domain notes (so you don't reintroduce errors)

- Pronunciation rules encoded in `PronounceView` come from Waray phonology (3 vowels a/i/u;
  o=u and e=i in spelling; 16 consonants; phonemic stress; hyphen = glottal stop; `-ay`→"igh",
  `-aw`→"ow"; `ng` is one sound; d↔r between vowels) and the Wikivoyage Waray phrasebook
  respelling style (CAPS = stressed syllable).
- Source vocabulary came from Paul's Google Drive "WarayLessons" sheet. A few OCR typos were
  corrected against his teacher's docx files and should stay corrected:
  `yama→yana` (now), `mapaso him euro→mapaso hin duro` (very hot), `mahingin→mahangin`
  (windy), `mapaSO→mapaso`, `ba-ba-yi→babaye`.
- Many longer sentence cards have an empty `say`. For those the synthesized voice is rough.
  The right fix is authoring respellings for them (see backlog), not changing the speak engine.

---

## 8. Backlog / good next steps

- Author `say` respellings for the multi-word sentence cards that lack them.
- Visible build/version stamp in the UI so a deploy can be confirmed at a glance.
- Move recordings to IndexedDB to escape the localStorage size cap.
- "Add your own card" flow (the data model already supports custom cards conceptually).
- Optional: pull new vocabulary from the source sheet on demand.
- Optional: a standalone OAuth sync (Supabase/Firebase) if gist tokens feel clunky — only
  worth it if the gist flow proves annoying.

---

## 9. Quick sanity checks after any change

```bash
npm run build
# open index.html in a browser; verify:
#  - home tide renders, decks show, a multiple-choice round works
#  - record a card, confirm playback uses your voice
#  - Backup & sync: connect a gist token, button turns green "Connected", push/pull work
node --check <(sed -n '/^<script>$/,/^<\/script>$/p' index.html | sed '1d;$d')  # JS parses
```

That's it. Edit the source, build, push. The tide does the rest.
