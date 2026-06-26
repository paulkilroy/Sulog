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
  // dialect/clitic variants that fold to a standard form we already gloss (verify w/ Ella)
  ka:    "ikaw",    // short 2nd-person form
  sin:   "hin",     // dialectal indefinite marker
  siya:  "hiya",    // dialectal "he / she"
  sino:  "hin-o",   // dialectal "who"
  digto: "didto",   // dialectal "there"
  aada:  "ada",     // "is present / there is"
  ak:    "akon",    // clipped "my / mine" (ak')
  tak:   "akon",    // clitic clip of "akon" ("tak lawas" = my body)
  sigi:  "sige",    // e→i spelling variant of "sige" (okay / go ahead)
  storya: "istorya",// clipped "story" (BFC boilerplate form)
};

// curated glosses that WIN over Tramp/lexicon — for function words Tramp glosses badly,
// and a few common words a 1991 dictionary lacks. (Applied in build-stories.) Verify w/ Ella.
export const GLOSS_FIX = {
  la:    "just / only",
  man:   "(softener / emphasis)",
  pirmi: "always",
  silot: "punishment",
  sano:  "when (san-o)",          // function word absent from parsed Tramp
  po:    "(polite particle)",     // borrowed politeness marker, used in dialogue
  opo:   "yes (polite)",          // "oo po" — polite yes
  nala:  "already / just (na la)",// particle fusion na+la
  dawla: "just / only (daw la)",  // particle fusion daw+la
};

export const CHUNKS = {
  "may ada":       "there is / has",
  "waray ada":     "there is none / nothing",
  "waray sapayan": "you're welcome",
  "pasensya na":   "sorry / excuse me",
  "hain an":       "where is the …",
  "hain iton":     "where is that …",
};
