# Sulog — Progress Update for Voltz
*Paul · August 2, 2026 · 15 days to semester start*

**TL;DR: On track for Aug 17.** The classroom platform is built and live in staging. The big news
since we talked: the full feedback-and-review pipeline is done end-to-end — students flag, native
reviewers answer, I approve, and the course updates itself. What's left is the instructor
dashboard, a full walkthrough test, and the pilot dry-run with you.

---

## ① Classroom platform *(Aug 17 — critical)*

- **Roles are live**: Student · Instructor · Reviewer · Admin, exactly as we decided — one admin,
  no trust tiers, reviewers propose / admin decides. Role requests flow through the app and I
  approve them.
- **Sign-in**: Google or magic email link (no password), anonymous-by-default until a student
  needs sync or a class. Sessions now survive iOS's storage eviction — the "my progress
  disappeared" class of bug is closed.
- **Enrollment**: class-code self-signup is built (`join a class` from the Account screen).
  Needs its live walkthrough — on the list below.
- **Still to finish**: the instructor dashboard (headline = unit-test average, pass at 80%, as
  agreed) and the end-to-end test with real accounts in every role.

## ② Feedback loops *(Aug 17 — critical)* — **done, and further than planned**

This is where most of the last two weeks went, and it came out stronger than the meeting spec:

- **Flag anything, anywhere.** Every screen — vocab, drills, grammar guides, exams, stories —
  has the same report control, and every flag auto-captures its context (which item, which
  lesson, which direction, what the student answered). Flags from reviewers are badged and
  sorted to the top of my queue — a native speaker's "this is wrong" counts for more.
- **The review pipeline is one system now.** Two kinds of issues feed the same queue:
  1. **People** flagging things while using the app, and
  2. **The course build itself** filing its own open questions — every exercise whose answer
     still needs a native speaker is a card in the queue, with the candidate answers listed
     *and each one citing its source* (the book, the Tramp-Zorc dictionary, an AI draft).
- **Native reviewers get their own worklist** ("Native Review"): pick answer a, answer b, or
  write your own. I approve or reject each one; approvals go live (dictionary) or ship with the
  next course build (exercise answers) — automatically, with a full audit trail of who suggested,
  who answered, who approved, and what changed. Nothing auto-applies; nothing is ever deleted.
- **58 real questions are queued right now** waiting for a native reviewer — mostly exercise
  answers the original book never provided.

## ③ Your 80k dictionary *(research track — but real movement)*

Two things happened here even though it's officially deferred:

- **The full Tramp & Zorc dictionary (25,000+ words) is now searchable inside the app** — any
  word, meaning + part of speech, and it works offline. Learners are no longer limited to course
  vocabulary.
- **Your online dictionary validated the stress data.** I compared your corpus dictionary's
  pronunciation markers against Tramp & Zorc's printed accents: everywhere they overlap, they
  agree. That means the 1991 accents are trustworthy and we now have a reliable stress reference
  for the course — this had been blocked on messy scans for weeks.
- The strategic point from our meeting stands and is now concrete: **the classroom is the
  dictionary's data pipeline.** The reviewer panel collects real dictionary fields (definition,
  POS, pronunciation, example), so native speakers validating for the class are generating your
  tagging data as a byproduct of teaching.

## ④ Grammar book → codified rules *(research track)*

Waiting on the PDF from your side — no action needed until it arrives, per your "wait" on the
NLP piece.

## Platform quality (alongside the workstreams)

- **Installable app** (add to home screen), offline practice, instant loading after first open.
- One consistent header and navigation on every screen; dictionary, sound guide, and progress
  reachable even mid-lesson.
- Pronunciation practice fixes: recording playback works on iPhone, and the speech detector no
  longer demands robot-loud speech. Your "lengthen the stressed vowel" coaching idea is next on
  the list — the groundwork (reliable stress data) is what the dictionary validation above gave us.

## What I need from you

1. **A reviewer.** Have your native-speaker colleague (or yourself) create an account and request
   the Reviewer role — I'll approve it, and the 58 queued questions are ready to answer. Even a
   handful answered is a perfect live test.
2. **Pilot dry-run (TG3)** — week of **Aug 10**: you plus 2–3 students, join by class code, run a
   lesson, flag something, and I'll walk the flags through the queue live. ~30 minutes.
3. **The grammar PDF**, whenever it lands — no rush.

## Next two weeks

| When | What |
|---|---|
| This week | Instructor dashboard + student detail · enrollment walkthrough · full role-by-role test |
| Week of Aug 10 | **TG3 pilot dry-run with you** · fixes from it · content freeze |
| Aug 17 | Semester start 🌊 |
