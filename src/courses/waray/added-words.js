/* Words added from gap analysis (also cards in cards.js).
   frequency.js slots these into each unit's ① Words (≤2 fold into the last words lesson;
   ≥3 become a "More common words" lesson). First-pass placement — verify with use. */
export const ADDED_WORDS = {
  // Duolingo gap (earlier pass)
  "u4":  ["kuya", "ate", "tiya", "tiyo", "ngaran"],
  "u31": ["kape", "gatas", "tinapay", "sorbetes", "duga", "kahel", "pinya", "pakwan"],
  "u21": ["pitaka", "relo", "bag", "kalo", "butang", "klase"],
  "u24": ["hotel", "barangay", "eskwelahan", "bungto"],
  "u5":  ["arte", "musika"],
  "u1":  ["alayon"],
  // Frequency gap (2026-06-25) — high-freq glue + core words from the CHED top-1000
  "u12": ["may", "tanan", "damo", "iba"],         // existential + quantifiers (X is Y)
  "u13": ["kun", "pero", "tungod", "para"],        // connectives (with the question words)
  "u14": ["duro", "gihapon", "tikang", "bisan", "sugad", "kada", "basi"], // particles/linkers
  "u16": ["maaram", "buot"],                       // know / want (with can/must)
  "u6":  ["dako"],                                  // big (with describing people)
  "u33": ["una"],                                  // first (with numbers)
  "u8":  ["ni", "kan"],                            // personal markers (with hi / an / it)
};
