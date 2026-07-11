/* Open questions for a native Daram/Samar Waray speaker (Ella). The Ask Ella panel
   shows the questions for the ACTIVE course (plus `course: "all"` language-level ones).
   Resolving them feeds back into the courses + dialect notes (variants.js, the
   challenger course, the reader). Append freely — set `course` to the course id it
   belongs to, or "all" for language-wide dialect questions. */

export const ELLA_QUESTIONS = [
  {
    id: "an-vs-in",
    course: "waray-challenger2",
    topic: "Challenger · core marker",
    q: "Does Daram Waray use “in” (or “it”) as the everyday noun marker instead of standard “an”?",
    detail: "e.g. “Aadi in balay” vs “Aadi an balay” (the house is here). Gemini insisted on “in/it” for Samar; we shipped the Challenger course with safe standard “an”. If “in” is what people really say in Daram, we'll switch it.",
  },
  {
    id: "dadi",
    course: "waray-challenger2",
    topic: "Challenger · vocabulary",
    q: "Is “dadi” the natural Daram word for “come here”?",
    detail: "Or is it “kadi”, “ngarihi”, or “kani”? Taught in Unit 2.",
  },
  {
    id: "kamusta-kumusta",
    course: "waray-challenger2",
    topic: "Challenger · spelling",
    q: "In Daram, is it “kamusta” or “kumusta”?",
    detail: "We teach “kamusta”. Minor, but worth getting right for the very first greeting.",
  },
  {
    id: "kagugub-an",
    course: "waray-frequency",
    topic: "Reader · register",
    q: "Is “kagugub-an” (forest) literary/“deep Waray”, with “kagurangan” the everyday Samar word?",
    detail: "Appears in the Bloom story “An Banog ha Bukid Huraw”. We want beginners learning the common form.",
  },
  {
    id: "bfc-stories",
    course: "waray-frequency",
    topic: "Reader · correction set",
    q: "Correct the 7 Bible-for-Children stories from dialectal to standard Waray.",
    detail: "Machine-translated, came out dialectal (san→han, sira→hira, aron, kumila…). Pulled from the Read tab until fixed. Full list + guesses in docs/courses/frequency/ella-todo-bfc-correction.md.",
  },
  {
    id: "samar-variants",
    course: "all",
    topic: "Dialect · confirm variants",
    q: "Are these the everyday Daram forms? Confirm or reject each.",
    items: [
      { k: "di", label: "di — short for diri (not)" },
      { k: "sin", label: "sin — for hin (a/some, object marker)" },
      { k: "mayda", label: "mayda — may ada (there is / has)" },
      { k: "wara", label: "wara — for waray (none / did not)" },
      { k: "gihap", label: "gihap — short for gihapon (also/still)" },
    ],
  },
  {
    id: "p2-kila",
    course: "waray-challenger2",
    topic: "Challenger · vocabulary (Phase 2)",
    q: "Is “kila” the right Daram word for “meet/get to know”?",
    detail: "Gemini taught it via “makakila” (to get to know someone). Is the bare root “kila” natural, or should we teach a different form? Unit 6.",
  },
  {
    id: "p2-brayong",
    course: "waray-challenger2",
    topic: "Challenger · vocabulary (Phase 2)",
    q: "Is “brayong” the everyday Daram word for the coconut-midrib yard broom?",
    detail: "Tagalog calls it “walis tingting”. Is “brayong” real Samar Waray, or is it “silhig”/something else? Unit 7.",
  },
  {
    id: "p2-kamapas",
    course: "waray-challenger2",
    topic: "Challenger · vocabulary (Phase 2)",
    q: "Is “kamapas” a real Waray word for the humid, sticky coastal heat?",
    detail: "Gemini glossed it “humid”, distinct from “mapaso” (hot). Confirm it exists and isn't a near-duplicate of mapaso. Unit 9.",
  },
  {
    id: "p2-masyado",
    course: "waray-challenger2",
    topic: "Challenger · register (Phase 2)",
    q: "For “very/too much”, do people in Daram say “masyado”, or is there a more native Waray word?",
    detail: "“masyado” is a Tagalog/Spanish-flavored loan. Is there a Waray intensifier (e.g. “sobra”, “duro”) we should teach instead/alongside? Unit 9.",
  },
  {
    id: "p2-inflected-lemmas",
    course: "waray-challenger2",
    topic: "Challenger · forms (Phase 2)",
    q: "Are “nalipay” (glad) and “umuuran” (raining) the right forms to drill as standalone cards?",
    detail: "These are inflected (nalipay = was/am glad; umuuran = is raining), not bare roots (lipay / uran). Fine for a beginner phrasebook, or should we drill the roots and keep the inflected forms in sentences? Units 6 & 9.",
  },
  {
    id: "p1-enclitic-agents",
    course: "waray-challenger2",
    topic: "Challenger · pronouns (Phase 1)",
    q: "Are the enclitic (post-posed) agent pronouns we drill the natural Daram forms?",
    detail: "We teach ko (my/by me) and mo (your/by you) — those feel safe. Less sure about: na (his/her — standard Waray is 'niya'?), ta (our, inclusive), mi (our, exclusive — vs 'namon'?), niyo (your, plural), nira (their). These came from the AI Phase-1 redesign; please correct any that aren't what people say in Daram. Phase 1 units 4 & 7.",
  },
  {
    id: "p1-time-words",
    course: "waray-challenger2",
    topic: "Challenger · time words (Phase 1)",
    q: "Confirm the everyday Daram time words: udto, yana, adlaw, kahapon, buwas, san-o.",
    detail: "Glossed noon / now / day(today) / yesterday / tomorrow / when. Are these the natural spoken forms in Daram (e.g. is 'san-o' the everyday 'when', and 'kahapon' the usual 'yesterday')? Phase 1 unit 6.",
  },
  {
    id: "c2-inlaw-terms",
    course: "waray-challenger2",
    topic: "Challenger 2 · family (Phase 2)",
    q: "Confirm the extended-family / in-law terms: ugangan, bayaw, hipag, umangkon.",
    detail: "Glossed parent-in-law / brother-in-law / sister-in-law / niece-nephew. Also using kuya, ate (older brother/sister), lolo, lola (grandparents). Are these the everyday Daram terms? (from the expanded Challenger 2 build)",
  },
  {
    id: "c2-clock-numbers",
    course: "waray-challenger2",
    topic: "Challenger 2 · telling time (Phase 2)",
    q: "For clock time, do people in Daram say Spanish numbers (alas sais, alas tres, alas singko) or native (unom, tulo, lima)?",
    detail: "Challenger 2 teaches native numbers 1-10 but the time unit uses 'alas + Spanish number' for the clock, which is common in the Philippines. Confirm what's natural in Daram so we teach one consistently.",
  },
];

// Removed Peace Corps sentences (synth audit): the AI-extracted Waray was confirmed defective and
// pulled from the course; each becomes an Ask-Ella question — the book's English prompt needs a
// NATIVE-authored answer, then the item returns to its lesson. Canonical source (also drives the
// seed rejection + the /verify Ella-todo page): docs/sources/peace-corps/rejected-sentences.json.
import REJECTED from "../../../docs/sources/peace-corps/rejected-sentences.json";
const slug = (w) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
for (const r of REJECTED) {
  const n = +(/pc-l(\d+)/.exec(r.lesson) || [])[1];
  ELLA_QUESTIONS.push({
    id: "synth-" + slug(r.waray),
    course: "pc",
    topic: `Lesson ${n} · ${r.where === "exam" ? "exam" : "drill"}`,
    q: `“${r.en}”`,                       // the English to translate IS the question
    prompt: r.en,
    suggest: r.suggest || null,           // the audit's proposed correction (needs her ear)
    draft: r.waray,                       // the AI's rejected attempt
    detail: r.reason.split(/[;—]/)[0].trim(),  // just the defect, one clause
  });
}

// questions for a given course (its own + language-wide "all")
export const reviewFor = (courseId) =>
  ELLA_QUESTIONS.filter((q) => q.course === courseId || q.course === "all");
