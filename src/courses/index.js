/* Course registry — every language/structure model Sulog can load.
   A course = { id, name, lang, seed, forgotten, curriculum }. Cards (seed) are
   shared between the two Waray models; only the curriculum order differs. A new
   language gets its own folder with its own cards + curriculum.

   Progress is stored independently per course id (sulog:<id>:prog, …), so
   switching models never mixes progress. */
import { SEED, FORGOTTEN } from "./waray/cards.js";
import { CLASSIC } from "./waray/classic.js";
import { FREQUENCY } from "./waray/frequency.js";
import { SEED_CH, FORGOTTEN_CH, CHALLENGER } from "./waray/challenger.js";
import { SEED_CH2, FORGOTTEN_CH2, CHALLENGER2 } from "./waray/challenger2.js";

export const COURSES = [
  { id: "waray-frequency", name: "Waray (Frequency)", lang: "war",
    seed: SEED, forgotten: FORGOTTEN, curriculum: FREQUENCY },
  { id: "waray-classic", name: "Waray (Classic)", lang: "war",
    seed: SEED, forgotten: FORGOTTEN, curriculum: CLASSIC },
  { id: "waray-challenger", name: "Waray (Challenger · Daram)", lang: "war",
    seed: SEED_CH, forgotten: FORGOTTEN_CH, curriculum: CHALLENGER },
  { id: "waray-challenger2", name: "Waray (Challenger 2 · Expanded)", lang: "war",
    seed: SEED_CH2, forgotten: FORGOTTEN_CH2, curriculum: CHALLENGER2 },
];

export const DEFAULT_COURSE_ID = "waray-frequency";

export const getCourse = (id) =>
  COURSES.find((c) => c.id === id) ||
  COURSES.find((c) => c.id === DEFAULT_COURSE_ID);
