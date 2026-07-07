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

/* Database courses (e.g. Peace Corps) aren't bundled — they're fetched from Supabase,
   transformed to this same shape, and cached in localStorage so module load stays
   synchronous. The async fetch+cache happens once, at course-selection time (see the
   course switcher); every boot after that reads the cache here. */
const DB_COURSE_KEY = (id) => "sulog:dbcourse:" + id;
export function cacheDbCourse(bundled, version = 0) {
  try { localStorage.setItem(DB_COURSE_KEY(bundled.id), JSON.stringify({ ...bundled, _v: Number(version) || 0 })); } catch (e) {}
}
function readDbCourse(id) {
  try {
    const raw = localStorage.getItem(DB_COURSE_KEY(id));
    if (!raw) return null;
    const c = JSON.parse(raw);
    // rehydrate: forgotten is a Set at runtime; reuse the language-level reader; no Ella queue yet
    return { lang: "war", stories: STORIES, review: [], ...c, forgotten: new Set(c.forgotten || []) };
  } catch (e) { return null; }
}
export const isDbCourseCached = (id) => { try { return !!localStorage.getItem(DB_COURSE_KEY(id)); } catch (e) { return false; } };
// the version of the currently-cached DB course (0 if none) — compared against the DB to detect staleness
export const cachedDbVersion = (id) => { try { return Number(JSON.parse(localStorage.getItem(DB_COURSE_KEY(id)) || "{}")._v) || 0; } catch (e) { return 0; } };

export const getCourse = (id) =>
  COURSES.find((c) => c.id === id) ||
  readDbCourse(id) ||
  COURSES.find((c) => c.id === DEFAULT_COURSE_ID);
