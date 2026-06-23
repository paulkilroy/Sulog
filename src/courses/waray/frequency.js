/* Waray (Frequency-first) — the same vocabulary as Classic, re-sequenced so the
   highest-frequency grammatical glue (markers, pronouns, demonstratives,
   questions, numbers) leads, and loan-heavy themes trail. Units are reused from
   Classic (same lesson ids + items) and renamed to Duolingo-style can-do goals,
   regrouped into 4 phases. See docs/frequency-first-structure.md.

   Lesson model (docs/lesson-retool-proposal.md): each lesson is tagged
   kind "words" (learn vocab — full 4-step drill) or "apply" (phrases — type the
   Waray, one step). The unit page shows ① Words then ② Apply; the graded unit
   review tests the ② phrases. Pure-vocab units have only ① Words. */
import { CLASSIC } from "./classic.js";

// index every Classic unit by id so we can reuse it (with all its lessons) here
const U = {};
CLASSIC.forEach((sec) => sec.units.forEach((u) => { U[u.id] = u; }));

// Existing Classic lessons that are phrase/application lessons → kind "apply".
// (Everything else defaults to "words". See docs classification 2026-06-23.)
const APPLY_IDS = new Set([
  "u2l1", "u8l2", "u9l2", "u10l2", "u11l2", "u12l1", "u12l3", "u13l2", "u13l3",
  "u14l2", "u15l3", "u16l2", "u22l2", "u23l3", "u24l3", "u25l3", "u27l2",
  "u28l2", "u29l1", "u29l2", "u30l2",
]);

// Units whose lessons are replaced wholesale to split mixed word+phrase lessons.
const REPLACE = {
  // "The pronouns" mixed 7 pronouns + 3 equational phrases → split into ①/②
  u3: [
    { id: "u3l1", title: "The pronouns", items: ["ako", "ikaw / ka", "hiya", "kita", "kami", "kamo", "hira"] },
    { id: "u3a1", title: "Saying who you are", kind: "apply", items: ["Amerikano ako", "Babaye ka", "Makusog hiya"] },
  ],
};

// New ② Apply lessons appended to units that lacked any (mined from sources;
// every line attested — Peace Corps course / CHED. See docs/phrase-expansion-proposal.md).
const ADD = {
  u4:  [{ id: "u4a1",  title: "Family & friends", kind: "apply",
    items: ["nanay niya", "sangkay nira"] }],
  u5:  [{ id: "u5a1",  title: "At work", kind: "apply",
    items: ["Estudyante hiya"] }],
  u6:  [{ id: "u6a1",  title: "Describing people", kind: "apply",
    items: ["Mahusay hiya", "Hataas ako", "Riko hira", "Makusog hiya nga lalake", "Maraut ini nga tawo"] }],
  u17: [{ id: "u17a1", title: "Actions in sentences", kind: "apply",
    items: ["Nakaon hiya", "Matindog kita", "Tinmawag kamo", "Natindog hira hiton lamesa ha sala"] }],
  u21: [{ id: "u21a1", title: "Around the house", kind: "apply",
    items: ["Mahusay an lamesa", "Puno an baso", "Mabusag an papel"] }],
  u26: [{ id: "u26a1", title: "Going places", kind: "apply",
    items: ["Makadto ka ba ha eskwelahan?"] }],
  u31: [{ id: "u31a1", title: "Food in sentences", kind: "apply",
    items: ["Mapalit hira hin mga isda ha merkado", "Inminom hiya hini nga gatas ha kusina"] }],
  u35: [{ id: "u35a1", title: "Faith in sentences", kind: "apply",
    items: ["Nasimba kami", "Diyos-diyos", "Ini nga uran, bendisyon ini han Ginoo"] }],
  u36: [{ id: "u36a1", title: "Praying & belief", kind: "apply",
    items: ["Maampo ba hi Bong?"] }],
};

// reuse a Classic unit with a can-do name; tag lesson kinds, apply splits/additions
const retool = (id, name, hint) => {
  const u = U[id];
  if (!u) throw new Error("frequency.js: unknown unit " + id);
  let lessons = REPLACE[id] || u.lessons;
  lessons = lessons.map((l) => ({ ...l, kind: l.kind || (APPLY_IDS.has(l.id) ? "apply" : "words") }));
  if (ADD[id]) lessons = lessons.concat(ADD[id].map((l) => ({ ...l, kind: l.kind || "apply" })));
  return { ...u, name, hint: hint ?? u.hint, lessons };
};

export const FREQUENCY = [
  { id: "p1", name: "Say something real", hint: "Speak from day one", units: [
    retool("u1",  "Say hello & thanks"),
    retool("u2",  "Get unstuck",            "Phrases for when you're lost"),
    retool("u3",  "Say who's who",          "ako, ikaw, hiya, kita…"),
    retool("u8",  "Name what you see",      "hi / an / it — point and name"),
    retool("u9",  "This & that",            "ini, iton, adto"),
    retool("u13", "Ask what, where, who",   "ano, hain, hin-o + ba"),
    retool("u33", "Count to 100"),
    retool("u4",  "Introduce your family"),
  ] },
  { id: "p2", name: "Put words together", hint: "Build real sentences", units: [
    retool("u10", "Say what's yours",       "ko / nakon, mo / nimo…"),
    retool("u11", "Say it's mine",          "akon, imo, iya…"),
    retool("u12", "Say “X is Y”"),
    retool("u14", "Already, not yet, just", "na, pa, la, liwat, hin duro"),
    retool("u15", "Do it: now / will / did"),
    retool("u17", "Everyday actions"),
    retool("u18", "Tell the time of day"),
    retool("u21", "Name things at home"),
    retool("u22", "Talk about meals"),
    retool("u24", "Ask the way"),
    retool("u34", "Name colors"),
  ] },
  { id: "p3", name: "Daily life & people", hint: "Describe your world", units: [
    retool("u5",  "Talk about work"),
    retool("u6",  "Describe people"),
    retool("u7",  "Say where it hurts",     "Body words"),
    retool("u16", "Can, must, mustn't"),
    retool("u19", "Days & months"),
    retool("u20", "Talk about the weather"),
    retool("u29", "Invite someone out"),
  ] },
  { id: "p4", name: "Out in the world & beyond now", hint: "Travel, errands, past & future", units: [
    retool("u30", "Make travel plans"),
    retool("u25", "Shop at the market"),
    retool("u26", "Get around"),
    retool("u27", "Check in at the airport"),
    retool("u28", "Plan a day trip"),
    retool("u23", "Cook a dish"),
    retool("u31", "Food & the table"),
    retool("u32", "Talk about nature & animals"),
    retool("u35", "God & worship"),
    retool("u36", "Church & belief"),
  ] },
];
