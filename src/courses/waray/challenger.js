/* Waray (Challenger · Daram) — a Gemini-designed, Duolingo-style course for older
   US adults relocating to Daram, Samar. PHASE 1 (u1–u5, A0) + PHASE 2 (u6–u11, A1)
   ingested; later phases pending generation. Same card shape as the other Waray courses:
   [deck, waray, english, subtext, respelling]. Curriculum references cards by Waray.

   MARKERS DEFERRED: bare grammatical markers (hi, an/in, hin) make poor standalone
   flashcards — their only "meaning" is a metalinguistic label, which looked wrong as MC
   choices. They're pulled from the drilled deck and belong in phrase/grammar practice
   (not yet ingested). The an-vs-in (Samar) question still stands for Ella — see Ask Ella. */

export const SEED_CH = [
  // u1 — Greetings and Your Name
  ["ch1", "maupay", "good", "", ""],
  ["ch1", "aga", "morning", "", ""],
  ["ch1", "kulop", "afternoon", "late lunch through late afternoon", ""],
  ["ch1", "gab-i", "evening / night", "glottal stop before the i", ""],
  ["ch1", "kamusta", "how are you / hello", "also spelled kumusta", ""],
  ["ch1", "ako", "I", "", ""],
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
  // u5 — Counting and Buying Snacks
  ["ch5", "usa", "one", "", ""],
  ["ch5", "duha", "two", "", ""],
  ["ch5", "tulo", "three", "", ""],
  ["ch5", "pira", "how many", "", ""],
  ["ch5", "tagpira", "how much (each)", "market price question", ""],
  ["ch5", "palit", "buy", "", ""],
  ["ch5", "mapalit", "will buy", "", ""],
  ["ch5", "pesos", "pesos", "currency", ""],

  // ── PHASE 2 · Daily Life in the Neighborhood (A1) ──
  // u6 — Meeting the In-Laws
  ["ch6", "apo", "grandparent / elder", "also any respected elder", ""],
  ["ch6", "mano", "older brother", "respectful title for any older man", ""],
  ["ch6", "mana", "older sister", "respectful title for any older woman", ""],
  ["ch6", "bana", "husband", "vs asawa = spouse", ""],
  ["ch6", "nalipay", "glad / happy", "'glad to meet you'; inflected — confirm w/ Ella", ""],
  ["ch6", "kila", "meet", "as in makakila; confirm w/ Ella", ""],
  // u7 — Everyday Objects in the Yard
  ["ch7", "lingkuran", "chair", "seat or bench", ""],
  ["ch7", "lamesa", "table", "Spanish loan", ""],
  ["ch7", "banga", "clay jar", "stores cool drinking water", ""],
  ["ch7", "kutsara", "spoon", "", ""],
  ["ch7", "tinidor", "fork", "", ""],
  ["ch7", "kadi", "come here / bring", "'pass me / bring that'", ""],
  ["ch7", "brayong", "broom", "coconut-midrib yard broom; confirm w/ Ella", ""],
  // u8 — Where are You Going? (Kain ka?)
  ["ch8", "kain", "where (going)", "Kain ka? = where are you going?", ""],
  ["ch8", "madto", "will go", "go to a far place", ""],
  ["ch8", "pakadto", "heading to", "going toward", ""],
  ["ch8", "tindahan", "store", "the sari-sari store", ""],
  ["ch8", "pantalan", "pier", "", ""],
  ["ch8", "uma", "farm", "fields or plantation", ""],
  // u9 — Talking About the Weather
  ["ch9", "mapaso", "hot", "weather or food", ""],
  ["ch9", "uran", "rain", "", ""],
  ["ch9", "umuuran", "raining", "'it's raining now'; inflected — confirm w/ Ella", ""],
  ["ch9", "hangin", "wind", "also air", ""],
  ["ch9", "mahagkot", "cold", "chilly breeze, cold drink", ""],
  ["ch9", "kamapas", "humid", "sticky coastal heat; confirm w/ Ella", ""],
  ["ch9", "masyado", "very", "amplifier; Tagalog loan — confirm w/ Ella", ""],
  // u10 — Time of Day and Simple Tasks
  ["ch10", "yana", "now / today", "", ""],
  ["ch10", "buwas", "tomorrow", "", ""],
  ["ch10", "nganay", "first", "'for a moment / first'", ""],
  ["ch10", "buhat", "do / make", "tasks, chores", ""],
  ["ch10", "trabaho", "work / job", "Spanish loan", ""],
  ["ch10", "pahuway", "rest", "", ""],
];

export const FORGOTTEN_CH = new Set();

export const CHALLENGER = [
  {
    id: "cp1", name: "First Steps in Daram",
    hint: "Greetings, people, home, food, and small purchases",
    units: [
      { id: "cu1", name: "Greetings & Your Name", hint: "Greet people and say your name", lessons: [
        { id: "cu1l1", title: "Times of Day", items: ["maupay", "aga", "kulop", "gab-i"] },
        { id: "cu1l2", title: "Who You Are", items: ["ako", "ikaw", "kamusta"] },
      ] },
      { id: "cu2", name: "Finding People & Yes/No", hint: "Answer simply, point out where someone is", lessons: [
        { id: "cu2l1", title: "Yes, No & Where", items: ["oo", "diri", "hain", "hiya"] },
        { id: "cu2l2", title: "Here & There", items: ["aadi", "aada", "didto", "dadi"] },
      ] },
      { id: "cu3", name: "Your House & Family", hint: "Family and the home", lessons: [
        { id: "cu3l1", title: "Family", items: ["asawa", "anak", "nanay", "tatay"] },
        { id: "cu3l2", title: "At Home", items: ["balay", "akon", "Balite"] },
      ] },
      { id: "cu4", name: "Food & Drink", hint: "Ask for water, coffee, food", lessons: [
        { id: "cu4l1", title: "Wants & Politeness", items: ["gusto", "tubig", "kape", "alayon"] },
        { id: "cu4l2", title: "Mealtime", items: ["kaon", "inom", "kan-on"] },
      ] },
      { id: "cu5", name: "Counting & Buying", hint: "Count and ask prices", lessons: [
        { id: "cu5l1", title: "One, Two, Three", items: ["usa", "duha", "tulo", "pira"] },
        { id: "cu5l2", title: "At the Store", items: ["tagpira", "palit", "mapalit", "pesos"] },
      ] },
    ],
  },
  {
    id: "cp2", name: "Daily Life in the Neighborhood",
    hint: "In-laws, the yard, going places, weather, and daily times",
    units: [
      { id: "cu6", name: "Meeting the In-Laws", hint: "Introduce yourself respectfully to extended family", lessons: [
        { id: "cu6l1", title: "Respectful Titles", items: ["apo", "mano", "mana"] },
        { id: "cu6l2", title: "Glad to Meet You", items: ["bana", "nalipay", "kila"] },
      ] },
      { id: "cu7", name: "Objects in the Yard", hint: "Ask for everyday household items", lessons: [
        { id: "cu7l1", title: "Around the Yard", items: ["lingkuran", "lamesa", "brayong"] },
        { id: "cu7l2", title: "Kitchen Things", items: ["banga", "kutsara", "tinidor", "kadi"] },
      ] },
      { id: "cu8", name: "Where Are You Going?", hint: "Answer the passing greeting 'Kain ka?'", lessons: [
        { id: "cu8l1", title: "Kain ka?", items: ["kain", "madto", "pakadto"] },
        { id: "cu8l2", title: "Local Destinations", items: ["tindahan", "pantalan", "uma"] },
      ] },
      { id: "cu9", name: "The Weather", hint: "Comment on heat, rain, and wind", lessons: [
        { id: "cu9l1", title: "Island Heat", items: ["mapaso", "kamapas", "masyado"] },
        { id: "cu9l2", title: "Rain & Wind", items: ["uran", "umuuran", "hangin", "mahagkot"] },
      ] },
      { id: "cu10", name: "Time & Simple Tasks", hint: "Coordinate daily times and chores", lessons: [
        { id: "cu10l1", title: "Today & Tomorrow", items: ["yana", "buwas", "nganay"] },
        { id: "cu10l2", title: "Chores & Rest", items: ["buhat", "trabaho", "pahuway"] },
      ] },
      { id: "cu11", name: "Review & Celebration", hint: "Mix neighborhood conversations smoothly", lessons: [
        { id: "cu11l1", title: "Neighborhood Mix A", items: ["kamusta", "apo", "kain", "madto", "tindahan", "yana"] },
        { id: "cu11l2", title: "Neighborhood Mix B", items: ["mapaso", "uran", "lingkuran", "banga", "buwas", "pahuway"] },
      ] },
    ],
  },
];

// CEFR tag per Challenger-only word — used by the proficiency engine.
// Phase 1 (decks ch1–ch5) is A0; Phase 2 (ch6–ch11) is A1.
const CH_P1_DECKS = new Set(["ch1", "ch2", "ch3", "ch4", "ch5"]);
export const CH_LEVELS = {};
for (const r of SEED_CH) CH_LEVELS[r[1]] = CH_P1_DECKS.has(r[0]) ? "A0" : "A1";
