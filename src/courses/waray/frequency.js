/* Waray (Frequency-first) — the same vocabulary as Classic, re-sequenced so the
   highest-frequency grammatical glue (markers, pronouns, demonstratives,
   questions, numbers) leads, and loan-heavy themes trail. Units are reused whole
   from Classic (same lesson ids + items) and renamed to Duolingo-style can-do
   goals; they're regrouped into 4 phases. See docs/frequency-first-structure.md.

   First cut = whole-unit reorder + rename. Deferred refinements noted there:
   intra-unit splits (numbers 1–10 vs 11–100; present vs past/future tense;
   extract may/mayda to P1) and i+1 recycling — those need new/relabelled cards. */
import { CLASSIC } from "./classic.js";

// index every Classic unit by id so we can reuse it (with all its lessons) here
const U = {};
CLASSIC.forEach((sec) => sec.units.forEach((u) => { U[u.id] = u; }));
// reuse a Classic unit, with a new can-do name (and optional new hint)
const as = (id, name, hint) => {
  const u = U[id];
  if (!u) throw new Error("frequency.js: unknown unit " + id);
  return { ...u, name, hint: hint ?? u.hint };
};

export const FREQUENCY = [
  { id: "p1", name: "Say something real", hint: "Speak from day one", units: [
    as("u1",  "Say hello & thanks"),
    as("u2",  "Get unstuck",            "Phrases for when you're lost"),
    as("u3",  "Say who's who",          "ako, ikaw, hiya, kita…"),
    as("u8",  "Name what you see",      "hi / an / it — point and name"),
    as("u9",  "This & that",            "ini, iton, adto"),
    as("u13", "Ask what, where, who",   "ano, hain, hin-o + ba"),
    as("u33", "Count to 100"),
    as("u4",  "Introduce your family"),
  ] },
  { id: "p2", name: "Put words together", hint: "Build real sentences", units: [
    as("u10", "Say what's yours",       "ko / nakon, mo / nimo…"),
    as("u11", "Say it's mine",          "akon, imo, iya…"),
    as("u12", "Say “X is Y”"),
    as("u14", "Already, not yet, just", "na, pa, la, liwat, hin duro"),
    as("u15", "Do it: now / will / did"),
    as("u17", "Everyday actions"),
    as("u18", "Tell the time of day"),
    as("u21", "Name things at home"),
    as("u22", "Talk about meals"),
    as("u24", "Ask the way"),
    as("u34", "Name colors"),
  ] },
  { id: "p3", name: "Daily life & people", hint: "Describe your world", units: [
    as("u5",  "Talk about work"),
    as("u6",  "Describe people"),
    as("u7",  "Say where it hurts",     "Body words"),
    as("u16", "Can, must, mustn't"),
    as("u19", "Days & months"),
    as("u20", "Talk about the weather"),
    as("u29", "Invite someone out"),
  ] },
  { id: "p4", name: "Out in the world & beyond now", hint: "Travel, errands, past & future", units: [
    as("u30", "Make travel plans"),
    as("u25", "Shop at the market"),
    as("u26", "Get around"),
    as("u27", "Check in at the airport"),
    as("u28", "Plan a day trip"),
    as("u23", "Cook a dish"),
    as("u31", "Food & the table"),
    as("u32", "Talk about nature & animals"),
    as("u35", "God & worship"),
    as("u36", "Church & belief"),
  ] },
];
