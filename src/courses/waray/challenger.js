/* Waray (Challenger · Daram) — a Gemini-designed, Duolingo-style course for older
   US adults relocating to Daram, Samar. PHASE 1 ingested (u1–u5, ~40 words); later
   phases pending generation. Same card shape as the other Waray courses:
   [deck, waray, english, subtext, respelling]. Curriculum references cards by Waray.

   DIALECT NOTE: Gemini proposed the Samar nominative marker "in"/"it" where standard
   Waray uses "an". We ingested with the SAFE standard "an" pending Ella's ruling — see
   the Ask Ella panel ([[ella-questions]]). "hin" (obj marker) kept as Gemini had it. */

export const SEED_CH = [
  // u1 — Greetings and Your Name
  ["ch1", "maupay", "good", "", ""],
  ["ch1", "aga", "morning", "", ""],
  ["ch1", "kulop", "afternoon", "late lunch through late afternoon", ""],
  ["ch1", "gab-i", "evening / night", "glottal stop before the i", ""],
  ["ch1", "kamusta", "how are you / hello", "also spelled kumusta", ""],
  ["ch1", "ako", "I", "", ""],
  ["ch1", "hi", "(personal name marker)", "goes right before a person's name", ""],
  ["ch1", "ikaw", "you", "", ""],
  // u2 — Finding People and Saying Yes/No
  ["ch2", "oo", "yes", "", ""],
  ["ch2", "diri", "no / not", "often shortened to 'di' in Daram", ""],
  ["ch2", "hain", "where", "for locating people or things", ""],
  ["ch2", "aadi", "here (near me)", "", ""],
  ["ch2", "aada", "there (near you)", "", ""],
  ["ch2", "didto", "over there (far from both)", "", ""],
  ["ch2", "hiya", "he / she", "no gender marking", ""],
  ["ch2", "dadi", "come here", "confirm w/ Ella (vs kadi / kani)", ""],
  // u3 — Your House and Family
  ["ch3", "asawa", "spouse", "husband or wife", ""],
  ["ch3", "anak", "child", "", ""],
  ["ch3", "nanay", "mother", "", ""],
  ["ch3", "tatay", "father", "", ""],
  ["ch3", "balay", "house / home", "", ""],
  ["ch3", "an", "the / a (noun marker)", "standard marker; Gemini suggested 'in' — see Ask Ella", ""],
  ["ch3", "akon", "my / mine", "", ""],
  ["ch3", "Balite", "Balite (a village in Daram)", "place name", ""],
  // u4 — Asking for Food and Drink
  ["ch4", "gusto", "want / like", "", ""],
  ["ch4", "tubig", "water", "", ""],
  ["ch4", "kape", "coffee", "", ""],
  ["ch4", "alayon", "please / kindly", "polite request", ""],
  ["ch4", "kaon", "eat", "", ""],
  ["ch4", "inom", "drink", "", ""],
  ["ch4", "kan-on", "cooked rice", "", ""],
  ["ch4", "hin", "some / (object marker)", "Samar variant: sin", ""],
  // u5 — Counting and Buying Snacks
  ["ch5", "usa", "one", "", ""],
  ["ch5", "duha", "two", "", ""],
  ["ch5", "tulo", "three", "", ""],
  ["ch5", "pira", "how many", "", ""],
  ["ch5", "tagpira", "how much (each)", "market price question", ""],
  ["ch5", "palit", "buy", "", ""],
  ["ch5", "mapalit", "will buy", "", ""],
  ["ch5", "pesos", "pesos", "currency", ""],
];

export const FORGOTTEN_CH = new Set();

export const CHALLENGER = [
  {
    id: "cp1", name: "First Steps in Daram",
    hint: "Greetings, people, home, food, and small purchases",
    units: [
      { id: "cu1", name: "Greetings & Your Name", hint: "Greet people and say your name", lessons: [
        { id: "cu1l1", title: "Times of Day", items: ["maupay", "aga", "kulop", "gab-i"] },
        { id: "cu1l2", title: "Who You Are", items: ["ako", "hi", "ikaw", "kamusta"] },
      ] },
      { id: "cu2", name: "Finding People & Yes/No", hint: "Answer simply, point out where someone is", lessons: [
        { id: "cu2l1", title: "Yes, No & Where", items: ["oo", "diri", "hain", "hiya"] },
        { id: "cu2l2", title: "Here & There", items: ["aadi", "aada", "didto", "dadi"] },
      ] },
      { id: "cu3", name: "Your House & Family", hint: "Family and the home", lessons: [
        { id: "cu3l1", title: "Family", items: ["asawa", "anak", "nanay", "tatay"] },
        { id: "cu3l2", title: "At Home", items: ["balay", "an", "akon", "Balite"] },
      ] },
      { id: "cu4", name: "Food & Drink", hint: "Ask for water, coffee, food", lessons: [
        { id: "cu4l1", title: "Wants & Politeness", items: ["gusto", "tubig", "kape", "alayon"] },
        { id: "cu4l2", title: "Mealtime", items: ["kaon", "inom", "kan-on", "hin"] },
      ] },
      { id: "cu5", name: "Counting & Buying", hint: "Count and ask prices", lessons: [
        { id: "cu5l1", title: "One, Two, Three", items: ["usa", "duha", "tulo", "pira"] },
        { id: "cu5l2", title: "At the Store", items: ["tagpira", "palit", "mapalit", "pesos"] },
      ] },
    ],
  },
];

// every Phase-1 word is A0 — used by the proficiency engine for Challenger-only words
export const CH_LEVELS = {};
for (const r of SEED_CH) CH_LEVELS[r[1]] = "A0";
