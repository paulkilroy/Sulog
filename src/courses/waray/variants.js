/* Variant + multi-word-expression map for Waray.
   - VARIANTS: single-word spelling/dialect variants → the canonical (taught) form.
     Used for the reader's tap-gloss, for "new word" highlighting, AND for coverage
     credit (knowing the canonical lights up its variants).
   - CHUNKS: multi-word expressions → an idiomatic English gloss. The reader does a
     LONGEST-MATCH (maximal munch) so "may ada" is glossed as one unit ("there is / has")
     instead of word-by-word.

   SEED SET — every entry here is a hypothesis to be verified with a native speaker (Ella).
   Keys are normalized (lowercase, no accents). Add liberally; correctness gates on review. */

export const VARIANTS = {
  mayda: "may",     // fused existential (may + ada) → "there is / has"
  kon:   "kun",     // dialectal "if / when"
  san:   "han",     // dialectal genitive marker
  sa:    "ha",      // dialectal locative marker
  wara:  "waray",   // dialectal "none / nothing" (CHED notes this variant)
  gihap: "gihapon", // common clipping of "also / still"
};

export const CHUNKS = {
  "may ada":       "there is / has",
  "waray ada":     "there is none / nothing",
  "waray sapayan": "you're welcome",
  "pasensya na":   "sorry / excuse me",
  "hain an":       "where is the …",
  "hain iton":     "where is that …",
};
