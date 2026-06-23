/* Course registry — every language/structure model Sulog can load.
   A course = { id, name, lang, seed, forgotten, curriculum }. Cards (seed) are
   shared between the two Waray models; only the curriculum order differs. A new
   language gets its own folder with its own cards + curriculum.

   Progress is stored independently per course id (sulog:<id>:prog, …), so
   switching models never mixes progress. */
import { SEED, FORGOTTEN } from "./waray/cards.js";
import { CLASSIC } from "./waray/classic.js";
import { FREQUENCY } from "./waray/frequency.js";

export const COURSES = [
  { id: "waray-frequency", name: "Waray (Frequency)", lang: "war",
    seed: SEED, forgotten: FORGOTTEN, curriculum: FREQUENCY },
  { id: "waray-classic", name: "Waray (Classic)", lang: "war",
    seed: SEED, forgotten: FORGOTTEN, curriculum: CLASSIC },
];

export const DEFAULT_COURSE_ID = "waray-frequency";

export const getCourse = (id) =>
  COURSES.find((c) => c.id === id) ||
  COURSES.find((c) => c.id === DEFAULT_COURSE_ID);
