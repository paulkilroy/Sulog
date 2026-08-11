# Sulog — TODO

**Hard deadline: Voltz classroom, Aug 17 2026.** Last updated 2026-08-02.

---

## 🧪 To Test (built, needs verification)

- [ ] **Cross-device sync** (durable session shipped) — time test: leave the iPhone ~1 week →
  Account still signed in + "cards from cloud" without re-auth = fixed. Signed out = dig deeper
  (alt suspect: home-screen storage partitioning).
- [ ] **Full role walkthrough** (one session; = the pre-TG3 shakeout, Voltz registering as
  instructor kicks it off):
  student joins by code → flags a lesson → instructor sees class + student detail →
  reviewer answers an a/b/other question in Native Speaker Review → admin approves in Admin
  Review (dictionary fix AND an exercise answer) → Change history shows the chain → other
  devices pick up the dictionary fix (version bump) → next rebuild harvests the exercise answer.
  58 build questions are live in the queue for this.
- [ ] **Offline service worker** — test with `sulog:offline=on` incl. Google OAuth on iOS, then
  flip the default ON.
- [ ] **Windows / Android TTS** (Bakhaw) — the Malay-tuned overrides won't hold on other fallbacks.
- [ ] **TG3 pilot dry-run** — Voltz + 2–3 REAL students, ~week of Aug 10. Runs AFTER the full
  role walkthrough above passes (walkthrough = our own accounts shake out every role; TG3 = the
  live pilot).

## 🎓 Aug 17 — remaining build work

- [ ] **Transitivity-first Chapter 6 rewrite** *(Aug 5 meeting — Voltz)*: Waray is SCALAR
  transitivity (speaker frames natural / accidental / intentional), not binary — teach the
  concept as the foundation. AI drafts via the course export (tools/export-course.mjs),
  Voltz reviews. Ties into the L5 ma-/-inm- paradigm decision.
- [ ] **About page: partnership text** — Voltz to send his preferred wording; one-line edit.

- [ ] **Detailed / schema Flag capture** — the word report panel collects real `meanings` fields
  (definition · POS · pronunciation · register · dialect · example · certainty) so an approved
  validation loads straight in. *(= Voltz's 80k-dictionary tagging pipeline — the class IS the
  dictionary's data source.)*
- [ ] **Word-sense mutation (3 ops)** — the remaining half of course-content mutation: approval-
  gated ops on `meanings`, never clobber — add-meaning (pending row) · primary/rare (`ord`) ·
  wrong (`disputed`, never delete). Guardrail: capture-only if it sprawls pre-launch. (The
  sentence half shipped 2026-08-02 — see Recently shipped.)
- [ ] **Quality-by-module board** — green/amber/red per module from unresolved flags + native
  coverage + rejections + pass-rates.

## 🚀 Post-launch / future

- [ ] **Senior Reviewer role** — browse + triage the queue, propose-only; admin still decides.
- [ ] **Course Admin vs Super Admin split** — Course Admin owns content approvals; Super Admin
  (Paul) owns roles/config/version ops. Retires the hardcoded-email admin check. Ladder:
  student → reviewer → senior reviewer → course admin → super admin.
- [ ] **Live lesson-content mutation** — approvals apply to lessons immediately (retires
  harvest-at-rebuild).
- [ ] **Offline remainder (c only)** — local working copies → IndexedDB: only protects ANONYMOUS
  users' progress + skips the post-eviction re-download; low stakes for a signed-in class, and it
  touches the synchronous boot path — do deliberately, not casually. ((a) persist()+reconnect
  flush and (b) offline states shipped 2026-08-04.)
- [ ] **Progress tab motivation** — milestone celebrations (band/streak/mastery landmarks),
  band-climb viz ("12 words to A1"), streak nudges, and a **day/week leaderboard** once there are
  real users (opt-in, display-name aware, class-scoped first — instructor sees it too). Tasteful,
  honest, no slot-machine.
- [ ] **AI wrong-answer explanations** — on a miss, an LLM breaks down word-by-word what was right
  and wrong, how to fix it, and crucially "here's how your answer sounded to a native speaker"
  (Paul's Gemini test of exactly this was outstanding feedback). Online-only (API call) — offline
  falls back to today's static verdict; cache explanations per (card, given-answer) so repeat
  misses are free. Cost/latency: only on tap ("explain this"), not every miss.
- [ ] **Adaptive learning — an AI "Needs work" for CONCEPTS, not cards.** Today's Needs work is
  per-card (Leitner box + pinned). The gap: misses that CLUSTER on a pattern across different
  cards — markers (an vs nga vs han), pronoun sets, linkers — never surface as "you have a marker
  problem" (Gemini spotted Paul's an/nga/han confusion from a few pasted misses and offered a
  targeted drill; that's the experience). Path: (1) tag drill items with concepts (markers/
  pronouns/linkers — grammar-block types + topics get partway); (2) aggregate miss rates per
  concept from data we already record (per-card wrong counts + given answers in flag context);
  (3) surface "you keep missing X — drill it?" with a generated concept session; (4) AI layer:
  LLM reads recent misses + given answers, NAMES the pattern in plain words, builds the session.
  Pairs with AI wrong-answer explanations below (same data, same model call).

- [ ] **Native-recorded audio database** *(Aug 5 meeting decision — supersedes "pre-rendered
  TTS audio")*: record native speakers per word, worklist generated from the pronunciation
  guides (phonetic spelling + stress). Replaces machine pronunciation where a recording exists;
  Whisper API stays the Waray STT fallback idea.
- [ ] **BFC stories** — 7 dialectal stories still dropped, pending native correction.
- [ ] Data-model debt: card↔dictionary normalization (pronunciation stored twice) · `topic` is a
  weak first-touch tag · repo-size hygiene (committed index.html history — destructive rewrite,
  needs explicit go). (tramp.json's `gloss` data key stays by decision — boundary field.)

## 🔬 Research track (never gates the class)

- [ ] **80k dictionary** — inject (LAYER onto `meanings`), Waray POS-tagger (calamanCy as a
  Tagalog *template* only), LLM-proposes/Voltz-confirms tagging loop, reconcile the three
  dictionaries (80k ↔ Tramp/Zorc ↔ live), corpus ranks (corporaproject login still pending).
- [ ] **Grammar book → codified rules → NLP** — blocked on the PDF; Voltz said "wait" on NLP.
- [ ] **Pronunciation engine** — stress = length + PITCH: add F0, calibrate weights on native
  reference recordings. Includes the cheap slice (per-syllable ms + "lengthen the stressed vowel"
  coaching) — moved OFF the Aug-17 path 2026-08-02: see how live students + reviewers use the
  existing practice tools first.
- [ ] **Malay-vs-Waray mispronunciation scan** — rule-based diff of Malay letter-to-sound vs our
  stress guides → ranked `spoken`-override queue (Apple/Malay fallback only).
- [ ] **Fuzzy / intent answer matching** *(Voltz aligned, Aug 5 meeting — partner ask, not just
  research)* — accept an answer that's worded differently but means
  the same thing (today's checkAnswer is only mechanically lenient: edit distance, dialect
  variants, o/u·e/i folding — not meaning). Ideas: per-card accepted-alternatives list baked at
  build (LLM proposes, native confirms — same loop as everything else); harvest real student
  answers from "Marked me wrong" flags as the seed data; embedding/LLM similarity as an online
  fallback; UX = "close enough" credit with the canonical answer shown. Watch live class data
  first — the flag_grade queue tells us exactly which right-in-spirit answers get rejected.
- [ ] Possible frequency-first + CEFR curriculum retool (keep the lesson/unit engine).

---

## ✅ Recently shipped

- **2026-08-04** — **Deterministic sweep**: checkAnswer fixed (word-level slashes "his/her book"
  now expand; fully-parenthesized targets no longer unanswerable — unit-tested) · rebuild-check
  retries pooler cancels (57014) · build-stories un-broken (optional extra-defs import) + reader
  definitions REGENERATED with the 11 approved loanword defs (tinidor "fork (Sp. tenedor)" etc.) ·
  `maalsom→maaslom` fixed in source + live DB (footprint was 1 dictionary + 1 meanings row; not
  drilled — no progress impact) + VARIANTS fold · legacy word-bank files renamed
  (gloss-reply→definition-reply) · Offline (a)+(b): `storage.persist()` · reconnect flush (offline practice
  pushes on the 'online' event, gated on the initial-pull arm) · "needs connection" pages for
  Admin Review / Native Speaker Review / My Class / Admin console (router-gated; learner screens
  unaffected — offline dictionary search verified).
- **2026-08-03** — **About page** (the name, LNU partnership, sources, contact form → feedback
  kind 'contact'; mailto fallback signed-out) · **pinch-to-zoom enabled** (dropped maximum-scale=1)
  + bigger drawer menu text · **browser/OS back = in-app back** (history integration, overlays
  dismiss first).
- **2026-08-02** — **Sentence-card fixes end-to-end**: Edit-&-apply branches word (definition) vs
  sentence (live expression update + audit + harvest→sentence-corrections.json→rebuild) — Paul's 4
  real flags now fixable · gate-retry inflation confirmed already fixed (4df6d3e) · Instructor
  dashboard verified done + **student detail drill-in** built (tap a
  roster row → test avg · streak · answers · mastered · per-unit tests · their flags) · Unified
  review pipeline end-to-end (user flags + build-emitted a/b/other
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
