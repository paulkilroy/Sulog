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

## Notes / non-cases
- **"Sige" = "okay"** heard correctly (`okay` is in the gloss "Okay / go ahead"), so the
  *matching* is fine there — that screen's issue was a UI bug (below), not a false negative.

## Known voice-mode UI bug (separate from matching)
- **Symptom:** in voice mode a card can get **stuck showing the listening UI with the
  heard text but no verdict / no "Continue" / "I was right" buttons** — you can only tap
  Repeat. The buttons appear after navigating away and back.
- **Likely cause:** the recognizer ended with only an *interim* result and no `isFinal`,
  so `onend` set idle but never called `judge()` → the card never leaves the un-judged
  state → no Verdict (and no override button) renders.
- **Fix candidate (deferred):** on `onend` with no final but a non-empty interim, judge
  on the interim (or fall back to showing the keyboard input / a "submit what I said"
  action) so the card always reaches a verdict.
