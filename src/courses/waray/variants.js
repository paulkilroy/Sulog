/* Variant + multi-word-expression map for Waray.
   - VARIANTS: single-word spelling/dialect variants → the canonical (taught) form.
     Used for the reader's tap-to-define, for "new word" highlighting, AND for coverage
     credit (knowing the canonical lights up its variants).
   - CHUNKS: multi-word expressions → an idiomatic English definition. The reader does a
     LONGEST-MATCH (maximal munch) so "may ada" is defined as one unit ("there is / has")
     instead of word-by-word.

   STARTER SET — every entry here is a hypothesis to be verified with a native speaker (Ella).
   Keys are normalized (lowercase, no accents). Add liberally; correctness gates on review. */

export const VARIANTS = {
  di:    "diri",    // clipped negator ("di ako maaram" = I don't know)
  mayda: "may",     // fused existential (may + ada) → "there is / has"
  kon:   "kun",     // dialectal "if / when"
  san:   "han",     // dialectal genitive marker
  sa:    "ha",      // dialectal locative marker
  wara:  "waray",   // dialectal "none / nothing" (CHED notes this variant)
  gihap: "gihapon", // common clipping of "also / still"
  // dialect/clitic variants that fold to a standard form we already define (verify w/ Ella)
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
  karuayag: "karuyag", // scanning-error spelling of "karuyag" (want / like)
};

// curated glosses that WIN over Tramp/lexicon — for function words Tramp glosses badly,
// and a few common words a 1991 dictionary lacks. (Applied in build-stories.) Verify w/ Ella.
export const DEFINITION_FIX = {
  la:    "just / only",
  man:   "(softener / emphasis)",
  pirmi: "always",
  silot: "punishment",
  sano:  "when (san-o)",          // function word absent from parsed Tramp
  po:    "(polite particle)",     // borrowed politeness marker, used in dialogue
  opo:   "yes (polite)",          // "oo po" — polite yes
  nala:  "already / just (na la)",// particle fusion na+la
  dawla: "just / only (daw la)",  // particle fusion daw+la
  // modern Spanish/English loans a 1991 dictionary can't have (verify w/ Ella)
  puwede: "can / may / allowed",  puydi: "can / may / allowed",  pwede: "can / may / allowed",
  paborito: "favorite",
  eksperyensya: "experience",
  timprano: "early (Sp. temprano)",
  simple: "simple",
  protocol: "protocol",
  bilding: "building",
  residente: "resident",
  singko: "five (number)",

  // English words set inside a Waray story (code-switching) — flag as English so the
  // learner reads them as-is and they don't show up as "missing Waray vocabulary".
  rock: "rock (English)",            proud: "proud (English)",
  tourist: "tourist (English)",      spot: "spot (English)",
  television: "television (English)",pushcart: "pushcart (English)",
  light: "light (English)",          ribbon: "ribbon (English)",
  cake: "cake (English)",            ice: "ice (English)",
  cream: "cream (English)",          softdrinks: "soft drinks (English)",
  lollipop: "lollipop (English)",    brush: "brush (English)",
  graduation: "graduation (English)",
  "ma'am": "ma'am (English; polite address, ~po)",

  // onomatopoeia / interjections
  eeeeennnngggg: "(sound effect)",  eeennngggg: "(sound effect)",
  wusssssss: "(whoosh)",            rawrrrrrrrr: "(roar)",
  huhuhu: "(sobbing)",              hmmmmm: "(thinking…) hmm",
  yehey: "yay! (cheer)",

  // standalone TAM prefixes split from their verb (scanning artifact) — name the tense
  nag: "(verb prefix — completed/past action)",
  mag: "(verb prefix — future/intended action)",
  pag: "(verb prefix — gerund / imperative)",

  // misc fixes from the corrections pass
  nay: "(woman's nickname; also ma'am / mother)",
  "nakikit-an": "is seen / visible (from kita = see)",
};

export const CHUNKS = {
  "may ada":       "there is / has",
  "waray ada":     "there is none / nothing",
  "waray sapayan": "you're welcome",
  "pasensya na":   "sorry / excuse me",
  "hain an":       "where is the …",
  "hain iton":     "where is that …",
};

// The GRADE-RELEVANT regional/colloquial forms (a curated subset of VARIANTS — spelling/OCR
// variants like "sigi/karuayag" stay reader-only). Each is an individually checkable setting in
// the Language door; presets bulk-select. Region attribution is community-reported and coarse —
// refine with native speakers as we learn (the CHED standard is Leyte/Tacloban-based, so the
// "standard" preset checks none).
// rel + canon render as prose ("di — short for *diri* (not)"); no arrow shorthand in the UI
export const DIALECT_FORMS = [
  { k: "di",    rel: "short for", canon: "diri",    definition: "not" },
  { k: "wara",  rel: "for",       canon: "waray",   definition: "none / did not" },
  { k: "sin",   rel: "for",       canon: "hin",     definition: "a/some, object marker" },
  { k: "san",   rel: "for",       canon: "han",     definition: "of/the, object marker" },
  { k: "sa",    rel: "for",       canon: "ha",      definition: "to/at/in" },
  { k: "gihap", rel: "short for", canon: "gihapon", definition: "also/still" },
  { k: "mayda", rel: "fused",     canon: "may ada", definition: "there is / has" },
  { k: "siya",  rel: "for",       canon: "hiya",    definition: "he/she" },
  { k: "sino",  rel: "for",       canon: "hin-o",   definition: "who" },
  { k: "digto", rel: "for",       canon: "didto",   definition: "there, far" },
  { k: "kon",   rel: "for",       canon: "kun",     definition: "if/when" },
  { k: "ak",    rel: "clipped",   canon: "akon",    definition: "my" },
];
export const DIALECT_PRESETS = {
  standard: { label: "Standard · Tacloban", forms: [] },
  daram:    { label: "Daram · rural Samar", forms: ["di", "wara", "sin", "san", "sa", "gihap", "mayda", "siya", "sino", "digto", "kon", "ak"] },
};
