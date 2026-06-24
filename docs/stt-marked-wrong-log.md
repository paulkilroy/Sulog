# STT — "correct but marked wrong" log

A running log of cases where the spoken answer was **correct** (right pronunciation /
valid meaning) but the matcher marked it **wrong** — i.e. false negatives. Not fixing
the matcher yet (the "I was right" override covers it in the moment); collecting cases
here so a future matcher pass is driven by real data, not guesses. Paste the copyable
speech-debug here when it happens.

## Open cases

### 1. "Maupay nga udto" (Good noon) — marked wrong
- **Expected (folded):** `maupay nga udtu`
- **Heard guesses:** "maupa na udo" · "maupan na udo" · "maupa nauto" · "moopay na udo"
- **Why it failed:** three 1-char per-word slips at once — `maupay→maupa` (drop y),
  `nga→na` (drop g, the linker), `udto→udo` (drop t). Whole-string edit distance =
  3, but tolerance caps at 2 for long targets → miss.
- **Root causes:** (a) long phrases accumulate per-word errors past a fixed tolerance;
  (b) the linker **`nga` is heard as `na`** constantly (g-drop), and `nga` is too short
  (3 chars → tolerance 0) to ever fuzzy-match `na`.
- **Fix candidates (discussed, deferred):** token/word-level matching (each target word
  fuzzy-matches some heard word — scales with phrase length) + treat the linker leniently
  (fold `ng→n`, or ignore `nga` as a stopword). Open question: apply everywhere vs only
  in voice/drill mode (keep graded unit reviews order-strict).

### 2. "Pasensya na" → answered **"I'm sorry"** — marked wrong
- **Answer (gloss):** `Sorry / excuse me`  · **Given:** `I'm sorry`
- **Why it failed:** different flavor from #1 — this is the **English answer side**, not
  Waray pronunciation. Gloss alternates are `sorry` and `excuse me`; "I'm sorry" carries
  an extra `I'm` → `im sorry` vs `sorry` is edit-distance 3, over tolerance → miss.
- **Root cause:** natural English phrasings add a leading pronoun+be ("**I'm** sorry",
  "**I** want", "**it's** good") that the bare gloss lacks. `checkAnswer` strips leading
  `to/a/an/the` but not `I'm/I am/it's`.
- **Fix candidates:** (a) add "I'm sorry" to this card's gloss alternates; (b) general —
  strip leading `I'm / I am / it's / it is` for English answers, and/or accept when the
  answer *contains* the gloss (the English mirror of the Waray "contained" tier). Watch
  false positives on very short glosses.

## Notes / non-cases
- **"Sige" = "okay"** heard correctly (`okay` is in the gloss "Okay / go ahead"), so the
  *matching* is fine there — that screen's issue was a UI bug (below), not a false negative.

## Voice-mode UI bug — FIXED 2026-06-24
- **Symptom:** in voice mode a card can get **stuck showing the listening UI with the
  heard text but no verdict / no "Continue" / "I was right" buttons** — you can only tap
  Repeat. The buttons appear after navigating away and back.
- **Likely cause:** the recognizer ended with only an *interim* result and no `isFinal`,
  so `onend` set idle but never called `judge()` → the card never leaves the un-judged
  state → no Verdict (and no override button) renders.
- **Fix (shipped):** on `onend`/`onerror` with no final but a non-empty interim, judge
  on the interim (or fall back to showing the keyboard input / a "submit what I said"
  action) so the card always reaches a verdict.
