/* Open questions for a native Daram/Samar Waray speaker (Ella). The Ask Ella panel
   shows the questions for the ACTIVE course (plus `course: "all"` language-level ones).
   Questions that belonged to the retired bundled courses (Challenger, Frequency reader)
   moved to archive/bundled-courses/ella-questions-archived.js with the courses themselves.
   Append freely — set `course` to the course id, or "all" for language-wide questions. */

export const ELLA_QUESTIONS = [
  {
    id: "ngan-hi-marker",
    course: "pc",
    topic: "Lesson 2 · markers",
    q: "Joining two names: “Hira Nonoy ngan hi Inday” or “hira Nonoy ngan Inday” — is the second “hi” required, optional, or wrong?",
    detail: "The Peace Corps book prints “Hira Nonoy ngan hi Inday.” (Lesson 2 written exercise) — marker repeated on the second name. But the marker drill rows we generated say “hira Jimmie ngan Leah” with no repeated marker. Whichever you say is natural in Daram, we'll match the drills to it.",
  },
  // (the samar-variants question moved out of the queue: regional forms are now the DIALECT
  //  setting in the Language door — grading accepts them in Daram mode via VARIANTS. Native
  //  verification of individual forms continues through the dictionary-confirm flow.)
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
