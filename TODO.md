# Sulog — TODO

Working backlog. **Hard deadline: Voltz classroom platform, Aug 17 2026.**
Last updated 2026-07-29. Checked items move to "Recently shipped" at the bottom.

---

## 🔴 Bugs / blockers

- [ ] **Fresh-login progress STILL broken.** Signing in fresh (iPhone) shows no progress despite
  plenty existing. The 2026-07-28 fix (defer the course-reload until the pull settles + retry
  `syncPull` 3×) did **not** resolve it — Paul retested and it still happens. Dig deeper.
  Leading suspects, in order: (1) **iOS Safari storage eviction** — localStorage wiped by ITP, so
  the persisted Supabase session / cached progress is gone on reopen (this is why the Offline/PWA
  → IndexedDB work below likely *fixes this too*); (2) auth token not attached when the pull fires
  (RLS silently returns 0 rows); (3) wrong/second account. Add real telemetry (log pull row-count +
  auth state) rather than guessing.
- [ ] **Test the classroom view end-to-end.** It's built but unverified with real sign-ins (RLS
  only truly exercises when authenticated). Walk every role: student join-by-code, flag a page,
  instructor dashboard + student-detail, reviewer propose, admin approve → dictionary mutation.

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
- [ ] **Delete dead `SetupView`** (unreachable) during app-code work.
- [ ] Roles: Student · Instructor · Reviewer · Admin (one admin for now, no trust tiers).
- [ ] **TG3:** pilot dry-run with Voltz + a few students ~1 week before Aug 17.

## 📴 Offline mode / PWA

Goal: launch and practice with no signal; sync progress when back online. Learner core (lessons,
drills, reader, TTS, progress) already caches locally — the gaps are the launch shell + storage
durability. Phased:
- [ ] **Phase 1 — PWA shell** (a service worker + web manifest caching the single `index.html` +
  icons). Makes the app installable to the home screen and launchable offline. *(See the response
  where this was requested for a plain-English explanation of "PWA shell".)*
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

## 🧹 UI cleanup

- [ ] **Hamburger menu review** — still a lot of cleanup (overlap, gaps, leftover pages from the
  redesign). Do a full pass over every menu/submenu.
- [ ] Settings "dialect" subtitle mismatch; Admin "quality" subtitle mismatch.

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

## 🔬 Research track (deferred — never gates the class)

- [ ] Corpus access (corporaproject.org login) for exact 1→1000 frequency ranks (email sent
  2026-06-23, awaiting reply).
- [ ] Voltz's **80k-word dictionary** — inject, POS-tag (freq-first + lookup + LLM-proposes /
  Voltz-confirms), reconcile with Tramp/Zorc.
- [ ] **Grammar book → codified DB rules → better NLP/translator** — blocked on the PDF; Voltz said
  "wait" on the NLP piece.
- [ ] Possible **frequency-first + CEFR** curriculum retool (keep the lesson/unit engine).

---

## ✅ Recently shipped (this session, 2026-07)

- Fresh-login race fix + pull retry *(did not fully resolve — reopened above)*.
- L20 review test + examples restored (35 AI-filled sides, pending Ella).
- L15 exit gate restored (10 AI-corrected `hin duro` sentences, pending Ella).
- Marker/cloze drill fix (blanks internal markers); seed classifier tightened; empty-block prune +
  build warnings (empty sections, duplicate printed page numbers).
- Verify page: fixed scan-page off-by-one; scan-index-vs-printed-page made explicit.
- Rename sweep: `seed→course`, `gloss→meaning`, `carve→sections` (files + refs + README).
- Dropped orphan `tts_overrides` table; TTS override moved onto `dictionary.spoken`.
