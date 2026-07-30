/* Course registry — Peace Corps is the ONLY live course (2026-07-13; the original bundled
   courses are preserved in /archive/bundled-courses). PC lives in Supabase: fetched, adapted
   (dbCourseToBundled), and cached in localStorage so module load stays synchronous. On first
   boot there is no cache yet — getCourse returns an empty shell and the version auto-refresh
   fetches + caches + reloads within a second or two. */
import { STORIES } from "./waray/stories.js";
import { reviewFor } from "./waray/ella-questions.js";

export const COURSES = [];                 // no bundled courses anymore
export const DEFAULT_COURSE_ID = "pc";

const DB_COURSE_KEY = (id) => "sulog:dbcourse:" + id;
export function cacheDbCourse(bundled, version = 0) {
  try { localStorage.setItem(DB_COURSE_KEY(bundled.id), JSON.stringify({ ...bundled, _v: Number(version) || 0 })); return true; } catch (e) { return false; }
}
function readDbCourse(id) {
  try {
    const raw = localStorage.getItem(DB_COURSE_KEY(id));
    if (!raw) return null;
    const c = JSON.parse(raw);
    return { lang: "war", stories: STORIES, review: reviewFor(id), ...c, forgotten: new Set(c.forgotten || []) };
  } catch (e) { return null; }
}
export const isDbCourseCached = (id) => { try { return !!localStorage.getItem(DB_COURSE_KEY(id)); } catch (e) { return false; } };
export const cachedDbVersion = (id) => { try { return Number(JSON.parse(localStorage.getItem(DB_COURSE_KEY(id)) || "{}")._v) || 0; } catch (e) { return 0; } };

// first-boot shell: renders an empty home for a beat while the auto-refresh pulls the course
const SHELL = () => ({ id: "pc", name: "Peace Corps Waray", lang: "war", cards: [], forgotten: new Set(), curriculum: [], stories: STORIES, review: reviewFor("pc") });

export const getCourse = (id) => readDbCourse(id) || readDbCourse(DEFAULT_COURSE_ID) || SHELL();
