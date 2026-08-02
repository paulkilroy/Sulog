# Sulog — TODO

**Hard deadline: Voltz classroom, Aug 17 2026.** Last updated 2026-08-02.

---

## 🧪 To Test (built, needs verification)

- [ ] **Cross-device sync** (durable session shipped) — time test: leave the iPhone ~1 week →
  Account still signed in + "cards from cloud" without re-auth = fixed. Signed out = dig deeper
  (alt suspect: home-screen storage partitioning).
- [ ] **Classroom end-to-end** — real accounts in every role: student joins by class code → flags a
  lesson → instructor sees the class → reviewer answers → admin approves. (Voltz asked to register
  as instructor — this is that test.)
- [ ] **Review loop round-trip** — Native Speaker Review: answer an a/b/other question → Admin
  Review: approve → Change history shows the chain → next rebuild harvests it into the lesson.
  58 questions live in the queue now.
- [ ] **applyFix version bump** — approve a dictionary fix → other devices pick it up (courses.version).
- [ ] **Offline service worker** — test with `sulog:offline=on` incl. Google OAuth on iOS, then
  flip the default ON.
- [ ] **Windows / Android TTS** (Bakhaw) — the Malay-tuned overrides won't hold on other fallbacks.

## 🎓 Aug 17 — remaining build work

- [ ] **Student detail screen** — the dashboard half is DONE (class card + join code, class
  unit-test average headline, per-student rows w/ mastered·units·test-avg, flags list). Missing:
  tap a student → their drill-in (per-unit test scores, streak/activity, mastered, their flags).
- [ ] **Stressed-vowel coaching** *(Voltz critical path)* — show per-syllable duration (ms) + coach
  "lengthen the stressed vowel" (Waray stress *is* vowel length; guides already mark the syllable).
- [ ] **Schema-shaped word capture** — the word report panel collects real `meanings` fields
  (definition · POS · pronunciation · register · dialect · example · certainty) so an approved
  validation loads straight in. *(= Voltz's 80k-dictionary tagging pipeline — the class IS the
  dictionary's data source.)*
- [ ] **Dictionary auto-mutation** — exactly 3 approval-gated ops on `meanings`, never clobber:
  add-meaning (pending row) · primary/rare (`ord`) · wrong (`disputed` flag, never delete). If it
  grows past 3 ops pre-launch, cut back to capture-only.
- [ ] **Quality-by-module board** — green/amber/red per module from unresolved flags + native
  coverage + rejections + pass-rates.
- [ ] Delete dead `SetupView`.
- [ ] **TG3 pilot dry-run** — Voltz + 2–3 students, ~week of Aug 10.

## 🐛 Bugs / small fixes

- [ ] Gate-retry grade inflation — "Review missed" can pass a failed gate.
- [ ] `checkAnswer` edge cases (slash-in-phrase, fully-parenthesized targets).
- [ ] `npm run check` flakiness — pooler cancels heavy reads (57014); add a retry wrapper.
- [ ] `build-stories.mjs` broken (imports never-committed `gloss-extra.js`) — blocks regenerating
  the reader's DEFINITIONS map (and the prepared loanword definitions).
- [ ] `maalsom` → `maaslom` spelling (PC OCR metathesis; keep the `ma-`; DB edit).

## 🚀 Post-launch / future

- [ ] **Senior Reviewer role** — browse + triage the queue, propose-only; admin still decides.
- [ ] **Course Admin vs Super Admin split** — Course Admin owns content approvals; Super Admin
  (Paul) owns roles/config/version ops. Retires the hardcoded-email admin check. Ladder:
  student → reviewer → senior reviewer → course admin → super admin.
- [ ] **Live lesson-content mutation** — approvals apply to lessons immediately (retires
  harvest-at-rebuild).
- [ ] **Offline Phases 2–4** — course/progress cache → IndexedDB + `storage.persist()`; offline
  write outbox + reconnect flush; "needs connection" states for online-only screens.
- [ ] **Progress tab motivation** — milestone celebrations (band/streak/mastery landmarks),
  band-climb viz ("12 words to A1"), streak nudges. Tasteful, honest, no slot-machine.
- [ ] **Pre-rendered audio** (or per-language override variants) for consistent TTS everywhere;
  Whisper API as the Waray STT fallback.
- [ ] **BFC stories** — 7 dialectal stories still dropped, pending native correction.
- [ ] Data-model debt: card↔dictionary normalization (pronunciation stored twice) · `topic` is a
  weak first-touch tag · internal rename leftovers (tramp `gloss` key, legacy word-bank filenames) ·
  repo-size hygiene (committed index.html history).

## 🔬 Research track (never gates the class)

- [ ] **80k dictionary** — inject (LAYER onto `meanings`), Waray POS-tagger (calamanCy as a
  Tagalog *template* only), LLM-proposes/Voltz-confirms tagging loop, reconcile the three
  dictionaries (80k ↔ Tramp/Zorc ↔ live), corpus ranks (corporaproject login still pending).
- [ ] **Grammar book → codified rules → NLP** — blocked on the PDF; Voltz said "wait" on NLP.
- [ ] **Pronunciation engine** — stress = length + PITCH: add F0, calibrate weights on native
  reference recordings (the cheap ms-coaching slice is on the Aug-17 list above).
- [ ] **Malay-vs-Waray mispronunciation scan** — rule-based diff of Malay letter-to-sound vs our
  stress guides → ranked `spoken`-override queue (Apple/Malay fallback only).
- [ ] Possible frequency-first + CEFR curriculum retool (keep the lesson/unit engine).

---

## ✅ Recently shipped

- **2026-08-02** — Unified review pipeline end-to-end (user flags + build-emitted a/b/other
  questions → Native Speaker Review → Admin Review → apply/harvest, chained into the rebuild;
  58 questions live) · Admin **Users table** (provider/roles/streak/answers/mastered, security-definer
  RPC) · applyFix bumps course version · queue renames + emoji sweep finished.
- **2026-08-01** — **Unified header** on every screen ([back] title [Flag][Mic/KB][☰]) + app-level
  drawer and bottom bar (Dictionary·Sounds·Progress persist through lessons) · dead-page purge
  (Language&course, STT test, standalone native-review pages; course preview embedded in Admin;
  Top-1000 coverage its own page) · reviewer semantics locked + flag weighting · durable auth
  session (IndexedDB) · aircon-era STT floor reverted · Stress Check recording fixed (WAV capture
  + element playback).
- **2026-07-30/31** — Full Tramp&Zorc dictionary (25.5k) searchable in-app + offline via IndexedDB ·
  "Taught in Lesson X" badge · Safari stuck-load fixed (lean bundle) + fast parallel load + load
  bar · iOS launch splashes · dictionary sheet keyboard fixes.
- **Earlier 2026-07** — fresh-login race fix · L20/L15 restorations (AI-filled, pending native) ·
  marker-drill fix · PWA phase 1 (installable, opt-in SW) · rename sweep (SEED→CARDS,
  deck→topic, say→pronunciation, gloss→definition) · data-model docs in schema.sql + README.
