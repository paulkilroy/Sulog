# Sulog — TODO

Working backlog. **Hard deadline: Voltz classroom platform, Aug 17 2026.**
Last updated 2026-07-29. Checked items move to "Recently shipped" at the bottom.

---

## 🔴 Bugs / blockers

- [ ] **Cross-device progress NOT syncing (REOPENED 2026-07-30).** The iPhone shows only progress
  done on that device — the DB pull isn't landing. Data is fine (one account, 208 rows). Root is
  almost certainly that **the iPhone isn't holding the Supabase session** (client stores it in
  localStorage; iOS/ITP evicts it) → app runs anonymous → `syncPull` bails (no user) → localStorage
  only. It fails silently. Earlier "reload-race" fix was moot if the pull never runs.
  - Added 2026-07-30 (diagnostics + more-live, NOT a claimed fix): the Account sync line now shows
    "Synced · N cards from cloud", and the app **re-pulls on every foreground/focus** (throttled).
  - **Evidence to gather on the iPhone:** open Account — does it say "Signed in as …"? After a pull,
    does it say "N cards from cloud" (expect ~208) or 0? That tells us signed-out vs pull-returns-0.
  - **Real fix (next):** persist the Supabase session in **durable storage (IndexedDB)** so iOS
    can't evict it — same work as Offline Phase 2. Consider DB-authoritative pull-on-open too.
- [ ] **Test the classroom view end-to-end.** It's built but unverified with real sign-ins (RLS
  only truly exercises when authenticated). Walk every role: student join-by-code, flag a page,
  instructor dashboard + student-detail, reviewer propose, admin approve → dictionary mutation.

## 🧱 Data-model cleanup (tech debt — not launch-blocking)

- [ ] **Normalize card ↔ dictionary (de-duplicate).** A card stores its own copy of
  `pronunciation`, snapshotted from the dictionary at build time ([remote.js](src/data/remote.js#L97)),
  and its `english` overlaps the dictionary `definition`. The clean model: a card **references**
  its dictionary entry by `waray` and inherits `pronunciation`/`definition` from it, storing only
  what's card-specific (topic, subtext, example, which lessons use it). `waray` itself is the link,
  not duplication. Separate, deliberate refactor — changes data flow, not just names.
- [ ] **`topic` is a weak first-touch tag.** A card's topic = the first lesson that introduced it,
  never updated — so glue words like `mga` get an arbitrary topic. It's used only for the card's
  category tag and for same-topic multiple-choice distractors. Decide: derive it from the unit,
  or drop it in favor of the curriculum (unit/lesson) as the sole grouping.
- Naming: card-model vocabulary standardized in code — `SEED→CARDS`, `deck→topic`,
  `say→pronunciation`, `GLOSS/GLOSS_FIX→DEFINITIONS/DEFINITION_FIX`. The dictionary `meaning` field
  is KEPT (mirrors the DB `meanings` column, read+written across the classroom path); "definition"
  is the prose term only. DB columns + tramp.json data left as-is at the boundaries.
- [ ] **`tools/build-stories.mjs` is broken** — it imports `src/courses/waray/gloss-extra.js`,
  which has never existed in git, so it can't run and `stories.js` (the reader's `DEFINITIONS` map)
  can't be regenerated. Make the missing import optional (default `{}`) or restore the file, then
  the `DEFINITION_FIX` → `DEFINITIONS` pipeline works again.
- [ ] **Loanword provenance (NOT a user-facing gap).** The PC loanwords absent from Zorc/Oyzon
  (tinidor, museo, Agosto, sekretarya, sorbetes, kostums, pumpboat, isnak, Diyos-diyos, Kristohanon)
  ALREADY show meanings in-app (reader `DEFINITIONS` + each card's English). The only gap is
  authoritative-dictionary backing. When wanted, add them as PK-authored rows to the DB `dictionary`
  (curated `DEFINITION_FIX` entries were prepared but reverted — inert until build-stories is fixed).
- [ ] **`maalsom` → `maaslom` spelling fix.** The PC book mis-OCR'd it (als↔asl); correct is
  `maaslom` (ma- + `aslom`; Zorc: `áslom` "sour"). Keep the `ma-`. The card is in the DB, so this
  needs a DB edit / a `pc-corrections` mechanism — not just a lookup-map entry.

## 🎓 Classroom platform — Voltz (Aug 17 2026, CRITICAL)

Built in TG2 but needs finishing + the human round-trip test above. From the meeting decisions:
- [ ] Finish/verify **classes & enrollment** (join-by-code self-signup; `join_class` exists).
- [ ] **Feedback capture + admin queue** — ⚑ report on *every* content surface (grammar, vocab,
  drills, verdicts), auto-capturing context (item·lesson·block·direction·answer·role·timestamp).
- [ ] **Instructor dashboard + student detail** — headline metric = unit-test average (graded
  gates, pass = 80%); mastery% + reports secondary.
- [ ] **Reviewer flow + `apply_feedback()` mutation.** Reviewers PROPOSE, admins DECIDE — one admin
  queue, nothing auto-applies.
- [ ] **Dictionary auto-mutation for Aug 17** (Paul's call, approval-gated, exactly 3 ops on
  `meanings`, never clobber): "add meaning" → new row (source `native`, pending); "primary/rare" →
  change `ord`; "wrong" → `disputed` flag (hide/deprioritize, never delete). If it grows past 3
  ops before launch, cut back to capture-only.
- [ ] **Schema-shaped native capture for words** — the word report panel collects real
  dictionary/`meanings` fields (definition, POS, pronunciation, register [new col], dialect,
  example, certainty [new col]) so an approved validation loads straight in, no retyping. (This is
  also Voltz's 80k-dictionary tagging pipeline — the class IS the dictionary's data source.)
- [ ] **Stressed-vowel coaching — "lengthen the stressed vowel"** *(Voltz bumped this to the
  critical path).* During pronunciation practice, surface each syllable's **duration in
  milliseconds** and coach the learner to lengthen the stressed vowel — Waray stress *is* vowel
  length. This is the cheap-win slice of the pronunciation-engine research: no pitch/F0 model
  needed, because every guide already marks the stressed syllable, so it's duration display + a
  prompt. (The fuller pitch/F0 + native-calibration engine stays in Research below.)
- [ ] **Quality-by-module board** (green/amber/red per module) for admin + instructor — derived
  from unresolved flags + native-validation coverage + rejections + later pass-rates.
- [ ] **Dialect catalog** as its own config page; **Course-vs-book / preview / `/verify`**
  consolidated (data-provenance merges in as its header) — both linked atop the Review queue.
- [ ] **Delete dead `SetupView`** (unreachable) during app-code work.
- [ ] Roles: Student · Instructor · Reviewer · Admin (one admin for now, no trust tiers).
- [ ] **TG3:** pilot dry-run with Voltz + a few students ~1 week before Aug 17.

> **Strategic insight (tell Voltz):** the schema-shaped native word-capture above generates POS
> tags + definitions + confirmations as a byproduct of teaching — so **the classroom platform IS
> the 80k-dictionary's data pipeline**. It merges the class workstream with the dictionary one.

## 📴 Offline mode / PWA

Goal: launch and practice with no signal; sync progress when back online. Learner core (lessons,
drills, reader, TTS, progress) already caches locally — the gaps are the launch shell + storage
durability. Phased:
- [~] **Phase 1 — PWA shell** — *groundwork shipped 2026-07-30.* Manifest + PNG icons
  (`assets/icons/`, rendered from the app's wave/sun art) + apple-touch-icon + iOS meta are LIVE →
  the app is **installable to the home screen** (standalone, themed). The **service worker**
  (`assets/sw.js`, network-first for HTML so online always gets the latest, cache-first for assets,
  ignores all Supabase/OAuth traffic) is written and wired, but **registration is OPT-IN** guarded
  by `localStorage['sulog:offline']='on'` — default OFF so live users are unaffected. **To finish:**
  test offline on a device with the flag, verify it doesn't disturb Google-OAuth / iOS, then flip
  the default on. Vercel serves `/manifest.webmanifest`, `/sw.js`, `/icons/*` via `vercel.json`.
- [ ] **Phase 2 — durable storage.** Move course cache + progress + settings from localStorage to
  **IndexedDB** + `navigator.storage.persist()`. This retires the iOS-eviction bug class — very
  likely the real fix for the fresh-login bug above.
- [ ] **Phase 3 — write outbox + reconnect flush.** Queue offline progress deltas; flush on the
  `online` event / next launch (merge-on-pull already handles multi-device conflicts).
- [ ] **Phase 4 — graceful degradation.** Online-only screens (dictionary DB search, review queue,
  Ask Ella, classroom dashboards) show "needs connection" instead of erroring.

## 🗣️ Pronunciation review — Malay-vs-Waray gap automation

*(Replaces the old "pronunciation practice" item — that already exists.)*
On Apple devices the TTS fallback voice is **Malay (ms-MY)**, so Waray words are read with Malay
letter→sound rules. We add per-word `dictionary.spoken` overrides where that's wrong (`mga`→"manga",
`hi`→"he"). **Goal: automate finding WHERE Malay mispronounces Waray so we don't hand-hunt ~1000
words.** Approach (rule-based, no audio needed):
- [ ] Model the **Malay reading** of each Waray headword (Malay grapheme→phoneme rules) and diff it
  against our **Waray reference** (the stress-marked `pronunciation` guide we already generate).
  Where they diverge → flag as a likely-mispronounced candidate.
- [ ] Cheap first pass: **pattern scan** for known Malay-TTS trouble spots — `ng`/`mga` clusters,
  word-initial `ng`, glottal-stop hyphens (`madig-on`), doubled vowels, `w`/`y` glides, `-an`/`-on`
  endings, non-Malay-default stress. Produces a ranked review queue.
- [ ] Feed the ranked list into the existing A/B override editor for quick authoring; harvest via
  `harvest:spoken`. **Caveat:** overrides are specific to the *fallback language*, so this only
  fixes the Apple/Malay case — Windows/Android differ (see TTS below).

## ✨ Progress tab — motivation / eye candy

The Progress popup is now honest data (proficiency climb + daily work bars) but it's plain. Make it
*motivating* — the screen a learner opens to feel good and come back:
- [ ] Celebrate milestones: crossing a CEFR band (A0→A1), streak landmarks (7/30/100 days), "N words
  mastered" round numbers — a moment (confetti/animation/badge), not just a number ticking.
- [ ] Richer proficiency viz: the band climb with the next milestone in sight ("12 more words to A1"),
  maybe the rising-tide metaphor animated as mastery grows.
- [ ] Momentum signals: "best week yet", "▲ up N pts", "on a roll" states; make the work bars feel
  rewarding (fill/settle animation, today highlighted).
- [ ] Streak protection nudge ("keep your 5-day streak — 1 quick review"), and a gentle comeback if
  a streak breaks.
- [ ] Consider a shareable progress card. Keep it tasteful, not slot-machine-y — respect the learner.
- [ ] Guard the data honesty we just fixed: no fake numbers, and empty/early states should still feel
  encouraging ("your climb starts here"), not broken.

## 🧹 UI cleanup — hamburger menu / submenus

Current drawer (☰) rows: **Account · Settings · My Class** (instructor) **· Review queue**
(reviewer/admin) **· Request · Admin console**; bottom bar = **Dictionary · Progress** (slide-up
sheets). Concrete issues found in the redesign audit:

- [ ] **Back-nav inconsistency** — a drawer subpage's Back should return to the **drawer**, not to
  home. Several still go home: Settings (`onBack → setView("home")`), Review queue / Ella, and
  others. Only ~9 of the subpages use `ctx.backToMenu`. Audit every `TopBar onBack` for
  drawer-launched pages and route them back to the drawer.
- [ ] **Settings scope creep** — finalized scope is **Language · Course · Dialect · Sound only**,
  but Settings still links to: **Pronunciation guide** ("How Waray sounds" — should be a Practice
  tip), the **Waray STT test** (dev-only debug page — remove from the learner UI), and the
  **Ella / Review queue** (already its own drawer row — duplicate). Strip these three out.
- [ ] **Duplicate "How Waray sounds" / pronounce entry points** — reachable from two places
  (Settings and another view). Consolidate, and fold it into **Practice as a collapsible tip**
  (cross-ref the TTS section).
- [ ] **Remove the Waray STT test debug page** from the shipped/learner build entirely.
- [ ] **Subtitle mismatches** — Settings "dialect" subtitle; Admin console "quality" subtitle.
- [ ] **Verify drawer role-gating** — My Class (instructor), Review queue (reviewer/admin), Admin
  console (admin); Account/Settings/Request always visible.
- [ ] **Delete dead `SetupView`** (also listed under Classroom) — unreachable, remove in build.
- [ ] Confirm the intended affordances hold post-redesign: bottom = Dictionary·Progress only;
  Escape dismisses the slide-up sheets; ⚑ report affordance present on every content surface.

## 🔊 TTS / audio (cross-platform)

- [ ] Test the **Windows / Android** experience (Paul can test Android at Bakhaw). Overrides are
  language-specific, so the Malay-tuned ones won't hold on English/other fallbacks.
- [ ] Evaluate **pre-rendered audio** (or per-language override variants) for consistent
  pronunciation across all devices.
- [ ] Fold "How Waray sounds" into the practice page as a collapsible tip.
- [ ] Waray **speech-to-text** — browser STT has no Waray locale (falls back to Filipino); Whisper
  API is the fallback path.

## 👩 Native review — Ella / reviewers (blocked on people, not code)

- [ ] Confirm the **AI-filled Waray**: L20 review test + examples (35 sides) and L15 `hin duro`
  gate (10) — English→Waray items first. Queued in `docs/ella-todo-synth-audit.md` §C/§D.
- [ ] The **~420-sentence synth audit** worklist (verify site ✎ marks).
- [ ] **BFC stories** — 7 dialectal stories dropped, pending correction.
- [ ] Dictionary confirmations / `madig-on`-style gloss questions.

## 🛠️ Engineering / correctness

- [ ] `npm run check` flakiness — the Supabase pooler cancels heavy scratch reads (`57014`). Add a
  retry wrapper around the enrichment `execSync` steps so a transient cancel re-runs the step.
- [ ] `checkAnswer` edge cases (slash-in-phrase, fully-parenthesized targets).
- [ ] Gate-retry grade inflation — "Review missed" can pass a failed gate.
- [ ] `fetchReviewList` 1000-row cap.
- [ ] Rename-sweep leftovers: internal identifiers (`.gloss` keys, `SEED`/`MARKER_GLOSS` consts) and
  legacy `docs/word-bank/` filenames (`gloss-reply.json`, `gloss-extra.js`).
- [ ] Repo-size hygiene — committed `index.html` history.

## 🔬 Research track — from the Voltz meetings (deferred; never gates the class)

These have their own tollgates and don't block Aug 17. Grouped by workstream.

### ③ Voltz's 80k-word dictionary
- [ ] **Inject the 80k dictionary** into the schema (LAYER onto `meanings`, don't clobber Tramp/PC).
- [ ] **Build a Waray POS-tagging tool.** Evaluate/adapt **calamanCy** (the open-source *Tagalog*
  spaCy pipeline) as a **TEMPLATE only** — it's Tagalog, not Waray, so it's a starting structure,
  not a drop-in. This is "the tagging tool based on the open-source Tagalog one."
- [ ] **Tagging loop** = freq-first + dictionary-lookup bootstrap + **LLM-proposes / Voltz-confirms**
  — the same human-in-the-loop as the Ella review queue. (And per the strategic insight, the
  classroom native-capture feeds this loop.)
- [ ] **Reconcile** the three dictionaries — Voltz's 80k ↔ Tramp/Zorc ↔ the PC/live dictionary.
- [ ] **Corpus + news sources** for coverage; corpus access (corporaproject.org login) for exact
  1→1000 frequency ranks (email sent 2026-06-23, awaiting reply).

### ④ Grammar book → codified rules → NLP
- [ ] **Grammar book → codified DB rules → better NLP/translator** — the definitive source on Waray
  formation. **Blocked on the PDF** (~week of 2026-07-27); Voltz himself said "wait" on the NLP
  piece.

### Pronunciation engine (Voltz's linguist note)
- [ ] **Waray stress = vowel LENGTH + pitch, not just loudness.** The current stress detector sums
  energy per syllable (duration partly baked in, tangled with loudness; no pitch). Options: add
  **pitch/F0** and **calibrate the weights on NATIVE reference recordings** (Voltz/Ella) instead of
  blind tuning. *(The cheap-win slice — per-syllable ms + "lengthen the stressed vowel" — was
  promoted to the Aug-17 critical path above. This entry is the fuller engine.)*

### Curriculum
- [ ] Possible **frequency-first + CEFR** curriculum retool (keep the lesson/unit engine).

---

## ✅ Recently shipped (this session, 2026-07)

- Fresh-login progress fix — course-reload race gate + pull retry *(now looks resolved, 2026-07-29)*.
- L20 review test + examples restored (35 AI-filled sides, pending Ella).
- L15 exit gate restored (10 AI-corrected `hin duro` sentences, pending Ella).
- Marker/cloze drill fix (blanks internal markers); seed classifier tightened; empty-block prune +
  build warnings (empty sections, duplicate printed page numbers).
- Verify page: fixed scan-page off-by-one; scan-index-vs-printed-page made explicit.
- Rename sweep: `seed→course`, `gloss→meaning`, `carve→sections` (files + refs + README).
- Dropped orphan `tts_overrides` table; TTS override moved onto `dictionary.spoken`.
- Pronunciation review report (`docs/notes/pronunciation-malay-vs-waray-report.md`) — decoded
  Oyzon's diacritic key + Malay-TTS gap classes; **no pronunciation data changed** (report-only).
- PWA Phase 1 groundwork — manifest + icons live (installable); service worker staged opt-in.
