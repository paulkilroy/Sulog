/* Course registry — every language/structure model Sulog can load, and the single
   manifest of what each course bundles:
     { id, name, lang, seed, forgotten, curriculum, stories, review }
   - seed/forgotten/curriculum : the cards + lesson structure
   - stories                   : the reader library (language-level; every Waray course
                                 shares the same Bloom/BFC reader)
   - review                    : this course's open native-speaker (Ella) questions
   Language-level helpers (variants, gloss) stay separate — they're grading/spelling
   infrastructure, not course content.

   Progress is stored independently per course id (sulog:<id>:prog, …), so switching
   models never mixes progress. */
import { SEED, FORGOTTEN } from "./waray/cards.js";
import { CLASSIC } from "./waray/classic.js";
import { FREQUENCY } from "./waray/frequency.js";
import { SEED_CH, FORGOTTEN_CH, CHALLENGER } from "./waray/challenger.js";
import { SEED_CH2, FORGOTTEN_CH2, CHALLENGER2 } from "./waray/challenger2.js";
import { STORIES } from "./waray/stories.js";
import { reviewFor } from "./waray/ella-questions.js";

const course = (c) => ({ lang: "war", stories: STORIES, review: reviewFor(c.id), ...c });

export const COURSES = [
  course({ id: "waray-frequency", name: "Waray (Frequency)",
    seed: SEED, forgotten: FORGOTTEN, curriculum: FREQUENCY }),
  course({ id: "waray-classic", name: "Waray (Classic)",
    seed: SEED, forgotten: FORGOTTEN, curriculum: CLASSIC }),
  course({ id: "waray-challenger", name: "Waray (Challenger · Daram)",
    seed: SEED_CH, forgotten: FORGOTTEN_CH, curriculum: CHALLENGER }),
  course({ id: "waray-challenger2", name: "Waray (Challenger 2 · Expanded)",
    seed: SEED_CH2, forgotten: FORGOTTEN_CH2, curriculum: CHALLENGER2 }),
];

export const DEFAULT_COURSE_ID = "waray-frequency";

export const getCourse = (id) =>
  COURSES.find((c) => c.id === id) ||
  COURSES.find((c) => c.id === DEFAULT_COURSE_ID);
