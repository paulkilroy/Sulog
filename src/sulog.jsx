import { getCourse, COURSES, DEFAULT_COURSE_ID, cacheDbCourse, cachedDbVersion } from "./courses/index.js";
import { CONFIRM_CANDIDATES } from "./courses/waray/confirm-candidates.js";
import { signInWithGoogle, signInWithEmail, signOut as sbSignOut, onAuth, getUser, isAdmin, pullProgress, pushProgress } from "./supabase.js";
import { fetchCourse, fetchCourses, fetchReviewList, confirmEntry, fetchCourseBundled, fetchCourseVersion, fetchEllaAnswers, saveEllaAnswer, fetchDialectForms, fetchAllDialectForms, setDialectForm, loadUserSettings, saveUserSettings, fetchDictionary, upsertProfile, fetchMyRoles, fetchMyRequests, requestRole, fetchMyTaughtClass, fetchMyEnrolledClasses, createClass, joinClass, fetchRoster, fetchClassProgress, fetchClassFlags, fetchPendingRoleRequests, decideRoleRequest, applyFix, fetchChangeLog, fetchTtsOverrides, saveTtsOverride, submitFeedback, fetchFeedback, resolveFeedback } from "./data/remote.js";
import { GLOSS } from "./courses/waray/stories.js";
import { VARIANTS, CHUNKS, DIALECT_FORMS, DIALECT_PRESETS } from "./courses/waray/variants.js";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Volume2, Mic, Check, X, ArrowLeft, Waves, Sun, Flame, BookOpen,
  Plus, RotateCcw, ChevronRight, ChevronLeft, Star, Ear, Pencil, List, Home,
  Trophy, Square, Play, Sparkles, AlertCircle, Target, Layers,
  Cloud, Download, Upload, FolderOpen, Keyboard,
  Eye, EyeOff, Copy, AlertTriangle, User, LogOut, Database, Globe, Lock, Wrench, Flag,
  GraduationCap, Menu as MenuIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Aplikasyon han Waray  —  "Sulog"  (the tide)
 *  A personal review app built from Paul's Preply lesson materials.
 *  Mastery rises like the tide on the Zumarraga Channel.
 * ------------------------------------------------------------------ */

// Build stamp, injected by build.sh via esbuild --define:__BUILD__ as "ISO|hash".
// Falls back to "dev" when bundled without the define (typeof on an undeclared
// name is safe). buildLabel() renders the timestamp in the viewer's local time.
const BUILD_STAMP = typeof __BUILD__ !== "undefined" ? __BUILD__ : "dev";
function buildLabel() {
  const [iso, hash] = String(BUILD_STAMP).split("|");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return BUILD_STAMP;
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + (hash ? " · " + hash : "");
}

/* ---------- seed vocabulary (from the WarayLessons sheet + teacher docx) ---------- */
/* a few obvious OCR typos in the sheet were corrected against the teacher's
   docx files: yama→yana(now), "mapaso him euro"→"mapaso hin duro",
   mahingin→mahangin, mapaSO→mapaso. Flagged in chat. */

/* ---------- active course (vocabulary + curriculum live in src/courses) ----------
   The selected course is read from localStorage at module load; switching
   courses persists the choice and reloads. Progress is namespaced per course. */
function _readCourseId() {
  try { const v = localStorage.getItem("sulog:course");
    return (v === "pc" || (v && localStorage.getItem("sulog:dbcourse:" + v))) ? v : DEFAULT_COURSE_ID; } // legacy bundled ids → pc
  catch (e) { return DEFAULT_COURSE_ID; }
}
const ACTIVE = getCourse(_readCourseId());
const COURSE_ID = ACTIVE.id;
const SEED = ACTIVE.seed;
const FORGOTTEN = ACTIVE.forgotten;
// per-course storage keys — progress is independent per course model
const PK = {
  prog:    `sulog:${COURSE_ID}:prog`,
  streak:  `sulog:${COURSE_ID}:streak`,
  lessons: `sulog:${COURSE_ID}:lessons`,
  units:   `sulog:${COURSE_ID}:units`,
  history: `sulog:${COURSE_ID}:history`,
  read:    `sulog:${COURSE_ID}:read`,
  stories: `sulog:${COURSE_ID}:stories`, // unit-capstone stories marked read
};
const storyRead = (id) => {
  try { return new Set(JSON.parse(localStorage.getItem(PK.stories) || "[]")).has(id); } catch (e) { return false; }
};
const toggleStoryRead = (id) => {
  try {
    const s = new Set(JSON.parse(localStorage.getItem(PK.stories) || "[]"));
    s.has(id) ? s.delete(id) : s.add(id);
    localStorage.setItem(PK.stories, JSON.stringify([...s]));
    return s.has(id);
  } catch (e) { return false; }
};
// one-time migration: the original `waray:*` progress was on the Classic order,
// so adopt it under waray-classic. Frequency (the new default) starts fresh.
(function migrateV1() {
  try {
    if (localStorage.getItem("sulog:migrated-v1")) return;
    for (const k of ["prog", "streak", "lessons", "units", "history"]) {
      const old = localStorage.getItem("waray:" + k);
      const dest = "sulog:waray-classic:" + k;
      if (old !== null && localStorage.getItem(dest) === null) localStorage.setItem(dest, old);
    }
    localStorage.setItem("sulog:migrated-v1", "1");
  } catch (e) {}
})();

const DECK_META = {
  greet: { name: "Greetings & Survival", short: "Greetings", hint: "The phrases you reach for every day" },
  week1: { name: "Week 1 — Foundations", short: "Week 1", hint: "Pronouns and equational sentences" },
  verbs: { name: "Verbs, Objects & Time", short: "Verbs & Time", hint: "Mag / Nag / Pag affixes and when things happen" },
  invite: { name: "Phrases — Invitations", short: "Invitations", hint: "Asking someone over" },
  direk: { name: "Directions", short: "Directions", hint: "Finding your way around" },
  shop: { name: "Shopping", short: "Shopping", hint: "At the market" },
  airport: { name: "At the airport", short: "Airport", hint: "Travel & check-in" },
  daytrip: { name: "A day trip", short: "Day trip", hint: "Sightseeing & outings" },
  meals: { name: "Meals & eating", short: "Meals", hint: "Breakfast to dinner" },
  cook: { name: "Cooking", short: "Cooking", hint: "In the kitchen" },
  whentrav: { name: "When & travel", short: "When", hint: "Time spans & arriving" },
  gram: { name: "Grammar", short: "Grammar", hint: "Sentence patterns" },
  num: { name: "Numbers", short: "Numbers", hint: "Counting" },
  cal: { name: "Days & months", short: "Calendar", hint: "The week and the year" },
  color: { name: "Colors", short: "Colors", hint: "Basic colors" },
  essent: { name: "Handy phrases", short: "Handy", hint: "Useful everyday lines" },
  poss: { name: "Possessives", short: "Possess.", hint: "my / your / mine / yours" },
  demo: { name: "Demonstratives", short: "This/That", hint: "this, that, over there" },
  mark: { name: "Markers", short: "Markers", hint: "hi / hin / han / ha / ngan" },
  qword: { name: "Question words", short: "Questions", hint: "who, what, where, why" },
  ptcl: { name: "Particles", short: "Particles", hint: "already, still, also, very, not" },
  modal: { name: "Can & must", short: "Modals", hint: "can, need to, don't" },
  ppl: { name: "People & jobs", short: "People", hint: "family, roles, the body" },
  faith: { name: "Faith & church", short: "Faith", hint: "God, worship, belief" },
  nature: { name: "Nature", short: "Nature", hint: "trees, sea, animals" },
  // Challenger (Daram) course — Phase 1 (ch1–ch7)
  ch1: { name: "Greetings & Your Name", short: "Greetings", hint: "Hellos, times of day, thanks" },
  ch2: { name: "People, Home & Family", short: "People", hint: "Where things are; family" },
  ch3: { name: "Food & Drink", short: "Food", hint: "Asking for food and drink" },
  ch4: { name: "My, Your, His/Her", short: "Possessives", hint: "Possessive & agent pronouns" },
  ch5: { name: "Counting & Buying", short: "Counting", hint: "Numbers and small purchases" },
  ch6: { name: "Time & When", short: "Time", hint: "Now, today, yesterday, tomorrow" },
  ch7: { name: "We, You All, They", short: "Groups", hint: "Plural pronouns" },
  // Challenger — Phase 2 (ch8–ch12)
  ch8: { name: "Meeting the In-Laws", short: "In-laws", hint: "Respectful family introductions" },
  ch9: { name: "Objects in the Yard", short: "Yard", hint: "Everyday household items" },
  ch10: { name: "Where Are You Going?", short: "Going", hint: "The passing greeting Kain ka?" },
  ch11: { name: "The Weather", short: "Weather", hint: "Heat, rain, and wind" },
  ch12: { name: "Time & Simple Tasks", short: "Tasks", hint: "Daily times and chores" },
};

// deck metadata for the ACTIVE course only — built from its cards, with a safe
// fallback so an unknown deck can never crash a card tag (the Challenger blank page)
const DECKS = (() => {
  // A deck's label comes from DECK_META if curated there (the Frequency/Classic
  // thematic decks, which span units); otherwise it's derived from the curriculum
  // unit that teaches the deck's cards (unit-aligned courses like Challenger never
  // need hardcoded labels); otherwise the raw deck id.
  const cardDeck = {}; for (const r of SEED) cardDeck[r[1]] = r[0];
  const fromCurriculum = {};
  for (const sec of (ACTIVE.curriculum || []))
    for (const u of (sec.units || []))
      for (const l of (u.lessons || []))
        for (const it of (l.items || [])) {
          const d = cardDeck[it];
          // short = first word of the unit name (keeps the card tag tidy)
          if (d && !fromCurriculum[d]) fromCurriculum[d] = { name: u.name, short: (u.name || d).split(/[\s,]+/)[0], hint: u.hint || "" };
        }
  const out = {};
  for (const r of SEED) { const d = r[0]; if (d && !out[d]) out[d] = DECK_META[d] || fromCurriculum[d] || { name: d, short: d, hint: "" }; }
  return out;
})();

/* ---------------- curriculum (scaffolded lesson path) ----------------
   Units → lessons, ordered so each lesson builds on earlier ones. Lessons list
   their items by Waray text (resolved to existing cards at runtime; unknown
   entries are skipped). Each lesson is cleared in 4 escalating parts. */
const PASS_PCT = 0.8; // score needed to pass a unit review (lessons are ungraded practice)
// ① Words — the full ladder for learning new vocabulary (recognize → produce).
const LESSON_PARTS = [
  { dir: "wte", mode: "mc", label: "Recognize", hint: "Waray → English" },
  { dir: "etw", mode: "mc", label: "Reverse", hint: "English → Waray" },
  { dir: "wte", mode: "type", label: "Recall", hint: "Type the English" },
  { dir: "etw", mode: "type", label: "Produce", hint: "Type the Waray — no hints" },
];
// Every lesson — words OR phrases — teaches with the full 4-step ladder. You never
// first-learn something in produce-only mode; produce-only is the UNIT REVIEW's job
// (see startUnitReview). `kind: "apply"` still marks a phrase lesson (for the ①/②
// grouping and which cards the review tests) — it no longer shortens the drill.
const partsFor = () => LESSON_PARTS;
// DB (grammar-spine) lessons play their own block STEPS; bundled lessons play the 4-step ladder.
const partCountById = (id) => { const l = LESSON_FLOW.find((x) => x.id === id); return l?.steps ? l.steps.length : partsFor(l).length; };
// a drill step's session direction + mode, from the book block's kind/modality
const drillParams = (step) => step.kind === "production"
  ? ["etw", step.modality === "voice" ? "speak" : "type"] // say it aloud (SpeakCard) or type it
  : ["wte", "mc"]; // recognition (mc / cloze) → recognize Waray→English

// Top tier = sections; each section holds units; each unit holds lessons.
const CURRICULUM = ACTIVE.curriculum;
// flat, ordered list of every lesson (with its unit + section) for unlock / "next"
const LESSON_FLOW = CURRICULUM.flatMap((s) =>
  s.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u, section: s })))
);
// resolve a lesson's item words to real card objects (skip any that don't exist)
function lessonCards(cards, lesson) {
  const byWaray = {};
  cards.forEach((c) => { byWaray[c.waray] = c; });
  return (lesson.items || []).map((w) => byWaray[w]).filter(Boolean);
}
// every (unique) card in a section, across its units' lessons
function sectionCards(cards, section) {
  const seen = new Set(), out = [];
  section.units.forEach((u) => u.lessons.forEach((l) => lessonCards(cards, l).forEach((c) => {
    if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
  })));
  return out;
}
// every (unique) card in a single unit, across its lessons
function unitCards(cards, unit) {
  const seen = new Set(), out = [];
  unit.lessons.forEach((l) => lessonCards(cards, l).forEach((c) => {
    if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
  }));
  return out;
}
// the cards a unit review tests: the ② Apply (phrase) cards — the real mastery
// bar. Units with no Apply lessons fall back to all their words.
function unitReviewPool(cards, unit) {
  const apply = (unit.lessons || []).filter((l) => l.kind === "apply");
  if (!apply.length) return unitCards(cards, unit);
  const seen = new Set(), out = [];
  apply.forEach((l) => lessonCards(cards, l).forEach((c) => {
    if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
  }));
  return out;
}
// does this unit have a graded review? (only if it has ② Apply phrases)
const unitHasReview = (unit) => (unit.lessons || []).some((l) => l.kind === "apply");
// all cards taught in this unit or any EARLIER unit (never a later one) — the only legal
// pool to pad a unit review from, so the graded test can't quiz words the learner hasn't
// reached yet. Walks the curriculum in order and stops after the target unit (inclusive).
function cardsThroughUnit(cards, unit) {
  const out = [], seen = new Set();
  for (const ph of (ACTIVE.curriculum || [])) for (const u of (ph.units || [])) {
    for (const c of unitCards(cards, u)) if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
    if (u.id === unit.id) return out;
  }
  return out;
}
// the words to test in a unit review (up to n): your HARDEST in this unit first
// (most-missed, then weakest box, then lowest accuracy, then longest word). If the unit
// is small, pad with your hardest cards from THIS unit or earlier — NEVER a future unit.
function unitReviewCards(cards, prog, unit, n = 10) {
  const rank = (c) => {
    const st = prog[c.id];
    return [-(st?.wrong || 0), masteryPct(st), accuracy(st), -(c.waray || "").length];
  };
  const cmp = (a, b) => {
    const ra = rank(a), rb = rank(b);
    for (let k = 0; k < ra.length; k++) if (ra[k] !== rb[k]) return ra[k] - rb[k];
    return 0;
  };
  const picked = [], used = new Set();
  const add = (c) => { if (c && !used.has(c.id)) { used.add(c.id); picked.push(c); } };
  unitReviewPool(cards, unit).slice().sort(cmp).forEach(add);            // the unit's Apply phrases, hardest first
  if (picked.length < n) cardsThroughUnit(cards, unit).slice().sort(cmp).forEach(add); // pad backward-only (this unit + earlier)
  return picked.slice(0, n);
}
// parts completed for a lesson; "done" when all its parts (kind-dependent) are cleared
const lessonDone = (lessons, id) => (lessons[id] || 0) >= partCountById(id);
// free navigation: every lesson is reachable — jump around / skip within a unit
function lessonUnlocked() { return true; }
// the first not-yet-finished unlocked lesson (what "Continue" jumps to)
function nextLesson(lessons) {
  return LESSON_FLOW.find((l) => !lessonDone(lessons, l.id)) || LESSON_FLOW[LESSON_FLOW.length - 1];
}


function buildCards() {
  return SEED.map((r) => {
    const [deck, waray, english, subtext, say, example] = r;
    return {
      // Stable id = the Waray string. Unique per course (verified: 0 dup waray in any
      // course) and, unlike a positional `cN`, it survives reordering, appends, and
      // moving a word between units — so editing curriculum never disturbs saved SRS
      // progress. Legacy positional ids are migrated on load (see migrateProgIds).
      id: waray,
      deck, waray, english,
      subtext: subtext || "",
      say: say || "",
      example: example || null,   // {war, focus, en} — in-context hint for single-word cards
      forgotten: FORGOTTEN.has(waray),
    };
  });
}

/* ---------------- proficiency (count-based CEFR-ish estimate) ----------------
   With one course (PC) and no frequency deck, proficiency = words mastered (box>=4),
   measured against friendly cumulative milestones. Reads progress only — never writes. */
const wordById = (course) => { const m = {}; (course.seed || []).forEach((r, i) => { m[`c${i}`] = r[1]; m[r[1]] = r[1]; }); return m; };
const BAND_MILESTONE = { A0: 0, A1: 40, A2: 140, B1: 320, B2: 550 };
const BAND_NEXT = { A0: "A1", A1: "A2", A2: "B1", B1: "B2" };
function computeProficiency(liveProg) {
  const id2w = wordById(ACTIVE);
  const pooled = {};
  if (liveProg) for (const id in liveProg) { const w = id2w[id]; if (w && liveProg[id] && (pooled[w] == null || (liveProg[id].box || 0) > pooled[w])) pooled[w] = liveProg[id].box || 0; }
  let mastered = 0;
  for (const w in pooled) if (pooled[w] >= 4) mastered++;
  let band = "A0";
  for (const b of ["A1", "A2", "B1"]) if (mastered >= BAND_MILESTONE[b]) band = b;
  const next = BAND_NEXT[band], lo = BAND_MILESTONE[band], hi = BAND_MILESTONE[next];
  const pct = hi > lo ? Math.min(1, Math.max(0, (mastered - lo) / (hi - lo))) : 1;
  return { band, next, pct, mastered };
}

/* ---------------- spaced repetition (Leitner) ---------------- */
const BOX_DAYS = [0, 1, 2, 4, 9, 18]; // interval after reaching each box
const MS_DAY = 86400000;
const now = () => Date.now();
// YYYY-MM-DD in the viewer's LOCAL time, so the day rolls over at local midnight
const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => localDay();
// current day-streak from the per-day activity map (date -> review count).
// Counts back from today; if today isn't done yet, the streak still stands
// (grace) and we count from yesterday. Uncapped, and consistent with what the
// 14-day strip shows.
const currentStreak = (days) => {
  const map = days || {};
  const d = new Date();
  const key = (x) => localDay(x);
  if (!map[key(d)]) d.setDate(d.getDate() - 1); // not studied yet today
  let n = 0;
  while (map[key(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
};

function freshStat(forgotten) {
  return {
    box: forgotten ? 0 : 0, seen: 0, right: 0, wrong: 0,
    streak: 0, last: 0, due: 0, pinned: false, recall: 0,
  };
}
function isDue(st) { return !st || st.seen === 0 || now() >= (st.due || 0); }
function masteryPct(st) { return st ? Math.min(1, st.box / 5) : 0; }
// --- reading coverage (mirrors tools/reading-coverage.mjs: exact + morphological
// containment, so inflected forms of a known root count as known) ---
function storyToks(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[’`]/g, "'").split(/[^a-z'\-]+/).map((t) => t.replace(/^['\-]+|['\-]+$/g, "")).filter((t) => t.length >= 2);
}
// the set of Waray word-tokens the learner can be said to "know" (box ≥ 2)
function knownWaray(prog, cards) {
  const s = new Set();
  for (const c of cards) if (masteryPct(prog[c.id]) >= 0.4) for (const t of storyToks(c.waray)) s.add(t);
  return s;
}
const _knows = (t, known, roots) => t && (known.has(t) || (t.length >= 4 && roots.some((r) => t.includes(r))));
// variant-aware: a dialect/spelling variant counts as known if its canonical is known
const knowsTok = (t, known, roots) => _knows(t, known, roots) || _knows(VARIANTS[t], known, roots);
// coverage of a story's running words + the count of distinct unknown words
function storyCoverage(story, known, roots) {
  let total = 0, hit = 0; const unknown = new Set();
  for (const p of story.paras) for (const t of storyToks(p)) {
    total++; if (knowsTok(t, known, roots)) hit++; else unknown.add(t);
  }
  return { pct: total ? hit / total : 0, total, unknown: unknown.size };
}
const _fold = (w) => w.replace(/o/g, "u").replace(/e/g, "i");
// light de-inflection (mirrors tools/missing-words.mjs): strip common prefixes, the
// -um-/-in- infix, and suffixes → candidate roots to look up.
function _deinflect(t) {
  const c = [], add = (x) => { x = x && x.replace(/^[-']+|[-']+$/g, ""); if (x && x.length >= 3 && x !== t && !c.includes(x)) c.push(x); }; // trim hyphen: "pag-iha"→"iha"
  add(t.replace(/-/g, "")); // de-hyphenate compound: "tabu-an"→"tabuan"
  add(t.replace(/^(nakaka|nagka|naka|nagpa|napa|nag|mag|nan|nam|nang|gin|gi|na|ma|pa|pag|pan|ka|i)/, ""));
  add(t.replace(/^([bcdfghjklmnpqrstvwxyz])(um|in)/, "$1"));
  for (const b of [t, ...c.slice()]) { const y = b.replace(/(han|hon|nan|an|on|i|a)$/, ""); add(y); add(_fold(y)); }
  return c;
}
const glossFor = (word) => {
  const direct = GLOSS[word] || (VARIANTS[word] && GLOSS[VARIANTS[word]]) || GLOSS[_fold(word)];
  if (direct) return direct;
  for (const cand of _deinflect(word)) if (GLOSS[cand]) return `${GLOSS[cand]}  (from ${cand})`; // inflected → root's gloss
  return null;
};
const MAXCHUNK = Math.max(2, ...Object.keys(CHUNKS).map((k) => k.split(" ").length));
// Cold type-recalls needed to graduate a missed word off "Needs work". Counts only
// genuine recall: a typed (non-MC) correct answer that wasn't the remedial type step
// right after an MC. See `recall` in applyResult.
const NW_RECOVER = 3;
// "needs work" = you pinned it, OR you've missed it and haven't re-earned it by cold
// recall yet. It DRAINS only as you type it right from memory; multiple-choice wins
// don't count. Miss it (typed) and the counter resets so it returns.
function needsWorkCard(st) {
  if (!st) return false;
  if (st.pinned) return true;                 // manual pin — stays until you unpin
  if (!(st.wrong > 0)) return false;          // never missed → not a struggle word
  return (st.recall || 0) < NW_RECOVER;       // still rebuilding → keep; recalled enough → drop
}
// accuracy 0–1 (used to break ties when ranking struggle); unseen = perfect
function accuracy(st) { return st && st.seen ? st.right / st.seen : 1; }

function applyResult(st, correct, mode) {
  const s = { ...st };
  s.seen += 1;
  s.last = now();
  if (correct) {
    s.right += 1;
    s.streak += 1;
    s.box = Math.min(5, s.box + 1);
  } else {
    s.wrong += 1;
    s.streak = 0;
    s.box = 0;
  }
  // `recall` = consecutive COLD type-recalls (the Needs-work graduation signal). ONLY a
  // typed answer moves it: +1 correct, back to 0 on a miss. MC answers are ignored
  // entirely (recognition ≠ recall). The remedial type-after-MC step is unscored, so it
  // never reaches here — exactly the "right after an MC prompt" case we want to exclude.
  if (mode === "type") s.recall = correct ? (s.recall || 0) + 1 : 0;
  else if (s.recall == null) s.recall = 0;
  s.due = now() + BOX_DAYS[s.box] * MS_DAY;
  return s;
}
// Card ids moved from a positional `cN` to the Waray string (stable across reorder /
// append / unit-move). Remap any legacy positional keys in a stored stat map to the
// Waray id via the current seed order. Idempotent — Waray keys pass straight through —
// so it's safe to run on every load, backup import, and cloud merge (an un-updated
// device may still send `cN`). MUST run against the seed order that produced those cN
// ids: this is why id-stabilization ships BEFORE any card is added/reordered.
function migrateProgIds(prog, seed = SEED) {
  if (!prog || typeof prog !== "object") return prog;
  let changed = false;
  const out = {};
  for (const k in prog) {
    const mm = /^c(\d+)$/.exec(k);
    if (mm && seed[+mm[1]]) { out[seed[+mm[1]][1]] = prog[k]; changed = true; }
    else out[k] = prog[k];
  }
  return changed ? out : prog;
}
// One-time backfill for `recall` (added after launch): reconstruct each card's trailing
// cold type-recall streak from the attempt history, so Needs-work dots reflect real past
// typing instead of resetting to 0. Typed-correct +1, typed-miss resets, MC ignored —
// the same rule as applyResult. Idempotent: only fills entries that lack `recall`.
function backfillRecall(prog, history, cards) {
  if (!prog || !Object.values(prog).some((st) => st && st.recall == null)) return prog;
  const idByWaray = {};
  cards.forEach((c) => { idByWaray[c.waray] = c.id; });
  const recallBy = {};
  for (const e of [...(history || [])].sort((a, b) => (a.ts || 0) - (b.ts || 0))) {
    const id = idByWaray[e.waray];
    if (id && e.mode === "type") recallBy[id] = e.correct ? (recallBy[id] || 0) + 1 : 0;
  }
  const np = { ...prog };
  for (const id in np) if (np[id] && np[id].recall == null) np[id] = { ...np[id], recall: recallBy[id] || 0 };
  return np;
}

/* ---------------- text matching ---------------- */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    // expand English contractions BEFORE the apostrophe is stripped, so "We'll" and
    // "we will" grade the same (else "we'll" glues to "well" and the edit distance
    // rejects the spelled-out form). won't/can't first \u2014 they contain "n't".
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/n't\b/g, " not")
    .replace(/'ll\b/g, " will")
    .replace(/'re\b/g, " are")
    .replace(/'ve\b/g, " have")
    .replace(/'m\b/g, " am")
    .replace(/let's\b/g, "let us")
    .replace(/\(.*?\)/g, "")
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function alts(s) {
  return s.split("/").map((x) => norm(x)).filter(Boolean);
}
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[m][n];
}
// fold Waray spelling equivalences: o=u and e=i are the same sound, so accept
// either when grading a Waray answer
// Waray spelling equivalences for grading: o=u, e=i (same sound), and c→k
// (loanwords + the recognizer spell /k/ as "c", e.g. "Rico" for "riko")
const warayFold = (s) => s.replace(/o/g, "u").replace(/e/g, "i").replace(/c/g, "k");
const _tol = (len) => (len <= 4 ? 0 : len <= 8 ? 1 : 2);
// Fuzziness is unlocked only for inputs we don't fully trust — never for a TYPED Waray answer.
//  · TYPED Waray: the learner chose every character, and Waray grammar lives in tiny words —
//    pronouns (ka you-sg / kamo you-pl / kami / kita), case markers (an/in/it/han/hin/sin/san),
//    particles (na/pa/nga). So we grade word-by-word: each word within its own length-scaled
//    tolerance (short words → 0 slack). "ka" is never accepted for "kamo".
//  · ENGLISH recall (waray=false): English varies naturally ("it's"/"it is", a dropped article,
//    looser order) and has no number trap → keep the forgiving whole-phrase match.
//  · SPOKEN Waray: the Filipino/Tagalog recognizer has no Waray locale, so it splits/joins words
//    and mangles short particles — word-by-word alignment falls apart on it. So we match at the
//    PHRASE level and forgive (this is why voice grading stays lenient). The cost: a spoken "ka"
//    for "kamo" passes — but the recognizer often can't tell them apart, and voice is secondary.
// English synonym folding: the book itself glosses one Waray word differently in different
// places (mahusay = "beautiful" in the vocab list, "pretty" in a sentence translation) —
// fold those to one canonical so either English answer is accepted. Conservative pairs only.
const EN_SYN = { beautiful: "pretty", nice: "good", fine: "good", large: "big", little: "small", difficult: "hard", glad: "happy" };
const enFold = (x) => x.split(" ").map((w) => EN_SYN[w] || w).join(" ");
function checkAnswer(input, target, waray, spoken) {
  let got = norm(input);
  if (!got) return false;
  const targets = alts(target);
  if (waray) got = warayFold(got); else got = enFold(got);
  const gotC = got.replace(/ /g, ""); // space-stripped: the recognizer splits/joins words freely
  const gotW = got.split(" ");
  const fuzzy = !waray || spoken;     // typed Waray = strict word-by-word; everything else forgives
  for (let t of targets) {
    if (waray) t = warayFold(t); else t = enFold(norm(t));
    if (got === t) return true;
    // per-word: same word count, EACH word within its own length-scaled tolerance. With the Daram
    // dialect setting on, a typed dialect form also matches its canonical word ("wara" for "waray",
    // "sin" for "hin") — acceptance only ever widens, never narrows.
    const tW = t.split(" ");
    const wordOk = (w, tw) => w === tw || (waray && _dialectForms.has(w) && warayFold(_dialectCanon.get(w) || VARIANTS[w] || "") === tw) || lev(w, tw) <= _tol(tw.length);
    if (gotW.length === tW.length && gotW.every((w, i) => wordOk(w, tW[i]))) return true;
    if (!fuzzy) continue;
    // whole-phrase edit distance (natural variation / recognizer noise)
    if (lev(got, t) <= _tol(t.length)) return true;
    if (waray) {
      // recognizer splits one word into several, joins words, or hallucinates a leading/
      // trailing syllable (e.g. "ulitawo" → "huli tawo"). Compare space-insensitively, and
      // accept when the whole target sits inside the heard string (≤2 stray chars).
      const tC = t.replace(/ /g, "");
      if (gotC === tC || lev(gotC, tC) <= _tol(tC.length)) return true;
      if (tC.length >= 5 && gotC.includes(tC) && gotC.length - tC.length <= 2) return true;
    }
  }
  return false;
}
// step-by-step of how one input is matched (for the speech debug view): raw →
// normalized → (Waray-folded) → compared to each accepted target with its edit
// distance and tolerance.
function explainMatch(input, target, waray) {
  const gotNorm = norm(input);
  const gotFold = waray ? warayFold(gotNorm) : gotNorm;
  const gotC = gotFold.replace(/ /g, "");
  const targets = alts(target).map((t) => {
    const tFold = waray ? warayFold(t) : t;
    const tol = _tol(tFold.length);
    const dist = lev(gotFold, tFold);
    let ok = gotFold === tFold || dist <= tol;
    let how = ok ? (dist === 0 ? "exact" : "edit≤" + tol) : "";
    if (!ok && waray) {
      const tC = tFold.replace(/ /g, "");
      const distC = lev(gotC, tC);
      if (gotC === tC || distC <= _tol(tC.length)) { ok = true; how = "despaced"; }
      else if (tC.length >= 5 && gotC.includes(tC) && gotC.length - tC.length <= 2) { ok = true; how = "contained"; }
    }
    return { target: t, fold: tFold, dist, tol, ok, how };
  });
  return { raw: input, gotNorm, gotFold, targets, ok: targets.some((x) => x.ok) };
}
// When a typed/picked answer is wrong, see if it's actually a known word so we can
// say what the learner *did* say. dir "etw" => they gave Waray (look it up);
// "wte" => they gave English (find the Waray it maps to). Returns "X = Y" or null.
const _stripLead = (s) => s.replace(/^(to |a |an |the )/, ""); // ignore "to walk" vs "walk"
function explainGiven(cards, given, answer, dir) {
  const g = norm(given);
  if (!g || g === norm(answer)) return null;
  if (dir === "etw") {
    // they typed Waray — find the word and show its meaning
    const c = cards.find((x) => norm(x.waray) === g) || cards.find((x) => warayFold(norm(x.waray)) === warayFold(g));
    return c ? `${c.waray} = ${c.english}` : null;
  }
  // they typed English — find which Waray word it means (ignoring leading to/a/the)
  const gs = _stripLead(g);
  const c = cards.find((x) => alts(x.english).some((a) => a === g || _stripLead(a) === gs));
  return c ? `“${given.trim()}” = ${c.waray}` : null;
}

/* ---------------- persistent storage wrapper ---------------- */
const mem = {};
const store = {
  async get(k) {
    try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
    return k in mem ? mem[k] : null;
  },
  async set(k, v) {
    mem[k] = v;
    try { localStorage.setItem(k, v); } catch (e) {/* quota — sync still holds the canonical copy */}
  },
};

/* ---------------- cloud sync (Supabase, per signed-in user) ----------------
   Progress syncs to Supabase when signed in with Google. The transport lives in
   supabase.js (pullProgress/pushProgress); the merge below stays client-side so an
   offline device never clobbers a newer record. */
// merge two progress maps, keeping whichever record was touched most recently
function mergeProg(local, cloud) {
  const out = { ...(local || {}) };
  for (const id in (cloud || {})) {
    const l = local && local[id];
    const c = cloud[id];
    if (!l || (c && (c.last || 0) >= (l.last || 0))) out[id] = c;
  }
  return out;
}
function mergeStreak(l, c) {
  if (!c) return l || { count: 0, last: "", days: {} };
  if (!l) return c;
  const days = { ...(l.days || {}), ...(c.days || {}) };
  const base = (c.last || "") >= (l.last || "") ? c : l;
  return { ...base, days, count: Math.max(l.count || 0, c.count || 0) };
}
// lessons: id -> parts cleared (monotonic). Take the furthest progress per lesson.
function mergeLessons(l, c) {
  const out = { ...(l || {}) };
  for (const id in (c || {})) out[id] = Math.max(out[id] || 0, c[id] || 0);
  return out;
}
// units: id -> {best, passed, last, at}. best = max, passed sticky, last/at from latest run.
function mergeUnits(l, c) {
  const out = { ...(l || {}) };
  for (const id in (c || {})) {
    const a = out[id], b = c[id];
    if (!a) { out[id] = b; continue; }
    const latest = (b.at || "") >= (a.at || "") ? b : a;
    out[id] = { best: Math.max(a.best || 0, b.best || 0), passed: !!(a.passed || b.passed), last: latest.last, at: latest.at };
  }
  return out;
}

/* ---------------- speech ----------------
   The browser almost never ships a Waray voice. Best case is a Filipino /
   Tagalog voice: Tagalog spelling maps to sound almost exactly like Waray
   (a=ah, i=ee, u=oo, ng = velar nasal, and it even has "nga"), so such a voice
   reads the RAW Waray text accurately and naturally. If none is available we
   fall back to an English voice reading the phonetic *respelling* — a rough
   approximation. Either way we speak one fluid utterance per phrase (words
   comma-joined for a light pause); no per-syllable chopping, which sounded
   robotic. The voice is chosen automatically (prefer Filipino) but the user can
   override it from the Sounds screen, stored as settings.voiceURI. */
let _voices = [];
let _autoVoice = null; // best automatic pick (highest voiceRank)
let _voiceURI = null;  // user-chosen voice (settings.voiceURI), set by App
let _ttsOverride = {}; // waray(lowercase) -> spoken form fed to the engine; loaded from dictionary.spoken
function setTtsOverrides(m) { _ttsOverride = m || {}; }
function getTtsOverrides() { return _ttsOverride; }
let _dialectForms = new Set(); // enabled regional forms — grading accepts exactly these
let _dialectCanon = new Map();  // form → canonical, from the dialect_forms table (VARIANTS is the offline fallback)
// dialect CATALOG (which forms exist) is GLOBAL CONFIG from the dialect_forms table — cached so
// boot is synchronous, refreshed from the DB, bundled DIALECT_FORMS only as first-run fallback
const DIALECT_CACHE_KEY = "sulog:dialectforms";
const readDialectCache = () => {
  try { const v = JSON.parse(localStorage.getItem(DIALECT_CACHE_KEY) || "null"); if (v?.length) return v; } catch (e) {}
  return DIALECT_FORMS.map((f) => ({ ...f, presets: ["daram"], verified: false }));
};

// How well a voice's language approximates Waray. Waray is Austronesian:
// Filipino/Tagalog is closest; Indonesian and Malay share the same 5-vowel,
// phonetic-Latin spelling (a=ah, i=ee, u=oo, ng = velar nasal), so they read
// raw Waray far better than an English voice. Higher rank = better.
// human-readable language name from a voice's lang code ("ms-MY" → "Malay"), with region if useful
const _langDN = (() => { try { return new Intl.DisplayNames(["en"], { type: "language" }); } catch { return null; } })();
function langName(lang) {
  if (!lang) return "?";
  const base = lang.split("-")[0];
  try { return (_langDN && _langDN.of(base)) || base; } catch { return base; }
}
function voiceRank(v) {
  const s = ((v.lang || "") + " " + (v.name || "")).toLowerCase();
  if (/(^|[^a-z])fil|(^|[^a-z])tl[-_]|tagalog|pilipino|filipino/.test(s)) return 3;
  if (/(^|[^a-z])id[-_]|indonesia/.test(s)) return 2;
  if (/(^|[^a-z])ms[-_]|malay|melayu/.test(s)) return 2;
  return 0;
}
function loadVoices() {
  try {
    _voices = window.speechSynthesis.getVoices() || [];
    _autoVoice = _voices
      .filter((v) => voiceRank(v) > 0)
      .sort((a, b) => voiceRank(b) - voiceRank(a))[0] || null;
  } catch (e) {}
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
}

// the voice to use: the user's pick if set & available, else the best auto-pick
function chosenVoice() {
  if (_voiceURI) {
    const v = _voices.find((x) => x.voiceURI === _voiceURI);
    if (v) return v;
  }
  return _autoVoice;
}

// English respelling -> readable text for an English voice: strip the syllable
// hyphens (join), lowercase, word-initial "ng" -> "n", comma-join the words.
function respellForTTS(say) {
  return say
    .split(/\s+/)
    .filter((w) => w && w !== "/") // "/" separates alternatives — a pause, not a spoken "slash"
    .map((w) => w.replace(/-/g, "").toLowerCase().replace(/^ng/, "n"))
    .join(", ");
}

// lookup key for an override: lowercase, strip surrounding punctuation ("platos," → "platos")
function ovKey(w) { return (w || "").toLowerCase().replace(/[^\wà-ÿ'-]/g, ""); }
function speak(arg, rate = 0.78, applyOverride = true) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    if (!_voices.length) loadVoices();

    const card = typeof arg === "string" ? { waray: arg, say: "" } : (arg || {});
    const voice = chosenVoice();
    const lang = voice ? voice.lang : "en-US";
    const english = /^en/i.test(lang);
    const words = (card.waray || "").split(/\s+/).filter((w) => w && w !== "/");
    const rawWaray = words.join(", ");

    // Per-word TTS overrides WIN for any voice: the spoken form we hand the engine (e.g. "mga"→"manga"),
    // for the handful of words a close-cousin/English voice mangles. Otherwise a non-English
    // (Filipino/Malay) voice reads the raw Waray; an English voice does better on the respelling.
    const ov = applyOverride ? words.map((w) => _ttsOverride[ovKey(w)] || null) : [];
    const text = ov.some(Boolean) ? words.map((w, i) => ov[i] || w).join(", ")
      : english ? (card.say ? respellForTTS(card.say) : rawWaray)
      : rawWaray;

    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = lang;
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch (e) {}
}
// short "go" beep so the user has a precise moment to start speaking (fired when the
// recognizer's audio capture actually goes live, not when we call start())
let _audioCtx = null;
function beep(freq = 880, ms = 110) {
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    const t = _audioCtx.currentTime, o = _audioCtx.createOscillator(), g = _audioCtx.createGain();
    o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(_audioCtx.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.start(t); o.stop(t + ms / 1000);
  } catch (e) {}
}
// speak plain English (for prompts whose question side is English) with an English voice
function speakEnglish(text, rate = 0.95) {
  try {
    const synth = window.speechSynthesis; if (!synth || !text) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = rate;
    const v = (_voices || []).find((x) => /^en/i.test(x.lang));
    if (v) u.voice = v;
    synth.speak(u);
  } catch (e) {}
}

/* =================================================================== */

export default function App() {
  const cards = useRef(buildCards()).current;
  const [view, setView] = useState("home");
  const [prog, setProg] = useState({});
  const [streak, setStreak] = useState({ count: 0, last: "", days: {} });
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [lessons, setLessons] = useState({}); // lessonId -> parts completed (0–4)
  const [lessonId, setLessonId] = useState(null); // lesson open in LessonView
  const [stepIdx, setStepIdx] = useState(0); // which teach/vocab step is open in TeachView (DB lessons)
  const [learnTarget, setLearnTarget] = useState(null); // lesson id to scroll to in LearnView
  const [learnSection, setLearnSection] = useState(null); // which section LearnView shows
  const [storyUnit, setStoryUnit] = useState(null); // unit whose capstone story is open
  const [settings, setSettings] = useState({ rate: 0.95, adaptive: false, voiceURI: "", sttLang: "fil-PH", sttDebug: true, voiceMode: false, dialect: "standard" });
  const [history, setHistory] = useState([]); // full attempt log {ts, waray, prompt, answer, given, correct, dir, mode}
  const [units, setUnits] = useState({}); // unitId -> {best, passed, last, at} from unit reviews
  const [user, setUser] = useState(null); // Supabase-authed user (null = anonymous/signed out)
  const [roles, setRoles] = useState([]);       // granted roles from user_roles
  const [roleReqs, setRoleReqs] = useState([]); // this user's role requests
  const [enrolledN, setEnrolledN] = useState(0); // classes this user has joined (drives the "student" pill)
  const [menuOpen, setMenuOpen] = useState(false); // the ☰ menu — App-level so "back" from a sub-page can reopen it
  const [report, setReport] = useState(null);   // {targetType,targetRef,context} — open report sheet

  // Google sign-in state (Supabase). Content is world-readable; admin (Paul) can edit.
  useEffect(() => {
    getUser().then(setUser).catch(() => {});
    const sub = onAuth(setUser);
    fetchTtsOverrides().then(setTtsOverrides).catch(() => {});   // per-word spoken overrides for the engine
    return () => { try { sub?.data?.subscription?.unsubscribe?.(); } catch (e) {} };
  }, [])
  // classroom: on sign-in mirror the auth user into profiles + load roles & requests
  useEffect(() => {
    if (!user) { setRoles([]); setRoleReqs([]); setEnrolledN(0); return; }
    upsertProfile(user).catch(() => {});
    fetchMyRoles().then(setRoles).catch(() => {});
    fetchMyRequests().then(setRoleReqs).catch(() => {});
    fetchMyEnrolledClasses().then((cs) => setEnrolledN((cs || []).length)).catch(() => {});
  }, [user]);;

  // Auto-refresh a database course when the DB has a newer version than our cache — so a reloaded
  // course propagates on the next open, with no manual re-switch. Offline/transient errors keep the cache.
  const [courseUpgraded, setCourseUpgraded] = useState(false);
  useEffect(() => {
    if (COURSES.some((c) => c.id === COURSE_ID)) return; // bundled course — nothing to check
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchCourseVersion(COURSE_ID);
        if (cancelled || v <= cachedDbVersion(COURSE_ID)) return;
        const bundled = await fetchCourseBundled(COURSE_ID, ACTIVE.name);
        if (cancelled || !bundled.curriculum.length) return;
        // cache ONLY (reload is deferred below) — reloading after a failed write (storage quota)
        // re-runs this exact path forever: fetch → fail to cache → reload → fetch…
        if (cacheDbCourse(bundled, v)) setCourseUpgraded(true);
      } catch (e) { /* keep the cached course */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // keep the module-level chosen voice that speak() reads in sync with settings
  useEffect(() => {
    _voiceURI = settings.voiceURI || null;
  }, [settings.voiceURI]);
  // dialect catalog: cached-then-refreshed from the dialect_forms table (global config —
  // Ella verifying / dropping a form reaches every device here, no deploy)
  const [dialectCatalog, setDialectCatalog] = useState(readDialectCache);
  const refreshDialect = useCallback(async () => {
    try { const list = await fetchDialectForms(); if (list.length) { setDialectCatalog(list); localStorage.setItem(DIALECT_CACHE_KEY, JSON.stringify(list)); } } catch (e) { /* offline — cache stands */ }
  }, []);
  useEffect(() => { refreshDialect(); }, [refreshDialect]);
  useEffect(() => {
    const forms = settings.dialectForms ?? (settings.dialect === "daram" ? Object.fromEntries(dialectCatalog.filter((f) => (f.presets || []).includes("daram")).map((f) => [f.k, true])) : {});
    _dialectForms = new Set(Object.keys(forms).filter((k) => forms[k]));
    _dialectCanon = new Map(dialectCatalog.map((f) => [f.k, f.canon]));
  }, [settings.dialectForms, settings.dialect, dialectCatalog]);
  // load on mount. Every parse is individually guarded: ONE corrupt localStorage value (partial
  // write on quota, manual edit, old format) must cost only that record — never the boot. Without
  // this, a single bad JSON.parse rejected the whole IIFE and the app hung on "Loading your tide…".
  useEffect(() => {
    (async () => {
      const parse = (raw, fallback) => { try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } };
      try {
        const p = await store.get(PK.prog);
        const s = await store.get(PK.streak);
        const cfg = await store.get("waray:settings");
        const les = await store.get(PK.lessons);
        const hist = await store.get(PK.history);
        const un = await store.get(PK.units);
        const parsedHist = parse(hist, []);
        if (parsedHist.length) setHistory(parsedHist);
        const oldProg = parse(p, null);
        if (oldProg) {
          const pp = backfillRecall(migrateProgIds(oldProg), parsedHist, cards);
          setProg(pp);
          store.set(PK.prog, JSON.stringify(pp)); // persist migrated ids + recall backfill
        }
        const st = parse(s, null); if (st) setStreak(st);
        const le = parse(les, null); if (le) setLessons(le);
        const u = parse(un, null); if (u) setUnits(u);
        const cf = parse(cfg, null); if (cf) setSettings((prev) => ({ ...prev, ...cf }));
      } catch (e) { /* storage unavailable — boot with fresh state */ }
      setLoaded(true);
    })();
  }, []);

  const saveProg = useCallback((np) => { setProg(np); store.set(PK.prog, JSON.stringify(np)); }, []);
  const saveStreak = useCallback((ns) => { setStreak(ns); store.set(PK.streak, JSON.stringify(ns)); }, []);
  const saveSettings = useCallback((ns) => { setSettings(ns); store.set("waray:settings", JSON.stringify(ns)); }, []);
  // append one attempt to the full history log (capped so storage stays bounded)
  const logAttempt = useCallback((e) => {
    setHistory((prev) => {
      const ns = [...prev, e];
      if (ns.length > 6000) ns.splice(0, ns.length - 6000);
      store.set(PK.history, JSON.stringify(ns));
      return ns;
    });
  }, []);
  // mark a lesson part complete (parts unlock in order, so keep the max reached)
  const completeLessonPart = useCallback((id, partIdx) => {
    setLessons((prev) => {
      const ns = { ...prev, [id]: Math.max(prev[id] || 0, partIdx + 1) };
      store.set(PK.lessons, JSON.stringify(ns));
      return ns;
    });
  }, []);
  // open a lesson part: build a session over its cards in that part's dir+mode.
  // Written (type) parts turn on remediation — miss a word and it drops to MC
  // then back to typing until you clear it, so the part always ends mastered.
  const startLessonPart = useCallback((lesson, partIdx) => {
    const part = partsFor(lesson)[partIdx];
    const ids = lessonCards(cards, lesson).map((c) => c.id);
    setSession({ deckKeys: Object.keys(DECKS), dir: part.dir, mode: part.mode, limit: ids.length, only: ids, lesson: { id: lesson.id, part: partIdx }, remediate: part.mode === "type" });
    setView("session");
  }, [cards]);
  // DB (grammar-spine) lesson STEP: teach/vocab open a reading screen; a drill runs the book's
  // specific items in that block's own format (recognition MC, produce typed/spoken) — no 4-step ladder.
  const startStep = useCallback((lesson, idx) => {
    const step = lesson.steps[idx];
    if (step.type !== "drill") { setLessonId(lesson.id); setStepIdx(idx); setView("teach"); return; }
    if (step.modality === "cloze") { setLessonId(lesson.id); setStepIdx(idx); setView("cloze"); return; }
    if (step.kind === "production" && step.dir === "both") {
      // the written exam: one part, both ways — first half Waray→English, second half English→Waray (the
      // book's two sections). dirMap keys direction to the card so it survives shuffling; order is kept.
      const half = Math.ceil(step.items.length / 2);
      const dirMap = {}; step.items.forEach((id, k) => { dirMap[id] = k < half ? "wte" : "etw"; });
      setSession({ deckKeys: Object.keys(DECKS), dir: "wte", mode: "type", limit: step.items.length, only: step.items, dirMap, footnote: step.footnote || null, lesson: { id: lesson.id, part: idx } });
    } else {
      const [dir, mode] = drillParams(step);
      setSession({ deckKeys: Object.keys(DECKS), dir, mode, limit: step.items.length, only: step.items, footnote: step.footnote || null, lesson: { id: lesson.id, part: idx } });
    }
    setView("session");
  }, []);
  // the unit review — the one graded checkpoint: 10 of your hardest words in the
  // unit, English→Waray typed, no remediation (it's a real test). Pass = 80%.
  const startUnitReview = useCallback((unit) => {
    const picks = unitReviewCards(cards, prog, unit, 10);
    setSession({ deckKeys: Object.keys(DECKS), dir: "etw", mode: "type", limit: picks.length, only: picks.map((c) => c.id), unitReview: { id: unit.id, name: unit.name } });
    setView("session");
  }, [cards, prog]);
  // an end-of-lesson gate (DB courses): a graded test over its EXACT recall items (produce Waray,
  // typed, no hints). Pass is sticky, tracked in the same units map as unit reviews.
  const startGate = useCallback((gate) => {
    // items are stored in exam order (paradigm table first, then applied sentences — see
    // emitGate in tools/gen-pc-course.mjs); play them as-is.
    const ids = (gate.items || []).filter((w) => cards.some((c) => c.id === w));
    if (!ids.length) return;
    // graded both ways. The direction split follows the CONTENT boundary, not a blind midpoint:
    // recognize the paradigm TABLE (single words → Waray→English), produce the applied SENTENCES
    // (English→Waray). A blind ceil(n/2) split stranded a sentence in the recognition half when the
    // table and sentence counts were unequal. A homogeneous exam falls back to first-half W→E.
    const words = ids.filter((id) => !/\s/.test(id)), sents = ids.filter((id) => /\s/.test(id));
    const dirMap = {};
    if (words.length && sents.length) {
      words.forEach((id) => { dirMap[id] = "wte"; });
      sents.forEach((id) => { dirMap[id] = "etw"; });
    } else {
      const half = Math.ceil(ids.length / 2);
      ids.forEach((id, k) => { dirMap[id] = k < half ? "wte" : "etw"; });
    }
    setSession({ deckKeys: Object.keys(DECKS), dir: "wte", mode: "type", limit: ids.length, only: ids, dirMap, gate: { id: gate.id, name: gate.name } });
    setView("session");
  }, [cards]);
  // record a unit-review result; "passed" is sticky (once mastered, stays so)
  const markUnitReview = useCallback((id, pct, passed) => {
    setUnits((prev) => {
      const ns = { ...prev, [id]: { best: Math.max(prev[id]?.best || 0, pct), passed: !!(passed || prev[id]?.passed), last: pct, at: today() } };
      store.set(PK.units, JSON.stringify(ns));
      return ns;
    });
  }, []);

  const bumpStreak = useCallback(() => {
    setStreak((prev) => {
      const t = today();
      if (prev.last === t) {
        const ns = { ...prev, days: { ...prev.days, [t]: (prev.days[t] || 0) + 1 } };
        store.set(PK.streak, JSON.stringify(ns)); return ns;
      }
      const y = localDay(new Date(Date.now() - MS_DAY));
      const count = prev.last === y ? prev.count + 1 : 1;
      const ns = { count, last: t, days: { ...prev.days, [t]: (prev.days[t] || 0) + 1 } };
      store.set(PK.streak, JSON.stringify(ns)); return ns;
    });
  }, []);

  const recordCard = useCallback((id, correct, mode) => {
    setProg((prev) => {
      const card = cards.find((c) => c.id === id);
      const st = prev[id] || freshStat(card?.forgotten);
      const np = { ...prev, [id]: applyResult(st, correct, mode) };
      store.set(PK.prog, JSON.stringify(np));
      return np;
    });
  }, [cards]);

  const togglePin = useCallback((id) => {
    setProg((prev) => {
      const st = prev[id] || freshStat(cards.find((c) => c.id === id)?.forgotten);
      const np = { ...prev, [id]: { ...st, pinned: !st.pinned } };
      store.set(PK.prog, JSON.stringify(np));
      return np;
    });
  }, [cards]);

  // manually clear a card off "Needs work": unpin it and mark its cold-recall counter satisfied so
  // needsWorkCard() drops it. If you miss it again later, recall resets and it returns (normal graduation).
  const dismissNeedsWork = useCallback((id) => {
    setProg((prev) => {
      const st = prev[id] || freshStat(cards.find((c) => c.id === id)?.forgotten);
      const np = { ...prev, [id]: { ...st, pinned: false, recall: NW_RECOVER } };
      store.set(PK.prog, JSON.stringify(np));
      return np;
    });
  }, [cards]);

  const playCard = useCallback((card) => {
    let rate = settings.rate;
    if (settings.adaptive) {
      // gradually speed up as a card is mastered: box 0 -> base, box 5 -> +0.35
      const box = prog[card.id]?.box || 0;
      rate = Math.min(1.25, (settings.rate - 0.1) + (box / 5) * 0.45);
    }
    speak(card, rate);
  }, [settings, prog]);

  // ---- backup: export everything to a portable JSON object ----
  const exportData = useCallback(() => {
    return {
      app: "sulog-waray",
      v: 1,
      exportedAt: new Date().toISOString(),
      prog,
      streak,
      lessons,
      units,
      history,
    };
  }, [prog, streak, lessons, units, history]);

  // ---- backup: load a JSON object back in ----
  const importData = useCallback(async (data, mode) => {
    if (!data || data.app !== "sulog-waray") throw new Error("That doesn't look like a Sulog backup file.");
    // progress + streak: replace (migrate legacy positional ids from an older export)
    if (data.prog) { const mp = migrateProgIds(data.prog); setProg(mp); await store.set(PK.prog, JSON.stringify(mp)); }
    if (data.streak) { setStreak(data.streak); await store.set(PK.streak, JSON.stringify(data.streak)); }
    // lessons/units: merge (furthest progress wins) so importing never undoes lessons
    // you've finished on this device
    if (data.lessons) { const m = mergeLessons(lessons, data.lessons); setLessons(m); await store.set(PK.lessons, JSON.stringify(m)); }
    if (data.units) { const m = mergeUnits(units, data.units); setUnits(m); await store.set(PK.units, JSON.stringify(m)); }
    if (data.history) { setHistory(data.history); await store.set(PK.history, JSON.stringify(data.history)); }
    return true;
  }, [lessons, units]);

  /* ---------------- cloud sync state & ops ---------------- */
  const stateRef = useRef({});
  stateRef.current = { prog, streak, settings, history, lessons, units, user };
  const [syncState, setSyncState] = useState({ status: "idle", at: "", error: "" });
  const pushTimer = useRef(null);
  const didInitialPull = useRef(false);
  // gate: never auto-push until the first pull has merged the cloud in. Without this a
  // fresh/behind device pushes its empty state ~2.5s after launch and clobbers the cloud
  // before its pull lands (cell is slower than the debounce). See sync-clobber fix.
  const [initialPulled, setInitialPulled] = useState(false);

  // merge a cloud snapshot (from Supabase) into local. Per-record recency wins, so a device
  // that was offline never clobbers a newer record. History is a local-only analytics log.
  const applyCloud = useCallback(async (cloud) => {
    if (!cloud) return;
    const cur = stateRef.current;
    // migrate legacy positional ids in the cloud snapshot before merging (an older device may not have)
    const np = mergeProg(cur.prog, migrateProgIds(cloud.prog || {}));
    const ns = mergeStreak(cur.streak, cloud.streak || {});
    setProg(np); await store.set(PK.prog, JSON.stringify(np));
    setStreak(ns); await store.set(PK.streak, JSON.stringify(ns));
    // lesson completion + unit-review results (furthest progress / sticky pass wins)
    const nl = mergeLessons(cur.lessons, cloud.lessons || {});
    setLessons(nl); await store.set(PK.lessons, JSON.stringify(nl));
    const nu = mergeUnits(cur.units, cloud.units || {});
    setUnits(nu); await store.set(PK.units, JSON.stringify(nu));
  }, []);

  const syncPull = useCallback(async () => {
    if (!stateRef.current.user) return;
    setSyncState({ status: "syncing", at: "", error: "" });
    // retry a few times — a fresh sign-in on cell can pull before the session's token is fully
    // attached (RLS then returns 0 rows) or drop a request; a transient miss must not leave a
    // signed-in device looking empty. Backoff between tries.
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const cloud = await pullProgress(COURSE_ID);
        const n = Object.keys(cloud.prog || {}).length; // how many cards the cloud returned — surfaced so a silent 0 is visible
        await applyCloud(cloud);
        setInitialPulled(true); // cloud is merged in — ONLY now is auto-push safe (a push before a
                                // successful pull would upsert this device's stale/empty state over the cloud)
        setSyncState({ status: "ok", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), error: "", n });
        return;
      } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 700 * (attempt + 1))); }
    }
    setSyncState({ status: "error", at: "", error: lastErr?.message || "couldn't reach the server" });
  }, [applyCloud]);

  const syncPush = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur.user) return;
    setSyncState((p) => ({ ...p, status: "syncing", error: "" }));
    try {
      await pushProgress(cur.user.id, COURSE_ID, { prog: cur.prog, streak: cur.streak, lessons: cur.lessons, units: cur.units });
      setSyncState({ status: "ok", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), error: "" });
    } catch (e) {
      setSyncState({ status: "error", at: "", error: e.message });
    }
  }, []);

  // pull once when signed in; auto-push unblocks INSIDE syncPull's success path — a FAILED pull
  // (offline, 5xx) must keep push disarmed, else this device upserts stale/empty state (incl. a
  // zeroed streak row) over the cloud. A later manual Pull retries and unblocks. Re-arm on sign-out.
  useEffect(() => {
    if (!loaded) return;
    if (user && !didInitialPull.current) {
      didInitialPull.current = true;
      syncPull();
    } else if (!user) {
      didInitialPull.current = false;
      setInitialPulled(false);
      setSyncState({ status: "idle", at: "", error: "" });
    }
  }, [loaded, user, syncPull]);

  // Re-pull whenever the app returns to the foreground (or regains focus) while signed in — so a
  // second device reflects the latest cloud without a full reload, closer to "always live". Throttled
  // so quick tab-switches don't thrash. This ALSO recovers a device whose first pull raced the auth
  // token: the next foreground re-pulls with the session attached. (auto-push guard is unaffected —
  // initialPulled is already true here, and mergeProg keeps newer local edits by timestamp.)
  const lastPullAt = useRef(0);
  useEffect(() => {
    if (!loaded) return;
    const maybePull = () => {
      if (document.visibilityState !== "visible") return;
      if (!stateRef.current.user) return;
      const now = Date.now();
      if (now - lastPullAt.current < 15000) return;   // throttle: at most once / 15s
      lastPullAt.current = now;
      syncPull();
    };
    document.addEventListener("visibilitychange", maybePull);
    window.addEventListener("focus", maybePull);
    return () => { document.removeEventListener("visibilitychange", maybePull); window.removeEventListener("focus", maybePull); };
  }, [loaded, syncPull]);

  // Reload to pick up a freshly-cached newer course — but WAIT until the initial progress pull has
  // settled. On a fresh device the course upgrade and the pull race: reloading mid-pull discards the
  // just-fetched cloud progress before it's persisted, so the reopened app looks empty (the fresh
  // sign-in "no progress" bug). Reload once the pull is done (ok) or truly failed (don't hang the
  // upgrade on a persistent auth issue) or there's no user to pull for.
  useEffect(() => {
    if (!courseUpgraded) return;
    if (!user || initialPulled || syncState.status === "error") location.reload();
  }, [courseUpgraded, user, initialPulled, syncState.status]);

  // per-user dialect SELECTION follows the account across devices (newest-wins by `updated`;
  // the toggle in the Language door pushes on change, so this pull only ever applies a
  // NEWER selection made on another device)
  useEffect(() => {
    if (!user) return;
    loadUserSettings(user.id).then((r) => {
      const cur = stateRef.current.settings || {};
      if (r && (Number(r.updated) || 0) > (Number(cur.dialectFormsUpdated) || 0))
        saveSettings({ ...cur, dialectForms: Object.fromEntries((r.dialect_forms || []).map((k) => [k, true])), dialectFormsUpdated: Number(r.updated) || 0 });
    }).catch(() => {});
  }, [user, saveSettings]);

  // auto-push on changes (debounced) — held until the initial pull has merged the cloud in
  useEffect(() => {
    if (!loaded || !user || !initialPulled) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => syncPush(), 2500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [prog, streak, lessons, units, loaded, user, initialPulled, syncPush]);

  if (!loaded) {
    return (
      <div className="ws-root ws-load">
        <Styles />
        <Waves size={40} />
        <p>Loading your tide…</p>
      </div>
    );
  }

  const ctx = {
    cards, prog, streak, view, setView, session, setSession,
    recordCard, togglePin, dismissNeedsWork, playCard, bumpStreak, saveProg,
    exportData, importData, settings, saveSettings,
    syncState, syncPull, syncPush,
    lessons, lessonId, setLessonId, completeLessonPart, startLessonPart, startStep, stepIdx,
    learnTarget, setLearnTarget, learnSection, setLearnSection,
    storyUnit, setStoryUnit,
    history, logAttempt, units, startUnitReview, markUnitReview, startGate,
    dialectCatalog, refreshDialect,
    user, signIn: signInWithGoogle, signInEmail: signInWithEmail, signOut: sbSignOut,
    admin: isAdmin(user) || roles.includes("admin"), roles, roleReqs,
    requestRole: async (r, note) => { await requestRole(r, note); setRoleReqs(await fetchMyRequests()); },
    openReport: (t) => setReport(t),
    enrolledN, menuOpen, setMenuOpen,
    // "back" from a menu sub-page returns to the ☰ menu, not straight home
    backToMenu: () => { setMenuOpen(true); setView("home"); },
  };

  return (
    <div className="ws-root" data-view={view}>
      <Styles />
      {!["home", "session"].includes(view) && SpeechRec && (
        <button className={`ws-vk ws-vk-fixed ${settings.voiceMode ? "on" : ""}`}
          title={settings.voiceMode ? "Voice mode — tap for keyboard" : "Keyboard mode — tap for voice"}
          onClick={() => saveSettings({ ...settings, voiceMode: !settings.voiceMode })}>
          {settings.voiceMode ? <Mic size={16} /> : <Keyboard size={16} />}
        </button>
      )}
      {view === "home" && <HomeView ctx={ctx} />}
      {view === "learn" && <LearnView ctx={ctx} />}
      {view === "lesson" && <LessonView ctx={ctx} />}
      {view === "teach" && <TeachView ctx={ctx} />}
      {view === "story" && <StoryView ctx={ctx} />}
      {view === "session" && <SessionView key={JSON.stringify(session)} ctx={ctx} />}
      {view === "needswork" && <NeedsWorkView ctx={ctx} />}
      {view === "read" && <ReadView ctx={ctx} />}
      {view === "pronounce" && <PronounceView ctx={ctx} />}
      {view === "stresslab" && <StressLabView ctx={ctx} />}
      {view === "accentduel" && <AccentDuelView ctx={ctx} />}
      {view === "stttest" && <SttTestView ctx={ctx} />}
      {view === "account" && <AccountView ctx={ctx} />}
      {view === "settings" && <SettingsView ctx={ctx} />}
      {view === "request" && <RequestView ctx={ctx} />}
      {view === "ella" && <EllaView ctx={ctx} />}
      {view === "language" && <LanguageView ctx={ctx} />}
      {view === "admin" && <AdminView ctx={ctx} />}
      {view === "class" && <ClassView ctx={ctx} />}
      {view === "queue" && <QueueView ctx={ctx} />}
      {report && <ReportSheet target={report} ctx={ctx} onClose={() => setReport(null)} />}
      {view === "cloze" && <ClozeView ctx={ctx} />}
    </div>
  );
}

/* ============ COURSE FROM DATABASE (beta) — renders the Supabase block model ============
   Reads the whole course live from Supabase (fetchCourse) and renders it as the typed-block
   model: guides · vocab · drills · phrases · gate · story. Read-only for now (proves CH2 is
   migrated + hooked up); interactive drilling + progress writes come next. Additive — does
   not touch the bundled-course app. */
const BLK_COLOR = { grammar: "var(--tide)", examples: "var(--tide)", note: "var(--tide)", vocab: "#2f8f4e", phrases: "#b5791d", drill: "#b5791d", assessment: "var(--coral)", story: "#7a5aa8", review: "var(--tide)" };
function renderMd(md) {
  if (!md) return null;
  const out = []; let tbl = null;
  const flush = () => { if (tbl) { out.push(tbl); tbl = null; } };
  for (const ln of md.split("\n")) {
    if (/^\s*\|.*\|\s*$/.test(ln)) {
      const cells = ln.trim().replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      (tbl || (tbl = { rows: [] })).rows.push(cells);
    } else { flush(); if (ln.trim()) out.push({ p: ln }); }
  }
  flush();
  return out.map((o, i) => o.rows
    ? <table key={i} style={{ borderCollapse: "collapse", margin: "6px 0", fontSize: 12.5 }}><tbody>{o.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ border: "1px solid #e3dccd", padding: "3px 8px" }}>{c}</td>)}</tr>)}</tbody></table>
    : <p key={i} style={{ margin: "3px 0", fontSize: 13.5, lineHeight: 1.5 }}>{o.p}</p>);
}
const isSentW = (w) => /\s/.test((w || "").trim());
// the quiz direction the preview shows for an item, mirroring the lesson player: recognition
// drills go Waray→English; production drills split half/half; the exam tests the paradigm TABLE
// (single words) Waray→English and the applied SENTENCES English→Waray.
function dbItemDir(block, items, idx, it) {
  if (block.type === "assessment" && block.assess_gate) {
    const hasW = items.some((x) => !isSentW(x.waray)), hasS = items.some((x) => isSentW(x.waray));
    if (hasW && hasS) return isSentW(it.waray) ? "etw" : "wte";
    return idx < Math.ceil(items.length / 2) ? "wte" : "etw";
  }
  if (block.type === "drill" && block.drill_kind === "production") return idx < Math.ceil(items.length / 2) ? "wte" : "etw";
  if (block.type === "drill") return "wte";
  return null;
}
const DirBadge = ({ d }) => !d ? null : (
  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".04em", padding: "1px 5px", borderRadius: 5, whiteSpace: "nowrap", flex: "0 0 auto",
    ...(d === "wte" ? { background: "rgba(28,176,184,.18)", color: "var(--sea)", border: "1px solid rgba(28,176,184,.4)" }
                    : { background: "rgba(244,165,58,.16)", color: "var(--sun)", border: "1px solid rgba(244,165,58,.4)" }) }}>
    {d === "wte" ? "WAR→ENG" : "ENG→WAR"}
  </span>
);
function DbItem({ it, dir, choices }) {
  const meaning = it.meaning || it.translation || "";
  const pron = it.pronunciation;
  if (choices) { // multiple-choice drill: show the prompt + all options (correct one in green)
    return (
      <div style={{ background: "rgba(197,138,42,.06)", borderRadius: 8, padding: "6px 8px", margin: "3px 0", display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", gap: 7, alignItems: "baseline", flexWrap: "wrap" }}>
          <DirBadge d={dir} />
          <b onClick={() => speak({ waray: it.waray, say: pron || "", english: meaning })} style={{ fontFamily: "Georgia,serif", fontSize: 15, cursor: "pointer" }} title="Tap to hear">{it.waray}</b>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {choices.map((ch, k) => (
            <span key={k} style={{ fontSize: 11.5, borderRadius: 8, padding: "2px 8px",
              ...(ch.ans ? { background: "var(--jade)", color: "#0b1f23", fontWeight: 700, border: "1px solid var(--jade)" }
                         : { background: "var(--sand)", color: "var(--ink-soft)", border: "1px solid var(--sand-deep)" }) }}>{ch.t}</span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div onClick={() => speak({ waray: it.waray, say: pron || "", english: meaning })}
      style={{ cursor: "pointer", padding: "3px 0", borderBottom: "1px dotted #24454b", display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}
      title="Tap to hear">
      <DirBadge d={dir} />
      <b style={{ fontFamily: "Georgia,serif", fontSize: 15 }}>{it.waray}</b>
      <span style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>{meaning}</span>
      {pron && <span style={{ marginLeft: "auto", fontFamily: "ui-monospace,monospace", fontSize: 11, color: "#8a9499" }}>{pron}</span>}
    </div>
  );
}
function DbBlock({ block, guides, pool, deck }) {
  const c = BLK_COLOR[block.type] || "#8a9499";
  const items = block.items || [];
  const isMC = block.type === "drill" && block.drill_kind === "recognition" && block.drill_modality === "mc";
  // this drill's own items are the section — wrong answers come from here first
  const section = items.map((it) => ({ id: it.waray, waray: it.waray, english: it.meaning || it.translation || "", deck }));
  const mcChoices = (it) => {
    const card = { id: it.waray, waray: it.waray, english: it.meaning || it.translation || "", deck };
    return [{ t: card.english, ans: true }, ...pickDistractors(pool || [], card, "wte", section).map((x) => ({ t: x, ans: false }))];
  };
  const renderItem = (it, i) => <DbItem key={i} it={it} dir={dbItemDir(block, items, i, it)} choices={isMC ? mcChoices(it) : null} />;
  const head = (label) => <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700, color: c, marginBottom: 4 }}>{label}</div>;
  let body;
  if (block.type === "grammar" || block.type === "examples" || block.type === "note") {
    body = <>{head(block.type + (block.title ? " · " + block.title : ""))}{block.body_md && <div>{renderMd(block.body_md)}</div>}{block.formula && <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 12, background: "var(--sand)", border: "1px solid #d6e2ef", borderRadius: 6, padding: "5px 8px", margin: "5px 0" }}>{block.formula}</div>}{items.map(renderItem)}</>;
  } else if (block.type === "vocab" || block.type === "phrases") {
    body = <>{head((block.type === "vocab" ? "Words" : "Phrases") + " · " + items.length)}{items.map(renderItem)}</>;
  } else if (block.type === "drill") {
    const dirLabel = block.drill_kind === "production" ? "Produce · both ways" : block.drill_kind === "recognition" ? "Recognize · Waray→English" : block.drill_kind;
    body = <>{head("Drill · " + dirLabel + (isMC ? " · multiple choice" : ""))}
      {items.map(renderItem)}
      {guides.length > 0 && <div style={{ marginTop: 5, display: "flex", gap: 5, flexWrap: "wrap" }}>{guides.map((g) => <span key={g} style={{ fontSize: 10, background: "var(--sand)", color: "var(--tide)", border: "1px solid #d6e2ef", borderRadius: 10, padding: "1px 7px" }}>{g}</span>)}</div>}</>;
  } else if (block.type === "assessment") {
    body = <>
      <div style={{ color: "var(--coral)", fontSize: 13, marginBottom: items.length ? 5 : 0 }}>🔒 Graded review · both ways · {items.length || block.assess_n || 10} items · {Math.round((block.assess_threshold || 0.8) * 100)}% to pass · no hints</div>
      {items.map(renderItem)}
    </>;
  } else if (block.type === "story") {
    body = <div style={{ color: "#7a5aa8", fontSize: 13 }}>📖 Story · {block.story_id}</div>;
  } else if (block.type === "review") {
    body = <div style={{ color: c, fontSize: 13 }}>↻ Review — {block.review_mode || "recall prior"}</div>;
  } else body = head(block.type);
  return (
    <div style={{ borderLeft: "3px solid " + c, paddingLeft: 10, margin: "8px 0" }}>
      {body}
      {block.footnote && block.footnote.split("\n").map((ln, k) => (
        <div key={k} style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 3 }}>* {ln}</div>
      ))}
    </div>
  );
}
// bundled-course overview: sections › units › lessons (the DB block model isn't available for these)
function BundledOverview({ course, open, setOpen }) {
  const secs = course.curriculum || [];
  const nU = secs.flatMap((s) => s.units).length;
  return (
    <>
      <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "2px 0 12px" }}>{nU} unit{nU === 1 ? "" : "s"} · bundled course.</p>
      {secs.flatMap((s) => s.units).map((u) => {
        const isOpen = open[u.id];
        return (
          <div key={u.id} style={{ border: "1px solid #e3dccd", borderRadius: 12, background: "var(--foam)", margin: "8px 0", overflow: "hidden" }}>
            <button onClick={() => setOpen((o) => ({ ...o, [u.id]: !o[u.id] }))}
              style={{ width: "100%", textAlign: "left", background: "var(--sand)", color: "var(--ink)", border: 0, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <b style={{ fontFamily: "Georgia,serif", fontSize: 15.5, flex: 1 }}>{u.name}</b>
              <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{(u.lessons || []).length} lessons</span>
              <ChevronRight size={16} style={{ transform: isOpen ? "rotate(90deg)" : "none", color: "var(--ink-soft)" }} />
            </button>
            {isOpen && (
              <div style={{ padding: "6px 14px 12px" }}>
                {u.can_do && <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 6 }}>“{u.can_do}”</div>}
                {(u.lessons || []).map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "5px 0", borderBottom: "1px dotted #efe7d9", paddingBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--sun-deep)", flex: 1 }}>{l.title || l.name}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{(l.items || []).length} items · {l.kind === "apply" ? "phrases" : "words"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ============ LANGUAGE & COURSE — one door for everything about what you're learning ============
   Language picker (Waray now; more later) · course selector + preview overview · sound & speech
   (pronunciation, answer-by-voice, speech test) · Ask Ella. Switching a DB course fetches +
   transforms + caches it first. */
/* ============================ ADMIN (global levers — separated from personal settings) ============================
   Everything here changes the app FOR EVERYONE (RLS admin-gated): the native-review queue,
   the dialect catalog, and the data-provenance health readout. Personal settings (your own
   dialect selection, sound, course) stay in the Language door. */
/* ============================ MY CLASS (instructor) / JOIN (student) ============================
   One class per instructor for now. The instructor sees the join code + roster; a student who
   joined sees which class they're in. Codes resolve through join_class() so students never get
   SELECT on classes (codes stay unguessable, not enumerable). */
/* ============================ REPORT SHEET (the ⚑) ============================
   One tap from any card/exercise. The learner picks a kind and optionally types a note; the
   item, lesson, direction and what they answered ride along automatically. Never blocks the
   lesson — it's a modal you dismiss. Anonymous users are told to sign in (feedback is
   attributed, so RLS requires an author). */
const REPORT_KINDS = [
  ["flag_grade", "Marked me wrong"],
  ["flag_confusing", "Confusing"],
  ["flag_wrong", "Content looks wrong"],
  ["typo", "Typo"],
];
function ReportSheet({ target, ctx, onClose }) {
  const { user, setView } = ctx;
  const [kind, setKind] = useState("flag_wrong");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const send = async () => {
    setBusy(true); setErr("");
    try {
      await submitFeedback({ kind, targetType: target.targetType, targetRef: target.targetRef, comment: note, context: target.context || {} });
      setSent(true); setTimeout(onClose, 1100);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(3,14,17,.72)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: "16px 16px 0 0", padding: "18px 18px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <Flag size={17} style={{ color: "var(--coral)" }} />
          <b style={{ fontSize: 15.5 }}>Report a problem</b>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "transparent", border: 0, color: "var(--ink-soft)", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12 }}>
          about <b style={{ color: "var(--ink)", fontFamily: "Georgia,serif" }}>{target.targetRef}</b>
          {target.context?.english ? ` · ${target.context.english}` : ""}
        </div>
        {sent ? (
          <div className="ws-backup-msg ok"><Check size={16} /><span>Thanks — sent to the review queue.</span></div>
        ) : !user ? (
          <>
            <div className="ws-backup-msg" style={{ marginBottom: 10 }}><AlertCircle size={16} /><span>Sign in to send feedback — it's attributed so we can follow up.</span></div>
            <button className="ws-start ws-full" onClick={() => { onClose(); setView("account"); }}><Cloud size={16} /> Go to Account</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 7 }}>What's off?</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
              {REPORT_KINDS.map(([k, label]) => (
                <button key={k} onClick={() => setKind(k)}
                  style={{ fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 999, cursor: "pointer",
                    border: "1px solid " + (kind === k ? "var(--tide)" : "var(--sand-deep)"),
                    background: kind === k ? "rgba(28,176,184,.14)" : "transparent",
                    color: kind === k ? "var(--sea)" : "var(--ink-soft)" }}>{label}</button>
              ))}
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add a note (optional)…"
              style={{ width: "100%", fontFamily: "inherit", fontSize: 14, color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 9, padding: "9px 12px", resize: "vertical" }} />
            {err && <div className="ws-backup-msg err" style={{ marginTop: 8 }}><AlertCircle size={16} /><span>{err}</span></div>}
            <button className="ws-start ws-full" style={{ marginTop: 12, opacity: busy ? .6 : 1 }} disabled={busy} onClick={send}>
              {busy ? "Sending…" : "Send"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================ REVIEW QUEUE (admin / instructor) ============================ */
function QueueView({ ctx }) {
  const { setView, admin } = ctx;
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");
  const [editId, setEditId] = useState(null);   // feedback id whose definition we're fixing
  const [editText, setEditText] = useState("");
  const load = useCallback(async () => {
    try { setItems(await fetchFeedback("open")); } catch (e) { setErr(e.message); setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const KIND_LABEL = { flag_grade: "marked wrong", flag_confusing: "confusing", flag_wrong: "looks wrong", typo: "typo", propose_add: "add meaning", propose_reorder: "reorder", propose_disputed: "flag wrong", validate: "validated" };
  const resolve = async (id, decision) => {
    try { await resolveFeedback(id, decision); setItems((xs) => xs.filter((x) => x.id !== id)); }
    catch (e) { setErr(e.message); }
  };
  // apply a fix: write the corrected definition to the dictionary (durable via native_confirmations,
  // replayed on every rebuild) AND resolve the flag as edited — the propose→decide loop closing on content.
  const applyEdit = async (f) => {
    if (!editText.trim()) { setErr("Type the corrected definition first."); return; }
    try {
      await applyFix({ feedback: f, meaning: editText.trim() });   // writes the fix + records the chain
      setItems((xs) => xs.filter((x) => x.id !== f.id));
      setEditId(null); setEditText(""); setErr("");
    } catch (e) { setErr(e.message); }
  };
  const editable = (f) => f.target_type === "word" || f.target_type === "card";
  return (
    <div className="ws-page">
      <TopBar title="Review queue" onBack={ctx.backToMenu} />
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: "0 0 12px" }}>
        Everything learners and reviewers flag lands here. {admin ? "You decide each one." : "Your class's flags."}
      </p>
      {err && <div className="ws-backup-msg err" style={{ marginBottom: 10 }}><AlertCircle size={16} /><span>{err}</span></div>}
      {items === null && <p style={{ color: "var(--ink-soft)" }}>Loading…</p>}
      {items && items.length === 0 && <p style={{ color: "var(--jade)" }}>🎉 Nothing open — the queue is clear.</p>}
      {items && items.map((f) => (
        <div key={f.id} style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "12px 14px", marginBottom: 9 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <b style={{ fontFamily: "Georgia,serif", fontSize: 16 }}>{f.target_ref}</b>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, border: "1px solid var(--coral)", color: "var(--coral)" }}>{KIND_LABEL[f.kind] || f.kind}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-dim)" }}>{f.author_role}</span>
          </div>
          {f.comment && <div style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 5 }}>“{f.comment}”</div>}
          {f.context && Object.keys(f.context).length > 0 && (
            <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 5, fontFamily: "ui-monospace,monospace" }}>
              {[f.context.english && `= ${f.context.english}`, f.context.direction, f.context.mode, f.context.lesson].filter(Boolean).join(" · ")}
            </div>
          )}
          {admin && editId === f.id ? (
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} placeholder={`corrected definition for “${f.target_ref}”`}
                onKeyDown={(e) => e.key === "Enter" && applyEdit(f)}
                style={{ flex: 1, fontSize: 13.5, color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 9, padding: "8px 11px" }} />
              <button onClick={() => applyEdit(f)} style={{ fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "0 14px", borderRadius: 9, border: 0, background: "var(--tide)", color: "#052024", cursor: "pointer" }}>Apply</button>
              <button onClick={() => { setEditId(null); setEditText(""); }} style={{ fontFamily: "inherit", fontSize: 12.5, padding: "0 10px", borderRadius: 9, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--ink-soft)", cursor: "pointer" }}>Cancel</button>
            </div>
          ) : admin && (
            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              {editable(f) && <button onClick={() => { setEditId(f.id); setEditText(""); setErr(""); }} style={{ fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 9, border: "1px solid var(--tide)", background: "transparent", color: "var(--sea)", cursor: "pointer" }}>Fix definition</button>}
              <button onClick={() => resolve(f.id, "applied")} style={{ fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 9, border: "1px solid var(--jade)", background: "transparent", color: "var(--jade)", cursor: "pointer" }}>Mark fixed</button>
              <button onClick={() => resolve(f.id, "rejected")} style={{ fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 9, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--ink-soft)", cursor: "pointer" }}>Dismiss</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ClassView({ ctx }) {
  const { setView, user, roles, admin } = ctx;
  const isInstructor = (roles || []).includes("instructor") || admin;
  const [taught, setTaught] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [roster, setRoster] = useState([]);
  const [byStudent, setByStudent] = useState({}); // student_id -> {mastered, seen, testAvg, passed}
  const [flags, setFlags] = useState([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        isInstructor ? fetchMyTaughtClass(user.id) : Promise.resolve(null),
        fetchMyEnrolledClasses(),
      ]);
      setTaught(t); setEnrolled(e || []);
      if (t) {
        const r = await fetchRoster(t.id);
        setRoster(r);
        const ids = r.map((s) => s.student_id);
        const [{ prog, units }, fl] = await Promise.all([fetchClassProgress(ids), fetchClassFlags(t.id)]);
        const by = {};
        for (const id of ids) by[id] = { mastered: 0, seen: 0, tests: [], passed: 0 };
        for (const p of prog) { const b = by[p.user_id]; if (!b) continue; if (p.seen) b.seen++; if (p.box >= 4) b.mastered++; }
        for (const u of units) { const b = by[u.user_id]; if (!b) continue; b.tests.push(u.best || 0); if (u.passed) b.passed++; }
        for (const id of ids) { const b = by[id]; b.testAvg = b.tests.length ? Math.round(b.tests.reduce((s, x) => s + x, 0) / b.tests.length) : null; }
        setByStudent(by); setFlags(fl || []);
      }
    } catch (err) { setMsg({ kind: "err", text: err.message }); }
    setLoading(false);
  }, [user, isInstructor]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name.trim()) { setMsg({ kind: "err", text: "Give the class a name." }); return; }
    setBusy(true); setMsg(null);
    try { const c = await createClass(name.trim()); setTaught(c); setRoster([]); setMsg({ kind: "ok", text: "Class created — share the code below." }); }
    catch (e) { setMsg({ kind: "err", text: e.message }); }
    setBusy(false);
  };

  if (!user) return (
    <div className="ws-page">
      <TopBar title="My class" onBack={ctx.backToMenu} />
      <p style={{ padding: "8px 4px", color: "var(--ink-soft)" }}>Sign in first — then you can join a class or create one.</p>
      <button className="ws-cta" onClick={() => setView("account")} style={{ width: "100%" }}>
        <div className="ws-cta-ic"><Cloud size={18} /></div><div><div className="ws-cta-t">Go to Account</div></div>
      </button>
    </div>
  );

  return (
    <div className="ws-page">
      <TopBar title="My class" onBack={ctx.backToMenu} />
      {msg && <div className={`ws-backup-msg ${msg.kind === "err" ? "err" : "ok"}`} style={{ margin: "0 0 12px" }}>{msg.kind === "err" ? <AlertCircle size={16} /> : <Check size={16} />}<span>{msg.text}</span></div>}
      {loading && <p style={{ color: "var(--ink-soft)" }}>Loading…</p>}

      {/* --- instructor: the class you teach --- */}
      {!loading && isInstructor && (
        <>
          <SectionLabel icon={<Layers size={14} />} text="Class you teach" />
          {taught ? (
            <div style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: 600 }}>{taught.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{roster.length} student{roster.length === 1 ? "" : "s"}</div>
              <div style={{ fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)", margin: "12px 0 5px" }}>Join code — share this</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <code style={{ flex: 1, fontFamily: "ui-monospace,monospace", fontSize: 21, letterSpacing: ".16em", color: "var(--sea)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 9, padding: "10px 12px", textAlign: "center" }}>{taught.code}</code>
                <button onClick={() => { try { navigator.clipboard.writeText(taught.code); setMsg({ kind: "ok", text: "Code copied." }); } catch (e) {} }}
                  style={{ flex: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "10px 14px", borderRadius: 9, border: "1px solid var(--tide)", background: "transparent", color: "var(--sea)", cursor: "pointer" }}>Copy</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 10 }}>You don't have a class yet. Create one and share its code with your students.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Waray 101 · Fall"
                  style={{ flex: 1, fontSize: 14, color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 9, padding: "9px 12px" }} />
                <button disabled={busy} onClick={create}
                  style={{ flex: "none", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, padding: "0 16px", borderRadius: 9, border: 0, background: "var(--tide)", color: "#052024", cursor: "pointer", opacity: busy ? .6 : 1 }}>
                  {busy ? "…" : "Create"}
                </button>
              </div>
            </div>
          )}
          {taught && (() => {
            const students = roster.map((r) => ({ ...r, s: byStudent[r.student_id] || { mastered: 0, seen: 0, testAvg: null, passed: 0 } }));
            const withTests = students.filter((x) => x.s.testAvg != null);
            const classAvg = withTests.length ? Math.round(withTests.reduce((a, x) => a + x.s.testAvg, 0) / withTests.length) : null;
            const maxMastered = Math.max(1, ...students.map((x) => x.s.mastered));
            return (
              <>
                <div className="ws-dash-summary">
                  <div className="ws-dash-stat"><b>{roster.length}</b><span>student{roster.length === 1 ? "" : "s"}</span></div>
                  <div className="ws-dash-stat"><b>{classAvg != null ? classAvg + "%" : "—"}</b><span>avg test</span></div>
                  <div className="ws-dash-stat"><b>{flags.length}</b><span>open flag{flags.length === 1 ? "" : "s"}</span></div>
                </div>

                <SectionLabel icon={<User size={14} />} text="Students" />
                {roster.length === 0
                  ? <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>No students yet — share the code above.</p>
                  : students.map((r) => (
                      <div key={r.student_id} className="ws-dash-row">
                        <div className="ws-dash-name">
                          <b>{r.display_name || r.email || "student"}</b>
                          <i>{r.s.mastered} mastered · {r.s.passed} unit{r.s.passed === 1 ? "" : "s"} passed</i>
                        </div>
                        <div className="ws-dash-bar" title={`${r.s.mastered} words mastered`}><span style={{ width: `${Math.round((r.s.mastered / maxMastered) * 100)}%` }} /></div>
                        <div className="ws-dash-score">{r.s.testAvg != null ? r.s.testAvg + "%" : "—"}</div>
                      </div>
                    ))}

                {flags.length > 0 && (
                  <>
                    <SectionLabel icon={<Flag size={14} />} text="Flags to review" />
                    {flags.map((f) => (
                      <button key={f.id} className="ws-backup-row" onClick={() => setView("queue")}>
                        <div className="ws-backup-txt"><b>{f.target_ref}</b><i>{(f.kind || "").replace(/_/g, " ")}{f.comment ? " · " + f.comment : ""}</i></div>
                        <ChevronRight size={16} className="ws-cta-arrow" />
                      </button>
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </>
      )}

      {!loading && !isInstructor && (
        <div className="ws-empty" style={{ marginTop: 20 }}>
          <GraduationCap size={26} />
          <p>“My Class” is for teachers. To join a class as a student, use <b>Request</b> from the menu.</p>
          <button className="ws-cta ws-cta-primary" style={{ margin: "14px auto" }} onClick={() => setView("request")}>Go to Request</button>
        </div>
      )}
    </div>
  );
}

function AdminView({ ctx }) {
  const { setView } = ctx;
  const [forms, setForms] = useState(null);
  const [stats, setStats] = useState(null);
  const [reqs, setReqs] = useState([]);      // pending role requests to approve/decline
  const [changes, setChanges] = useState([]); // dictionary change history (traceability chain)
  const [err, setErr] = useState("");
  const loadAll = useCallback(async () => {
    try {
      const [fl, dict, rq, ch] = await Promise.all([fetchAllDialectForms(), fetchDictionary(), fetchPendingRoleRequests().catch(() => []), fetchChangeLog().catch(() => [])]);
      setForms(fl); setReqs(rq || []); setChanges(ch || []);
      const by = {}; let queue = 0;
      for (const d of dict) { if (!d.confirmed) queue++; else { const k = d.confirmed_by || "unstamped"; by[k] = (by[k] || 0) + 1; } }
      setStats({ total: dict.length, by, queue });
    } catch (e) { setErr(e.message || String(e)); }
  }, []);
  const decide = async (req, approve) => {
    try { await decideRoleRequest(req, approve); setReqs((xs) => xs.filter((x) => x.id !== req.id)); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { loadAll(); }, [loadAll]);
  const mark = async (k, patch) => {
    try { await setDialectForm(k, patch); await loadAll(); ctx.refreshDialect(); } catch (e) { setErr(e.message); }
  };
  const box = { background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 };
  return (
    <div className="ws-page">
      <TopBar title="Admin — global levers" onBack={ctx.backToMenu} />
      <div style={{ padding: "0 4px" }}>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 14px" }}>
          Everything on this screen changes the app for EVERYONE. Your personal settings live under 🌐 Language &amp; course.
        </p>
        {err && <p style={{ color: "var(--coral)", fontSize: 12.5 }}>{err}</p>}

        <SectionLabel icon={<span style={{ fontSize: 13 }}>✋</span>} text={`Role requests${reqs.length ? ` (${reqs.length})` : ""}`} />
        {reqs.length === 0
          ? <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "2px 4px 14px" }}>No pending requests. When someone asks to be an instructor or reviewer, it lands here to approve.</p>
          : reqs.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "11px 13px", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.display_name || r.email || "someone"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>wants <b>{r.role}</b>{r.note ? ` · “${r.note}”` : ""}</div>
                </div>
                <button onClick={() => decide(r, true)} style={{ flex: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "6px 12px", borderRadius: 9, border: "1px solid var(--jade)", background: "transparent", color: "var(--jade)", cursor: "pointer" }}>Approve</button>
                <button onClick={() => decide(r, false)} style={{ flex: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--ink-soft)", cursor: "pointer" }}>Decline</button>
              </div>
            ))}

        <SectionLabel icon={<span style={{ fontSize: 13 }}>🗺️</span>} text="Dialect catalog (global config)" />
        <div style={box}>
          {!forms && <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading…</p>}
          {forms && forms.map((fm) => (
            <div key={fm.k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "5px 2px", borderBottom: "1px dotted #24454b", opacity: fm.active ? 1 : 0.45 }}>
              <span style={{ flex: 1 }}><b>{fm.k}</b> — {fm.rel} <i>{fm.canon}</i> <span style={{ color: "var(--ink-soft)" }}>({fm.gloss})</span>
                {fm.verified && <span style={{ color: "var(--jade)", fontSize: 11.5 }}> ✓ native-verified</span>}
                {!fm.active && <span style={{ color: "var(--coral)", fontSize: 11.5 }}> · dropped</span>}</span>
              {fm.active && !fm.verified && <button onClick={() => mark(fm.k, { verified: true })}
                style={{ fontSize: 10.5, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--jade)", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>✓ verify</button>}
              {fm.verified && fm.active && <button onClick={() => mark(fm.k, { verified: false })}
                style={{ fontSize: 10.5, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--ink-soft)", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>unverify</button>}
              {fm.active
                ? <button onClick={() => { if (confirm(`Drop “${fm.k}” from every user's settings list?`)) mark(fm.k, { active: false }); }}
                    style={{ fontSize: 10.5, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--coral)", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>✗ drop</button>
                : <button onClick={() => mark(fm.k, { active: true })}
                    style={{ fontSize: 10.5, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--jade)", borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>restore</button>}
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 7 }}>
            Rows come from the <code>dialect_forms</code> table — edits reach every device on refresh, no deploy. ✓ marks what Ella has confirmed as real Daram usage.
          </div>
        </div>

        <SectionLabel icon={<Database size={14} />} text="Data provenance" />
        <div style={box}>
          {stats ? (
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <b>{stats.total}</b> dictionary entries · confirmed by:{" "}
              {Object.entries(stats.by).map(([k, n]) => `${k} ${n}`).join(" · ")} · <b style={{ color: stats.queue ? "var(--sun)" : "var(--jade)" }}>{stats.queue} in the queue</b>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>
                Every confirmed definition cites its verifier (Tramp print · book print · Ella). <code>npm run check</code> proves the DB rebuilds from committed sources.
              </div>
            </div>
          ) : <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Loading…</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <a href="verify/" target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--tide)" }}>Course-vs-book review site →</a>
            <a href="verify/ella-todo.html" target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: "var(--tide)" }}>Ella printable todo →</a>
          </div>

          <SectionLabel icon={<span style={{ fontSize: 13 }}>🧬</span>} text="Change history — traceability" />
          {changes.length === 0
            ? <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "2px 4px" }}>No dictionary changes recorded yet. When a flag is fixed from the Review queue, the full chain — who suggested, who approved, before → after — is logged here.</p>
            : changes.map((c) => (
                <div key={c.id} style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "11px 13px", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <b style={{ fontFamily: "Georgia,serif", fontSize: 16 }}>{c.target_ref}</b>
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{String(c.approved_at || "").slice(0, 10)}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
                    {c.before_val?.meaning ? <><s style={{ opacity: .7 }}>{c.before_val.meaning}</s> → </> : null}<b style={{ color: "var(--ink)" }}>{c.after_val?.meaning}</b>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 5, fontFamily: "ui-monospace,monospace" }}>
                    {c.suggestedName ? `suggested: ${c.suggestedName}${c.suggestedRole ? ` (${c.suggestedRole})` : ""}` : "suggested: —"}
                    {" · "}reviewed: {c.reviewedName || "—"}{" · "}approved: {c.approvedName || "—"}
                    {c.suggestion ? <div style={{ marginTop: 2 }}>“{c.suggestion}”</div> : null}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

function LanguageView({ ctx }) {
  const { setView, settings, saveSettings, admin } = ctx;
  const [dbCourses, setDbCourses] = useState([]);        // courses that live only in Supabase
  const [selected, setSelected] = useState(COURSE_ID);   // previewed course (defaults to active)
  const [st, setSt] = useState({ loading: false });      // DB-course overview fetch
  const [open, setOpen] = useState({});
  const [switching, setSwitching] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchCourses()
      .then((cs) => setDbCourses((cs || []).filter((c) => !COURSES.some((b) => b.id === c.id))))
      .catch(() => {});
  }, []);

  const isDb = !COURSES.some((c) => c.id === selected);
  // fetch the DB block model to preview a DB course (bundled courses render from their curriculum)
  useEffect(() => {
    if (!isDb) { setSt({ loading: false }); setOpen({}); return; }
    let alive = true; setSt({ loading: true }); setOpen({});
    fetchCourse(selected).then((course) => alive && setSt({ course })).catch((e) => alive && setSt({ error: e.message || String(e) }));
    return () => { alive = false; };
  }, [selected, isDb]);

  const switchTo = async (id) => {
    if (id === COURSE_ID) return;
    if (COURSES.some((c) => c.id === id)) { try { localStorage.setItem("sulog:course", id); } catch (e) {} location.reload(); return; }
    setSwitching(true); setErr("");
    try {
      const meta = dbCourses.find((c) => c.id === id);
      const [bundled, version] = await Promise.all([fetchCourseBundled(id, meta?.name || id), fetchCourseVersion(id).catch(() => 0)]);
      if (!bundled.curriculum.length) throw new Error("that course has no drillable lessons yet.");
      // if the cache write fails (storage full), do NOT flip the course + reload — boot would find no
      // cache and silently fall back to the default course, not the one the user tapped
      if (!cacheDbCourse(bundled, version)) throw new Error("couldn't save the course on this device (storage full?). Free some space and retry.");
      try { localStorage.setItem("sulog:course", id); } catch (e) {}
      location.reload();
    } catch (e) { setSwitching(false); setErr("Couldn't load that course: " + (e.message || e)); }
  };

  const all = [
    ...COURSES.map((c) => ({ id: c.id, name: c.name })),
    ...dbCourses.map((c) => ({ id: c.id, name: c.name })),
  ];
  if (!all.some((c) => c.id === COURSE_ID)) all.push({ id: COURSE_ID, name: ACTIVE.name }); // active DB course before the list lands
  const units = st.course ? st.course.phases.flatMap((p) => p.units.map((u) => ({ ...u, phase: p.name }))) : [];
  // flat card pool for the preview's multiple-choice distractors (deck = unit id) — scoped to the
  // PREVIEWED course, not the active deck, so options come from the right vocabulary
  const previewPool = React.useMemo(() => {
    if (!st.course) return [];
    const out = [], seen = new Set();
    for (const p of st.course.phases || []) for (const u of p.units || []) for (const l of u.lessons || []) for (const b of l.blocks || []) for (const it of b.items || []) {
      const eng = it.meaning || it.translation || "";
      if (!it.waray || !eng || seen.has(it.waray)) continue;
      seen.add(it.waray); out.push({ id: it.waray, waray: it.waray, english: eng, deck: u.id });
    }
    return out;
  }, [st.course]);

  const langPill = (label, on, soon) => (
    <span style={{ fontSize: 12.5, border: "1px " + (soon ? "dashed" : "solid") + " " + (on ? "var(--tide)" : "var(--sand-deep)"),
      background: on ? "var(--tide)" : "transparent", color: on ? "#fff" : soon ? "var(--ink-soft)" : "var(--ink)",
      borderRadius: 999, padding: "5px 12px" }}>{label}</span>
  );
  const selName = (all.find((c) => c.id === selected) || {}).name || "";

  return (
    <div className="ws-page">
      <TopBar title="Language & course" onBack={() => setView("home")} />
      <div style={{ padding: "4px 14px 40px", maxWidth: 720, margin: "0 auto" }}>

        <SectionLabel icon={<Globe size={14} />} text="Language" />
        <div className="ws-course-switch">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {langPill("🌊 Waray (Winaray)", true, false)}
            {langPill("Cebuano — soon", false, true)}
            {langPill("Tagalog — soon", false, true)}
          </div>
          <p className="ws-course-note" style={{ marginTop: 8 }}>More languages are on the way — your account &amp; progress carry across all of them.</p>
        </div>

        <SectionLabel icon={<Layers size={14} />} text="Course" />
        <div style={{ display: "flex", gap: 6, margin: "2px 0 12px", flexWrap: "wrap" }}>
          {all.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              style={{ border: "1px solid " + (c.id === selected ? "var(--tide)" : "var(--sand-deep)"), background: c.id === selected ? "var(--tide)" : "var(--foam)", color: c.id === selected ? "#fff" : "var(--ink)", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, cursor: "pointer" }}>
              {c.name}{c.id === COURSE_ID ? " ·  active" : ""}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 4px" }}>
          {selected === COURSE_ID
            ? <span style={{ fontSize: 12.5, color: "var(--jade)", fontWeight: 600 }}>✓ Your active course</span>
            : <button onClick={() => switchTo(selected)} disabled={switching}
                style={{ background: "var(--tide)", color: "#fff", border: 0, borderRadius: 999, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: switching ? "default" : "pointer", opacity: switching ? 0.7 : 1 }}>
                {switching ? "Loading…" : "Switch to this course"}
              </button>}
        </div>
        {err && <p style={{ color: "var(--coral)", fontSize: 12.5 }}>{err}</p>}

        <SectionLabel icon={<span style={{ fontSize: 13 }}>🗺️</span>} text="Dialect — accepted regional forms" />
        <div style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "11px 14px", marginBottom: 14 }}>
          {(() => {
            // catalog comes from the dialect_forms table (global config, no deploy to change);
            // the checked SELECTION is yours — saved locally and synced to your account
            const catalog = ctx.dialectCatalog || [];
            const presetIds = [...new Set(catalog.flatMap((f) => f.presets || []))];
            const presets = [{ id: "standard", label: "Standard · Tacloban", forms: [] },
              ...presetIds.map((id) => ({ id, label: id === "daram" ? "Daram · rural Samar" : id, forms: catalog.filter((f) => (f.presets || []).includes(id)).map((f) => f.k) }))];
            const forms = settings.dialectForms ?? (settings.dialect === "daram" ? Object.fromEntries(catalog.filter((f) => (f.presets || []).includes("daram")).map((f) => [f.k, true])) : {});
            const setForms = (nf) => {
              saveSettings({ ...settings, dialectForms: nf, dialectFormsUpdated: Date.now() });
              if (ctx.user) saveUserSettings(ctx.user.id, Object.keys(nf).filter((k) => nf[k])).catch(() => {});
            };
            const onCount = catalog.filter((f) => forms[f.k]).length;
            return (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {presets.map((p) => {
                    const active = p.forms.length === onCount && p.forms.every((k) => forms[k]);
                    return (
                      <button key={p.id} onClick={() => setForms(Object.fromEntries(p.forms.map((k) => [k, true])))}
                        style={{ border: "1px solid " + (active ? "var(--tide)" : "var(--sand-deep)"), background: active ? "var(--tide)" : "var(--foam)", color: active ? "#fff" : "var(--ink)", borderRadius: 999, padding: "5px 12px", fontSize: 12.5, cursor: "pointer" }}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 2 }}>
                  {catalog.map((fm) => (
                    <label key={fm.k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, padding: "4px 2px", cursor: "pointer", color: forms[fm.k] ? "var(--ink)" : "var(--ink-soft)" }}>
                      <input type="checkbox" checked={!!forms[fm.k]} onChange={(e) => setForms({ ...forms, [fm.k]: e.target.checked })} style={{ accentColor: "var(--tide)" }} />
                      <span><b>{fm.k}</b> — {fm.rel} <i>{fm.canon}</i> <span style={{ color: "var(--ink-soft)" }}>({fm.gloss})</span>
                        {fm.verified && <span title="native-speaker verified" style={{ color: "var(--jade)", fontSize: 11.5 }}> ✓</span>}</span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 7, lineHeight: 1.45 }}>
                  Checked forms are ACCEPTED when you answer ({onCount} on){ctx.user ? " — synced to your account" : ""}. ✓ = native-speaker verified. Presets preselect; adjust freely. Courses still teach the standard forms.
                </div>
              </>
            );
          })()}
        </div>

        <SectionLabel icon={<Volume2 size={14} />} text="Sound & speech" />
        <button className="ws-backup-row" onClick={() => setView("pronounce")}>
          <div className="ws-backup-ic"><Ear size={18} /></div>
          <div className="ws-backup-txt"><b>Pronunciation guide</b><i>How Waray sounds · voice &amp; speed</i></div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        {SpeechRec && (
          <button className="ws-backup-row" onClick={() => saveSettings({ ...settings, voiceMode: !settings.voiceMode })}>
            <div className="ws-backup-ic ws-ic-tide"><Mic size={18} /></div>
            <div className="ws-backup-txt"><b>Answer by voice</b><i>{settings.voiceMode ? "On — speak your answers" : "Off — type your answers"}</i></div>
            <span style={{ width: 36, height: 21, borderRadius: 21, background: settings.voiceMode ? "var(--tide)" : "var(--sand-deep)", position: "relative", flex: "none" }}>
              <span style={{ position: "absolute", top: 2, left: settings.voiceMode ? 17 : 2, width: 17, height: 17, borderRadius: "50%", background: "var(--foam)", transition: "left .15s" }} />
            </span>
          </button>
        )}
        {SpeechRec && (
          <button className="ws-backup-row" onClick={() => setView("stttest")}>
            <div className="ws-backup-ic"><Mic size={18} /></div>
            <div className="ws-backup-txt"><b>Test speech recognition</b><i>Check if your device can hear Waray</i></div>
            <ChevronRight size={18} className="ws-cta-arrow" />
          </button>
        )}

        <SectionLabel icon={<span style={{ fontSize: 13 }}>👩</span>} text="Native speaker" />
        <button className="ws-backup-row" onClick={() => setView("ella")}>
          <div className="ws-backup-ic ws-ic-coral"><span style={{ fontSize: 16 }}>👩</span></div>
          <div className="ws-backup-txt"><b>Ella · review queue</b><i>Missing answers, dialect questions{admin ? " & dictionary confirmations" : ""}</i></div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>

        <SectionLabel icon={<BookOpen size={14} />} text={"Preview" + (selName ? " · " + selName : "")} />
        {isDb && (
          <a href="/verify/" target="_blank" rel="noopener" className="ws-backup-row" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="ws-backup-ic ws-ic-tide"><BookOpen size={18} /></div>
            <div className="ws-backup-txt"><b>Course vs. book</b><i>Every lesson side-by-side with the scanned PDF — directions, choices &amp; source checks</i></div>
            <ChevronRight size={18} className="ws-cta-arrow" />
          </a>
        )}
        {isDb ? (
          <>
            {st.loading && <p style={{ color: "var(--ink-soft)" }}>Loading course from the database…</p>}
            {st.error && <p style={{ color: "var(--coral)" }}>Couldn't load: {st.error}</p>}
            {st.course && (
              <>
                <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "2px 0 12px" }}>From the database — {units.length} unit{units.length === 1 ? "" : "s"}, full block model (guides, footnotes, gates &amp; stories). Tap any word to hear it.</p>
                {units.map((u) => {
                  const isOpen = open[u.id];
                  return (
                    <div key={u.id} style={{ border: "1px solid #e3dccd", borderRadius: 12, background: "var(--foam)", margin: "8px 0", overflow: "hidden" }}>
                      <button onClick={() => setOpen((o) => ({ ...o, [u.id]: !o[u.id] }))}
                        style={{ width: "100%", textAlign: "left", background: "var(--sand)", color: "var(--ink)", border: 0, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                        <b style={{ fontFamily: "Georgia,serif", fontSize: 15.5, flex: 1 }}>{u.name}</b>
                        <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{(u.lessons || []).length} lessons</span>
                        <ChevronRight size={16} style={{ transform: isOpen ? "rotate(90deg)" : "none", color: "var(--ink-soft)" }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: "6px 14px 12px" }}>
                          {u.can_do && <div style={{ fontSize: 12, color: "var(--ink-soft)", fontStyle: "italic", marginBottom: 6 }}>“{u.can_do}”</div>}
                          {(u.lessons || []).map((l) => {
                            const guides = (l.blocks || []).filter((b) => ["grammar", "examples", "note", "vocab"].includes(b.type)).map((b) => b.type);
                            return (
                              <div key={l.id} style={{ margin: "10px 0" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sun-deep)", marginBottom: 2 }}>{l.title}</div>
                                {(l.blocks || []).map((b) => <DbBlock key={b.id} block={b} guides={b.type === "drill" ? [...new Set(guides)] : []} pool={previewPool} deck={u.id} />)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        ) : (
          <BundledOverview course={getCourse(selected)} open={open} setOpen={setOpen} />
        )}
      </div>
    </div>
  );
}

/* ============ ADMIN REVIEW QUEUE — confirm/fix the flagged dictionary entries ============
   Lists dictionary rows with confirmed=false (Ella's queue). Editing meaning/pronunciation +
   Confirm writes to Supabase (RLS allows the admin only). Row drops off on confirm. */
// One unconfirmed dictionary word — SAME cited multiple-choice pattern as the missing-answer
// cards: every candidate gloss says WHO asserts it (how the word entered the app, vs what the
// Tramp dictionary prints), plus a free-text "my own". Candidates are baked at build time by
// tools/gen-confirm-candidates.mjs. Pronunciation is verified alongside (prefilled from the
// row or from Tramp's accented headword) and saves with the meaning.
function DbReviewRow({ entry, onConfirmed }) {
  const cand = CONFIRM_CANDIDATES[entry.waray] || {};
  const options = [];
  if (entry.meaning) options.push({ key: "current", label: cand.origin || "course deck", text: entry.meaning });
  if (cand.tramp?.gloss && cand.tramp.gloss.toLowerCase() !== (entry.meaning || "").toLowerCase())
    options.push({ key: "tramp", label: `Tramp dictionary${cand.tramp.page ? ` · p.${cand.tramp.page}` : ""}`, text: cand.tramp.gloss });
  const [pick, setPick] = useState(options[0]?.key || "other");
  const [other, setOther] = useState("");
  const [pron, setPron] = useState(entry.pronunciation || cand.pron || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const chosen = pick === "other" ? other.trim() : options.find((o) => o.key === pick)?.text || "";
  const confirm = async () => {
    if (!chosen) return;
    setSaving(true); setErr("");
    try { await confirmEntry(entry.waray, { confirmed: true, meaning: chosen, pronunciation: pron || null }); onConfirmed(entry.waray); }
    catch (e) { setErr(e.message || "save failed"); setSaving(false); }
  };
  const optionRow = (key, label, text) => (
    <label key={key} style={{ display: "flex", gap: 9, alignItems: "baseline", padding: "7px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid " + (pick === key ? "var(--jade)" : "var(--sand-deep)"), background: pick === key ? "rgba(31,184,159,.08)" : "transparent", marginTop: 6 }}>
      <input type="radio" name={"dict-" + entry.waray} checked={pick === key} onChange={() => setPick(key)} style={{ accentColor: "var(--jade)", marginTop: 2 }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", color: "var(--ink-soft)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontFamily: "Georgia,serif", fontSize: 15.5, fontWeight: 600, lineHeight: 1.35 }}>{text}</span>
    </label>
  );
  return (
    <div style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 12, padding: "12px 14px", margin: "10px 0" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#b79ae8", fontWeight: 700 }}>{entry.kind}{entry.loan ? ` · ${entry.loan} loan` : ""}</div>
      <b style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "inline-block", marginTop: 2 }} onClick={() => speak({ waray: entry.waray, say: pron, english: chosen || entry.meaning })} title="Tap to hear">{entry.waray} 🔊</b>
      {options.map((o) => optionRow(o.key, o.label, o.text))}
      <label style={{ display: "flex", gap: 9, alignItems: "center", padding: "7px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid " + (pick === "other" ? "var(--jade)" : "var(--sand-deep)"), background: pick === "other" ? "rgba(31,184,159,.08)" : "transparent", marginTop: 6 }}>
        <input type="radio" name={"dict-" + entry.waray} checked={pick === "other"} onChange={() => setPick("other")} style={{ accentColor: "var(--jade)" }} />
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", color: "var(--ink-soft)", textTransform: "uppercase", whiteSpace: "nowrap" }}>✎ my own</span>
        <input value={other} onChange={(e) => { setOther(e.target.value); setPick("other"); }} placeholder="type the meaning…"
          style={{ flex: 1, fontSize: 15, fontFamily: "Georgia,serif", fontWeight: 600, color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 8, padding: "6px 10px" }} />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={pron} onChange={(e) => setPron(e.target.value)} placeholder="pronunciation (mah-OO-pigh)"
          style={{ flex: "1 1 150px", fontSize: 12.5, fontFamily: "ui-monospace,monospace", color: "var(--sea)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 8, padding: "7px 10px" }} />
        <button onClick={confirm} disabled={saving || !chosen}
          style={{ background: "var(--jade)", color: "#0b1f23", fontWeight: 800, fontSize: 12.5, border: 0, borderRadius: 9, padding: "6px 16px", cursor: "pointer", opacity: saving || !chosen ? 0.5 : 1 }}>
          {saving ? "Saving…" : "Confirm"}
        </button>
      </div>
      {err && <div style={{ color: "var(--coral)", fontSize: 12, marginTop: 5 }}>{err}</div>}
    </div>
  );
}
// One review-queue question: shows the ask; the admin gets an answer box (prefilled with the AI's
// draft for missing-answer items) + Confirm, mirroring the dictionary flow. Saved answers render
// green for everyone; harvest-ella folds them back into the course on the next content build.
function EllaQuestionCard({ q, admin, answer, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);
  // choice state: "suggest" | "draft" | "other" (missing-answer cards); free text held separately
  const [pick, setPick] = useState(q.suggest ? "suggest" : "other");
  const [other, setOther] = useState("");
  // per-item yes/no state (multi-item dialect cards)
  const [marks, setMarks] = useState({});
  const chosen = q.items ? (q.items.every((it) => marks[it.k]) ? q.items.map((it) => `${it.k}=${marks[it.k]}`).join("; ") : "")
    : pick === "suggest" ? q.suggest : pick === "draft" ? q.draft : other.trim();
  const save = async () => {
    if (!chosen) return;
    setBusy(true); setErr("");
    try { await saveEllaAnswer(q.id, chosen); onSaved(chosen); setEditing(false); }
    catch (e) { setErr(e.message || String(e)); }
    setBusy(false);
  };
  const answered = !!answer && !editing;
  const savedMarks = {}; if (q.items && answer) for (const part of answer.split(/;\s*/)) { const [k, v] = part.split("="); if (k) savedMarks[k.trim()] = (v || "").trim(); }
  const optionRow = (key, label, text) => (
    <label key={key} style={{ display: "flex", gap: 9, alignItems: "baseline", padding: "7px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid " + (pick === key ? "var(--jade)" : "var(--sand-deep)"), background: pick === key ? "rgba(31,184,159,.08)" : "transparent", marginTop: 6 }}>
      <input type="radio" name={q.id} checked={pick === key} onChange={() => setPick(key)} style={{ accentColor: "var(--jade)", marginTop: 2 }} />
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", color: "var(--ink-soft)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontFamily: "Georgia,serif", fontSize: 15.5, fontWeight: 600, lineHeight: 1.35 }}>{text}</span>
    </label>
  );
  return (
    <div style={{ background: "var(--foam)", border: "1px solid " + (answered ? "rgba(31,184,159,.45)" : "var(--sand-deep)"), borderRadius: 12, padding: "12px 14px", margin: "10px 0" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: "#b79ae8", fontWeight: 700, marginBottom: 4 }}>{q.topic}</div>
      <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--ink)", lineHeight: 1.35 }}>{q.q}</div>
      {q.detail && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4, lineHeight: 1.45 }}>{q.detail}</div>}
      {q.items && q.items.map((it) => {
        const mark = answered ? savedMarks[it.k] : marks[it.k];
        const canMark = admin && !answered;
        return (
          <div key={it.k} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px dotted #24454b" }}>
            <span style={{ flex: 1, fontSize: 14 }}>{it.label}</span>
            {["yes", "no"].map((v) => (
              <button key={v} disabled={!canMark} onClick={() => canMark && setMarks((m) => ({ ...m, [it.k]: v }))}
                style={{ fontSize: 12, fontWeight: 800, borderRadius: 8, padding: "4px 12px", cursor: canMark ? "pointer" : "default",
                  opacity: !canMark && mark !== v ? 0.35 : 1,
                  border: "1px solid " + (mark === v ? (v === "yes" ? "var(--jade)" : "var(--coral)") : "var(--sand-deep)"),
                  background: mark === v ? (v === "yes" ? "rgba(31,184,159,.18)" : "rgba(240,122,102,.15)") : "transparent",
                  color: mark === v ? (v === "yes" ? "var(--jade)" : "var(--coral)") : "var(--ink-soft)" }}>
                {v === "yes" ? "✓ yes" : "✗ no"}
              </button>
            ))}
          </div>
        );
      })}
      {answered ? (
        <div style={{ marginTop: 9, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--jade)" }}>✓ ELLA</span>
          {!q.items && <span style={{ fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 600 }}>{answer}</span>}
          {admin && <button onClick={() => { if (!q.items) { setPick("other"); setOther(answer); } setEditing(true); }} style={{ marginLeft: "auto", fontSize: 11.5, background: "transparent", border: "1px solid var(--sand-deep)", color: "var(--ink-soft)", borderRadius: 8, padding: "2px 9px", cursor: "pointer" }}>edit</button>}
        </div>
      ) : admin ? (
        <div style={{ marginTop: 6 }}>
          {q.items ? (
            // per-item confirm/reject (list itself renders for everyone below)
            null && q.items.map((it) => (
              <div key={it.k} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px dotted #24454b" }}>
                <span style={{ flex: 1, fontSize: 14 }}>{it.label}</span>
                {["yes", "no"].map((v) => (
                  <button key={v} onClick={() => setMarks((m) => ({ ...m, [it.k]: v }))}
                    style={{ fontSize: 12, fontWeight: 800, borderRadius: 8, padding: "4px 12px", cursor: "pointer",
                      border: "1px solid " + (marks[it.k] === v ? (v === "yes" ? "var(--jade)" : "var(--coral)") : "var(--sand-deep)"),
                      background: marks[it.k] === v ? (v === "yes" ? "rgba(31,184,159,.18)" : "rgba(240,122,102,.15)") : "transparent",
                      color: marks[it.k] === v ? (v === "yes" ? "var(--jade)" : "var(--coral)") : "var(--ink-soft)" }}>
                    {v === "yes" ? "✓ yes" : "✗ no"}
                  </button>
                ))}
              </div>
            ))
          ) : (
            <>
              {q.suggest && optionRow("suggest", "Claude · suggested fix", q.suggest)}
              {q.draft && optionRow("draft", "Gemini · book extraction (removed)", q.draft)}
              <label style={{ display: "flex", gap: 9, alignItems: "center", padding: "7px 10px", borderRadius: 10, cursor: "pointer", border: "1px solid " + (pick === "other" ? "var(--jade)" : "var(--sand-deep)"), background: pick === "other" ? "rgba(31,184,159,.08)" : "transparent", marginTop: 6 }}>
                <input type="radio" name={q.id} checked={pick === "other"} onChange={() => setPick("other")} style={{ accentColor: "var(--jade)" }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".04em", color: "var(--ink-soft)", textTransform: "uppercase", whiteSpace: "nowrap" }}>✎ my own</span>
                <input value={other} onChange={(e) => { setOther(e.target.value); setPick("other"); }} placeholder="type the natural Waray…"
                  style={{ flex: 1, fontSize: 15, fontFamily: "Georgia,serif", fontWeight: 600, color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 8, padding: "6px 10px" }} />
              </label>
            </>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <button onClick={save} disabled={busy || !chosen}
              style={{ background: "var(--jade)", color: "#0b1f23", fontWeight: 800, fontSize: 12.5, border: 0, borderRadius: 9, padding: "6px 16px", cursor: "pointer", opacity: busy || !chosen ? 0.5 : 1 }}>
              {busy ? "Saving…" : "Confirm"}
            </button>
            {q.items && !chosen && <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>mark every item to confirm</span>}
            {err && <span style={{ fontSize: 11.5, color: "var(--coral)" }}>{err}</span>}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--ink-soft)", fontStyle: "italic" }}>awaiting Ella's answer</div>
      )}
    </div>
  );
}

/* ===================== ELLA · REVIEW QUEUE (one native-review door) =====================
   Everything a native speaker reviews, in one screen with jumpable sections:
   1. Missing answers — course items removed by the synth audit; each needs her Waray
   2. Dialect questions — the open usage/dialect judgment calls
   3. Dictionary — unconfirmed entries (admin-only: confirm writes to the DB live)  */
function EllaView({ ctx }) {
  const { setView, admin } = ctx;
  const [st, setSt] = useState({ loading: true });
  const [done, setDone] = useState(0);
  const [answers, setAnswers] = useState({});  // question id -> Ella's saved answer (world-readable)
  useEffect(() => { let alive = true; fetchEllaAnswers().then((m) => alive && setAnswers(m)).catch(() => {}); return () => { alive = false; }; }, []);
  useEffect(() => {
    if (!admin) return;
    let alive = true;
    fetchReviewList().then((list) => alive && setSt({ list })).catch((e) => alive && setSt({ error: e.message }));
    return () => { alive = false; };
  }, [admin]);
  const onConfirmed = (waray) => { setSt((s) => ({ list: (s.list || []).filter((e) => e.waray !== waray) })); setDone((d) => d + 1); };
  const missing = ACTIVE.review.filter((q) => q.id.startsWith("synth-"));
  const dialect = ACTIVE.review.filter((q) => !q.id.startsWith("synth-"));
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const chip = (id, label, n) => (
    <button key={id} onClick={() => jump(id)} style={{ border: "1px solid var(--sand-deep)", background: "var(--foam)", color: "var(--ink)", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
      {label} <span style={{ color: "var(--sea)" }}>{n}</span>
    </button>
  );
  const secHead = (id, emoji, title, sub) => (
    <div id={id} style={{ scrollMarginTop: 12, margin: "26px 0 6px" }}>
      <div style={{ fontSize: 15, fontWeight: 800 }}>{emoji} {title}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.45 }}>{sub}</div>
    </div>
  );
  const qCard = (q) => <EllaQuestionCard key={q.id} q={q} admin={admin} answer={answers[q.id]} onSaved={(a) => setAnswers((p) => ({ ...p, [q.id]: a }))} />;
  return (
    <div className="ws-page">
      <TopBar title="👩 Ella · review queue" onBack={() => setView("home")} />
      <div style={{ padding: "4px 16px 40px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "2px 0 4px" }}>
          {missing.length > 0 && chip("ella-missing", "Missing answers", `${missing.filter((q) => answers[q.id]).length}/${missing.length}`)}
          {dialect.length > 0 && chip("ella-dialect", "Dialect questions", dialect.length)}
          {admin && chip("ella-dict", "Dictionary", st.list ? st.list.length : "…")}
        </div>
        {missing.length > 0 && (
          <>
            {secHead("ella-missing", "✍️", "Missing answers", "Exercise items removed from the course because the AI-written Waray was wrong. Give the natural Waray for each English prompt and the item returns to its lesson.")}
            {missing.map(qCard)}
          </>
        )}
        {dialect.length > 0 && (
          <>
            {secHead("ella-dialect", "🗣️", "Dialect questions", "Open usage / Daram-dialect judgment calls. Answers feed back into the courses and dialect notes.")}
            {dialect.map(qCard)}
          </>
        )}
        {admin && (
          <>
            {secHead("ella-dict", "📖", "Dictionary confirmations", `Unconfirmed entries — fix the meaning/pronunciation if needed, then Confirm; it saves straight to the database.${done > 0 ? ` ${done} confirmed this session.` : ""}`)}
            {st.loading && <p style={{ color: "var(--ink-soft)" }}>Loading…</p>}
            {st.error && <p style={{ color: "var(--coral)" }}>Couldn't load: {st.error}</p>}
            {st.list && st.list.map((e) => <DbReviewRow key={e.waray} entry={e} onConfirmed={onConfirmed} />)}
            {st.list && st.list.length === 0 && <p style={{ color: "var(--jade)" }}>🎉 All confirmed!</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================ HOME ============================ */
function HomeView({ ctx }) {
  const { cards, prog, streak, setView, setSession, lessons, units, setLearnTarget, setLearnSection, settings, saveSettings, user, syncState, syncPull } = ctx;
  const { menuOpen, setMenuOpen } = ctx;       // ☰ menu lives at App level so "back" can reopen it
  const [sheet, setSheet] = useState(null);   // null | "dict" | "history" — bottom-bar slide-ups
  useEffect(() => {                            // Escape slides the drawer back
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const curLesson = nextLesson(lessons);
  // first boot: the course is fetched from the DB — until the auto-refresh caches it,
  // ACTIVE is an empty shell (no lessons) and the full home would crash. Show a splash.
  if (!curLesson) {
    return (
      <div className="ws-page" style={{ display: "grid", placeItems: "center", minHeight: "70vh", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 40 }}>🌊</div>
          <h2 style={{ margin: "10px 0 4px" }}>Sulog</h2>
          <p style={{ color: "var(--ink-soft)" }}>Fetching the Peace Corps course…</p>
        </div>
      </div>
    );
  }
  // open a section's own page; optionally scroll to a lesson within it
  const openSection = (sid, lessonId = null) => { setLearnSection(sid); setLearnTarget(lessonId); setView("learn"); };
  const total = cards.length;
  let mastered = 0, learning = 0, fresh = 0, sumPct = 0, due = 0;
  cards.forEach((c) => {
    const st = prog[c.id];
    sumPct += masteryPct(st);
    if (!st || st.seen === 0) fresh++;
    else if (st.box >= 4) mastered++;
    else learning++;
    if (isDue(st)) due++;
  });
  const overall = total ? sumPct / total : 0;
  const needsWork = cards.filter((c) => needsWorkCard(prog[c.id])).length;
  const streakDays = currentStreak(streak.days);
  const prof = computeProficiency(prog);

  const heroActions = (
    <div className="ws-hero-btns">
      <button className="ws-hero-btn" onClick={() => ctx.openReport({ targetType: "lesson", targetRef: "general", context: { screen: "home" } })} title="Report a problem or send feedback"><Flag size={18} /></button>
      {SpeechRec && (
        <button className={`ws-hero-btn ${settings.voiceMode ? "on" : ""}`} title={settings.voiceMode ? "Voice mode on — tap for keyboard" : "Keyboard mode — tap for voice"}
          onClick={() => saveSettings({ ...settings, voiceMode: !settings.voiceMode })}>
          {settings.voiceMode ? <Mic size={18} /> : <Keyboard size={18} />}
        </button>
      )}
      <button className={`ws-hero-btn ${menuOpen ? "on" : ""}`} onClick={() => setMenuOpen((o) => !o)} title="Menu"><MenuIcon size={18} /></button>
    </div>
  );

  return (
    <div className="ws-page">
      <TideHero prof={prof} pct={overall} mastered={mastered} total={total} actions={heroActions} />

      <DayTracker streak={streak} />

      {/* a failed sync is otherwise invisible until you open Account — surface it here, tappable */}
      {user && syncState?.status === "error" && (
        <button onClick={() => syncPull()}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
            background: "rgba(240,122,102,.12)", border: "1px solid var(--coral)", borderRadius: 12,
            padding: "11px 14px", margin: "0 0 12px", color: "var(--ink)", fontFamily: "inherit" }}>
          <AlertCircle size={18} style={{ color: "var(--coral)", flex: "none" }} />
          <span style={{ flex: 1 }}>
            <b style={{ display: "block", fontSize: 14 }}>Couldn't sync your progress — tap to retry</b>
            <i style={{ fontStyle: "normal", fontSize: 11.5, color: "var(--ink-soft)" }}>{syncState.error || "check your connection"}</i>
          </span>
          <RotateCcw size={16} style={{ color: "var(--coral)", flex: "none" }} />
        </button>
      )}

      <div className="ws-cta-grid">
        <button className="ws-cta ws-cta-primary" onClick={() => openSection(curLesson.section.id, curLesson.id)}>
          <div className="ws-cta-ic"><BookOpen size={20} /></div>
          <div>
            <div className="ws-cta-t">Continue learning</div>
            <div className="ws-cta-d">{curLesson.unit.name === curLesson.section.name ? curLesson.section.name : `${curLesson.section.name} · ${curLesson.unit.name}`}</div>
            <div className="ws-cta-sub">{curLesson.title}</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        <button className="ws-cta" onClick={() => setView("needswork")}>
          <div className="ws-cta-ic ws-ic-coral"><AlertCircle size={18} /></div>
          <div>
            <div className="ws-cta-t">Needs work {needsWork ? <span className="ws-badge">{needsWork}</span> : null}</div>
            <div className="ws-cta-d">The words & phrases you keep missing</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        <button className="ws-cta" onClick={() => setView("stresslab")}>
          <div className="ws-cta-ic ws-ic-tide"><Mic size={18} /></div>
          <div>
            <div className="ws-cta-t">Stress check <span className="ws-badge" style={{ background: "var(--sun)", color: "#123" }}>beta</span></div>
            <div className="ws-cta-d">Say a word — see which syllable you stressed</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        <button className="ws-cta" onClick={() => setView("accentduel")}>
          <div className="ws-cta-ic ws-ic-coral"><Trophy size={18} /></div>
          <div>
            <div className="ws-cta-t">Accent Duel <span className="ws-badge" style={{ background: "var(--sun)", color: "#123" }}>2P</span></div>
            <div className="ws-cta-d">🇺🇸 Waray vs 🇵🇭 English — pass-the-phone</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        <button className="ws-cta" onClick={() => setView("read")}>
          <div className="ws-cta-ic ws-ic-jade"><BookOpen size={18} /></div>
          <div>
            <div className="ws-cta-t">Read a story</div>
            <div className="ws-cta-d">Real Waray stories, matched to what you know</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
      </div>

      <SectionLabel icon={<Layers size={14} />} text="Phases" />
      {/* one aggregate status for the whole course (was repeated per phase) */}
      {(() => {
        let f = 0, l = 0, m = 0, w = 0;
        cards.forEach((c) => {
          const st = prog[c.id];
          if (!st || st.seen === 0) { f++; return; }
          const p = masteryPct(st);
          if (p >= 0.8) m++; else if (p >= 0.4) l++; else w++;
        });
        return <div className="ws-phase-summary"><Distribution fresh={f} learning={l} mastered={m} weak={w} /></div>;
      })()}
      <div className="ws-units">
        {CURRICULUM.map((s, i) => {
          const allL = s.units.flatMap((u) => u.lessons);
          const lessonsDone = allL.filter((l2) => lessonDone(lessons, l2.id)).length;
          const lessonsTot = allL.length;
          const pct = lessonsTot ? Math.round((lessonsDone / lessonsTot) * 100) : 0;
          const mUnits = s.units.filter((u) => units[u.id]?.passed).length;
          // a phase unlocks once the phase before it is finished (first is always open)
          const locked = i > 0 && !CURRICULUM[i - 1].units.flatMap((u) => u.lessons).every((l2) => lessonDone(lessons, l2.id));
          return (
            <button key={s.id} className={`ws-unit-tile ${locked ? "locked" : ""}`} disabled={locked} onClick={() => !locked && openSection(s.id)}>
              <div className="ws-unit-tile-top">
                <span className="ws-unit-tile-name">{s.name}</span>
                <span className="ws-unit-tile-meta">
                  {locked ? <Lock size={14} /> : <>{lessonsDone}/{lessonsTot} lessons<ChevronRight size={15} /></>}
                </span>
              </div>
              <div className="ws-unit-tile-sub">
                {locked ? "Finish the phase above to unlock"
                  : s.units.length > 1
                    ? (mUnits > 0 ? `${mUnits}/${s.units.length} units mastered` : `${s.units.length} units · tap to learn`)
                    : (lessonsDone > 0 ? "In progress · tap to continue" : "Tap to start")}
              </div>
              {!locked && <div className="ws-phase-bar"><span style={{ width: pct + "%" }} /></div>}
            </button>
          );
        })}
      </div>

      <div className="ws-build">build {buildLabel()}</div>

      {/* ☰ side drawer — always mounted so it can slide in and back out */}
      <div className={`ws-drawer-scrim ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      <div className={`ws-drawer ${menuOpen ? "open" : ""}`} role="menu" aria-hidden={!menuOpen}>
        <button className="ws-drawer-x" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={19} /></button>
        <div className="ws-drawer-body">
            <div className="ws-menu-top"><b>Menu</b></div>

            {/* Account & sync — always first, with the three role pills */}
            <div className="ws-menu-acct">
              <button className="ws-menu-row" onClick={() => { setMenuOpen(false); setView("account"); }}>
                <span className="ws-menu-ic">☁️</span>
                <span className="ws-menu-tt"><b>Account &amp; sync</b><i>{ctx.user ? `${ctx.user.email} · ${syncWord(ctx.syncState)}` : "Sign in to sync across devices"}</i></span>
                <ChevronRight size={16} className="ws-menu-chev" />
              </button>
              <div className="ws-menu-pills">
                {/* status only — requesting a role happens on the Request tab */}
                <span className={`ws-role-pill ${ctx.enrolledN > 0 ? "held" : ""}`}
                  title={ctx.enrolledN > 0 ? "You're enrolled in a class" : "Join a class from Request to become a student"}>
                  student{ctx.enrolledN > 0 ? " ✓" : ""}
                </span>
                {[["reviewer", "reviewer"], ["instructor", "instructor"], ["admin", "admin"]].map(([r, label]) => {
                  const held = (ctx.roles || []).includes(r) || (r === "admin" && ctx.admin);
                  const pending = (ctx.roleReqs || []).some((q) => q.role === r && q.status === "pending");
                  return (
                    <span key={r} className={`ws-role-pill ${held ? "held" : pending ? "pending" : ""}`}
                      title={held ? "You hold this role" : pending ? "Requested — an admin will review" : "Ask for this on the Request tab"}>
                      {label}{held ? " ✓" : pending ? " ·…" : ""}
                    </span>
                  );
                })}
              </div>
            </div>

            <MenuRow icon="⚙️" title="Settings" subtitle="language · course · my dialect · sound" chevron onClick={() => { setMenuOpen(false); setView("settings"); }} />

            {(roleHas(ctx, "instructor") || ctx.admin) &&
              <MenuRow icon="🎓" title="My Class" subtitle="your class · roster · flags" badge="instructor" onClick={() => { setMenuOpen(false); setView("class"); }} />}

            {(roleHas(ctx, "reviewer") || roleHas(ctx, "instructor") || ctx.admin) &&
              <MenuRow icon="👩" title="Review queue" subtitle="missing answers · dictionary · dialect" badge="rev·admin" onClick={() => { setMenuOpen(false); setView("queue"); }} />}

            <MenuRow icon="✋" title="Request" subtitle="join a class · request access" chevron onClick={() => { setMenuOpen(false); setView("request"); }} />

            {ctx.admin &&
              <MenuRow icon="🔧" title="Admin console" subtitle="approvals · dialect catalog · quality · provenance" onClick={() => { setMenuOpen(false); setView("admin"); }} />}
        </div>
      </div>
      <div className="ws-bottombar">
        <button className={`ws-bb ${sheet === "dict" ? "active" : ""}`} onClick={() => setSheet("dict")}><List size={18} /><span>Dictionary</span></button>
        <button className={`ws-bb ${sheet === "history" ? "active" : ""}`} onClick={() => setSheet("history")}><Trophy size={18} /><span>Progress</span></button>
      </div>

      {sheet === "dict" && <SlideSheet title="Dictionary" onClose={() => setSheet(null)}><DictSheet ctx={ctx} /></SlideSheet>}
      {sheet === "history" && <SlideSheet title="Progress" onClose={() => setSheet(null)}><HistoryView ctx={ctx} embedded /></SlideSheet>}
    </div>
  );
}

const roleHas = (ctx, r) => (ctx.roles || []).includes(r);
const syncWord = (s) => s?.status === "error" ? "not synced" : s?.status === "syncing" ? "syncing…" : "synced";

// one ☰-menu row: emoji · {title, subtitle} · {role badge | chevron}
function MenuRow({ icon, title, subtitle, badge, chevron, onClick }) {
  return (
    <button className="ws-menu-row" onClick={onClick}>
      <span className="ws-menu-ic">{icon}</span>
      <span className="ws-menu-tt"><b>{title}</b>{subtitle && <i>{subtitle}</i>}</span>
      {badge && <span className="ws-menu-badge">{badge}</span>}
      {chevron && <ChevronRight size={16} className="ws-menu-chev" />}
    </button>
  );
}

// a bottom sheet that slides up; tap-out / X / Esc all slide it back DOWN before unmounting
function SlideSheet({ title, onClose, children }) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => { setClosing(true); setTimeout(onClose, 240); }, [onClose]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  return (
    <div className={`ws-sheet-scrim ${closing ? "closing" : ""}`} onClick={close}>
      <div className={`ws-sheet ${closing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="ws-sheet-grip" />
        <div className="ws-sheet-head"><b>{title}</b><button className="ws-sheet-x" onClick={close} aria-label="Close"><X size={18} /></button></div>
        <div className="ws-sheet-body">{children}</div>
      </div>
    </div>
  );
}

// Dictionary: a search box that shows up to 5 live matches as you type; tap one for its full entry.
function DictSheet({ ctx }) {
  const { cards } = ctx;
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wordRe = new RegExp("(^|\\s)" + esc + "($|\\s)");   // s as a whole word inside a phrase
    const isWord = (w) => !/\s/.test(w);
    // Rank single-word Waray matches ABOVE phrases: exact word ≫ single word ≫ prefix ≫ whole-word-
    // in-phrase ≫ substring; English matches score lower. So "libro" the word beats "libro han pastor".
    const score = (c) => {
      const w = (c.waray || "").toLowerCase(), e = (c.english || "").toLowerCase();
      let waray = 0;
      if (w === s) waray = 1000;               // exact Waray word
      else if (w.startsWith(s)) waray = 50;    // Waray prefix
      else if (wordRe.test(w)) waray = 25;     // s is a whole word inside a phrase
      else if (w.includes(s)) waray = 10;      // Waray substring
      let sc = waray;
      if (waray && isWord(c.waray)) sc += 100; // single Waray word beats any phrase (Waray hits only)
      if (e === s) sc += 40; else if (e.startsWith(s)) sc += 8; else if (e.includes(s)) sc += 3;
      return sc - w.length * 0.05;             // tiebreak: shorter/closer first
    };
    return cards
      .filter((c) => ((c.waray || "") + " " + (c.english || "")).toLowerCase().includes(s))
      .map((c) => [score(c), c])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 8)
      .map(([, c]) => c);
  }, [q, cards]);

  if (sel) return <DictEntry card={sel} st={ctx.prog[sel.id]} ctx={ctx} onBack={() => setSel(null)} />;
  return (
    <>
      <input className="ws-search" autoFocus placeholder="Search Waray or English…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!q.trim() && <p className="ws-dict-hint">Start typing to look up a word.</p>}
      {q.trim() && results.length === 0 && <p className="ws-dict-hint">No matches for “{q.trim()}”.</p>}
      {results.map((c) => (
        <button key={c.id} className="ws-dict-hit" onClick={() => setSel(c)}>
          <div className="ws-dict-hit-main"><b>{c.waray}</b>{c.say && <span className="ws-dict-hit-say">/ {c.say} /</span>}</div>
          <div className="ws-dict-hit-eng">{c.english}</div>
        </button>
      ))}
    </>
  );
}

// the full entry for one word inside the Dictionary sheet
function DictEntry({ card, st, ctx, onBack }) {
  const { playCard, togglePin } = ctx;
  const p = masteryPct(st);
  const deck = DECKS[card.deck];
  return (
    <div className="ws-dict-entry">
      <button className="ws-sheet-back" onClick={onBack}><ChevronLeft size={15} /> results</button>
      <div className="ws-dict-hw">{card.waray}</div>
      {card.say && <div className="ws-dict-hw-say">/ {card.say} /</div>}
      <div className="ws-dict-hw-eng">{card.english}</div>
      <div className="ws-dict-entry-meta">
        {deck && <span className="ws-dict-tag">{deck.short}</span>}
        <span className="ws-dict-tag">{st?.seen ? `${p}% mastered` : "not started"}</span>
      </div>
      <div className="ws-dict-entry-acts">
        <button onClick={() => playCard(card)}><Volume2 size={16} /> Hear it</button>
        <button className={st?.pinned ? "on" : ""} onClick={() => togglePin(card.id)}><Star size={16} /> {st?.pinned ? "Pinned" : "Pin"}</button>
      </div>
    </div>
  );
}

function TideHero({ prof, pct, mastered, total, actions }) {
  const pctN = Math.round((prof?.pct ?? 0) * 100);
  const fill = 100 - pctN; // sea rises with progress to the next band
  return (
    <div className="ws-tide">
      <svg viewBox="0 0 400 200" className="ws-tide-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2e34" />
            <stop offset="100%" stopColor="#0e4951" />
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a3ab" />
            <stop offset="100%" stopColor="#0c6b73" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill="url(#sky)" />
        <circle cx="316" cy="116" r="22" fill="#f4a53a" opacity="0.95" />
        <circle cx="316" cy="116" r="34" fill="#f4a53a" opacity="0.18" />
        <g style={{ transform: `translateY(${fill}%)`, transition: "transform 1.1s cubic-bezier(.2,.8,.2,1)" }}>
          <path className="ws-wave1" d="M0,30 C60,12 120,48 200,30 C280,12 340,48 400,30 L400,200 L0,200 Z" fill="url(#sea)" opacity="0.92" />
          <path className="ws-wave2" d="M0,40 C80,22 140,58 200,40 C260,22 340,58 400,40 L400,200 L0,200 Z" fill="#0c6b73" opacity="0.55" />
        </g>
      </svg>
      <div className="ws-tide-overlay">
        <div className="ws-tide-top">
          <div className="ws-tide-brand">
            <h1 className="ws-tide-name">Sulog</h1>
            <div className="ws-tide-place">Daram, Samar</div>
          </div>
          {actions}
        </div>
        <div className="ws-tide-band">
          <div className="ws-tide-pct">{prof?.band} <span>→ {prof?.next}</span></div>
          <div className="ws-tide-bar"><div style={{ width: `${pctN}%` }} /></div>
          <div className="ws-tide-label">{pctN}% to {prof?.next} · {prof?.mastered} mastered</div>
        </div>
      </div>
    </div>
  );
}

/* A strip of the last 14 days: a filled cell per day (intensity = how many
   reviews that day) plus the current day-streak, both from streak.days. */
function DayTracker({ streak }) {
  const N = 14;
  const map = streak.days || {};
  const W = ["S", "M", "T", "W", "T", "F", "S"];
  const base = new Date();
  const days = [];
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = localDay(d);
    days.push({ key, count: map[key] || 0, dow: d.getDay(), isToday: i === 0 });
  }
  const level = (c) => (c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : 3);
  const run = currentStreak(map);

  return (
    <div className="ws-tracker">
      <div className="ws-tracker-head">
        <span className="ws-tracker-title">Last 14 days</span>
        <span className="ws-tracker-streak"><Flame size={13} /> {run}-day streak</span>
      </div>
      <div className="ws-tracker-grid">
        {days.map((d) => (
          <div key={d.key} className={`ws-day ${d.isToday ? "today" : ""}`}
            title={`${d.key} · ${d.count} review${d.count === 1 ? "" : "s"}`}>
            <div className={`ws-day-cell lv${level(d.count)}`} />
            <span className="ws-day-lbl">{W[d.dow]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Distribution({ fresh, learning, mastered, weak = 0 }) {
  const tot = fresh + learning + mastered + weak || 1;
  return (
    <div className="ws-dist">
      <div className="ws-dist-bar">
        <div style={{ width: `${(mastered / tot) * 100}%` }} className="ws-seg ws-seg-m" />
        <div style={{ width: `${(learning / tot) * 100}%` }} className="ws-seg ws-seg-l" />
        <div style={{ width: `${(weak / tot) * 100}%` }} className="ws-seg ws-seg-x" />
        <div style={{ width: `${(fresh / tot) * 100}%` }} className="ws-seg ws-seg-f" />
      </div>
      <div className="ws-dist-legend">
        <span><i className="ws-dot ws-dot-m" />Mastered {mastered}</span>
        <span><i className="ws-dot ws-dot-l" />Learning {learning}</span>
        {weak > 0 && <span><i className="ws-dot ws-dot-x" />Needs work {weak}</span>}
        <span><i className="ws-dot ws-dot-f" />New {fresh}</span>
      </div>
    </div>
  );
}

function ConstellationGrid({ cards, prog }) {
  return (
    <div className="ws-constel">
      {cards.map((c) => {
        const p = masteryPct(prog[c.id]);
        const st = prog[c.id];
        let cls = "ws-cell-f";
        if (st && st.seen > 0) cls = p >= 0.8 ? "ws-cell-m" : p >= 0.4 ? "ws-cell-l3" : "ws-cell-l1";
        return <div key={c.id} className={`ws-cell ${cls}`} title={`${c.waray} — ${c.english}`} />;
      })}
    </div>
  );
}

/* ============================ SESSION ============================ */
function buildQueue(cards, prog, deckKeys, limit, only) {
  const pool = only
    ? cards.filter((c) => only.includes(c.id))
    : cards.filter((c) => deckKeys.includes(c.deck));
  const dueCards = pool.filter((c) => isDue(prog[c.id]));
  const rest = pool.filter((c) => !isDue(prog[c.id]))
    .sort((a, b) => (prog[a.id]?.last || 0) - (prog[b.id]?.last || 0));
  const ordered = [...shuffle(dueCards), ...rest].slice(0, limit);
  return shuffle(ordered);
}
function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

function SessionView({ ctx }) {
  const { cards, prog, session, setView, recordCard, bumpStreak, completeLessonPart, logAttempt, settings, saveSettings } = ctx;
  // base = the cards to study once (first attempt is what scores). Each becomes a
  // "step"; a missed written step splices in extra (unscored) MC→type steps so
  // you keep at it until you clear it.
  // a bidirectional drill (dirMap) keeps the book order so the W→E section comes before E→W; other
  // sessions shuffle as usual.
  const base = useRef(session.dirMap
    ? (session.only || []).map((id) => cards.find((c) => c.id === id)).filter(Boolean)
    : buildQueue(cards, prog, session.deckKeys, session.limit, session.only)).current;
  const [steps, setSteps] = useState(() => base.map((c) => ({ card: c, mode: session.mode, scored: true })));
  const [i, setI] = useState(0);
  const [tally, setTally] = useState({ right: 0, wrong: 0 });
  const [results, setResults] = useState([]); // first-attempt results only {id, prompt, answer, given, correct}
  const [done, setDone] = useState(base.length === 0);
  // "Needs work" drill only: a sticky MC↔type/say switch the learner controls for
  // the whole session (other sessions keep the mode their step prescribes).
  const [drillMode, setDrillMode] = useState(session.mode);

  const step = steps[i];
  const card = step?.card;
  // per-card direction for bidirectional drills (dirMap); everything else uses the session's dir
  const cardDir = (session.dirMap && card && session.dirMap[card.id]) || session.dir;
  // remedial steps keep their forced mc→type sequence; a drill's scored steps follow
  // the sticky drillMode; everything else uses the step's own mode.
  const mode = step?.remedial ? step.mode : (session.drill ? drillMode : (step?.mode || session.mode));
  const exitTo = session.lesson ? "lesson" : session.unitReview ? "learn" : "home";

  const advance = () => { if (i + 1 >= steps.length) { setDone(true); if (session.lesson) completeLessonPart(session.lesson.id, session.lesson.part); } else setI(i + 1); };
  // step back to re-see the previous card (e.g. if an auto-advance was too quick).
  // Mark it unscored so re-answering it won't double-count the first attempt.
  const back = () => { if (i <= 0) return; setSteps((prev) => prev.map((s, k) => (k === i - 1 ? { ...s, scored: false } : s))); setI(i - 1); };

  const onResult = (correct, given) => {
    if (step.scored) { // only the first encounter feeds the SRS, history and grade
      recordCard(card.id, correct, mode);
      bumpStreak();
      const prompt = cardDir === "wte" ? card.waray : card.english;
      const answer = cardDir === "wte" ? card.english : card.waray;
      logAttempt({ ts: Date.now(), waray: card.waray, prompt, answer, given: given || "", correct, dir: cardDir, mode });
      setTally((t) => ({ right: t.right + (correct ? 1 : 0), wrong: t.wrong + (correct ? 0 : 1) }));
      setResults((r) => [...r, { id: card.id, prompt, answer, given: given || "", correct }]);
    }
    if (session.remediate && mode === "type" && !correct) { // drop to MC, then type again
      setSteps((prev) => {
        const ns = [...prev];
        ns.splice(i + 1, 0, { card, mode: "mc", scored: false, remedial: true }, { card, mode: "type", scored: false, remedial: true });
        return ns;
      });
      setI(i + 1);
      return;
    }
    advance();
  };

  if (done) return <SessionDone ctx={ctx} tally={tally} total={base.length} results={results} />;
  if (!card) return <SessionDone ctx={ctx} tally={tally} total={0} results={results} />;

  const distractors = pickDistractors(cards, card, cardDir, base); // base = this session's/section's cards
  const scoredDone = results.length;
  return (
    <div className="ws-page ws-session">
      <div className="ws-session-top">
        <button className="ws-icon-btn" onClick={() => setView(exitTo)}><X size={20} /></button>
        <button className="ws-icon-btn" disabled={i <= 0} onClick={back} title="Previous card"><ChevronLeft size={20} /></button>
        <div className="ws-progress-track">
          <div className="ws-progress-fill" style={{ width: `${(scoredDone / base.length) * 100}%` }} />
        </div>
        <div className="ws-session-count">{Math.min(scoredDone + 1, base.length)}/{base.length}</div>
        <button className="ws-vk" title="Report a problem with this item"
          onClick={() => ctx.openReport({ targetType: "card", targetRef: card.waray,
            context: { direction: cardDir, mode, lesson: session.lesson?.id || null, english: card.english } })}>
          <Flag size={16} />
        </button>
        {SpeechRec && (
          <button className={`ws-vk ${settings.voiceMode ? "on" : ""}`} title={settings.voiceMode ? "Voice — tap for keyboard" : "Keyboard — tap for voice"}
            onClick={() => saveSettings({ ...settings, voiceMode: !settings.voiceMode })}>
            {settings.voiceMode ? <Mic size={16} /> : <Keyboard size={16} />}
          </button>
        )}
      </div>

      {session.drill && (
        <div className="ws-drillmode">
          <button className={drillMode === "mc" ? "on" : ""} onClick={() => setDrillMode("mc")}>Choices</button>
          <button className={drillMode === "type" ? "on" : ""} onClick={() => setDrillMode("type")}>{settings.voiceMode ? "Say it" : "Type it"}</button>
        </div>
      )}
      {step.remedial && (
        <div className="ws-remedy">{mode === "mc" ? "Let's try that one again — pick the right answer." : "Now type it from memory."}</div>
      )}
      <CardReview
        key={i + ":" + card.id + ":" + mode}
        card={card} dir={cardDir} mode={mode}
        distractors={distractors} ctx={ctx} onResult={onResult}
        onSkip={step.remedial ? advance : null}
      />
      {session.footnote && (
        <div className="ws-footnote">
          {session.footnote.split("\n").map((ln, k) => <div key={k}>* {ln}</div>)}
        </div>
      )}
    </div>
  );
}

// `prefer` = the cards of the CURRENT section (this drill / lesson step). Wrong answers are drawn
// from the tightest scope first — other items just taught in this same section — then widened to
// the unit deck, then any deck (same shape), then anything. That keeps distractors relevant instead
// of pulling correct answers from lessons the learner hasn't reached yet.
function pickDistractors(cards, card, dir, prefer) {
  const field = dir === "wte" ? "english" : "waray";
  const key = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const aW = key(card.waray), aE = key(card.english);
  // never use a card that IS the same word or the same meaning as the prompt —
  // that produces ambiguous options ("Sige." vs "sige", "Okay." for "ok/go ahead")
  const distinct = (c) => c.id !== card.id && key(c.waray) !== aW && key(c.english) !== aE;
  // match the answer's SHAPE — a phrase prompt must get phrase options, not lone
  // words (a full-sentence answer next to one-word distractors gives itself away)
  const isPhrase = (c) => /\s/.test((c.waray || "").trim());
  const want = isPhrase(card);
  const shaped = (c) => isPhrase(c) === want;
  // accumulate up to 3 options across widening tiers (a small section still fills out)
  const seen = new Set([key(card[field])]);
  const out = [];
  const fill = (list) => { for (const c of shuffle(list)) { if (out.length === 3) break; if (!distinct(c)) continue; const v = c[field]; if (v && !seen.has(key(v))) { seen.add(key(v)); out.push(v); } } };
  fill((prefer || []).filter(shaped));                                       // this section first
  if (out.length < 3) fill(cards.filter((c) => shaped(c) && c.deck === card.deck)); // this unit
  if (out.length < 3) fill(cards.filter(shaped));                            // any unit, same shape
  if (out.length < 3) fill(cards);                                           // last resort: relax shape
  return out;
}

// Browser speech recognition (Web Speech API). There is no Waray locale, so for
// Waray answers we use the closest the browser offers (Filipino/Tagalog, set in
// settings). Cloud-backed in Chrome/Edge; absent in Firefox (button hides).
const SpeechRec = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
// true if ANY recognition alternative passes the lenient check (STT is noisy, so
// give credit if any of the hypotheses matches)
function speechMatches(alts, answer, waray) {
  return (alts || []).some((a) => checkAnswer(a, answer, waray, true));
}

// mic button that transcribes one spoken phrase; feeds interim text live and the
// final alternatives back to the caller
function MicButton({ lang, onInterim, onFinal, onStart }) {
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState("");
  const recRef = useRef(null);
  if (!SpeechRec) return null;
  const start = () => {
    setErr("");
    if (onStart) onStart();
    try {
      const rec = new SpeechRec();
      rec.lang = lang || "fil-PH";
      rec.interimResults = true;
      rec.maxAlternatives = 5;
      rec.continuous = false;
      rec.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        const alts = Array.from(res).map((a) => a.transcript.trim()).filter(Boolean);
        if (res.isFinal) onFinal(alts);
        else if (onInterim) onInterim(alts[0] || "");
      };
      rec.onerror = (ev) => { setErr(ev.error === "not-allowed" ? "Mic blocked — allow it for this site." : ev.error === "no-speech" ? "Didn't catch that — try again." : "Recognition error."); setListening(false); };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch (e) { setErr("Speech recognition isn't available here."); }
  };
  const stop = () => { try { recRef.current && recRef.current.stop(); } catch (e) {} setListening(false); };
  return (
    <>
      <button type="button" className={`ws-mic-stt ${listening ? "on" : ""}`} onClick={() => (listening ? stop() : start())}>
        <Mic size={18} /> {listening ? "Listening… tap to stop" : "Speak the answer"}
      </button>
      {err && <div className="ws-mic-err">{err}</div>}
    </>
  );
}

// shows exactly what recognition heard and how each guess was matched, so a
// surprising result (e.g. credited "Shanghai" for "sangkay") is inspectable and
// copyable to share
function SttDebug({ heard, alts, answer, waray, lang }) {
  const [copied, setCopied] = useState(false);
  const rows = (alts || []).map((a) => ({ a, m: explainMatch(a, answer, waray) }));
  const expFold = waray ? warayFold(norm(answer)) : norm(answer);
  const text = () => {
    let s = `Waray STT debug\nexpected: ${answer}  →  ${expFold}  (listen: ${lang}, fold: ${waray ? "on" : "off"})\n`;
    if (heard.length) s += `heard live: ${heard.join("  →  ")}\n`;
    s += `final guesses:\n` + rows.map(({ a, m }, i) =>
      `  ${i + 1}. "${a}" → "${m.gotFold}"  ${m.ok ? `✓ matches (dist ${Math.min(...m.targets.map((t) => t.dist))})` : "✗"}`).join("\n");
    return s;
  };
  const copy = () => { try { navigator.clipboard.writeText(text()); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch (e) {} };
  return (
    <div className="ws-sttdbg">
      <div className="ws-sttdbg-head">
        <span><Mic size={12} /> speech debug</span>
        <button onClick={copy}>{copied ? "copied" : "copy"}</button>
      </div>
      {heard.length > 0 && <div className="ws-sttdbg-heard"><b>heard:</b> {heard.join("  →  ")}</div>}
      {rows.length > 0 && <div className="ws-sttdbg-exp"><b>expected:</b> {answer}{waray && expFold !== norm(answer) ? ` → ${expFold}` : ""}</div>}
      {rows.map(({ a, m }, i) => {
        const best = Math.min(...m.targets.map((t) => t.dist));
        return (
          <div key={i} className={`ws-sttdbg-alt ${m.ok ? "ok" : ""}`}>
            <span className="ws-sttdbg-n">{i + 1}</span>
            <span className="ws-sttdbg-raw">"{a}"</span>
            <span className="ws-sttdbg-arr">→</span>
            <span className="ws-sttdbg-fold">{m.gotFold}</span>
            <span className="ws-sttdbg-dist">{m.ok ? <Check size={12} /> : <X size={12} />} {best}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Rapid-fire Waray speech-to-text tester. Walks every card; you say the Waray
   word, and on a correct match it auto-advances and auto-listens for the next —
   hands-free until a miss, where it stops and shows the speech debug so you can
   tune the matching logic. Reached from the mic icon in the home header. */
function SttTestView({ ctx }) {
  const { cards, settings, setView } = ctx;
  const lang = settings.sttLang || "fil-PH";
  const pool = useRef(cards.filter((c) => c.waray)).current;
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState("ready"); // ready|listening|hit|miss|done
  const [heard, setHeard] = useState([]);
  const [finalAlts, setFinalAlts] = useState(null);
  const [stats, setStats] = useState({ hit: 0, miss: 0 });
  const recRef = useRef(null);
  const tokRef = useRef(0); // bumped on every (re)start so stale callbacks are ignored
  const card = pool[i];

  const stopRec = () => {
    tokRef.current++;
    try { recRef.current && recRef.current.abort(); } catch (e) {}
    recRef.current = null;
  };
  useEffect(() => () => stopRec(), []); // cleanup on unmount

  const evaluate = (idx, alts) => {
    setFinalAlts(alts);
    const ok = alts.length > 0 && speechMatches(alts, pool[idx].waray, true);
    if (ok) {
      setPhase("hit");
      setStats((s) => ({ ...s, hit: s.hit + 1 }));
      setTimeout(() => advance(idx), 600); // auto-advance + auto-listen
    } else {
      setPhase("miss");
      setStats((s) => ({ ...s, miss: s.miss + 1 }));
    }
  };

  const listenFor = (idx) => {
    const c = pool[idx];
    if (!SpeechRec || !c) return;
    stopRec();
    const tok = tokRef.current;
    setHeard([]); setFinalAlts(null); setPhase("listening");
    const rec = new SpeechRec();
    rec.lang = lang; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
    let settled = false;
    rec.onresult = (e) => {
      if (tok !== tokRef.current) return;
      const res = e.results[e.results.length - 1];
      const a = Array.from(res).map((x) => x.transcript.trim()).filter(Boolean);
      if (res.isFinal) { settled = true; evaluate(idx, a); }
      else setHeard((h) => [...h, a[0] || ""].filter(Boolean).slice(-6));
    };
    rec.onerror = () => { if (tok === tokRef.current && !settled) { settled = true; evaluate(idx, []); } };
    rec.onend = () => { if (tok === tokRef.current && !settled) { settled = true; evaluate(idx, []); } };
    recRef.current = rec;
    try { rec.start(); } catch (e) {}
  };

  const advance = (fromIdx) => {
    const ni = fromIdx + 1;
    stopRec();
    if (ni >= pool.length) { setI(ni - 1); setPhase("done"); return; }
    setI(ni);
    listenFor(ni);
  };

  const start = () => listenFor(i);
  const retry = () => listenFor(i);
  const skip = () => advance(i);
  const pause = () => { stopRec(); setPhase("ready"); };
  const restart = () => { stopRec(); setStats({ hit: 0, miss: 0 }); setI(0); setPhase("ready"); setHeard([]); setFinalAlts(null); };

  if (!SpeechRec) {
    return (
      <div className="ws-page">
        <TopBar title="Waray STT test" onBack={() => setView("home")} />
        <div className="ws-pron-intro">Speech recognition isn't available in this browser. Try Chrome or Edge.</div>
      </div>
    );
  }

  const done = stats.hit + stats.miss;
  const pct = done ? Math.round((stats.hit / done) * 100) : 0;
  return (
    <div className="ws-page">
      <TopBar title="Waray STT test" onBack={() => { stopRec(); setView("home"); }} />

      <div className="ws-stt-meter">
        <span><b>{i + 1}</b> / {pool.length}</span>
        <span className="ws-stt-hit"><Check size={13} /> {stats.hit}</span>
        <span className="ws-stt-mis"><X size={13} /> {stats.miss}</span>
        {done > 0 && <span className="ws-stt-pct">{pct}% match</span>}
      </div>

      <div className={`ws-stt-card ${phase}`}>
        <div className="ws-stt-prompt">{card ? card.waray : "—"}</div>
        <div className="ws-stt-gloss">{card ? card.english : ""}</div>
        {card && card.say && <div className="ws-stt-say">{card.say}</div>}

        {phase === "listening" && (
          <div className="ws-stt-live">
            <span className="ws-stt-dot" /> listening…
            {heard.length > 0 && <div className="ws-stt-heard">{heard[heard.length - 1]}</div>}
          </div>
        )}
        {phase === "hit" && <div className="ws-stt-verdict ok"><Check size={18} /> matched</div>}
        {phase === "miss" && <div className="ws-stt-verdict no"><X size={18} /> no match</div>}
      </div>

      {phase === "miss" && finalAlts && (
        <SttDebug heard={heard} alts={finalAlts} answer={card.waray} waray={true} lang={lang} />
      )}

      <div className="ws-stt-controls">
        {(phase === "ready" || phase === "done") && (
          <button className="ws-stt-btn primary" onClick={start}><Mic size={18} /> {phase === "done" ? "Done — restart?" : "Start"}</button>
        )}
        {phase === "listening" && (
          <button className="ws-stt-btn" onClick={pause}>Pause</button>
        )}
        {phase === "miss" && (
          <>
            <button className="ws-stt-btn primary" onClick={retry}><RotateCcw size={16} /> Retry</button>
            <button className="ws-stt-btn" onClick={skip}><ChevronRight size={16} /> Skip</button>
          </>
        )}
        {phase !== "ready" && <button className="ws-stt-btn ghost" onClick={restart}>Restart from 1</button>}
      </div>

      <div className="ws-pron-intro" style={{ marginTop: 16 }}>
        Say the Waray word shown. On a correct match it auto-advances and listens for
        the next — hands-free until a miss. Listening in <b>{lang}</b> (no Waray locale
        exists), o/u and e/i folded. Misses show the speech debug to tune the matcher.
      </div>
    </div>
  );
}

// the shared voice-input control (same circle everywhere — type, mc, listen)
function VoiceOrb({ vmState, heard, onTap, onRepeat, onSkip, compact }) {
  return (
    <div className={`ws-voice ${compact ? "compact" : ""}`}>
      <div className={`ws-voice-orb ${vmState}`} onClick={onTap}>
        {vmState === "listening" ? <Mic size={compact ? 22 : 26} /> : <Volume2 size={compact ? 22 : 26} />}
      </div>
      <div className="ws-voice-state">
        {vmState === "speaking" ? "listen…" : vmState === "starting" ? "get ready…" : vmState === "listening" ? "say the answer" : "tap to speak"}
        {heard.length > 0 && <div className="ws-voice-heard">{heard[heard.length - 1]}</div>}
      </div>
      {(onRepeat || onSkip) && (
        <div className="ws-voice-acts">
          {onRepeat && <button className="ws-skip" onClick={onRepeat}>Repeat</button>}
          {onSkip && <button className="ws-skip" onClick={onSkip}>Skip</button>}
        </div>
      )}
    </div>
  );
}

function CardReview({ card, dir, mode, distractors, ctx, onResult, onSkip }) {
  const { playCard, settings } = ctx;
  const promptField = dir === "wte" ? "waray" : "english";
  const answerField = dir === "wte" ? "english" : "waray";
  const prompt = card[promptField];
  const answer = card[answerField];
  const promptIsWaray = promptField === "waray";

  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [judged, setJudged] = useState(null); // 'right'|'wrong'|null
  const [picked, setPicked] = useState(null);
  const [heard, setHeard] = useState([]); // live interim transcripts (the "transforming")
  const [sttAlts, setSttAlts] = useState(null); // final recognition alternatives
  const sttLang = dir === "etw" ? (settings.sttLang || "fil-PH") : "en-US";

  const options = useRef(shuffle([answer, ...distractors])).current;

  // auto-play for listen mode
  useEffect(() => {
    if (mode === "listen") setTimeout(() => playCard(card), 250);
  }, []);

  const judge = (correct) => { setJudged(correct ? "right" : "wrong"); };

  // number hotkeys (1–4) pick an option — fast MC play on a keyboard
  useEffect(() => {
    if ((mode !== "mc" && mode !== "listen") || picked !== null) return;
    const onKey = (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) { e.preventDefault(); setPicked(n - 1); judge(options[n - 1] === answer); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, mode]);

  /* ---- VOICE MODE (hands-free) — speak the prompt, listen for the spoken answer,
     judge (type) or pick the matching option (mc/listen), auto-advance. */
  const voiceMode = settings.voiceMode && (mode === "type" || mode === "mc" || mode === "listen");
  const vmRec = useRef(null), vmTok = useRef(0);
  const [vmState, setVmState] = useState("idle"); // idle | speaking | listening
  const vmStop = () => { vmTok.current++; try { vmRec.current && vmRec.current.abort(); } catch (e) {} vmRec.current = null; };
  const vmListen = () => {
    if (!SpeechRec) return;
    vmStop(); const tok = vmTok.current; setHeard([]); setSttAlts(null); setVmState("starting");
    // scale the listen window to how long the expected answer is: a one-word answer ends
    // snappily on the first pause, but a longer phrase keeps listening across mid-phrase
    // pauses (continuous) and only stops after a length-scaled silence — so it never cuts
    // you off mid-sentence.
    const expectWords = (norm(answer || "").split(/\s+/).filter(Boolean).length) || 1;
    const longPhrase = expectWords >= 2;
    const endGap = longPhrase ? 1500 + expectWords * 250 : 0; // silence-after-speech to stop
    const maxListen = 4000 + expectWords * 1600;              // hard cap so it can't run on
    const rec = new SpeechRec(); rec.lang = sttLang; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = longPhrase;
    let settled = false, lastAlts = [], live = false; // keep interim guesses so a no-final end still judges
    let settleTimer = null, hardStop = null;
    const bumpSettle = () => { if (!longPhrase || !live) return; clearTimeout(settleTimer); settleTimer = setTimeout(() => { try { rec.stop(); } catch (e) {} }, endGap); };
    // cue the user to speak only when capture is actually live (onaudiostart) — avoids
    // clipping the first ms while the mic warms up; beep gives a precise "go"
    const goLive = () => { if (tok === vmTok.current && !settled && !live) { live = true; setVmState("listening"); beep(); if (longPhrase) hardStop = setTimeout(() => { try { rec.stop(); } catch (e) {} }, maxListen); } };
    rec.onaudiostart = goLive; rec.onstart = goLive;
    const liveFallback = setTimeout(goLive, 800); // in case onaudiostart never fires
    // reach a verdict from a set of guesses (type: always judges; mc: judges only on a match)
    const finish = (a) => {
      settled = true; clearTimeout(liveFallback); clearTimeout(settleTimer); clearTimeout(hardStop); setVmState("idle"); setSttAlts(a);
      const waray = dir === "etw";
      if (mode === "type") { const m = a.find((x) => checkAnswer(x, answer, waray, true)); setTyped(m ? answer : (a[0] || "")); judge(!!m); }
      else { // mc / listen — pick the CLOSEST-matching option, not the first loose match
        // (e.g. "waray pa" contains "waray", but should select "Waray pa" exactly, not "Waray")
        let best = -1, bestD = Infinity;
        options.forEach((o, k) => a.forEach((x) => {
          const m = explainMatch(x, o, waray);
          if (m.ok) { const d = Math.min(...m.targets.map((t) => t.dist)); if (d < bestD) { bestD = d; best = k; } }
        }));
        if (best < 0) { // nothing cleared tolerance — still resolve to the nearest option by
          // raw distance so the card ALWAYS reaches a verdict and auto-advances, like every
          // other answer path (typed/tap). Among 4 shown options, not free-typing — no grading
          // tolerance changes; this only closes the dead-end where voice MC judged nothing.
          options.forEach((o, k) => a.forEach((x) => {
            const d = Math.min(...explainMatch(x, o, waray).targets.map((t) => t.dist));
            if (d < bestD) { bestD = d; best = k; }
          }));
        }
        if (best >= 0) { setPicked(best); judge(options[best] === answer); }
      }
    };
    rec.onresult = (e) => { if (tok !== vmTok.current) return;
      bumpSettle(); // speech heard → push the "you're done" deadline out
      if (longPhrase) {
        // continuous: stitch the whole phrase across segments; DON'T finish on a pause —
        // wait for the silence window / hard cap (onEnd) so long answers complete
        let full = ""; for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript + " ";
        full = full.trim();
        if (full) { lastAlts = [full]; setHeard((h) => [...h, full].filter(Boolean).slice(-6)); }
      } else {
        const res = e.results[e.results.length - 1]; const a = Array.from(res).map((x) => x.transcript.trim()).filter(Boolean);
        if (res.isFinal) finish(a);
        else { lastAlts = a; setHeard((h) => [...h, a[0] || ""].filter(Boolean).slice(-6)); }
      }
    };
    // ended/errored without a final result: judge on the last interim if we heard anything,
    // so the card always reaches a verdict (and its Continue / "I was right" buttons) — never stuck
    const onEnd = () => { clearTimeout(liveFallback); clearTimeout(settleTimer); clearTimeout(hardStop); if (tok === vmTok.current && !settled) { if (lastAlts.length) finish(lastAlts); else setVmState("idle"); } };
    rec.onerror = onEnd; rec.onend = onEnd;
    vmRec.current = rec; try { rec.start(); } catch (e) { clearTimeout(liveFallback); setVmState("idle"); }
  };
  // open the mic only AFTER the app has finished talking — a fixed timeout opened it mid-TTS on
  // long sentences, so the recognizer transcribed the app's own voice as the learner's answer.
  const listenWhenQuiet = (isLive) => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const talking = typeof speechSynthesis !== "undefined" && speechSynthesis.speaking;
      if (!talking || Date.now() - t0 > 12000) { clearInterval(iv); setTimeout(() => { if (isLive()) vmListen(); }, 350); }
    }, 150);
    return iv;
  };
  useEffect(() => {
    if (!voiceMode || judged || picked !== null) return;
    let live = true; setVmState("speaking");
    if (promptIsWaray) playCard(card); else speakEnglish(prompt);
    const iv = setTimeout(() => { if (live) listenWhenQuiet(() => live); }, 400); // let TTS actually start first
    return () => { live = false; clearTimeout(iv); vmStop(); };
  }, [voiceMode, card.id, judged, picked]);

  /* ---- MULTIPLE CHOICE ---- */
  if (mode === "mc" || mode === "listen") {
    const listening = mode === "listen";
    return (
      <div className="ws-card">
        <div className="ws-card-tag">{DECKS[card.deck].short} · {listening ? "Listen" : dir === "wte" ? "Waray → English" : "English → Waray"}</div>
        {listening ? (
          <button className="ws-listen-big" onClick={() => playCard(card)}>
            <Volume2 size={30} /><span>Tap to hear</span>
          </button>
        ) : (
          <PromptBlock text={prompt} isWaray={promptIsWaray} say={promptIsWaray ? card.say : ""}
            onPlay={() => playCard(card)} />
        )}

        {voiceMode && picked === null && (
          <VoiceOrb compact vmState={vmState} heard={heard}
            onTap={() => vmState === "listening" ? vmStop() : vmListen()}
            onRepeat={() => { vmStop(); setVmState("speaking"); if (promptIsWaray) playCard(card); else speakEnglish(prompt); setTimeout(() => listenWhenQuiet(() => true), 400); }} />
        )}

        <div className="ws-options">
          {options.map((o, k) => {
            let cls = "";
            if (picked !== null) {
              if (o === answer) cls = "correct";
              else if (o === options[picked]) cls = "incorrect";
            }
            return (
              <button key={k} className={`ws-opt ${cls}`} disabled={picked !== null}
                onClick={() => { setPicked(k); judge(o === answer); }}>
                <span className="ws-opt-key">{k + 1}</span>{o}
              </button>
            );
          })}
        </div>

        {judged && <Verdict card={card} ctx={ctx} answer={answer} correct={judged === "right"}
          given={picked !== null ? options[picked] : ""} dir={dir} autoMs={1300}
          showWaray onResult={(corr) => onResult(corr, picked !== null ? options[picked] : "")} />}
        {(sttAlts || heard.length > 0) && (judged === "wrong" || settings.sttDebug) && (
          <SttDebug heard={heard} alts={sttAlts} answer={answer} waray={dir === "etw"} lang={sttLang} />
        )}
        {onSkip && picked === null && <button className="ws-skip" onClick={onSkip}>Skip this one</button>}
      </div>
    );
  }

  /* ---- TYPE IT ---- */
  if (mode === "type") {
    return (
      <div className="ws-card">
        <div className="ws-card-tag">{DECKS[card.deck].short} · Type the {dir === "wte" ? "English" : "Waray"}</div>
        <PromptBlock text={prompt} isWaray={promptIsWaray} say={promptIsWaray ? card.say : ""}
          onPlay={() => playCard(card)} />
        {!judged ? (
          voiceMode ? (
            <VoiceOrb vmState={vmState} heard={heard}
              onTap={() => vmState === "listening" ? vmStop() : vmListen()}
              onRepeat={() => { vmStop(); setVmState("speaking"); if (promptIsWaray) playCard(card); else speakEnglish(prompt); setTimeout(() => listenWhenQuiet(() => true), 400); }}
              onSkip={onSkip ? () => { vmStop(); onSkip(); } : null} />
          ) : (
          <>
            <input className="ws-input" autoFocus value={typed} placeholder="Type or speak your answer…"
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) judge(checkAnswer(typed, answer, dir === "etw")); }} />
            <MicButton
              lang={sttLang}
              onStart={() => { setHeard([]); setSttAlts(null); }}
              onInterim={(t) => { setTyped(t); setHeard((h) => (h[h.length - 1] === t ? h : [...h, t])); }}
              onFinal={(altsList) => {
                const waray = dir === "etw";
                // spoken=true: this is recognizer output — grade with the lenient phrase-level
                // matcher, same as voice mode (the strict word-by-word tier is for TYPED answers)
                const matchAlt = altsList.find((a) => checkAnswer(a, answer, waray, true));
                setSttAlts(altsList);
                // if any guess matched you said it right — show the CORRECT word,
                // not the recognizer's fuzzy/foreign spelling (still in the debug
                // panel). Only on a miss do we show what it actually heard.
                setTyped(matchAlt ? answer : (altsList[0] || ""));
                judge(!!matchAlt);
              }} />
            <button className="ws-check" disabled={!typed.trim()} onClick={() => judge(checkAnswer(typed, answer, dir === "etw"))}>
              Check
            </button>
            {onSkip && <button className="ws-skip" onClick={onSkip}>Skip this one</button>}
          </>
          )
        ) : (
          <>
            <div className={`ws-yourans ${judged}`}>{typed || "—"}</div>
            <Verdict card={card} ctx={ctx} answer={answer} correct={judged === "right"}
              given={typed} dir={dir} autoMs={voiceMode ? 1300 : undefined}
              showWaray={dir === "etw"} onResult={(corr) => onResult(corr, typed)} allowOverride />
          </>
        )}
        {(sttAlts || heard.length > 0) && (judged === "wrong" || settings.sttDebug) && (
          <SttDebug heard={heard} alts={sttAlts} answer={answer} waray={dir === "etw"} lang={sttLang} />
        )}
      </div>
    );
  }

  /* ---- FLASHCARD ---- */
  if (mode === "flash") {
    return (
      <div className="ws-card">
        <div className="ws-card-tag">{DECKS[card.deck].short} · Flashcard</div>
        <PromptBlock text={prompt} isWaray={promptIsWaray} say={promptIsWaray ? card.say : ""}
          onPlay={() => playCard(card)} />
        {!revealed ? (
          <button className="ws-reveal" onClick={() => setRevealed(true)}>Show answer</button>
        ) : (
          <>
            <div className="ws-answer-reveal">
              <span className="ws-answer-text">{answer}</span>
              {answerField === "waray" && <button className="ws-mini-play" onClick={() => playCard(card)}><Volume2 size={16} /></button>}
            </div>
            {card.subtext && <div className="ws-subtext">{card.subtext}</div>}
            <SelfGrade onResult={onResult} />
          </>
        )}
      </div>
    );
  }

  /* ---- SPEAK IT ---- */
  if (mode === "speak") {
    return (
      <SpeakCard card={card} dir={dir} prompt={prompt} answer={answer}
        promptIsWaray={promptIsWaray} ctx={ctx} onResult={onResult} />
    );
  }
  return null;
}

function PromptBlock({ text, isWaray, say, onPlay }) {
  return (
    <div className="ws-prompt">
      <div className={isWaray ? "ws-prompt-waray" : "ws-prompt-eng"}>{text}</div>
      {isWaray && say && <div className="ws-say">/ {say} /</div>}
      {isWaray && (
        <button className="ws-mini-play" onClick={onPlay}><Volume2 size={16} /> hear it</button>
      )}
    </div>
  );
}

// render a Waray phrase with its focus word highlighted (first, case-insensitive match)
function FocusPhrase({ war, focus }) {
  if (!focus) return war;
  const i = war.toLowerCase().indexOf(focus.toLowerCase());
  if (i < 0) return war;
  return <>{war.slice(0, i)}<b className="ws-eg-hi">{war.slice(i, i + focus.length)}</b>{war.slice(i + focus.length)}</>;
}

function Verdict({ card, ctx, answer, correct, showWaray, onResult, allowOverride, given, dir, autoMs }) {
  const { playCard, cards } = ctx;
  // Enter advances — same as clicking Continue. Ignore the keypress that opened
  // this verdict (e.g. the Enter that submitted a typed answer) so one Enter =
  // one step and you don't skip the result screen.
  // When autoMs is set and the answer is right, also auto-advance after that
  // delay so a correct run flows without a click (Back is there if too quick).
  const shownAt = useRef(Date.now());
  const autoAdvance = autoMs && correct;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !e.repeat && Date.now() - shownAt.current > 250) {
        e.preventDefault();
        onResult(correct);
      }
    };
    window.addEventListener("keydown", onKey);
    const t = autoAdvance ? setTimeout(() => onResult(correct), autoMs) : null;
    return () => { window.removeEventListener("keydown", onKey); if (t) clearTimeout(t); };
  }, [correct, onResult, autoAdvance, autoMs]);
  const youSaid = !correct ? explainGiven(cards, given, answer, dir) : null;
  return (
    <div className={`ws-verdict ${correct ? "ok" : "no"}`}>
      <div className="ws-verdict-head">
        {correct ? <><Check size={18} /> Tama! (correct)</> : <><X size={18} /> Not quite</>}
      </div>
      {!correct && (
        <div className="ws-verdict-answer">
          <span>{answer}</span>
          {showWaray && <button className="ws-mini-play" onClick={() => playCard(card)}><Volume2 size={15} /></button>}
        </div>
      )}
      {youSaid && <div className="ws-verdict-yousaid">you said: {youSaid}</div>}
      {card.subtext && <div className="ws-subtext">{card.subtext}</div>}
      {card.example?.war && (
        <button className="ws-verdict-eg" onClick={() => playCard({ waray: card.example.war, say: "" })} title="Hear it in use">
          <span className="ws-eg-war"><FocusPhrase war={card.example.war} focus={card.example.focus} /> <Volume2 size={12} className="ws-eg-play" /></span>
          <span className="ws-eg-en">{card.example.en}</span>
        </button>
      )}
      <div className="ws-verdict-actions">
        {allowOverride && (
          <button className="ws-ghost-btn" onClick={() => onResult(!correct)}>
            {correct ? "Mark wrong" : "I was right"}
          </button>
        )}
        <button className="ws-next-btn" onClick={() => onResult(correct)}>
          Continue <ChevronRight size={18} />
        </button>
      </div>
      {autoAdvance && <div className="ws-auto-bar" style={{ animationDuration: `${autoMs}ms` }} />}
    </div>
  );
}

function SelfGrade({ onResult }) {
  return (
    <div className="ws-selfgrade">
      <button className="ws-sg ws-sg-no" onClick={() => onResult(false)}><X size={18} />Missed it</button>
      <button className="ws-sg ws-sg-ok" onClick={() => onResult(true)}><Check size={18} />Got it</button>
    </div>
  );
}

/* ---------- speak mode: say it aloud, then reveal & self-grade ---------- */
function SpeakCard({ card, dir, prompt, answer, promptIsWaray, ctx, onResult }) {
  const { playCard } = ctx;
  const wantWaray = dir === "etw"; // produce Waray
  const target = wantWaray ? answer : prompt;
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="ws-card">
      <div className="ws-card-tag">{DECKS[card.deck].short} · Speak it</div>
      <div className="ws-speak-prompt">
        <div className="ws-speak-instr">Say this in Waray:</div>
        <div className="ws-prompt-eng">{wantWaray ? prompt : answer}</div>
      </div>

      {!revealed ? (
        <button className="ws-reveal" onClick={() => { setRevealed(true); playCard(card); }}>
          Reveal & compare
        </button>
      ) : (
        <>
          <div className="ws-answer-reveal">
            <span className="ws-answer-text">{target}</span>
            <button className="ws-mini-play" onClick={() => playCard(card)}>
              <Volume2 size={16} /> reference
            </button>
          </div>
          {card.say && <div className="ws-say">/ {card.say} /</div>}
          <SelfGrade onResult={onResult} />
        </>
      )}
    </div>
  );
}

function SessionDone({ ctx, tally, total, results = [] }) {
  const { setView, setSession, session, cards, markUnitReview, lessons, units, startLessonPart, startStep, startUnitReview, setLessonId, setLearnSection } = ctx;
  const inLesson = !!session?.lesson;
  const isUnitReview = !!session?.unitReview; // the unit's graded checkpoint
  const isGate = !!session?.gate;             // an end-of-lesson gate
  const isReview = isUnitReview || isGate;    // any graded, pass/fail checkpoint
  const gradedId = session?.unitReview?.id || session?.gate?.id;
  const missed = results.filter((r) => !r.correct);
  const allIds = results.map((r) => r.id);
  const missedIds = missed.map((r) => r.id);

  // whole-set grade: fold in cards already known before this (review-missed) run
  const effTotal = session?.base?.total || total;
  const effRight = (session?.base?.priorRight || 0) + tally.right;
  const acc = effTotal ? Math.round((effRight / effTotal) * 100) : 0;
  const passed = acc >= PASS_PCT * 100;

  // record the graded result once (pass is sticky in markUnitReview; gates share the same store)
  useEffect(() => { if (isReview && effTotal > 0) markUnitReview(gradedId, acc, passed); }, []);

  // Retrying a GRADED run (gate / unit review) must not raise the grade: passing requires ONE CLEAN
  // FULL RUN. "Practice missed" re-drills the misses unscored (gate/unitReview stripped, so the
  // done-screen doesn't call markUnitReview); "Retake" re-runs the whole set graded, from zero.
  // Ungraded lesson parts keep the old accumulate-the-frame behavior — there it's just practice.
  const reviewMissed = () => {
    const s = { ...session, only: missedIds, limit: missedIds.length, nonce: Date.now() };
    if (isReview) { delete s.gate; delete s.unitReview; delete s.base; s.practice = true; }
    else s.base = { total: effTotal, priorRight: effRight };
    setSession(s); setView("session");
  };
  const reviewAll = () => { const s = { ...session, only: allIds, limit: allIds.length, nonce: Date.now() }; delete s.base; setSession(s); setView("session"); };

  // primary "keep going" action: the next part of this lesson, else the next
  // lesson. The default — Enter triggers it (after a short guard so the Enter
  // that finished the last card doesn't carry through and skip this screen).
  let nextAction = null;
  if (inLesson && LESSON_FLOW.find((l) => l.id === session.lesson.id)?.steps) {
    // DB block lesson: advance to the next step (drill or reading), else back to the lesson
    const lesson = LESSON_FLOW.find((l) => l.id === session.lesson.id);
    const pIdx = session.lesson.part;
    nextAction = pIdx + 1 < lesson.steps.length
      ? { label: `Next: ${stepMeta(lesson.steps[pIdx + 1]).label}`, go: () => startStep(lesson, pIdx + 1) }
      : { label: "Back to lesson", go: () => { setLessonId(lesson.id); setLearnSection(lesson.section.id); setView("lesson"); } };
  } else if (inLesson) {
    const lesson = LESSON_FLOW.find((l) => l.id === session.lesson.id);
    const pIdx = session.lesson.part;
    const parts = partsFor(lesson);
    if (lesson && pIdx + 1 < parts.length) {
      nextAction = { label: `Next: ${parts[pIdx + 1].label}`, go: () => startLessonPart(lesson, pIdx + 1) };
    } else {
      // finished a lesson's last part. If this was the unit's LAST lesson and the unit has
      // a graded review you haven't passed yet, send the learner there — don't skip past it.
      const unit = lesson?.unit;
      const unitDone = unit && unit.lessons.every((l) => l.id === session.lesson.id || lessonDone(lessons, l.id));
      if (unit && unitDone && unitHasReview(unit) && !units[unit.id]?.passed) {
        nextAction = { label: `Unit review: ${unit.name}`, go: () => startUnitReview(unit) };
      } else {
        const nl = nextLesson(lessons);
        if (nl && nl.id !== session.lesson.id) {
          nextAction = { label: `Next lesson: ${nl.title}`, go: () => { setLessonId(nl.id); setLearnSection(nl.section.id); setView("lesson"); } };
        }
      }
    }
  } else if (isReview && passed) {
    // after passing the review, continue forward to the next unfinished lesson
    const nl = nextLesson(lessons);
    if (nl) nextAction = { label: `Next lesson: ${nl.title}`, go: () => { setLessonId(nl.id); setLearnSection(nl.section.id); setView("lesson"); } };
  }
  const shownAt = useRef(Date.now());
  const goNextRef = useRef(null);
  goNextRef.current = nextAction?.go || null;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !e.repeat && Date.now() - shownAt.current > 250 && goNextRef.current) {
        e.preventDefault(); goNextRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const heading = isReview ? (passed ? (isGate ? "Passed!" : "Mastered!") : "Liwat anay") : inLesson ? "Human na!" : "Human na!";
  return (
    <div className="ws-page ws-done">
      <div className="ws-done-card">
        <div className={`ws-done-ring ${isReview && !passed ? "fail" : ""}`} style={{ "--p": acc }}>
          <span>{acc}<i>%</i></span>
        </div>
        <h2>{heading}</h2>
        {isReview && (
          <div className={`ws-passpill ${passed ? "ok" : "no"}`}>
            {passed
              ? <><Check size={14} /> Passed · {isGate ? "test cleared" : "unit mastered"}</>
              : <><X size={14} /> Score {PASS_PCT * 100}% to {isGate ? "pass this test" : "master this unit"}</>}
          </div>
        )}
        <p className="ws-done-sub">{total === 0 ? "Nothing here yet — come back later." : `${effRight}/${effTotal} correct${effTotal - effRight > 0 ? ` · ${effTotal - effRight} to revisit` : ""}`}</p>

        {missed.length > 0 && (
          <div className="ws-missed">
            <div className="ws-missed-label">Missed ({missed.length})</div>
            {missed.map((r, k) => {
              const said = explainGiven(cards, r.given, r.answer, session.dir);
              return (
                <div key={k} className="ws-missed-row">
                  <div className="ws-missed-prompt">{r.prompt}</div>
                  <div className="ws-missed-ans">
                    <span className="ws-missed-yours">{r.given || "—"}</span>
                    <ArrowLeft size={12} className="ws-missed-arr" />
                    <span className="ws-missed-correct">{r.answer}</span>
                  </div>
                  {said && <div className="ws-missed-said">you said: {said}</div>}
                </div>
              );
            })}
          </div>
        )}

        <div className="ws-done-actions">
          {nextAction && (
            <button className="ws-start" onClick={nextAction.go}>{nextAction.label} <ChevronRight size={17} /></button>
          )}
          {results.length > 0 && (
            <>
              {missedIds.length > 0 && <button className={nextAction || isReview ? "ws-ghost-btn" : "ws-start"} onClick={reviewMissed}><RotateCcw size={17} /> {isReview ? "Practice missed (unscored)" : "Review missed"}</button>}
              {isReview && !passed && <button className="ws-start" onClick={reviewAll}><RotateCcw size={17} /> Retake the exam</button>}
              {!(isReview && !passed) && <button className={(nextAction || missedIds.length > 0) ? "ws-ghost-btn" : "ws-start"} onClick={reviewAll}><RotateCcw size={17} /> Review all</button>}
            </>
          )}
          {inLesson ? (
            <button className="ws-ghost-btn" onClick={() => setView("lesson")}>Back to lesson</button>
          ) : isReview ? (
            <button className="ws-ghost-btn" onClick={() => setView("learn")}>Back to unit</button>
          ) : (
            <button className="ws-ghost-btn" onClick={() => setView("home")}><Home size={16} /> Home</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ LEARN PATH ============================ */
function LearnView({ ctx }) {
  const { cards, lessons, units, startUnitReview, startGate, setView, setLessonId, setLearnSection, learnTarget, learnSection, setStoryUnit } = ctx;
  const cur = nextLesson(lessons);
  const s = CURRICULUM.find((x) => x.id === learnSection) || cur.section;
  // scroll to the lesson the user came in on (else the current lesson, if here)
  useEffect(() => {
    const id = learnTarget || cur.id;
    const t = setTimeout(() => {
      const el = document.getElementById("ln-" + id);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, []);
  const all = s.units.flatMap((u) => u.lessons);
  const sDone = all.filter((l) => lessonDone(lessons, l.id)).length;
  return (
    <div className="ws-page">
      <TopBar title={s.name} onBack={() => setView("home")} />
      <div className="ws-learn">
        <div className="ws-section">
          <div className="ws-section-head">
            <div className="ws-section-hint">{s.hint}</div>
            <div className="ws-section-prog">{sDone}/{all.length}</div>
          </div>
          {s.units.map((u) => {
            const uDone = u.lessons.filter((l) => lessonDone(lessons, l.id)).length;
            const ur = units[u.id];
            const hasCards = unitCards(cards, u).length > 0;
            return (
              <div key={u.id} id={"ln-" + u.id} className="ws-unit">
                {/* skip the unit header when the phase has a single unit — its name duplicates the phase title */}
                {s.units.length > 1 && (
                  <div className="ws-unit-head">
                    <div>
                      <div className="ws-unit-name">{u.name}{ur?.passed && <span className="ws-unit-mastered"><Check size={12} /> mastered</span>}</div>
                      <div className="ws-unit-hint">{u.hint}</div>
                    </div>
                    <div className="ws-unit-prog">{uDone}/{u.lessons.length}</div>
                  </div>
                )}
                <div className="ws-lessons">
                  {(() => {
                    const node = (l) => {
                      const done = lessons[l.id] || 0;
                      const total = partCountById(l.id);
                      const complete = lessonDone(lessons, l.id);
                      const isCur = l.id === cur.id;
                      const n = lessonCards(cards, l).length;
                      return (
                        <button key={l.id} id={"ln-" + l.id} className={`ws-lnode ${complete ? "done" : ""} ${isCur ? "cur" : ""}`}
                          onClick={() => { setLessonId(l.id); setLearnSection(s.id); setView("lesson"); }}>
                          <div className="ws-lnode-ring" style={{ "--p": (done / total) * 100 }}>
                            {complete ? <Check size={16} /> : <span>{done}/{total}</span>}
                          </div>
                          <div className="ws-lnode-body">
                            <div className="ws-lnode-title">{l.title}</div>
                            <div className="ws-lnode-sub">
                              {complete ? "Complete · tap to review" : isCur ? "Continue" : "Start"} · {n} item{n === 1 ? "" : "s"}
                            </div>
                          </div>
                          <ChevronRight size={16} className="ws-lnode-arr" />
                        </button>
                      );
                    };
                    // end-of-lesson gate node (DB courses): graded, sits right after its lesson
                    const gateNode = (g) => {
                      const gp = units[g.id];
                      return (
                        <button key={g.id} className={`ws-lnode ws-gate ${gp?.passed ? "done" : ""}`} onClick={() => startGate(g)}>
                          <div className="ws-lnode-ring">{gp?.passed ? <Check size={16} /> : <span style={{ fontSize: 14 }}>🔒</span>}</div>
                          <div className="ws-lnode-body">
                            <div className="ws-lnode-title">{g.name}</div>
                            <div className="ws-lnode-sub">
                              {gp?.passed ? `Passed · best ${gp.best}%` : `Recall test · ${(g.items || []).length} items · 80% to pass`}
                            </div>
                          </div>
                          <ChevronRight size={16} className="ws-lnode-arr" />
                        </button>
                      );
                    };
                    const gates = u.gates || [];
                    // gate-bearing courses (Peace Corps) render in book order with the test after each
                    // lesson; bundled courses keep the ①Words / ②Apply grouping.
                    if (gates.length) {
                      const byAfter = {}; for (const g of gates) (byAfter[g.after] = byAfter[g.after] || []).push(g);
                      return u.lessons.map((l) => <React.Fragment key={l.id}>{node(l)}{(byAfter[l.id] || []).map(gateNode)}</React.Fragment>);
                    }
                    const wl = u.lessons.filter((l) => l.kind !== "apply");
                    const al = u.lessons.filter((l) => l.kind === "apply");
                    const split = wl.length > 0 && al.length > 0;
                    return (
                      <>
                        {split && <div className="ws-lblock">① Words</div>}
                        {wl.map(node)}
                        {split && <div className="ws-lblock">② Apply · type the Waray</div>}
                        {al.map(node)}
                      </>
                    );
                  })()}
                </div>
                {unitHasReview(u) && hasCards && (
                  <button className={`ws-lnode ws-review ${ur?.passed ? "done" : ""}`} onClick={() => startUnitReview(u)}>
                    <div className="ws-lnode-ring">{ur?.passed ? <Check size={16} /> : <Trophy size={15} />}</div>
                    <div className="ws-lnode-body">
                      <div className="ws-lnode-title">Unit review</div>
                      <div className="ws-lnode-sub">
                        {ur?.passed ? `Mastered · best ${ur.best}%` : ur ? `Best ${ur.best}% · score 80% to master` : "Type the phrases · test out anytime"}
                      </div>
                    </div>
                    <ChevronRight size={16} className="ws-lnode-arr" />
                  </button>
                )}
                {u.story && (() => {
                  const unlocked = u.lessons.every((l) => lessonDone(lessons, l.id));
                  const read = storyRead(u.story.id);
                  return (
                    <button className={`ws-lnode ws-story ${read ? "done" : ""} ${unlocked ? "" : "locked"}`} disabled={!unlocked}
                      onClick={() => { setStoryUnit(u); setLearnSection(s.id); setView("story"); }}>
                      <div className="ws-lnode-ring">{read ? <Check size={16} /> : <BookOpen size={15} />}</div>
                      <div className="ws-lnode-body">
                        <div className="ws-lnode-title">Story · {u.story.title}</div>
                        <div className="ws-lnode-sub">
                          {read ? "Read · tap to revisit" : unlocked ? "Read the unit's story" : "Finish the lessons to unlock"}
                        </div>
                      </div>
                      <ChevronRight size={16} className="ws-lnode-arr" />
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// label/hint/CTA for a DB-lesson block step
/* ============================ CLOZE (marker drill) ============================
   The book's "Use the correct marker with the following nouns" exercises: show the bare
   noun/name (+ the book's cue, e.g. "(plural)"), pick hi / hira / an / an mga. The rows are
   exercise forms, not vocabulary — they never enter the card pool or SRS. */
// Case/possessive markers a cloze drill can blank, LONGEST-match first so "an mga"/"han mga" beat
// "an"/"han". Covers both I-class (leading marker: "an lamesa", "hi Ben") AND II-class possessives,
// where the marker sits INSIDE the phrase ("lapis ni Bebing", "mulayan han mga bata") — findMarker
// locates it wherever it falls rather than assuming it leads.
const CASE_MARKERS = ["an mga", "han mga", "hira", "nira", "kan", "han", "hin", "hi", "ha", "ni", "an"];
const MARKER_GLOSS = {
  an: "a common noun", "an mga": "plural common nouns", hi: "one person by name",
  hira: "several people by name", han: "of a common noun", "han mga": "of plural common nouns",
  hin: "a / some (object)", ha: "to / at / in", ni: "of a person by name",
  nira: "of several people by name", kan: "to / for a person by name",
};
function findMarker(full) {
  const words = (full || "").split(/\s+/).filter(Boolean);
  const low = words.map((w) => w.toLowerCase().replace(/[.,!?]+$/, ""));
  for (let i = 0; i < words.length; i++)
    for (const mk of CASE_MARKERS) {
      const p = mk.split(" ");
      if (p.every((tok, k) => low[i + k] === tok))
        return { answer: mk, before: words.slice(0, i).join(" "), after: words.slice(i + p.length).join(" "), full };
    }
  return null;
}
function ClozeView({ ctx }) {
  const { lessons, lessonId, stepIdx, setView, completeLessonPart } = ctx;
  const lesson = LESSON_FLOW.find((l) => l.id === lessonId);
  const step = lesson?.steps?.[stepIdx];
  const items = useMemo(() => shuffle((step?.cloze || []).map((x) => {
    const m = findMarker(x.full);
    return m ? { ...m, cue: x.cue } : null;
  }).filter(Boolean)), [step]);
  const options = useMemo(() => [...new Set(items.map((it) => it.answer))].sort(), [items]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);
  if (!lesson || !step || !items.length) return <div className="ws-page"><TopBar title="Markers" onBack={() => setView("lesson")} /><p style={{ padding: 20 }}>Nothing to drill.</p></div>;
  const it = items[i];
  const pick = (m) => {
    if (picked) return;
    setPicked(m);
    if (m === it.answer) setRight((r) => r + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 >= items.length) { setDone(true); completeLessonPart(lesson.id, stepIdx); }
      else setI(i + 1);
    }, m === it.answer ? 550 : 1400);
  };
  if (done) return (
    <div className="ws-page">
      <TopBar title="Markers" onBack={() => setView("lesson")} />
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 40 }}>{right === items.length ? "🌊" : "👍"}</div>
        <h2>{right}/{items.length}</h2>
        <p style={{ color: "var(--ink-soft)" }}>{options.map((m) => `${m} — ${MARKER_GLOSS[m] || "marker"}`).join(" · ")}</p>
        <button className="ws-cta ws-cta-primary" style={{ margin: "14px auto" }} onClick={() => setView("lesson")}>Back to the lesson</button>
      </div>
    </div>
  );
  return (
    <div className="ws-page">
      <TopBar title={`Markers · ${i + 1}/${items.length}`} onBack={() => setView("lesson")}
        onReport={() => ctx.openReport({ targetType: "exercise", targetRef: it.full, context: { screen: "markers", answer: it.answer, lesson: lesson.id } })} />
      <div style={{ textAlign: "center", padding: "26px 16px" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Which marker fits?</p>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 30, fontWeight: 600, margin: "10px 0 2px", cursor: "pointer" }}
          onClick={() => speak({ waray: it.full, say: "", english: "" })} title="Tap to hear">
          {it.before && <>{it.before}{" "}</>}
          <span style={{ color: picked ? (picked === it.answer ? "var(--jade)" : "var(--coral)") : "var(--tide)", borderBottom: "2px dashed var(--sand-deep)", padding: "0 6px" }}>
            {picked ? it.answer : "___"}
          </span>{it.after && <>{" "}{it.after}</>} <span style={{ fontSize: 16 }}>🔊</span>
        </div>
        {it.cue && <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{it.cue}</div>}
        <div className="ws-options" style={{ maxWidth: 340, margin: "24px auto 0", textAlign: "left" }}>
          {options.map((m, k) => {
            let cls = "";
            if (picked) { if (m === it.answer) cls = "correct"; else if (m === picked) cls = "incorrect"; }
            return (
              <button key={m} className={`ws-opt ${cls}`} disabled={picked !== null} onClick={() => pick(m)}>
                <span className="ws-opt-key">{k + 1}</span>{m}
              </button>
            );
          })}
        </div>
        {picked && picked !== it.answer && <p style={{ color: "var(--coral)", fontSize: 13, marginTop: 12 }}>It's <b>{it.full}</b></p>}
        {step.footnote && (
          <div className="ws-footnote" style={{ maxWidth: 340, margin: "16px auto 0", textAlign: "left" }}>
            {step.footnote.split("\n").map((ln, k) => <div key={k}>* {ln}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

function stepMeta(step) {
  if (step.type === "teach") return { label: (step.parts && step.parts[0] && step.parts[0].title) || "Grammar", hint: "Read the explanation", cta: "Read" };
  if (step.type === "vocab") return { label: "Learn the words", hint: `${step.items.length} to learn`, cta: "Learn" };
  if (step.kind === "production") return step.dir === "both"
    ? { label: "Translate", hint: "Both ways — Waray ↔ English", cta: "Start" }
    : { label: "Write it", hint: "Type the Waray", cta: "Start" };
  if (step.modality === "cloze") return { label: "Markers", hint: "Pick the right marker", cta: "Start" };
  return { label: step.title === "Examples" ? "Examples" : "Recognize", hint: "Pick the meaning", cta: "Start" };
}

function LessonView({ ctx }) {
  const { cards, lessons, lessonId, setView, setLearnSection, startLessonPart, startStep, playCard } = ctx;
  const lesson = LESSON_FLOW.find((l) => l.id === lessonId) || nextLesson(lessons);
  const done = lessons[lesson.id] || 0;

  // DB (grammar-spine) lessons: walk the book's blocks as steps — teach, learn words, then each
  // specific drill in its own format. No 4-step ladder.
  if (lesson.steps) {
    return (
      <div className="ws-page">
        <TopBar title={lesson.unit.name} onBack={() => { setLearnSection(lesson.section.id); setView("learn"); }}
          onReport={() => ctx.openReport({ targetType: "lesson", targetRef: lesson.id, context: { screen: "lesson", title: lesson.title } })} />
        <h2 className="ws-lesson-title">{lesson.title}</h2>
        <SectionLabel text="Work through each part" />
        <div className="ws-parts">
          {lesson.steps.map((step, k) => {
            const m = stepMeta(step);
            const completed = done > k;
            const available = done >= k;
            return (
              <button key={k} className={`ws-part ${completed ? "done" : ""} ${done === k ? "cur" : ""}`}
                disabled={!available} onClick={() => startStep(lesson, k)}>
                <div className="ws-part-num">{completed ? <Check size={15} /> : k + 1}</div>
                <div className="ws-part-body">
                  <div className="ws-part-label">{m.label}</div>
                  <div className="ws-part-hint">{m.hint}</div>
                </div>
                <span className="ws-part-cta">{completed ? "Again" : done === k ? m.cta : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // bundled courses: the flat 4-step ladder over the lesson's cards
  const items = lessonCards(cards, lesson);
  const parts = partsFor(lesson);
  const isApply = lesson.kind === "apply";
  return (
    <div className="ws-page">
      <TopBar title={lesson.unit.name} onBack={() => { setLearnSection(lesson.section.id); setView("learn"); }}
        onReport={() => ctx.openReport({ targetType: "lesson", targetRef: lesson.id, context: { screen: "lesson", title: lesson.title } })} />
      <h2 className="ws-lesson-title">{lesson.title}</h2>

      <SectionLabel text={isApply ? "Phrases — say these" : "Words & phrases"} />
      <div className="ws-lwords">
        {items.map((c) => (
          <button key={c.id} className="ws-lword" onClick={() => playCard(c)}>
            <div>
              <div className="ws-lword-w">{c.waray}</div>
              {c.say && <div className="ws-lword-say">/ {c.say} /</div>}
            </div>
            <div className="ws-lword-e">{c.english}</div>
          </button>
        ))}
      </div>

      <SectionLabel text="Clear all 4 to finish" />
      <div className="ws-parts">
        {parts.map((p, k) => {
          const completed = done > k;
          const available = done >= k && items.length > 0;
          return (
            <button key={k} className={`ws-part ${completed ? "done" : ""} ${done === k ? "cur" : ""}`}
              disabled={!available} onClick={() => startLessonPart(lesson, k)}>
              <div className="ws-part-num">{completed ? <Check size={15} /> : k + 1}</div>
              <div className="ws-part-body">
                <div className="ws-part-label">{p.label}</div>
                <div className="ws-part-hint">{p.hint}</div>
              </div>
              <span className="ws-part-cta">{completed ? "Review" : done === k ? "Start" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Teach / Learn screen for a DB-lesson step: grammar prose or the vocab words, then "Got it". */
function TeachView({ ctx }) {
  const { cards, lessons, lessonId, stepIdx, completeLessonPart, setView, playCard } = ctx;
  const lesson = LESSON_FLOW.find((l) => l.id === lessonId);
  const step = lesson && lesson.steps && lesson.steps[stepIdx];
  if (!step) { setView("lesson"); return null; }
  const byId = {}; cards.forEach((c) => { byId[c.id] = c; });
  const gotIt = () => { completeLessonPart(lesson.id, stepIdx); setView("lesson"); };
  return (
    <div className="ws-page">
      <TopBar title={lesson.title} onBack={() => setView("lesson")}
        onReport={() => ctx.openReport({ targetType: "lesson", targetRef: lesson.id,
          context: { screen: step.type === "teach" ? "grammar" : "vocab", title: (step.parts && step.parts[0] && step.parts[0].title) || lesson.title, step: stepIdx } })} />
      {step.type === "teach" ? (
        <>
          {step.parts.map((p, i) => (
            <div key={i} className="ws-teach">
              {p.title && <h3 className="ws-teach-title">{p.title}</h3>}
              {renderMd(p.prose)}
              {p.formula && <div className="ws-teach-formula">{p.formula}</div>}
            </div>
          ))}
        </>
      ) : (
        <>
          <SectionLabel text={`Learn these ${step.items.length} words`} />
          <div className="ws-lwords">
            {step.items.map((id) => { const c = byId[id]; if (!c) return null; return (
              <button key={id} className="ws-lword" onClick={() => playCard(c)}>
                <div><div className="ws-lword-w">{c.waray}</div>{c.say && <div className="ws-lword-say">/ {c.say} /</div>}</div>
                <div className="ws-lword-e">{c.english}</div>
              </button>
            ); })}
          </div>
        </>
      )}
      {step.footnote && (
        <div className="ws-footnote" style={{ marginTop: 14 }}>
          {step.footnote.split("\n").map((ln, k) => <div key={k}>* {ln}</div>)}
        </div>
      )}
      <button className="ws-start ws-full" style={{ marginTop: 18 }} onClick={gotIt}><Check size={18} /> Got it</button>
    </div>
  );
}

/* ============================ HISTORY ============================ */
// eye candy for Progress: an accuracy-over-time area chart + a mastery bar. Pure SVG, no libs.
function ProgressChart({ history, cards, prog }) {
  const days = {};
  for (const e of history) { const d = localDay(new Date(e.ts)); (days[d] = days[d] || { n: 0, r: 0 }); days[d].n++; if (e.correct) days[d].r++; }
  const series = Object.keys(days).sort().map((k) => ({ acc: days[k].r / days[k].n, n: days[k].n })).slice(-21);
  // mastery snapshot (box>=4) — a "how far along" bar under the trend
  let mastered = 0, seen = 0;
  for (const c of cards) { const st = prog[c.id]; if (st?.seen) { seen++; if ((st.box || 0) >= 4) mastered++; } }

  const W = 300, H = 96, pad = 6;
  const xs = (i) => pad + (series.length <= 1 ? 0 : (i / (series.length - 1)) * (W - 2 * pad));
  const ys = (a) => H - pad - a * (H - 2 * pad);
  const line = series.map((s, i) => `${xs(i).toFixed(1)},${ys(s.acc).toFixed(1)}`).join(" ");
  const last = series.length ? series[series.length - 1].acc : 0;
  const first = series.length ? series[0].acc : 0;
  const delta = Math.round((last - first) * 100);

  return (
    <div className="ws-chart">
      <div className="ws-chart-head">
        <div><b>{Math.round(last * 100)}%</b><span>recent accuracy</span></div>
        {series.length >= 2 && <div className={`ws-chart-delta ${delta >= 0 ? "up" : "down"}`}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts</div>}
      </div>
      {series.length >= 2 ? (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ws-chart-svg" aria-hidden="true">
          <defs><linearGradient id="pgfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--tide)" stopOpacity=".34" /><stop offset="1" stopColor="var(--tide)" stopOpacity="0" /></linearGradient></defs>
          <line x1={pad} y1={ys(0.5)} x2={W - pad} y2={ys(0.5)} stroke="var(--sand-deep)" strokeWidth="1" strokeDasharray="3 4" />
          <polygon points={`${xs(0).toFixed(1)},${H - pad} ${line} ${xs(series.length - 1).toFixed(1)},${H - pad}`} fill="url(#pgfill)" />
          <polyline points={line} fill="none" stroke="var(--tide)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={xs(series.length - 1)} cy={ys(last)} r="3.6" fill="var(--sea)" stroke="var(--shell)" strokeWidth="1.5" />
        </svg>
      ) : (
        <div className="ws-chart-empty">Keep drilling — your accuracy trend shows up after a couple of days.</div>
      )}
      <div className="ws-chart-mastery">
        <div className="ws-chart-mastery-bar"><span style={{ width: `${seen ? Math.round((mastered / seen) * 100) : 0}%` }} /></div>
        <div className="ws-chart-mastery-lbl"><b>{mastered}</b> of {seen} started words mastered</div>
      </div>
    </div>
  );
}

function HistoryView({ ctx, embedded }) {
  const { history, setView, cards } = ctx;
  const days = {};
  for (const e of history) {
    const d = localDay(new Date(e.ts));
    (days[d] = days[d] || []).push(e);
  }
  const dayKeys = Object.keys(days).sort().reverse();
  const totalRight = history.filter((e) => e.correct).length;
  const overallAcc = history.length ? Math.round((totalRight / history.length) * 100) : 0;
  return (
    <div className={embedded ? "" : "ws-page"}>
      {!embedded && <TopBar title="History" onBack={() => setView("home")} />}
      {history.length === 0 ? (
        <div className="ws-empty">
          <Trophy size={28} />
          <p>No attempts yet. Every answer — right and wrong — collects here by day so you can track your progress and revisit what you missed.</p>
        </div>
      ) : (
        <>
          <ProgressChart history={history} cards={cards} prog={ctx.prog} />
          <div className="ws-hist-overall">{history.length} answers · {overallAcc}% correct</div>
          {dayKeys.map((d) => {
            const es = days[d];
            const right = es.filter((e) => e.correct).length;
            const acc = Math.round((right / es.length) * 100);
            const misses = es.filter((e) => !e.correct);
            const label = new Date(d + "T00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
            return (
              <div key={d} className="ws-hist-day">
                <div className="ws-hist-dayhead">
                  <span className="ws-hist-date">{label}</span>
                  <span className="ws-hist-acc">{right}/{es.length} · {acc}%</span>
                </div>
                {misses.map((e, k) => {
                  const said = explainGiven(cards, e.given, e.answer, e.dir);
                  return (
                    <div key={k} className="ws-hist-miss">
                      <span className="ws-hist-prompt">{e.prompt}</span>
                      <span className="ws-hist-yours">{e.given || "—"}</span>
                      <ArrowLeft size={11} className="ws-missed-arr" />
                      <span className="ws-hist-correct">{e.answer}</span>
                      {said && <span className="ws-hist-said">({said})</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============================ NEEDS WORK ============================ */
function NeedsWorkView({ ctx }) {
  const { cards, prog, setView, setSession, playCard, togglePin, dismissNeedsWork } = ctx;
  // rank by how much you struggle: most-missed first, then lowest accuracy
  const items = cards.filter((c) => needsWorkCard(prog[c.id]))
    .sort((a, b) => {
      const sa = prog[a.id], sb = prog[b.id];
      const byWrong = (sb?.wrong || 0) - (sa?.wrong || 0);
      return byWrong || accuracy(sa) - accuracy(sb);
    });
  // Build a FAIR drill so the queue actually drains: lead with cards that are 1–2 cold recalls from
  // graduating (opportunistic wins), interleaved with the genuinely hard ones. All-hardest-first meant
  // the near-clearing cards never got drilled and the queue never moved.
  const drill = (() => {
    const meta = items.map((c) => ({ c, r: prog[c.id]?.recall || 0, w: prog[c.id]?.wrong || 0, acc: accuracy(prog[c.id]), pin: prog[c.id]?.pinned }));
    const close = meta.filter((x) => x.r >= 1 && !x.pin).sort((a, b) => b.r - a.r);              // nearly there — clear these out
    const hard = meta.filter((x) => !(x.r >= 1 && !x.pin)).sort((a, b) => b.w - a.w || a.acc - b.acc);
    const out = []; let i = 0, j = 0;
    while (out.length < 20 && (i < close.length || j < hard.length)) {   // interleave: a win, then a hard one
      if (i < close.length) out.push(close[i++].c);
      if (j < hard.length && out.length < 20) out.push(hard[j++].c);
    }
    return out;
  })();
  const closeN = items.filter((c) => (prog[c.id]?.recall || 0) >= 1 && !prog[c.id]?.pinned).length;

  return (
    <div className="ws-page">
      <TopBar title="Needs work" onBack={() => setView("home")} />
      {items.length === 0 ? (
        <div className="ws-empty">
          <Sparkles size={28} />
          <p>Nothing to redrill yet. Miss a word — or pin it with the star — and it collects here. Type it right from memory {NW_RECOVER}× (multiple-choice doesn't count) and it graduates off on its own.</p>
        </div>
      ) : (
        <>
          <button className="ws-start ws-full" onClick={() => {
            // produce it from memory (English → Waray, typed) with remediation: a miss
            // keeps re-drilling until cleared — a real mastery drill, not soft recognition
            setSession({ deckKeys: Object.keys(DECKS), dir: "etw", mode: "type", remediate: true, drill: true, limit: drill.length, only: drill.map((c) => c.id) });
            setView("session");
          }}>
            <Play size={18} /> Drill {drill.length} {drill.length === items.length ? "" : "— a fair mix"}
          </button>
          <div className="ws-pron-note" style={{ margin: "10px 0 4px" }}>
            {closeN > 0 && <><b>{closeN}</b> {closeN === 1 ? "word is" : "words are"} one or two recalls from graduating — this session leads with those, mixed with the hardest. </>}
            The dots fill only when you <b>type</b> a word right from memory — multiple-choice doesn't count. {NW_RECOVER} cold recalls and it graduates off; a miss resets it.
          </div>
          <div className="ws-nw-list">
            {items.map((c) => {
              const st = prog[c.id];
              return (
                <div key={c.id} className="ws-nw">
                  <button className="ws-mini-play sq" onClick={() => playCard(c)}><Volume2 size={16} /></button>
                  <div className="ws-nw-body">
                    <div className="ws-nw-waray">{c.waray}</div>
                    <div className="ws-nw-eng">{c.english}</div>
                  </div>
                  <div className="ws-nw-meta">
                    {!st?.pinned && (
                      <div className="ws-nw-recover" title={`${Math.min(st?.recall || 0, NW_RECOVER)}/${NW_RECOVER} cold type-recalls to graduate off this list`}>
                        {Array.from({ length: NW_RECOVER }).map((_, i) => (
                          <span key={i} className={`ws-nw-pip ${(st?.recall || 0) > i ? "on" : ""}`} />
                        ))}
                      </div>
                    )}
                    <span className="ws-nw-miss" title="times missed">×{st?.wrong || 0}</span>
                    <button className={`ws-pin ${st?.pinned ? "on" : ""}`} onClick={() => togglePin(c.id)}>
                      <Star size={15} />
                    </button>
                    <button className="ws-nw-remove" title="Remove from Needs work (I know this one)" onClick={() => dismissNeedsWork(c.id)}>
                      <X size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ===================== UNIT STORY (capstone) ===================== */
function StoryView({ ctx }) {
  const { storyUnit, setView, setLearnSection, learnSection, playCard } = ctx;
  const story = storyUnit?.story;
  const [answer, setAnswer] = useState(null);
  const [read, setRead] = useState(() => story ? storyRead(story.id) : false);
  const back = () => { setLearnSection(learnSection); setView("learn"); };
  if (!story) { back(); return null; }
  const q = story.q;
  return (
    <div className="ws-page">
      <TopBar title={storyUnit.name} onBack={back}
        onReport={() => ctx.openReport({ targetType: "lesson", targetRef: storyUnit.id || storyUnit.name, context: { screen: "story" } })} />
      <h2 className="ws-lesson-title">{story.title}</h2>
      <div className="ws-read-meta">{story.titleEn} · {storyUnit.name} story · tap a line to hear it</div>
      <div className="ws-story-body">
        {story.lines.map((ln, i) => (
          <div key={i} className="ws-story-line" onClick={() => playCard({ waray: ln.war, say: "" })}>
            <div className="ws-story-war">
              {ln.war}
              <Volume2 size={14} className="ws-story-play" />
            </div>
            <div className="ws-story-en">{ln.en}</div>
          </div>
        ))}
      </div>
      {q && (
        <div className="ws-quiz">
          <SectionLabel text="Check your understanding" />
          <div className="ws-quiz-q">
            <div className="ws-quiz-prompt">{q.q}</div>
            {q.options.map((o, oi) => {
              let cls = "";
              if (answer != null) { if (oi === q.answer) cls = "correct"; else if (oi === answer) cls = "incorrect"; }
              return (
                <button key={oi} className={`ws-quiz-opt ${cls}`} disabled={answer != null}
                  onClick={() => setAnswer(oi)}>{o}</button>
              );
            })}
          </div>
        </div>
      )}
      <button className={`ws-start ws-full ${read ? "ws-connected" : ""}`} style={{ marginTop: 18 }}
        onClick={() => setRead(toggleStoryRead(story.id))}>
        {read ? <><Check size={18} /> Read — tap to unmark</> : <><BookOpen size={18} /> Mark as read</>}
      </button>
    </div>
  );
}

/* ============================ READ ============================ */
function ReadView({ ctx }) {
  const { cards, prog, setView, playCard } = ctx;
  const [open, setOpen] = useState(null);   // selected story
  const [sel, setSel] = useState(null);     // tapped {word, gloss}
  const [answers, setAnswers] = useState({}); // comprehension-quiz picks {qIdx: optIdx}
  const openStory = (s) => { setOpen(s); setSel(null); setAnswers({}); };
  const [readSet, setReadSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(PK.read) || "[]")); } catch (e) { return new Set(); }
  });
  const markRead = (id) => setReadSet((prev) => {
    const ns = new Set(prev); ns.has(id) ? ns.delete(id) : ns.add(id);
    try { localStorage.setItem(PK.read, JSON.stringify([...ns])); } catch (e) {}
    return ns;
  });

  const { known, roots } = React.useMemo(() => {
    const k = knownWaray(prog, cards);
    return { known: k, roots: [...k].filter((w) => w.length >= 4) };
  }, [prog, cards]);

  // ---------- reader ----------
  if (open) {
    const cov = storyCoverage(open, known, roots);
    const tap = (core) => {
      const n = storyToks(core)[0] || "";
      let g = glossFor(n);
      if (g && VARIANTS[n] && !GLOSS[n]) g = `${g}  (form of ${VARIANTS[n]})`;
      setSel({ word: core, gloss: g });
      playCard({ waray: core, say: "" });
    };
    const tapChunk = (text, gloss) => { setSel({ word: text, gloss }); playCard({ waray: text, say: "" }); };
    // render a paragraph word-by-word, but match registered multi-word chunks LONGEST-FIRST
    const renderPara = (p, pi) => {
      const parts = p.split(/(\s+)/); // alternating words & whitespace
      const out = [];
      let i = 0;
      while (i < parts.length) {
        const part = parts[i];
        if (part === "" || /^\s+$/.test(part)) { out.push(part); i++; continue; }
        // longest chunk (MAXCHUNK..2 words) starting at this word
        let chunk = null;
        for (let len = MAXCHUNK; len >= 2 && !chunk; len--) {
          const words = []; let j = i;
          while (words.length < len && j < parts.length) {
            if (/^\s+$/.test(parts[j])) { j++; continue; }
            const wn = storyToks(parts[j])[0]; if (!wn) { words.length = 0; break; }
            words.push(wn); j++;
          }
          if (words.length === len && CHUNKS[words.join(" ")]) chunk = { end: j, gloss: CHUNKS[words.join(" ")] };
        }
        if (chunk) {
          const text = parts.slice(i, chunk.end).join("");
          out.push(<span key={i} className="ws-rw chunk" onClick={() => tapChunk(text, chunk.gloss)}>{text}</span>);
          i = chunk.end; continue;
        }
        const n = storyToks(part)[0] || "";
        if (!n) { out.push(<span key={i}>{part}</span>); i++; continue; }
        const kn = knowsTok(n, known, roots);
        out.push(<span key={i} className={`ws-rw ${kn ? "" : "new"}`} onClick={() => tap(part)}>{part}</span>);
        i++;
      }
      out.push(<button key="play" className="ws-read-play" title="Hear this line" onClick={() => playCard({ waray: p, say: "" })}><Volume2 size={14} /></button>);
      return <p key={pi} className="ws-read-p">{out}</p>;
    };
    return (
      <div className="ws-page">
        <TopBar title="Read" onBack={() => { setOpen(null); setSel(null); setAnswers({}); }} />
        <h2 className="ws-lesson-title">{open.title}</h2>
        <div className="ws-read-meta">
          {open.source} · {Math.round(cov.pct * 100)}% known · {cov.unknown} new word{cov.unknown === 1 ? "" : "s"}
          <span className="ws-read-hint"> · tap any word</span>
        </div>
        <div className="ws-read-body">{open.paras.map(renderPara)}</div>
        {open.questions && open.questions.length > 0 && (
          <div className="ws-quiz">
            <SectionLabel text="Check your understanding" />
            {open.questions.map((q, qi) => (
              <div key={qi} className="ws-quiz-q">
                <div className="ws-quiz-prompt">{q.q}</div>
                {q.options.map((o, oi) => {
                  const chosen = answers[qi];
                  let cls = "";
                  if (chosen != null) { if (oi === q.answer) cls = "correct"; else if (oi === chosen) cls = "incorrect"; }
                  return (
                    <button key={oi} className={`ws-quiz-opt ${cls}`} disabled={chosen != null}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}>{o}</button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <button className={`ws-start ws-full ${readSet.has(open.id) ? "ws-connected" : ""}`} style={{ marginTop: 18 }} onClick={() => markRead(open.id)}>
          {readSet.has(open.id) ? <><Check size={18} /> Read — tap to unmark</> : <><BookOpen size={18} /> Mark as read</>}
        </button>
        <div className="ws-read-credit">
          {open.source === "Bloom"
            ? <>From <b>Bloom Library</b> ({open.license}) — bloomlibrary.org. Used with attribution.</>
            : <>From <b>Bible for Children</b> — free to copy, not for sale. Used with attribution.</>}
        </div>
        {sel && (
          <div className="ws-gloss-bar" onClick={() => playCard({ waray: sel.word, say: "" })}>
            <Volume2 size={16} />
            <b>{sel.word}</b>
            <span>{sel.gloss || "not in the glossary — likely a name, or a rare/inflected word (tap to hear it)"}</span>
            <button className="ws-skip" onClick={(e) => { e.stopPropagation(); setSel(null); }}>✕</button>
          </div>
        )}
      </div>
    );
  }

  // ---------- story list ----------
  // sort: most-known first; ties (e.g. a fresh learner at 0%) break to the EASIEST —
  // fewest new words, then shortest — so there's always a sensible "start here".
  const rows = ACTIVE.stories
    .map((s) => ({ s, cov: storyCoverage(s, known, roots) }))
    .sort((a, b) => b.cov.pct - a.cov.pct || a.cov.unknown - b.cov.unknown || a.cov.total - b.cov.total);
  const tier = (p) => p >= 0.85 ? { c: "ok", t: "ready" } : p >= 0.7 ? { c: "mid", t: "a stretch" } : { c: "hard", t: "hard" };

  return (
    <div className="ws-page">
      <TopBar title="Read a story" onBack={() => setView("home")} />
      <div className="ws-pron-intro">
        Real Waray stories, free &amp; openly licensed, sorted by how much you already know.
        Tap any word to hear it and see its meaning. Don't expect to know every word — reading
        a story where you know most of it is how the words stick.
      </div>
      <div className="ws-read-list">
        {rows.map(({ s, cov }) => {
          const tr = tier(cov.pct);
          return (
            <button key={s.id} className="ws-read-card" onClick={() => openStory(s)}>
              <div className="ws-read-card-main">
                <div className="ws-read-card-title">{readSet.has(s.id) ? <Check size={14} className="ws-read-done" /> : null}{s.title}</div>
                <div className="ws-read-card-sub">{s.titleEn ? <i>“{s.titleEn}” · </i> : null}{s.source} · {s.paras.length} parts · {cov.unknown} new words</div>
              </div>
              <div className={`ws-read-badge ${tr.c}`}>
                <b>{Math.round(cov.pct * 100)}%</b><span>{tr.t}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ BROWSE ============================ */

function masteryColor(p, st) {
  if (!st || st.seen === 0) return "#cdbfa6";
  if (p >= 0.8) return "#4fb286";
  if (p >= 0.4) return "#3fa9b0";
  return "#e2604a";
}

/* ============================ BACKUP & SYNC ============================ */

/* ============================ ACCOUNT & SYNC ============================ */
function AccountView({ ctx }) {
  const { setView, exportData, importData, syncState, syncPull, syncPush, user, signIn, signInEmail, signOut } = ctx;
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const download = () => {
    try {
      const json = JSON.stringify(exportData());
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const stamp = localDay();
      const a = document.createElement("a"); a.href = url; a.download = `sulog-backup-${stamp}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMsg({ kind: "ok", text: `Saved sulog-backup-${stamp}.json (${Math.max(1, Math.round(json.length / 1024))} KB).` });
    } catch { setMsg({ kind: "err", text: "Couldn't create the file here. Try from your own browser tab." }); }
  };
  const onPick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const data = JSON.parse(await file.text());
      await importData(data, "merge");
      setMsg({ kind: "ok", text: `Restored ${data.prog ? Object.keys(data.prog).length : 0} cards. Your progress is back.` });
    } catch (err) { setMsg({ kind: "err", text: err.message || "That file couldn't be read." }); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  return (
    <div className="ws-page">
      <TopBar title="Account & sync" onBack={ctx.backToMenu} />
      <SectionLabel icon={<Cloud size={14} />} text="Sign in &amp; sync" />
      <div className="ws-gist">
        {user ? (
          <>
            <div className="ws-drive-note" style={{ marginBottom: 10 }}>Signed in as <b>{user.email}</b>. Your progress syncs automatically — a few seconds after each change, and pulls when Sulog opens.</div>
            {(syncState.status === "syncing" || syncState.status === "ok" || syncState.status === "error") && (
              <div className={`ws-sync-status ${syncState.status}`} style={{ marginBottom: 10 }}>
                <span className="ws-sync-dot" />
                <span>{syncState.status === "syncing" ? "Syncing…" : syncState.status === "error" ? "Couldn't sync" : syncState.at ? `Synced ${syncState.at}${syncState.n != null ? ` · ${syncState.n} cards from cloud` : ""}` : "Synced"}</span>
              </div>
            )}
            {syncState.status === "error" && <div className="ws-backup-msg err" style={{ marginBottom: 10 }}><AlertCircle size={16} /><span>{syncState.error}</span></div>}
            <div className="ws-sync-btns">
              <button className="ws-backup-row compact" onClick={() => syncPull()}><Download size={16} /> Pull now</button>
              <button className="ws-backup-row compact" onClick={() => syncPush()}><Upload size={16} /> Push now</button>
            </div>
            <button className="ws-backup-row compact" style={{ marginTop: 8 }} onClick={() => signOut()}><X size={16} /> Sign out</button>
          </>
        ) : (
          <>
            <div className="ws-drive-note" style={{ marginBottom: 12 }}>Sign in with Google and your progress follows you to every device — no tokens, no files.</div>
            <button className="ws-start ws-full" onClick={() => signIn()}><Cloud size={18} /> Sign in with Google</button>
            <div style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 12, margin: "10px 0 8px" }}>or use email — no password</div>
            <div style={{ display: "flex", gap: 7 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={{ flex: 1, fontSize: 14, color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 9, padding: "9px 12px" }} />
              <button style={{ flex: "none", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "0 16px", borderRadius: 9, border: "1px solid var(--tide)", background: "transparent", color: "var(--sea)", cursor: "pointer", whiteSpace: "nowrap" }}
                onClick={async () => { if (!email.includes("@")) { setMsg({ kind: "err", text: "Enter an email address." }); return; } try { await signInEmail(email); setMsg({ kind: "ok", text: "Check your email for the sign-in link." }); } catch (e) { setMsg({ kind: "err", text: e.message }); } }}>Email link</button>
            </div>
          </>
        )}
      </div>

      <SectionLabel icon={<Download size={14} />} text="Backup" />
      <button className="ws-backup-row" onClick={download}>
        <div className="ws-backup-ic"><Download size={18} /></div>
        <div className="ws-backup-txt"><b>Download a backup</b><i>A small JSON file — mastery, streak, what needs work</i></div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>
      <button className="ws-backup-row" onClick={() => fileRef.current?.click()} disabled={busy}>
        <div className="ws-backup-ic ws-ic-coral"><Upload size={18} /></div>
        <div className="ws-backup-txt"><b>{busy ? "Restoring…" : "Import a backup file"}</b><i>Merges in — furthest progress wins</i></div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPick} style={{ display: "none" }} />
      {msg && <div className={`ws-backup-msg ${msg.kind}`}>{msg.kind === "ok" ? <Check size={16} /> : <AlertCircle size={16} />}<span>{msg.text}</span></div>}
    </div>
  );
}

/* ============================ REQUEST — join a class / ask for a role ============================ */
function RequestView({ ctx }) {
  const { setView, user, roles, roleReqs, requestRole, joinClass } = ctx;
  const [joinCode, setJoinCode] = useState("");
  const [enrolled, setEnrolled] = useState([]);
  const [msg, setMsg] = useState(null);
  const loadEnrolled = useCallback(() => { if (user) fetchMyEnrolledClasses().then(setEnrolled).catch(() => {}); }, [user]);
  useEffect(() => { loadEnrolled(); }, [loadEnrolled]);
  if (!user) return (
    <div className="ws-page">
      <TopBar title="Request access" onBack={ctx.backToMenu} />
      <div className="ws-empty"><Lock size={26} /><p>Sign in first — then you can join a class or ask for a role.</p>
        <button className="ws-cta ws-cta-primary" style={{ margin: "14px auto" }} onClick={() => setView("account")}>Go to Account</button></div>
    </div>
  );
  return (
    <div className="ws-page">
      <TopBar title="Request access" onBack={ctx.backToMenu} />
      <div className="ws-pron-intro">Join a class your teacher set up, or ask for a role. Role requests go to an admin to approve.</div>

      <SectionLabel icon={<GraduationCap size={14} />} text="Join a class" />
      <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="WARAY-XXXXX"
          style={{ flex: 1, fontFamily: "ui-monospace,monospace", fontSize: 14, letterSpacing: ".08em", color: "var(--ink)", background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 9, padding: "10px 12px" }} />
        <button style={{ flex: "none", fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, padding: "0 18px", borderRadius: 9, border: "1px solid var(--tide)", background: "transparent", color: "var(--sea)", cursor: "pointer" }}
          onClick={async () => { try { await joinClass(joinCode); setMsg({ kind: "ok", text: "Joined — it's listed below." }); setJoinCode(""); loadEnrolled(); } catch (e) { setMsg({ kind: "err", text: e.message }); } }}>Join</button>
      </div>
      {enrolled.length === 0
        ? <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "2px 2px 4px" }}>You haven't joined a class yet.</p>
        : enrolled.map((c) => (
            <div key={c.id} style={{ background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 11, padding: "11px 13px", marginBottom: 7 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>code {c.code}</div>
            </div>
          ))}

      <SectionLabel icon={<span style={{ fontSize: 13 }}>✋</span>} text="Ask for a role" />
      {[["instructor", "Instructor", "Teach a class — create one and get a join code"], ["reviewer", "Reviewer", "I speak Waray natively — help review & correct content"]].map(([r, label, desc]) => {
        const held = (roles || []).includes(r);
        const pending = (roleReqs || []).some((q) => q.role === r && q.status === "pending");
        return (
          <div key={r} className="ws-backup-row" style={{ cursor: "default" }}>
            <div className="ws-backup-txt"><b>{label}</b><i>{desc}</i></div>
            <button disabled={held || pending} onClick={() => requestRole(r, "").then(() => setMsg({ kind: "ok", text: `Requested ${label} — an admin will review it.` })).catch((e) => setMsg({ kind: "err", text: e.message }))}
              style={{ flex: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "6px 13px", borderRadius: 9, whiteSpace: "nowrap",
                border: "1px solid " + (held ? "var(--jade)" : pending ? "var(--sun)" : "var(--tide)"), background: "transparent",
                color: held ? "var(--jade)" : pending ? "var(--sun)" : "var(--sea)", cursor: held || pending ? "default" : "pointer" }}>
              {held ? "Held ✓" : pending ? "Requested" : "Request"}
            </button>
          </div>
        );
      })}
      {msg && <div className={`ws-backup-msg ${msg.kind}`} style={{ marginTop: 10 }}>{msg.kind === "ok" ? <Check size={16} /> : <AlertCircle size={16} />}<span>{msg.text}</span></div>}
    </div>
  );
}

/* ============================ SETTINGS — language / sound hub ============================ */
function SettingsView({ ctx }) {
  const { setView, settings, saveSettings } = ctx;
  return (
    <div className="ws-page">
      <TopBar title="Settings" onBack={ctx.backToMenu} />
      <SectionLabel icon={<Globe size={14} />} text="Language &amp; course" />
      <button className="ws-backup-row" onClick={() => setView("language")}>
        <div className="ws-backup-ic"><Globe size={18} /></div>
        <div className="ws-backup-txt"><b>Language &amp; course</b><i>Pick a language, switch course, preview &amp; dialect</i></div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>

      <SectionLabel icon={<Ear size={14} />} text="Sound &amp; speech" />
      <button className="ws-backup-row" onClick={() => setView("pronounce")}>
        <div className="ws-backup-ic"><Ear size={18} /></div>
        <div className="ws-backup-txt"><b>Pronunciation &amp; sounds</b><i>How Waray sounds · TTS voice &amp; speed</i></div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>
      {SpeechRec && (
        <button className="ws-backup-row" onClick={() => saveSettings({ ...settings, voiceMode: !settings.voiceMode })}>
          <div className="ws-backup-ic"><Mic size={18} /></div>
          <div className="ws-backup-txt"><b>Answer by voice</b><i>{settings.voiceMode ? "On — speak your answers" : "Off — type your answers"}</i></div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: settings.voiceMode ? "var(--jade)" : "var(--ink-dim)" }}>{settings.voiceMode ? "On" : "Off"}</span>
        </button>
      )}
    </div>
  );
}

/* ============================ STRESS CHECK (beta prototype) ============================
   Waray stress is PHONEMIC (PAH-tigh = to kill, pah-TIGH = dead). Record → energy envelope
   (Web Audio, 20ms RMS) → voiced segments ≈ syllables → prominence (loudness × duration) →
   compare the most prominent against the CAPITALIZED guide syllable. Browser-only.
   Visuals: live waveform while recording; then a score gauge, the word colored per
   syllable, and the envelope with detected syllables shaded. */
// Pick practice words with VARIETY + rising DIFFICULTY: bias toward more syllables, glottal
// stops, and longer words, while pushing recently-seen words to the back (persisted, so
// sessions differ). Efraimidis-Spirakis weighted sampling gives a fresh order each visit.
function difficultyOf(c) {
  const w = c.waray.toLowerCase();
  const syl = ((c.say || "").match(/-/g) || []).length + 1;    // syllable count from the guide
  const glottal = (w.match(/-/g) || []).length;                // glottal stops — hard for Americans
  const ngOnset = /(^|[-\s])ng/.test(w) ? 1 : 0;              // syllable-initial ng — hard for Americans
  const diph = (w.match(/(ay|aw)/g) || []).length;             // -ay/-aw diphthongs
  return syl * 2 + glottal * 3 + ngOnset * 2 + diph + w.replace(/[^a-z]/g, "").length / 4;
}
function practicePool(cards, key) {
  const cand = cards.filter((c) => (c.say || "").includes("-") && !/[\s/]/.test(c.waray) && c.waray.length >= 3);
  let recent = []; try { recent = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) {}
  const seen = new Set(recent);
  return cand
    .map((c) => ({ c, seen: seen.has(c.id), k: Math.pow(Math.random(), 1 / Math.max(0.5, difficultyOf(c))) }))
    .sort((a, b) => (a.seen - b.seen) || (b.k - a.k))          // unseen first, then hard-weighted random
    .map((x) => x.c);
}
function markPracticed(id, key, cap = 60) {
  if (!id) return;
  try { let r = JSON.parse(localStorage.getItem(key) || "[]"); r = r.filter((x) => x !== id); r.push(id); if (r.length > cap) r = r.slice(-cap); localStorage.setItem(key, JSON.stringify(r)); } catch (e) {}
}

function syllabifyWaray(w) {   // same algorithm as the guide generator (build-respellings)
  w = w.toLowerCase().replace(/ng/g, "ŋ");
  const out = [];
  w.split("-").forEach((g) => {
    const units = []; const re = /([^aeiou]*)([aeiou])/g; let m, last = 0;
    while ((m = re.exec(g))) { units.push({ o: m[1], v: m[2] }); last = re.lastIndex; }
    const tail = g.slice(last);
    if (!units.length) { if (g) out.push(g); return; }
    const syls = units.map((u) => u.o + u.v);
    for (let k = 0; k < units.length - 1; k++) { const on = units[k + 1].o; if (on.length >= 2) { syls[k] += on.slice(0, -1); syls[k + 1] = on.slice(-1) + units[k + 1].v; } }
    if (tail) syls[syls.length - 1] += tail;
    syls.forEach((x) => out.push(x));
  });
  return out.map((x) => x.replace(/ŋ/g, "ng"));
}
// debug readout + copy button, mirroring the app's speech-debug panel — paste it to Claude
function StressDebug({ res, card, syls, expected }) {
  const [open, setOpen] = useState(false);
  const dump = [
    `word: ${card.waray}  guide: ${card.say}  expected-stress: #${expected + 1} (${syls[expected]})`,
    `frames: ${res.nFrames} (${res.nFrames * 20}ms)  floor: ${res.floor?.toFixed(4)}  peak: ${res.peakV?.toFixed(4)}  threshold: ${res.th?.toFixed(4)}`,
    `raw bursts: ${res.nRaw} → segments after split: ${res.segs.length} (expected ${syls.length})`,
    ...res.segs.map((g, i) => `  seg${i + 1}${res.countOk ? ` (${syls[i]})` : ""}: ${g.a * 20}–${(g.b + 1) * 20}ms  dur ${(g.b - g.a + 1) * 20}ms  score ${res.scores[i]?.toFixed(4)}  rel ${Math.round(100 * res.scores[i] / Math.max(...res.scores, 1e-9))}%${i === res.detected ? "  ← DETECTED STRESS" : ""}`),
    `verdicts: ${(res.verdicts || []).join(", ")}  ·  pct: ${res.pct}  ok: ${res.ok}`,
    `recognizer heard: ${res.said ? (res.said.alts.join(" | ") || "(nothing)") + (res.said.ok ? "  MATCH" : "  NO MATCH") : "n/a"}`,
    `sound per syllable: ${res.sound ? res.sound.map((r0, i) => `${syls[i]}=${Math.round(r0 * 100)}% heard:${res.soundHeard?.[i] || "·"}`).join("  ") : "n/a"}`,
    `envelope: ${res.sm.map((v) => Math.round(v * 1000)).join(",")}`,
  ].join("\n");
  return (
    <div style={{ maxWidth: 340, margin: "8px auto 0", textAlign: "left" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "transparent", border: 0, color: "var(--ink-soft)", fontSize: 11.5, cursor: "pointer", padding: 0 }}>
        {open ? "▾" : "▸"} stress debug
      </button>
      {open && (
        <div style={{ background: "var(--shell)", border: "1px solid var(--sand-deep)", borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>
          <button onClick={() => { try { navigator.clipboard.writeText(dump); } catch (e) {} }}
            style={{ float: "right", fontSize: 10.5, border: "1px solid var(--sand-deep)", background: "transparent", color: "var(--tide)", borderRadius: 6, padding: "2px 9px", cursor: "pointer" }}>copy</button>
          <pre style={{ margin: 0, fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--ink-soft)", maxHeight: 180, overflow: "auto" }}>{dump}</pre>
        </div>
      )}
    </div>
  );
}

// per-syllable SOUND score: align the recognizer's transcript to the target word
// (char-level, o/u e/i folded) and measure how much of each syllable's span matched.
function syllableSoundRatios(transcript, wordSyls) {
  // fold for MATCHING: Waray vowel folding (o=u, e=i) + sound-equivalent spellings the
  // Filipino recognizer uses (c=k, qu=k, z=s, f=p, v=b). Keep the RAW letters for display.
  const foldArr = (x) => {
    const low = (x || "").toLowerCase(); const out = [];
    for (let i = 0; i < low.length; i++) {
      const ch = low[i];
      if (!/[a-z]/.test(ch)) continue;
      if (ch === "q" && low[i + 1] === "u") { out.push({ raw: "qu", f: "k" }); i++; continue; }
      out.push({ raw: ch, f: { o: "u", e: "i", c: "k", z: "s", f: "p", v: "b" }[ch] || ch });
    }
    return out;
  };
  const tA = foldArr(wordSyls.join("")), hA = foldArr(transcript);
  const t = tA.map((x) => x.f).join(""), h = hA.map((x) => x.f).join("");
  const fold = (x) => foldArr(x).map((y) => y.f).join("");
  if (!t || !h) return null;
  const n = t.length, m = h.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => i === 0 ? -j : j === 0 ? -i : 0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    D[i][j] = Math.max(D[i - 1][j - 1] + (t[i - 1] === h[j - 1] ? 1 : -1), D[i - 1][j] - 1, D[i][j - 1] - 1);
  const hit = new Array(n).fill(false);
  const got = new Array(n).fill("");        // which transcript char landed on each target char
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (D[i][j] === D[i - 1][j - 1] + (t[i - 1] === h[j - 1] ? 1 : -1)) { if (t[i - 1] === h[j - 1]) hit[i - 1] = true; got[i - 1] = hA[j - 1].raw; i--; j--; }
    else if (D[i][j] === D[i - 1][j] - 1) { got[i - 1] = "·"; i--; } else j--;
  }
  const ratios = [], heard = []; let pos = 0;
  for (const syl of wordSyls) {
    const len = fold(syl).length;
    let ok = 0, gs = "";
    for (let k = pos; k < pos + len; k++) { if (hit[k]) ok++; gs += got[k] || "·"; }
    ratios.push(len ? ok / len : 0); heard.push(gs); pos += len;
  }
  return { ratios, heard };
}
// Shared stress engine: loudness envelope -> N syllable nuclei -> prominence + verdicts.
function analyzeStress(frames, nSyl, expected) {
    // NATURAL-SPEECH segmentation: don't hunt for silences between syllables (connected
    // speech has none) — find the N loudness PEAKS (syllable nuclei ≈ vowels, N = the
    // guide's syllable count) and cut at the dips between them, however shallow.
    const sm = frames.map((_, i) => {
      let t = 0, n = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(frames.length - 1, i + 2); j++) { t += frames[j]; n++; }
      return t / n;
    });
    const peak = Math.max(...sm, 1e-6);
    const floor = [...sm].sort((a, b) => a - b)[Math.floor(sm.length * 0.2)] || 0;
    const th = Math.max(floor * 2.2, peak * 0.12);
    // NOISE GATE: speech has loud vowels over quiet gaps (high peak÷floor). Steady background
    // — aircon, running water — is FLAT (peak barely above floor), and too quiet overall means
    // nothing was really said. Either way it isn't a word; reject so noise isn't graded/heard.
    const dyn = peak / Math.max(floor, 1e-4);
    const noSpeech = peak < 0.03 || dyn < 2.6;
    let lo = sm.findIndex((v) => v > th); let hi = sm.length - 1;
    while (hi > lo && sm[hi] <= th) hi--;
    if (noSpeech || lo < 0 || hi - lo < 4) return { segs: [], sm, detected: -1, scores: [], countOk: false, ok: false, pct: 0, verdicts: Array(nSyl).fill("unsure"), th, floor, peakV: peak, nFrames: sm.length, nRaw: 0, noSpeech: true, dyn };
    // local maxima inside the voiced span, ≥80ms apart (keep the taller of close pairs)
    let peaks = [];
    for (let i = lo + 1; i < hi; i++) if (sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && sm[i] > th) peaks.push(i);
    peaks.sort((a, b) => sm[b] - sm[a]);
    const picked = [];
    for (const p of peaks) { if (picked.every((q) => Math.abs(q - p) >= 4)) picked.push(p); }
    const nuclei = picked.slice(0, nSyl).sort((a, b) => a - b);
    // boundaries at the deepest dip between consecutive nuclei; segments span dip→dip
    const bounds = [lo];
    for (let k = 0; k < nuclei.length - 1; k++) {
      let m = nuclei[k], mv = Infinity;
      for (let i = nuclei[k] + 1; i < nuclei[k + 1]; i++) if (sm[i] < mv) { mv = sm[i]; m = i; }
      bounds.push(m);
    }
    bounds.push(hi + 1);
    let keep = nuclei.map((_, k) => ({ a: bounds[k], b: bounds[k + 1] - 1 }));
    keep = keep.map((g) => {
      let pk = 0; for (let i = g.a; i <= g.b; i++) pk = Math.max(pk, sm[i]);
      let a2 = g.a, b2 = g.b;
      while (b2 > a2 && sm[b2] < 0.25 * pk) b2--;      // fade-out tail
      while (a2 < b2 && sm[a2] < 0.25 * pk) a2++;      // quiet lead-in
      return { a: a2, b: b2 };
    });
    const score = (g) => { let t = 0; for (let i = g.a; i <= g.b; i++) t += Math.max(0, sm[i] - floor); return t; };
    const scores = keep.map(score);
    const detected = scores.indexOf(Math.max(...scores));
    const countOk = keep.length === nSyl;
    let pct = countOk && scores.length ? Math.round(100 * (scores[expected] ?? 0) / Math.max(...scores)) : 0;
    if (!countOk) pct = Math.min(pct, 40);
    const mx = Math.max(...scores, 1e-9);
    const verdicts = !countOk ? Array(nSyl).fill("unsure") : Array(nSyl).fill(0).map((_, i) => {
      const rel = (scores[i] ?? 0) / mx;
      if (i === expected) return rel >= 0.999 ? "correct" : rel >= 0.75 ? "almost" : "missed";
      return rel >= 0.999 ? "missed" : rel >= 0.85 ? "almost" : "correct";
    });
    return { segs: keep, sm, detected, scores, countOk, ok: countOk && detected === expected, pct, verdicts,
      th, floor, peakV: peak, nFrames: sm.length, nRaw: picked.length };
  };


// ============================ ACCENT DUEL (2-player game) ============================
// Pass-the-phone: Paul says a Waray word (graded in Filipino), Ella says an English word
// Filipinos commonly shift (graded in en-US). Same stress engine both ways; the recognizer
// locale swaps per turn. Score = stress placement + whether the recognizer heard the RIGHT
// word (strict — "tree" for "three" doesn't count). Alternating turns, shared scoreboard.
// English words that are HARD to say with an American accent — mined from published lists of
// (a) words Filipinos commonly shift and (b) words even Americans mispronounce. Guides are the
// American pronunciation; graded on the en-US recognizer, so getting close to General American
// is the whole point. (sources: BoldVoice, YourDictionary, Samal English 100-word list)
const EN_TRAPS = [
  // — commonly shifted by Filipino speakers —
  { w: "almond", g: "AH-mund" }, { w: "salmon", g: "SAM-un" }, { w: "debut", g: "day-BYOO" },
  { w: "comfortable", g: "KUMF-tur-bul" }, { w: "vegetable", g: "VEJ-tuh-bul" }, { w: "chocolate", g: "CHOK-lut" },
  { w: "entrepreneur", g: "on-truh-pruh-NUR" }, { w: "genre", g: "ZHON-ruh" }, { w: "zucchini", g: "zoo-KEE-nee" },
  { w: "cemetery", g: "SEM-uh-tair-ee" }, { w: "controversy", g: "KON-truh-vur-see" }, { w: "coupon", g: "KOO-pon" },
  { w: "mayonnaise", g: "MAY-uh-nayz" }, { w: "nuisance", g: "NOO-suns" }, { w: "sergeant", g: "SAR-junt" },
  { w: "suicide", g: "SOO-uh-side" }, { w: "tortoise", g: "TOR-tus" }, { w: "utensil", g: "yoo-TEN-sul" },
  { w: "lettuce", g: "LET-us" }, { w: "broccoli", g: "BROK-uh-lee" }, { w: "category", g: "KAT-uh-gor-ee" },
  { w: "cleanliness", g: "KLEN-lee-nus" }, { w: "gourmet", g: "gor-MAY" }, { w: "handsome", g: "HAN-sum" },
  { w: "heinous", g: "HAY-nus" }, { w: "knowledge", g: "NOL-ij" }, { w: "orange", g: "OR-inj" },
  { w: "picture", g: "PIK-chur" }, { w: "species", g: "SPEE-sheez" }, { w: "thesis", g: "THEE-sis" },
  { w: "busy", g: "BIZ-ee" }, { w: "bury", g: "BAIR-ee" }, { w: "boutique", g: "boo-TEEK" },
  { w: "asthma", g: "AZ-muh" }, { w: "attorney", g: "uh-TUR-nee" }, { w: "parachute", g: "PAIR-uh-shoot" },
  { w: "vehicle", g: "VEE-uh-kul" }, { w: "receipt", g: "ruh-SEET" }, { w: "worry", g: "WUR-ee" },
  // — even Americans get these wrong —
  { w: "colonel", g: "KUR-nul" }, { w: "hyperbole", g: "hy-PUR-buh-lee" }, { w: "mischievous", g: "MIS-chuh-vus" },
  { w: "nuclear", g: "NOO-klee-ur" }, { w: "quinoa", g: "KEEN-wah" }, { w: "espresso", g: "es-PRES-oh" },
  { w: "jewelry", g: "JOO-ul-ree" }, { w: "february", g: "FEB-roo-air-ee" }, { w: "iron", g: "EYE-urn" },
  { w: "cache", g: "KASH" }, { w: "worcestershire", g: "WOOS-tur-shur" }, { w: "prestigious", g: "pre-STIJ-us" },
  { w: "cupboard", g: "KUB-urd" }, { w: "often", g: "OF-un" }, { w: "library", g: "LY-brair-ee" },
  { w: "arctic", g: "ARK-tik" }, { w: "envelope", g: "EN-vuh-lohp" }, { w: "pneumonia", g: "noo-MOHN-yuh" },
  { w: "especially", g: "es-PESH-uh-lee" }, { w: "temperature", g: "TEM-pruh-chur" }, { w: "restaurant", g: "RES-tuh-ront" },
  { w: "opportunity", g: "op-ur-TOO-nuh-tee" }, { w: "development", g: "duh-VEL-up-munt" }, { w: "particularly", g: "pur-TIK-yuh-lur-lee" },
];
const ROUNDS = 5;   // words per player
function AccentDuelView({ ctx }) {
  const { cards, setView, playCard } = ctx;
  const warayPool = useMemo(() => practicePool(cards, "sulog:practiced"), [cards]);
  const enPool = useMemo(() => shuffle(EN_TRAPS.slice()), []);   // fresh order each game
  const players = [
    { flag: "🇺🇸", lang: "Waray", locale: "fil-PH", pick: (n) => warayPool[n % (warayPool.length || 1)] && { word: warayPool[n % warayPool.length].waray, guide: warayPool[n % warayPool.length].say, card: warayPool[n % warayPool.length] } },
    { flag: "🇵🇭", lang: "English", locale: "en-US", pick: (n) => ({ word: enPool[n % enPool.length].w, guide: enPool[n % enPool.length].g }) },
  ];
  const [phase, setPhase] = useState("setup");     // setup | turn | result | over
  const [turn, setTurn] = useState(0);             // 0..ROUNDS*2-1
  const [score, setScore] = useState([0, 0]);
  const [state, setState] = useState("idle");      // idle | rec | error (within a turn)
  const [res, setRes] = useState(null);
  const recRef = useRef(null);
  const liveCanvas = useRef(null);
  const envCanvas = useRef(null);
  const p = turn % 2;                              // whose turn (0 Paul, 1 Ella)
  const roundNo = Math.floor(turn / 2) + 1;
  const item = players[p].pick(Math.floor(turn / 2));
  const syls = item ? item.guide.split("-") : [];
  const expected = syls.findIndex((x) => /[A-Z]/.test(x)) >= 0 ? syls.findIndex((x) => /[A-Z]/.test(x)) : 0;
  useEffect(() => { if (item && item.card) markPracticed(item.card.id, "sulog:practiced"); }, [item && item.card && item.card.id]);

  const cleanup = () => { const r = recRef.current; if (!r) return; clearInterval(r.iv); try { r.sr?.stop(); } catch (e) {} try { r.stream.getTracks().forEach((t) => t.stop()); r.ac.close(); } catch (e) {} recRef.current = null; };
  useEffect(() => cleanup, []);

  const grade = (frames, alts) => {
    const a = analyzeStress(frames, syls.length, expected);
    if (a.noSpeech) return { pts: 0, matched: false, heardTop: "", stressPct: 0, verdicts: a.verdicts, syls,
      verified: false, noSpeech: true, sm: a.sm, segs: [], detected: -1, countOk: false };
    const norm = (x) => (x || "").toLowerCase().replace(/[^a-z]/g, "");
    const target = norm(item.word);
    const uniq = [...new Set(alts)];
    const heardTop = uniq[uniq.length - 1] || "";
    const matched = uniq.some((x) => norm(x) === target) || (players[p].lang === "Waray" && uniq.some((x) => checkAnswer(x, item.word, true, true)));
    const stressPct = a.countOk ? Math.round(100 * (a.scores[expected] || 0) / Math.max(...a.scores, 1e-9)) : 40;
    // STRESS is the point of the game, so it gates the score even when the word is recognized:
    // right word + right stress → 88..100; right word but stress on the wrong syllable → 45
    // (clearly penalized); "almost" (stressed syllable was close to loudest) → 70; wrong word → 0..30.
    const stressV = a.countOk ? a.verdicts[expected] : "unsure";
    let pts;
    if (!matched) pts = Math.round(0.3 * stressPct);
    else if (stressV === "correct") pts = Math.round(88 + 0.12 * stressPct);
    else if (stressV === "almost") pts = 70;
    else pts = 45;
    return { pts, matched, stressV, heardTop, stressPct, verdicts: a.verdicts, syls, verified: uniq.length > 0,
      sm: a.sm, segs: a.segs, detected: a.detected, countOk: a.countOk };
  };
  const start = async () => {
    setRes(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      try { await ac.resume(); } catch (e) {}      // mobile: a fresh context is suspended
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser(); an.fftSize = 2048; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const heardAlts = []; let sr = null;
      if (SpeechRec) try {
        sr = new SpeechRec(); sr.lang = players[p].locale; sr.interimResults = true; sr.maxAlternatives = 5; sr.continuous = true;
        sr.onresult = (e) => { for (const r of e.results) for (let i = 0; i < r.length; i++) if (r[i].transcript?.trim()) heardAlts.push(r[i].transcript.trim()); };
        sr.start();
      } catch (e) { sr = null; }
      const frames = []; let lastLoud = Date.now(), everLoud = false;
      const iv = setInterval(() => {
        if (!recRef.current) return;
        an.getFloatTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length); frames.push(rms);
        // live waveform so you can SEE it hearing you
        const cv = liveCanvas.current;
        if (cv) { const dpr = window.devicePixelRatio || 1, W = cv.clientWidth * dpr, H = cv.clientHeight * dpr; cv.width = W; cv.height = H;
          const g = cv.getContext("2d"); const fr = frames.slice(-160), pk = Math.max(...fr, 0.05);
          g.clearRect(0, 0, W, H); g.beginPath(); g.strokeStyle = "#f0a05a"; g.lineWidth = 2 * dpr;
          fr.forEach((v, i) => { const x = i / 160 * W, y = H - (v / pk) * (H - 4 * dpr) - 2 * dpr; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
        if (rms > 0.04) { lastLoud = Date.now(); everLoud = true; }   // speech floor (above room noise)
        const t = Date.now() - recRef.current.t0;
        if ((everLoud && Date.now() - lastLoud > 700) || t > 3500) stop();
      }, 20);
      recRef.current = { stream, ac, iv, frames, sr, heardAlts, t0: Date.now() };
      setState("rec");
    } catch (e) { setState("error"); }
  };
  const stop = () => {
    const r = recRef.current; if (!r) return;
    const frames = r.frames.slice(); const alts = r.heardAlts.slice();
    cleanup();
    const g = grade(frames, alts);
    setScore((sc) => { const n = sc.slice(); n[p] += g.pts; return n; });
    setRes(g); setState("idle"); setPhase("result");
    setTimeout(() => {   // the result envelope, same visual as Stress check
      const cv = envCanvas.current; if (!cv || !g.sm) return;
      const dpr = window.devicePixelRatio || 1, W = cv.clientWidth * dpr, H = cv.clientHeight * dpr; cv.width = W; cv.height = H;
      const gg = cv.getContext("2d"); gg.clearRect(0, 0, W, H);
      const pk = Math.max(...g.sm, 1e-6), n = g.sm.length, labels = g.countOk ? g.syls : (g.segs || []).map((_, i) => String(i + 1));
      (g.segs || []).forEach((sg, k) => {
        gg.fillStyle = k === g.detected ? "rgba(31,184,159,.22)" : "rgba(122,158,172,.15)";
        gg.fillRect(sg.a / n * W, 0, (sg.b - sg.a + 1) / n * W, H);
        if (labels[k]) { gg.fillStyle = k === g.detected ? "#1fb89f" : "#7a9eac"; gg.font = `bold ${11 * dpr}px ui-monospace,monospace`; gg.textAlign = "center"; gg.fillText(labels[k], (sg.a + sg.b + 1) / 2 / n * W, 12 * dpr); }
      });
      gg.beginPath(); gg.strokeStyle = "#f0a05a"; gg.lineWidth = 2 * dpr;
      g.sm.forEach((v, i) => { const x = i / n * W, y = H - (v / pk) * (H - 4 * dpr) - 2 * dpr; i ? gg.lineTo(x, y) : gg.moveTo(x, y); }); gg.stroke();
    }, 40);
  };
  // hands-free: open the mic once any (requested) coach audio is quiet
  useEffect(() => {
    if (phase !== "turn" || state !== "idle" || !item) return;
    let live = true; const t0 = Date.now();
    const iv = setInterval(() => {
      const talking = typeof speechSynthesis !== "undefined" && speechSynthesis.speaking;
      if (!talking || Date.now() - t0 > 8000) { clearInterval(iv); setTimeout(() => { if (live) start(); }, 250); }
    }, 120);
    return () => { live = false; clearInterval(iv); };
  }, [phase, state, turn]);

  const VCOLOR = { correct: "var(--jade)", almost: "var(--sun)", missed: "var(--coral)", unsure: "var(--ink-soft)" };
  const scoreboard = (
    <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "6px 0 14px" }}>
      {players.map((pl, i) => (
        <div key={i} style={{ flex: "0 0 130px", textAlign: "center", padding: "8px 10px", borderRadius: 12, border: "1.5px solid " + (phase !== "over" && i === p ? "var(--tide)" : "var(--sand-deep)"), background: phase !== "over" && i === p ? "rgba(46,160,180,.10)" : "var(--foam)" }}>
          <div style={{ fontSize: 22 }}>{pl.flag}</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{score[i]}</div>
          <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>{pl.lang}</div>
        </div>
      ))}
    </div>
  );

  if (phase === "setup") return (
    <div className="ws-page">
      <TopBar title="Accent Duel" onBack={() => { cleanup(); setView("home"); }} />
      <div style={{ textAlign: "center", padding: "10px 18px" }}>
        <div style={{ fontSize: 44 }}>🎤⚔️</div>
        <h2 style={{ margin: "6px 0" }}>Accent Duel</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
          Pass the phone back and forth. One player says a <b>Waray</b> word that trips up Americans; the other says an <b>English</b> word Filipinos often shift — each graded in its own accent. Score = stress + whether the phone heard the right word. {ROUNDS} rounds each; highest total wins.
        </p>
        <button className="ws-cta ws-cta-primary" style={{ maxWidth: 260, margin: "18px auto 0" }} onClick={() => { setPhase("turn"); setState("idle"); }}>
          <div className="ws-cta-t">Start · 🇺🇸 Waray first</div>
        </button>
      </div>
    </div>
  );

  if (phase === "over") {
    const win = score[0] === score[1] ? null : score[0] > score[1] ? 0 : 1;
    return (
      <div className="ws-page">
        <TopBar title="Accent Duel" onBack={() => { cleanup(); setView("home"); }} />
        <div style={{ textAlign: "center", padding: "10px 18px" }}>
          <div style={{ fontSize: 46 }}>{win === null ? "🤝" : "🏆"}</div>
          <h2 style={{ margin: "6px 0" }}>{win === null ? "It's a tie!" : `${players[win].flag} wins!`}</h2>
          {scoreboard}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
            <button className="ws-opt" style={{ padding: "10px 18px" }} onClick={() => { setTurn(0); setScore([0, 0]); setRes(null); setPhase("turn"); setState("idle"); }}>rematch</button>
            <button className="ws-opt" style={{ padding: "10px 18px" }} onClick={() => setView("home")}>done</button>
          </div>
        </div>
      </div>
    );
  }

  // turn / result share the word card
  return (
    <div className="ws-page">
      <TopBar title={`Accent Duel · round ${roundNo}/${ROUNDS}`} onBack={() => { cleanup(); setView("home"); }} />
      <div style={{ textAlign: "center", padding: "6px 16px" }}>
        {scoreboard}
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}><span style={{ fontSize: 18 }}>{players[p].flag}</span> · say this <b style={{ color: "var(--ink)" }}>{players[p].lang}</b> word</div>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 38, fontWeight: 600, margin: "6px 0 2px", cursor: "pointer" }}
          onClick={() => { if (recRef.current) { cleanup(); setState("idle"); } if (item.card) playCard(item.card); else speakEnglish(item.word); }} title="Tap to hear">
          {item.word} <span style={{ fontSize: 18 }}>🔊</span>
        </div>
        <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 14, color: "var(--sea)" }}>/ {item.guide} /</div>

        {phase === "turn" && (
          <>
            <button onClick={state === "rec" ? stop : start}
              style={{ marginTop: 18, width: 84, height: 84, borderRadius: "50%", border: "3px solid " + (state === "rec" ? "var(--coral)" : "var(--tide)"), background: state === "rec" ? "rgba(240,122,102,.15)" : "var(--foam)", fontSize: 30, cursor: "pointer" }}>
              {state === "rec" ? "◼" : "🎤"}
            </button>
            <div style={{ height: 40, maxWidth: 300, margin: "8px auto 0" }}>
              {state === "rec" && <canvas ref={liveCanvas} style={{ width: "100%", height: 40 }} />}
            </div>
            <div style={{ fontSize: 12.5, color: state === "rec" ? "var(--coral)" : "var(--ink-soft)", marginTop: 2, fontWeight: state === "rec" ? 700 : 400 }}>
              {state === "rec" ? "● listening — say it, then pause" : state === "error" ? "mic unavailable — allow microphone access" : "getting the mic ready…"}
            </div>
          </>
        )}

        {phase === "result" && res && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: res.pts >= 80 ? "var(--jade)" : res.pts >= 50 ? "var(--sun)" : "var(--coral)" }}>+{res.pts}</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
              {res.syls.map((x, i) => (
                <span key={i} style={{ fontFamily: "ui-monospace,monospace", fontSize: 13, padding: "2px 8px", borderRadius: 7, background: "var(--foam)", border: "1.5px solid " + VCOLOR[res.verdicts[i] || "unsure"], color: VCOLOR[res.verdicts[i] || "unsure"], fontWeight: i === expected ? 800 : 400 }}>{x}</span>
              ))}
            </div>
            <div style={{ maxWidth: 320, margin: "10px auto 0", background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 10, padding: "6px 8px 2px" }}>
              <canvas ref={envCanvas} style={{ width: "100%", height: 56 }} />
              <div style={{ fontSize: 10.5, color: "var(--ink-soft)", padding: "2px 0 4px" }}>your loudness — shaded = syllables heard, green = loudest</div>
            </div>
            <div style={{ fontSize: 13, marginTop: 8, color: res.matched && res.stressV === "correct" ? "var(--jade)" : res.matched ? "var(--sun)" : "var(--coral)" }}>
              {res.noSpeech ? "⚠ mostly background noise — try in a quieter spot"
                : !res.verified ? "⚠ phone heard nothing — try again"
                : !res.matched ? `✗ phone heard “${res.heardTop}” — not “${item.word}”`
                : res.stressV === "correct" ? `✓ nailed it — right word, stress on ${syls[expected]}`
                : `heard the word, but stress the ${syls[expected]} syllable — you leaned on ${syls[res.detected] || "another"}`}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
              <button className="ws-opt" style={{ padding: "9px 14px" }} onClick={() => { if (item.card) playCard(item.card); else speakEnglish(item.word); }}>🔊 hear it</button>
              <button className="ws-opt" style={{ padding: "9px 14px" }} onClick={() => { setRes(null); setPhase("turn"); setState("idle"); setScore((sc) => { const n = sc.slice(); n[p] -= res.pts; return n; }); }}>retry</button>
              <button className="ws-opt ws-cta-primary" style={{ padding: "9px 18px", color: "#fff" }} onClick={() => {
                if (turn + 1 >= ROUNDS * 2) { setPhase("over"); } else { setTurn((t) => t + 1); setRes(null); setPhase("turn"); setState("idle"); }
              }}>{turn + 1 >= ROUNDS * 2 ? "see winner →" : `pass to ${players[(p + 1) % 2].flag} →`}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StressLabView({ ctx }) {
  const { cards, setView, playCard } = ctx;
  const pool = useMemo(() => practicePool(cards, "sulog:practiced"), [cards]);
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState("idle");     // idle | rec | result | error
  const [res, setRes] = useState(null);
  const recRef = useRef(null);
  const liveCanvas = useRef(null);
  const envCanvas = useRef(null);
  const card = pool[idx % (pool.length || 1)];
  const syls = card ? card.say.split("-") : [];
  const wordSyls = card ? syllabifyWaray(card.waray) : [];
  const expected = syls.findIndex((x) => /[A-Z]/.test(x));
  useEffect(() => { if (card) markPracticed(card.id, "sulog:practiced"); }, [card && card.id]);

  const cleanup = () => { const r = recRef.current; if (!r) return; clearInterval(r.iv); try { r.mr?.stop(); } catch (e) {} try { r.stream.getTracks().forEach((t) => t.stop()); r.ac.close(); } catch (e) {} recRef.current = null; };
  useEffect(() => cleanup, []);
  if (!card) return <div className="ws-page"><TopBar title="Stress check" onBack={() => setView("home")} /><p style={{ padding: 20 }}>No words with guides yet.</p></div>;

  const analyze = (frames) => analyzeStress(frames, syls.length, expected);
  const drawEnv = (cv, sm, segs, detected, labels) => {
    if (!cv) return; const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth * dpr, H = cv.clientHeight * dpr; cv.width = W; cv.height = H;
    const g = cv.getContext("2d"); g.clearRect(0, 0, W, H);
    const peak = Math.max(...sm, 1e-6), n = sm.length;
    (segs || []).forEach((sg, k) => {
      g.fillStyle = k === detected ? "rgba(31,184,159,.22)" : "rgba(122,158,172,.15)";
      g.fillRect(sg.a / n * W, 0, (sg.b - sg.a + 1) / n * W, H);
      if (labels && labels[k]) {
        g.fillStyle = k === detected ? "#1fb89f" : "#7a9eac";
        g.font = `bold ${11 * dpr}px ui-monospace,monospace`; g.textAlign = "center";
        g.fillText(labels[k], (sg.a + sg.b + 1) / 2 / n * W, 12 * dpr);
      }
    });
    g.beginPath(); g.strokeStyle = "#f0a05a"; g.lineWidth = 2 * dpr;
    sm.forEach((v, i) => { const x = i / n * W, y = H - (v / peak) * (H - 4 * dpr) - 2 * dpr; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
  };
  const start = async () => {
    setRes(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser(); an.fftSize = 2048; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const chunks = []; let mr = null;
      try { mr = new MediaRecorder(stream); mr.ondataavailable = (e) => chunks.push(e.data); mr.start(); } catch (e) {}
      // parallel word-identity check: the Filipino recognizer is rough on Waray, but it
      // reliably tells "dada" from "blah blah" — collect every alternative it offers
      const heardAlts = []; let sr = null;
      if (SpeechRec) try {
        sr = new SpeechRec(); sr.lang = (ctx.settings?.sttLang) || "fil-PH"; sr.interimResults = true; sr.maxAlternatives = 5; sr.continuous = true;
        sr.onresult = (e) => { for (const r of e.results) for (let i = 0; i < r.length; i++) if (r[i].transcript?.trim()) heardAlts.push(r[i].transcript.trim()); };
        sr.start();
      } catch (e) { sr = null; }
      const frames = []; let lastLoud = Date.now(); let everLoud = false;
      const iv = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        frames.push(rms);
        drawEnv(liveCanvas.current, frames.slice(-160), [], -1);         // live scrolling wave
        if (rms > 0.04) { lastLoud = Date.now(); everLoud = true; }   // speech floor (above room noise)
        const t = Date.now() - recRef.current.t0;
        if ((everLoud && Date.now() - lastLoud > 700) || t > 3500) stop();
      }, 20);
      recRef.current = { stream, ac, iv, frames, mr, chunks, sr, heardAlts, t0: Date.now() };
      setState("rec");
    } catch (e) { setState("error"); }
  };
  const stop = () => {
    const r = recRef.current; if (!r) return;
    const frames = r.frames.slice(); const chunks = r.chunks; const mr = r.mr;
    const heardAlts = r.heardAlts || []; try { r.sr?.stop(); } catch (e) {}
    const finish = () => {
      const a = analyze(frames);
      // noise gate: flat/steady background (aircon, water) or near-silence isn't a word —
      // don't grade it or trust the recognizer's hallucinated transcript
      if (a.noSpeech) {
        a.said = { alts: [], ok: false, verified: false };
        a.audio = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: mr?.mimeType || "audio/webm" })) : null;
        setRes(a); setState("result");
        setTimeout(() => drawEnv(envCanvas.current, a.sm, [], -1, []), 30);
        return;
      }
      // word-identity gate: any recognizer alternative that leniently matches the word passes;
      // clear speech that matches NOTHING caps the score (it wasn't this word). No speech
      // recognized at all → can't verify, note it but don't punish (the recognizer is flaky).
      const alts = [...new Set(heardAlts)];
      const saidOk = alts.some((x) => checkAnswer(x, card.waray, true, true));
      a.said = { alts: alts.slice(-6), ok: saidOk, verified: alts.length > 0 };
      // per-syllable sound score from the best-aligned alternative; combine with stress:
      // a syllable's grade is the WORSE of how you stressed it and how it sounded
      const rank = { correct: 0, almost: 1, missed: 2, unsure: 0.5 };
      let best = null, bestSum = -1;
      for (const alt of alts) {
        const r0 = syllableSoundRatios(alt, wordSyls);
        if (r0) { const t = r0.ratios.reduce((x, y) => x + y, 0); if (t > bestSum) { bestSum = t; best = r0; } }
      }
      if (best && wordSyls.length === syls.length) {
        a.sound = best.ratios; a.soundHeard = best.heard;
        const sv = best.ratios.map((r0) => r0 >= 0.8 ? "correct" : r0 >= 0.45 ? "almost" : "missed");
        a.verdicts = a.verdicts.map((v, i) => rank[sv[i]] > rank[v] ? sv[i] : v);
        const soundPct = Math.round(100 * bestSum / best.ratios.length);
        a.pct = Math.round((a.pct + soundPct) / 2);
        a.ok = a.ok && sv.every((v) => v !== "missed");
      } else if (alts.length && !saidOk) { a.pct = Math.min(a.pct, 30); a.ok = false; }
      a.audio = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: mr?.mimeType || "audio/webm" })) : null;
      setRes(a); setState("result");
      setTimeout(() => drawEnv(envCanvas.current, a.sm, a.segs, a.detected, a.countOk ? syls : a.segs.map((_, i) => String(i + 1))), 30);
    };
    if (mr && mr.state !== "inactive") { mr.onstop = finish; try { mr.requestData(); mr.stop(); } catch (e) { finish(); } cleanup0(r); }
    else { cleanup0(r); finish(); }
    recRef.current = null;
  };
  const cleanup0 = (r) => { clearInterval(r.iv); try { r.stream.getTracks().forEach((t) => t.stop()); r.ac.close(); } catch (e) {} };
  const next = () => { setIdx((i) => i + 1); setRes(null); setState("idle"); };
  // hands-free flow: the mic opens by itself on every new word / retry — but the coach
  // stays SILENT unless asked (tap the word or the coach button). If TTS is playing
  // (user requested it), wait for quiet before opening the mic so it never records the app.
  useEffect(() => {
    if (state !== "idle" || !card) return;
    let live = true;
    const t0 = Date.now();
    const iv = setInterval(() => {
      const talking = typeof speechSynthesis !== "undefined" && speechSynthesis.speaking;
      if (!talking || Date.now() - t0 > 8000) { clearInterval(iv); setTimeout(() => { if (live) start(); }, 250); }
    }, 120);
    return () => { live = false; clearInterval(iv); };
  }, [state, idx]);
  // per-syllable verdict colors, BoldVoice-style
  const VCOLOR = { correct: "var(--jade)", almost: "var(--sun)", missed: "var(--coral)", unsure: "var(--ink-soft)" };
  const VMARK = { correct: "✓", almost: "~", missed: "✗", unsure: "?" };
  const sylColor = (i) => !res ? "var(--ink)" : VCOLOR[res.verdicts?.[i] || "unsure"];
  const R = 52, C = Math.PI * R;   // gauge arc
  return (
    <div className="ws-page">
      <TopBar title="Stress check · beta" onBack={() => { cleanup(); setView("home"); }} />
      <div style={{ textAlign: "center", padding: "14px 16px" }}>
        {state === "result" && res && (
          <svg width="140" height="82" viewBox="0 0 140 82" style={{ display: "block", margin: "0 auto" }}>
            <path d="M 18 74 A 52 52 0 0 1 122 74" fill="none" stroke="var(--sand-deep)" strokeWidth="9" strokeLinecap="round" />
            <path d="M 18 74 A 52 52 0 0 1 122 74" fill="none" stroke={res.pct >= 80 ? "var(--jade)" : res.pct >= 50 ? "var(--sun)" : "var(--coral)"}
              strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * res.pct / 100} ${C}`} />
            <text x="70" y="66" textAnchor="middle" fontSize="24" fontWeight="800" fill="currentColor">{res.pct}%</text>
          </svg>
        )}
        <div style={{ fontFamily: "Georgia,serif", fontSize: 36, fontWeight: 600, cursor: "pointer", letterSpacing: ".5px" }}
          onClick={() => { if (recRef.current) { cleanup(); setState("idle"); } playCard(card); }} title="Tap to hear">
          {wordSyls.length === syls.length
            ? wordSyls.map((w, i) => <span key={i} style={{ color: sylColor(i), textDecoration: i === expected ? "underline" : "none", textUnderlineOffset: 5 }}>{w}</span>)
            : <span style={{ color: res ? sylColor(res.detected) : "var(--ink)" }}>{card.waray}</span>}
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6, flexWrap: "wrap" }}>
          {syls.map((x, i) => (
            <span key={i} style={{ fontFamily: "ui-monospace,monospace", fontSize: 13, padding: "2px 8px", borderRadius: 7, background: "var(--foam)", border: "1.5px solid " + (res && res.verdicts ? VCOLOR[res.verdicts[i]] : "var(--sand-deep)"), color: sylColor(i), fontWeight: i === expected ? 800 : 400 }}>
              {x}{res && res.verdicts && <b style={{ marginLeft: 4 }}>{VMARK[res.verdicts[i]]}</b>}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 5 }}>{card.english} · say it with the <b>{syls[expected]}</b> loud &amp; long</div>

        {state !== "result" && (
          <>
            <button onClick={state === "rec" ? stop : start}
              style={{ marginTop: 16, width: 88, height: 88, borderRadius: "50%", border: "3px solid " + (state === "rec" ? "var(--coral)" : "var(--tide)"), background: state === "rec" ? "rgba(240,122,102,.15)" : "var(--foam)", fontSize: 32, cursor: "pointer" }}>
              {state === "rec" ? "◼" : "🎤"}
            </button>
            <div style={{ height: 44, maxWidth: 320, margin: "10px auto 0" }}>
              {state === "rec" && <canvas ref={liveCanvas} style={{ width: "100%", height: 44 }} />}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              {state === "rec" ? "your turn — stops on silence" : state === "error" ? "mic unavailable — allow microphone access" : "listen…"}
            </div>
          </>
        )}

        {state === "result" && res && (
          <div style={{ marginTop: 12 }}>
            <div style={{ maxWidth: 340, margin: "0 auto", background: "var(--foam)", border: "1px solid var(--sand-deep)", borderRadius: 10, padding: "6px 8px 2px" }}>
              <canvas ref={envCanvas} style={{ width: "100%", height: 64 }} />
              <div style={{ fontSize: 10.5, color: "var(--ink-soft)", padding: "2px 0 4px" }}>your loudness over time — shaded = syllables heard, green = your loudest</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: res.ok ? "var(--jade)" : "var(--coral)" }}>
              {res.noSpeech ? "⚠ mostly background noise — try in a quieter spot" : res.ok ? "✓ stressed the right syllable" : !res.countOk ? `heard ${res.segs.length} syllable${res.segs.length === 1 ? "" : "s"}, expected ${syls.length} — your syllables blended together; try a hair slower with a tiny break between them` : `you stressed “${syls[res.detected] || "?"}” — it wants “${syls[expected]}”`}
            </div>
            {/* what the program thought you said, syllable by syllable */}
            <div style={{ maxWidth: 340, margin: "10px auto 0", textAlign: "left", fontSize: 12.5 }}>
              {res.segs.map((sg, i) => {
                const rel = Math.round(100 * (res.scores[i] || 0) / Math.max(...res.scores, 1e-9));
                const lab = res.countOk ? syls[i] : `#${i + 1}`;
                const v = res.countOk ? res.verdicts[i] : "unsure";
                const sndV = res.sound ? (res.sound[i] >= 0.8 ? "correct" : res.sound[i] >= 0.45 ? "almost" : "missed") : null;
                return (
                  <div key={i} style={{ padding: "4px 0", borderBottom: "1px dotted #24454b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "ui-monospace,monospace", width: 52, fontWeight: i === res.detected ? 800 : 400, color: VCOLOR[v] }}>{lab}</span>
                      <span style={{ width: 52, color: "var(--ink-soft)" }}>stress</span>
                      <span style={{ flex: 1, height: 9, background: "var(--sand-deep)", borderRadius: 5, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${rel}%`, background: VCOLOR[v] === "var(--ink-soft)" ? "var(--sea)" : VCOLOR[v] }} />
                      </span>
                      <span style={{ width: 78, textAlign: "right", color: "var(--ink-soft)", fontSize: 11 }}>{(sg.b - sg.a + 1) * 20}ms{i === res.detected ? " ← loudest" : ""}</span>
                    </div>
                    {res.sound && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <span style={{ width: 52 }} />
                        <span style={{ width: 52, color: "var(--ink-soft)" }}>sound</span>
                        <span style={{ flex: 1, height: 9, background: "var(--sand-deep)", borderRadius: 5, overflow: "hidden" }}>
                          <span style={{ display: "block", height: "100%", width: `${Math.round(res.sound[i] * 100)}%`, background: VCOLOR[sndV] }} />
                        </span>
                        <span style={{ width: 78, textAlign: "right", fontFamily: "ui-monospace,monospace", fontSize: 11, color: VCOLOR[sndV] }}>heard “{res.soundHeard?.[i] || "·"}”</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ color: "var(--ink-soft)", marginTop: 3 }}>the program heard {res.segs.length} syllable{res.segs.length === 1 ? "" : "s"}; stress = the loudest·longest one{res.countOk ? "" : ` (raw bursts before splitting: ${res.nRaw})`}</div>
            </div>
            {res.said && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: !res.said.verified ? "var(--ink-soft)" : res.said.ok ? "var(--jade)" : "var(--coral)" }}>
                {!res.said.verified ? "⚠ couldn't verify the word (recognizer heard nothing)"
                  : res.said.ok ? `✓ sounded like “${card.waray}”`
                  : `✗ that didn't sound like “${card.waray}” — heard “${res.said.alts[res.said.alts.length - 1] || "?"}”`}
              </div>
            )}
            <StressDebug res={res} card={card} syls={syls} expected={expected} />
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
              <button className="ws-opt" style={{ padding: "9px 14px" }} onClick={() => playCard(card)}>🔊 coach</button>
              {res.audio && <button className="ws-opt" style={{ padding: "9px 14px" }} onClick={() => new Audio(res.audio).play()}>▶ my recording</button>}
              <button className="ws-opt" style={{ padding: "9px 14px" }} onClick={() => { setRes(null); setState("idle"); }}>try again</button>
              <button className="ws-opt" style={{ padding: "9px 14px" }} onClick={next}>next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// A/B popup: the three test sentences, word by word, with a Native ↔ Override switch. Words with an
// override are highlighted; flip the switch and tap ▶ to hear the difference on the current voice.
const TTS_TEST_SENTENCES = ["Maupay nga aga", "Magluluto mga platos", "Ako po hi Paul"];
function TtsCompare({ onClose, rate, voiceLabel, admin }) {
  const [mode, setMode] = useState("override");   // "native" | "override"
  const [ov, setOv] = useState(getTtsOverrides());
  const [edit, setEdit] = useState(null);          // { word } being edited
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const play = (s) => speak({ waray: s, say: "" }, rate, mode === "override");
  const openEdit = (w) => { const k = ovKey(w); setEdit({ word: k, raw: w }); setText(ov[k] || ""); setMsg(""); };
  const tryText = () => speak({ waray: text || edit.raw, say: "" }, rate, false);  // hear the typed spelling literally
  const save = async () => {
    try {
      await saveTtsOverride(edit.word, text);
      const fresh = await fetchTtsOverrides(); setTtsOverrides(fresh); setOv(fresh);
      setMsg(text.trim() ? `Saved — "${edit.word}" now speaks "${text.trim()}".` : `Cleared — "${edit.word}" reads the raw Waray.`);
      setEdit(null);
    } catch (e) { setMsg(e.message); }
  };
  return (
    <div className="ws-ab-scrim" onClick={onClose}>
      <div className="ws-ab" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pronunciation A/B">
        <div className="ws-ab-head">
          <b>Pronunciation A/B</b>
          <button className="ws-sheet-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ws-ab-toggle">
          <button className={mode === "native" ? "on" : ""} onClick={() => setMode("native")}>Native (raw)</button>
          <button className={mode === "override" ? "on" : ""} onClick={() => setMode("override")}>Override</button>
        </div>
        {TTS_TEST_SENTENCES.map((s, si) => (
          <div key={si} className="ws-ab-row">
            <button className="ws-mini-play sq" onClick={() => play(s)} title="Hear this line"><Volume2 size={16} /></button>
            <div className="ws-ab-words">
              {s.split(/\s+/).map((w, wi) => {
                const o = ov[ovKey(w)];
                const on = mode === "override" && o;
                return (
                  <span key={wi} className={`ws-ab-word ${o ? "has-ov" : ""} ${on ? "ov-on" : ""} ${admin ? "edit" : ""}`}
                    onClick={admin ? () => openEdit(w) : undefined} title={admin ? "Tap to set how this word is spoken" : undefined}>
                    {w}{on ? <i> →{o}</i> : null}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        {admin && edit && (
          <div className="ws-ab-edit">
            <div className="ws-ab-edit-lbl">How should <b>{edit.raw}</b> be spoken?</div>
            <div className="ws-ab-edit-row">
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={`e.g. "he" — blank = read "${edit.raw}" as-is`}
                onKeyDown={(e) => e.key === "Enter" && save()} />
              <button className="ws-ab-try" onClick={tryText} title="Hear the typed spelling"><Volume2 size={14} /></button>
            </div>
            <div className="ws-ab-edit-btns">
              <button className="ws-ab-save" onClick={save}>Save</button>
              <button className="ws-ab-cancel" onClick={() => { setEdit(null); setMsg(""); }}>Cancel</button>
            </div>
          </div>
        )}
        {msg && <div className="ws-ab-msg">{msg}</div>}
        <div className="ws-ab-note">Teal words have an override. Flip the switch and tap ▶ to hear <b>native</b> vs <b>override</b> on your current voice{voiceLabel ? ` (${voiceLabel})` : ""}.{admin ? " Tap any word to set how it's spoken." : ""}</div>
      </div>
    </div>
  );
}

function PronounceView({ ctx }) {
  const { setView, settings, saveSettings } = ctx;
  const SPEEDS = [
    { k: "slow", label: "Slow", rate: 0.78 },
    { k: "normal", label: "Normal", rate: 0.95 },
    { k: "natural", label: "Natural", rate: 1.1 },
  ];
  // available system voices (populated async via onvoiceschanged)
  const [voices, setVoices] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  useEffect(() => {
    const load = () => { try { setVoices(window.speechSynthesis.getVoices() || []); } catch (e) {} };
    load();
    try { window.speechSynthesis.addEventListener("voiceschanged", load); } catch (e) {}
    return () => { try { window.speechSynthesis.removeEventListener("voiceschanged", load); } catch (e) {} };
  }, []);
  const goodVoices = voices.filter((v) => voiceRank(v) > 0);
  const hasFilipino = voices.some((v) => voiceRank(v) === 3);
  // the voice actually in use right now: your pick if set, else the auto best-match; null = the
  // browser falls back to its default (usually English). This is exactly what speak() resolves to.
  const activeVoice = settings.voiceURI
    ? (voices.find((v) => v.voiceURI === settings.voiceURI) || null)
    : (goodVoices.slice().sort((a, b) => voiceRank(b) - voiceRank(a))[0] || null);
  const activeRank = activeVoice ? voiceRank(activeVoice) : 0;
  // preview the sample phrase at a given base rate (mirrors the adaptive offset)
  // test phrase — exercises the overrides (mga→manga, hi→hee) and ordinary words in one breath
  const preview = (r) => speak({ waray: "Maupay nga aga, magluluto mga platos, ako po hi Paul", say: "" }, settings.adaptive ? r - 0.1 : r);
  // persist the chosen voice AND apply it to _voiceURI immediately, so the
  // preview uses it without waiting for the settings effect to commit
  const pickVoice = (uri) => {
    saveSettings({ ...settings, voiceURI: uri });
    _voiceURI = uri || null;
  };
  const rules = [
    ["Three vowels", "Waray has just a, i, u. In writing, o is the same sound as u, and e is the same as i — so luto and lutu, or babaye and babayi, are the same word."],
    ["a → \u201cah\u201d", "Always the open ah of \u201cfather.\u201d Never the flat a of \u201ccat.\u201d  ako = ah-KAW."],
    ["i → \u201ceh / ee\u201d", "Slides between the e of \u201cbet\u201d and the ee of \u201csee.\u201d  diri = DEE-ree."],
    ["u → \u201coh / oo\u201d", "Slides between oh and oo.  kulop = KOO-lop, oo = AW-aw."],
    ["The hyphen is a stop", "A hyphen marks a glottal stop — a clean catch in the throat, like the middle of \u201cuh-oh.\u201d  gab-i = gahb·EE, mag-aano = mag·AH·ah·no."],
    ["-ay → \u201cigh\u201d", "The ending -ay sounds like the y in \u201csky.\u201d  maupay = mah-OO-pigh, balay = bah-LIGH, sangkay = sahng-KIGH."],
    ["-aw → \u201cow\u201d", "The ending -aw sounds like \u201cnow.\u201d  ikaw = ee-KOW, sayaw = sah-YOW."],
    ["ng is one sound", "ng is a single nasal, like the end of \u201csing\u201d — even at the start of a word.  hangin = HAH-ngin."],
    ["d \u2194 r", "Between vowels, d often softens toward r. You'll hear both; don't worry about it."],
    ["Stress moves", "Stress isn't fixed and it can change meaning. Lean on the CAPS in each card's pronunciation guide, and on the reference audio."],
  ];
  const stressLabBtn = (
    <button className="ws-backup-row" onClick={() => ctx.setView("stresslab")}>
      <div className="ws-backup-ic ws-ic-tide"><Mic size={18} /></div>
      <div className="ws-backup-txt"><b>Stress check · beta</b><i>Say a word — the app checks WHICH syllable you stressed</i></div>
      <ChevronRight size={18} className="ws-cta-arrow" />
    </button>
  );
  const examples = [
    ["Maupay nga aga", "mah-OO-pigh ngah AH-gah", "Good morning"],
    ["Kumusta ka?", "koo-moos-TAH kah", "How are you?"],
    ["Salamat", "sah-LAH-mat", "Thank you"],
    ["gab-i", "gahb-EE", "evening / night"],
    ["Diri ako maaram", "DEE-ree ah-KAW mah-AH-ram", "I don't know"],
  ];
  return (
    <div className="ws-page">
      <TopBar title="How Waray sounds" onBack={() => setView("home")} />
      {showCompare && <TtsCompare onClose={() => setShowCompare(false)} rate={settings.rate} voiceLabel={activeVoice ? activeVoice.name : "browser default"} admin={ctx.admin} />}
      <div className="ws-pron-intro">
        Browsers don't speak Waray. A Filipino/Tagalog voice reads it most accurately (Tagalog spelling sounds
        almost like Waray); without one it falls back to an English voice reading a rough respelling. Best of all,
        record your teacher or yourself on any card — that becomes the voice you'll hear from then on.
      </div>

      <SectionLabel icon={<Volume2 size={14} />} text="Playback speed" />
      <div className="ws-speed">
        <div className="ws-speed-seg">
          {SPEEDS.map((s) => (
            <button key={s.k} className={Math.abs(settings.rate - s.rate) < 0.02 ? "on" : ""}
              onClick={() => { saveSettings({ ...settings, rate: s.rate }); preview(s.rate); }}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="ws-speed-slider">
          <label className="ws-speed-glabel">Speed</label>
          <input type="range" min="0.6" max="1.4" step="0.05" value={settings.rate}
            onChange={(e) => saveSettings({ ...settings, rate: parseFloat(e.target.value) })}
            onMouseUp={(e) => preview(parseFloat(e.target.value))}
            onTouchEnd={(e) => preview(parseFloat(e.target.value))}
            aria-label="Playback speed" />
          <span className="ws-speed-val">{settings.rate.toFixed(2)}×</span>
        </div>
        <div className="ws-speed-slider">
          <label className="ws-speed-glabel">Voice</label>
          <select className="ws-voice-select" value={settings.voiceURI || ""}
            onChange={(e) => { pickVoice(e.target.value); preview(settings.rate); }}
            aria-label="Speech voice">
            <option value="">Auto{goodVoices.length ? " (best match)" : ""}</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {langName(v.lang)} ({v.name}){voiceRank(v) > 0 ? " ★" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className={`ws-voice-now ${activeRank > 0 ? "ok" : "warn"}`}>
          <span>
            {activeVoice
              ? <>Now using <b>{langName(activeVoice.lang)}</b> <span className="ws-voice-lang">({activeVoice.name} · {activeVoice.lang})</span> {activeRank === 3 ? "· Filipino ✓" : activeRank > 0 ? "· close cousin ✓" : "· ⚠ not Waray-friendly — Waray will sound off"}</>
              : <>Now using <b>your browser's default voice</b> · ⚠ no Waray-friendly voice found — Waray will be spelled out or approximated</>}
          </span>
          <button className="ws-voice-test" onClick={() => setShowCompare(true)}><Volume2 size={14} /> Hear it · A/B</button>
        </div>
        <div className={`ws-voice-note ${goodVoices.length ? "good" : ""}`}>
          {hasFilipino
            ? "A Filipino voice (★) is available — it reads Waray most accurately. Pick it above."
            : goodVoices.length
            ? "No Filipino voice here, but Indonesian/Malay voices (★) are close cousins — same vowels and spelling — and read Waray far more naturally than English. Try one above (e.g. Damayanti or Amira)."
            : "No close-language voice found. A Filipino, Indonesian, or Malay voice reads Waray far better than English — on Mac add one in System Settings → Accessibility → Spoken Content → System Voice → Manage Voices."}
        </div>
        <button className={`ws-speed-adapt ${settings.adaptive ? "on" : ""}`}
          onClick={() => saveSettings({ ...settings, adaptive: !settings.adaptive })}>
          <span className="ws-speed-adapt-box">{settings.adaptive ? <Check size={13} /> : null}</span>
          <span>
            <b>Speed up as I learn</b>
            <i>New cards play slower; the better you know a card, the faster it speaks</i>
          </span>
        </button>
      </div>

      {SpeechRec && (
        <>
          <SectionLabel icon={<Mic size={14} />} text="Speak your answers (experimental)" />
          <div className="ws-stt">
            <div className="ws-stt-note">
              In the typed parts you can tap <b>Speak the answer</b> instead of typing — handy hands-free.
              Browsers have no Waray recognizer, so it listens in the closest language below and we grade
              leniently. Filipino/Tagalog is the best starting point; try the others if it mishears you.
            </div>
            <div className="ws-speed-slider">
              <label className="ws-speed-glabel">Listen as</label>
              <select className="ws-voice-select" value={settings.sttLang || "fil-PH"}
                onChange={(e) => saveSettings({ ...settings, sttLang: e.target.value })}
                aria-label="Speech recognition language">
                {[["fil-PH", "Filipino"], ["tl-PH", "Tagalog"], ["en-PH", "English (Philippines)"], ["id-ID", "Indonesian"], ["ms-MY", "Malay"]].map(([v, n]) => (
                  <option key={v} value={v}>{n} ({v})</option>
                ))}
              </select>
            </div>
            <button className={`ws-speed-adapt ${settings.sttDebug ? "on" : ""}`}
              onClick={() => saveSettings({ ...settings, sttDebug: !settings.sttDebug })}>
              <span className="ws-speed-adapt-box">{settings.sttDebug ? <Check size={13} /> : null}</span>
              <span>
                <b>Show what it heard (debug)</b>
                <i>Under each spoken answer: every guess, how it folded, and which one matched — with a copy button</i>
              </span>
            </button>
          </div>
        </>
      )}

      <SectionLabel text="Practice" />
      {stressLabBtn}

      <SectionLabel text="The rules that matter" />
      <div className="ws-rules">
        {rules.map(([t, d], i) => (
          <div key={i} className="ws-rule">
            <div className="ws-rule-t">{t}</div>
            <div className="ws-rule-d">{d}</div>
          </div>
        ))}
      </div>
      <SectionLabel text="Hear the pattern" />
      <div className="ws-pron-ex">
        {examples.map(([w, s, e], i) => (
          <button key={i} className="ws-pron-row" onClick={() => speak({ waray: w, say: s })}>
            <Volume2 size={16} />
            <div>
              <div className="ws-pron-w">{w}</div>
              <div className="ws-pron-s">/ {s} /  ·  {e}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="ws-pron-note">
        Source: Waray phonology (3-vowel system, 16 consonants, stress-based) and the Wikivoyage Waray phrasebook respelling style.
      </div>
    </div>
  );
}

/* ============================ shared bits ============================ */
function TopBar({ title, onBack, onReport }) {
  return (
    <div className="ws-topbar">
      <button className="ws-icon-btn" onClick={onBack}><ArrowLeft size={20} /></button>
      <h2>{title}</h2>
      {onReport
        ? <button className="ws-icon-btn" onClick={onReport} title="Report a problem with this page"><Flag size={18} /></button>
        : <div style={{ width: 40 }} />}
    </div>
  );
}
function SectionLabel({ icon, text }) {
  return <div className="ws-seclabel">{icon}<span>{text}</span></div>;
}
function Bar({ pct }) {
  return <div className="ws-bar"><div className="ws-bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} /></div>;
}

/* ============================ styles ============================ */
function Styles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');

:root{
  --sea-ink:#0a2226; --sea:#5fc9cf; --tide:#1cb0b8; --tide-soft:#2f8f95;
  --sun:#f4a53a; --sun-deep:#f0b968; --coral:#f07a66; --jade:#1fb89f;
  --shell:#0b1f23; --sand:#16333a; --sand-deep:#2b4f56;
  --ink:#eaf3f2; --ink-soft:#9db3b5; --foam:#102a2f;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.ws-root{font-family:'Outfit',system-ui,sans-serif;color:var(--ink);
  background:radial-gradient(135% 80% at 50% -8%, #123a3f 0%, var(--shell) 52%);
  min-height:100%;max-width:480px;margin:0 auto;position:relative;line-height:1.45}
.ws-root *::selection{background:var(--tide);color:#fff}
/* the Ella review queue gets desktop room (everything else stays phone-shaped) */
@media(min-width:900px){.ws-root[data-view="ella"],.ws-root[data-view="dbreview"]{max-width:860px}
  .ws-root[data-view="ella"] .ws-bottombar,.ws-root[data-view="dbreview"] .ws-bottombar{max-width:860px}}
.ws-load{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;min-height:60vh;color:var(--sea)}
.ws-page{padding:18px 16px 90px}

/* header */
.ws-icon-btn{width:40px;height:40px;border-radius:12px;border:1px solid var(--sand-deep);
  background:var(--foam);color:var(--sea);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:.15s}
.ws-icon-btn:active{transform:scale(.94)}

/* tide hero — brand, actions, and progress band all live in the graphic */
.ws-tide{position:relative;border-radius:22px;overflow:hidden;height:210px;margin-bottom:16px;
  box-shadow:0 10px 30px -12px rgba(10,46,52,.5)}
.ws-tide-svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.ws-wave1{animation:wave 7s ease-in-out infinite alternate}
.ws-wave2{animation:wave 9s ease-in-out infinite alternate-reverse}
@keyframes wave{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
.ws-tide-overlay{position:absolute;inset:0;display:flex;flex-direction:column;
  justify-content:space-between;padding:16px 18px}
.ws-tide-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.ws-tide-brand{min-width:0}
.ws-tide-name{font-family:'Fraunces',serif;font-size:40px;line-height:.92;font-weight:600;
  margin:0;color:#fff;letter-spacing:-.01em;text-shadow:0 2px 16px rgba(0,0,0,.3)}
.ws-tide-place{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;
  color:#bfeef0;margin-top:5px;text-shadow:0 1px 8px rgba(0,0,0,.3)}
.ws-hero-btns{display:flex;flex-wrap:nowrap;flex-shrink:0;gap:4px;justify-content:flex-end}
.ws-hero-btn{width:30px;height:30px;flex-shrink:0;border-radius:9px;border:1px solid rgba(255,255,255,.22);
  background:rgba(255,255,255,.12);color:#eafafb;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:.15s;backdrop-filter:blur(3px)}
.ws-hero-btn:active{transform:scale(.92)}
.ws-hero-btn.on{background:var(--sun);border-color:var(--sun);color:#fff}
.ws-tide-band{}
.ws-tide-pct{font-family:'Fraunces',serif;font-size:30px;font-weight:600;color:#fff;
  line-height:1;text-shadow:0 2px 14px rgba(0,0,0,.25)}
.ws-tide-pct span{font-size:16px;opacity:.8}
.ws-tide-bar{width:60%;max-width:220px;height:5px;background:rgba(255,255,255,.22);
  border-radius:999px;overflow:hidden;margin:6px 0 0}
.ws-tide-bar>div{height:100%;background:#f4a53a;border-radius:999px;transition:width .6s ease}
.ws-tide-label{color:#cfeef0;font-size:11px;font-weight:500;margin-top:4px;
  text-shadow:0 1px 8px rgba(0,0,0,.3)}

/* streak chips */
.ws-streakrow{display:flex;gap:8px;margin:14px 0 18px}
.ws-chip{flex:1;background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;
  padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:1px;color:var(--ink-soft)}
.ws-chip b{font-size:19px;color:var(--ink);font-weight:700;font-family:'Fraunces',serif}
.ws-chip span{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em}
.ws-chip svg{color:var(--tide);margin-bottom:2px}
.ws-chip-flame svg{color:var(--sun-deep)}

/* 14-day tracker */
.ws-tracker{background:var(--foam);border:1px solid var(--sand-deep);border-radius:16px;
  padding:13px 14px 11px;margin-bottom:18px}
.ws-tracker-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:11px}
.ws-tracker-title{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-soft);font-weight:600}
.ws-tracker-streak{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:var(--sun-deep)}
.ws-tracker-grid{display:flex;gap:4px}
.ws-day{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}
.ws-day-cell{width:100%;aspect-ratio:1;border-radius:5px;background:var(--sand)}
.ws-day-cell.lv1{background:#cdeae8}
.ws-day-cell.lv2{background:var(--tide-soft)}
.ws-day-cell.lv3{background:var(--tide)}
.ws-day.today .ws-day-cell{box-shadow:0 0 0 2px var(--sun-deep)}
.ws-day-lbl{font-size:9px;color:var(--sand-deep);font-weight:600}

/* home "Units" tiles (mastery boxes, tap to review) */
.ws-units{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
.ws-unit-tile{display:block;width:100%;text-align:left;padding:14px;border-radius:16px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;font-family:inherit;transition:.15s}
.ws-unit-tile:active{transform:scale(.99)}
.ws-unit-tile-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.ws-unit-tile-name{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:var(--sea)}
.ws-unit-tile-meta{display:inline-flex;align-items:center;gap:2px;flex-shrink:0;font-size:12px;font-weight:700;
  color:var(--tide);font-variant-numeric:tabular-nums}
.ws-unit-tile-sub{font-size:11.5px;color:var(--ink-soft);margin:2px 0 2px}
.ws-unit-tile.locked{opacity:.6;cursor:not-allowed;background:transparent;border-style:dashed}
.ws-unit-tile.locked .ws-unit-tile-name{color:var(--ink-soft)}
.ws-unit-tile.locked .ws-unit-tile-meta{color:var(--sand-deep)}
.ws-phase-summary{margin:0 0 12px}
.ws-phase-bar{height:6px;border-radius:4px;background:var(--sand);overflow:hidden;margin-top:9px}
.ws-phase-bar span{display:block;height:100%;background:var(--tide);border-radius:4px;transition:width .2s}

/* learn path */
.ws-learn{padding-bottom:30px}
.ws-section{margin-bottom:26px}
.ws-section-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
  border-bottom:2px solid var(--sand-deep);padding-bottom:6px;margin-bottom:14px}
.ws-section-name{font-family:'Fraunces',serif;font-size:22px;font-weight:600;color:var(--sea)}
.ws-section-prog{flex-shrink:0;font-size:12px;font-weight:700;color:var(--tide);font-variant-numeric:tabular-nums}
.ws-section-hint{font-size:12px;color:var(--ink-soft)}
.ws-unit{margin-bottom:22px}
.ws-unit-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.ws-unit-name{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:var(--ink)}
.ws-unit-hint{font-size:12px;color:var(--ink-soft);margin-top:1px}
.ws-unit-prog{flex-shrink:0;font-size:11px;font-weight:700;color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam));
  border-radius:20px;padding:4px 9px;font-variant-numeric:tabular-nums}
.ws-lessons{display:flex;flex-direction:column;gap:8px}
.ws-lblock{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--tide);
  margin:6px 2px 0;opacity:.85}
.ws-lnode{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 13px;
  border-radius:14px;border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;
  font-family:inherit;transition:.15s}
.ws-lnode.cur{border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam))}
.ws-lnode.done{border-color:var(--jade)}
.ws-lnode.locked{opacity:.5;cursor:not-allowed}
.ws-lnode-ring{flex-shrink:0;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:11px;font-weight:700;color:var(--sea);
  background:conic-gradient(var(--tide) calc(var(--p)*1%), var(--sand) 0)}
.ws-lnode-ring span{background:var(--foam);width:30px;height:30px;border-radius:50%;display:flex;
  align-items:center;justify-content:center}
.ws-lnode.done .ws-lnode-ring{background:var(--jade);color:#fff}
.ws-lnode-body{flex:1;min-width:0}
.ws-lnode-title{font-size:14.5px;font-weight:600;color:var(--ink)}
.ws-lnode-sub{font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.ws-lnode-arr{color:var(--sand-deep);flex-shrink:0}
.ws-lnode.ws-review{margin-top:7px;border-style:dashed;border-color:var(--tide);background:color-mix(in srgb, var(--tide) 12%, var(--foam))}
.ws-lnode.ws-review .ws-lnode-ring{background:var(--sun);color:#fff}
.ws-lnode.ws-review.done{border-style:solid}
.ws-lnode.ws-review.done .ws-lnode-ring{background:var(--jade)}
.ws-lnode.ws-gate{margin:1px 0 4px 22px;border-color:var(--sun);background:color-mix(in srgb, var(--sun) 15%, var(--foam))}
.ws-lnode.ws-gate .ws-lnode-ring{background:color-mix(in srgb, var(--sun) 15%, var(--foam));border:1px solid var(--sun)}
.ws-lnode.ws-gate .ws-lnode-title{color:var(--sun-deep)}
.ws-lnode.ws-gate.done{border-color:var(--jade)}
.ws-lnode.ws-gate.done .ws-lnode-ring{background:var(--jade);color:#fff;border:0}
.ws-lnode.ws-story{margin-top:7px;border-style:dashed;border-color:var(--sun);background:color-mix(in srgb, var(--sun) 10%, var(--foam))}
.ws-lnode.ws-story .ws-lnode-ring{background:var(--sun);color:#fff}
.ws-lnode.ws-story.done{border-style:solid;border-color:var(--jade)}
.ws-lnode.ws-story.done .ws-lnode-ring{background:var(--jade)}
/* unit-capstone story */
.ws-story-body{display:flex;flex-direction:column;gap:8px;margin:6px 0 4px}
.ws-story-line{padding:11px 13px;border-radius:13px;border:1px solid var(--sand-deep);
  background:var(--foam);cursor:pointer}
.ws-story-war{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--sea);
  display:flex;align-items:center;gap:7px;line-height:1.35}
.ws-story-play{color:var(--tide);flex-shrink:0;opacity:.7}
.ws-story-en{font-size:13.5px;color:var(--ink-soft);margin-top:3px;line-height:1.35}
.ws-unit-mastered{display:inline-flex;align-items:center;gap:3px;margin-left:8px;font-size:10.5px;font-weight:700;
  color:var(--jade);vertical-align:middle}

/* lesson screen */
.ws-lesson-title{font-family:'Fraunces',serif;font-size:23px;font-weight:600;color:var(--ink);margin:4px 0 4px}
.ws-teach{background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;padding:14px 16px;margin:8px 0}
.ws-teach-title{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--sea);margin:0 0 6px}
.ws-teach p{margin:6px 0;font-size:14.5px;line-height:1.55;color:var(--ink)}
.ws-teach table{border-collapse:collapse;margin:8px 0;font-size:13px}
.ws-teach td{border:1px solid var(--sand-deep);padding:4px 9px;color:var(--ink)}
.ws-teach-formula{font-family:ui-monospace,monospace;font-size:12.5px;background:color-mix(in srgb,var(--tide) 12%,var(--foam));border:1px solid var(--sand-deep);border-radius:8px;padding:6px 9px;margin-top:8px;color:var(--ink)}
.ws-lwords{display:flex;flex-direction:column;gap:7px;margin-bottom:8px}
.ws-lword{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;
  padding:10px 13px;border-radius:12px;border:1px solid var(--sand-deep);background:var(--foam);
  cursor:pointer;font-family:inherit}
.ws-lword-w{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--sea)}
.ws-lword-say{font-size:11px;color:var(--tide);margin-top:1px}
.ws-lword-e{font-size:13px;color:var(--ink-soft);text-align:right;flex-shrink:0}
.ws-parts{display:flex;flex-direction:column;gap:8px;padding-bottom:30px}
.ws-part{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 13px;
  border-radius:14px;border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;
  font-family:inherit;transition:.15s}
.ws-part.cur{border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam))}
.ws-part.done{border-color:var(--jade)}
.ws-part:disabled{opacity:.45;cursor:not-allowed}
.ws-part-num{flex-shrink:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-weight:700;font-size:14px;color:#fff;background:var(--sand-deep)}
.ws-part.cur .ws-part-num{background:var(--tide)}
.ws-part.done .ws-part-num{background:var(--jade)}
.ws-part-body{flex:1;min-width:0}
.ws-part-label{font-size:14.5px;font-weight:600;color:var(--ink)}
.ws-part-hint{font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.ws-part-cta{flex-shrink:0;font-size:12px;font-weight:700;color:var(--tide)}

/* CTAs */
.ws-cta-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
.ws-cta{display:flex;align-items:center;gap:13px;padding:15px 16px;border-radius:16px;
  border:1px solid var(--sand-deep);background:var(--foam);color:var(--ink);cursor:pointer;text-align:left;
  transition:.15s;width:100%}
.ws-cta:active{transform:scale(.99)}
.ws-cta-primary{background:linear-gradient(140deg,color-mix(in srgb,var(--tide) 52%,#081b1f) 0%,color-mix(in srgb,var(--tide) 26%,#081b1f) 100%);
  border:1px solid color-mix(in srgb,var(--tide) 42%,transparent);color:#fff}
.ws-cta-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;
  justify-content:center;background:var(--sand);color:var(--sea);flex-shrink:0}
.ws-cta-primary .ws-cta-ic{background:rgba(255,255,255,.2);color:#fff}
.ws-ic-tide{background:color-mix(in srgb,var(--tide) 22%,var(--foam));color:var(--tide)}
.ws-ic-coral{background:color-mix(in srgb,var(--coral) 22%,var(--foam));color:var(--coral)}
.ws-ic-jade{background:color-mix(in srgb,var(--jade) 22%,var(--foam));color:var(--jade)}
/* Read tab — story list */
.ws-read-list{display:flex;flex-direction:column;gap:9px}
.ws-read-card{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;
  background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;padding:13px 15px}
.ws-read-card-main{flex:1;min-width:0}
.ws-read-card-title{font-size:15px;font-weight:650;color:var(--ink)}
.ws-read-done{color:var(--jade);vertical-align:-2px;margin-right:5px}
.ws-read-card-sub{font-size:12px;color:var(--ink-soft);margin-top:2px}
.ws-read-badge{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-width:58px;padding:6px 8px;border-radius:11px;line-height:1.1}
.ws-read-badge b{font-size:15px}
.ws-read-badge span{font-size:10px;opacity:.85}
.ws-read-badge.ok{background:#e0f3ea;color:#2f7a57}
.ws-read-badge.mid{background:#fdf0db;color:var(--sun-deep)}
.ws-read-badge.hard{background:#fae3de;color:var(--coral)}
/* Read tab — reader */
.ws-read-meta{font-size:12.5px;color:var(--ink-soft);margin:-6px 0 14px}
.ws-read-hint{color:var(--tide)}
.ws-read-body{font-size:18px;line-height:1.85;color:var(--ink)}
.ws-read-p{margin:0 0 15px}
.ws-rw{cursor:pointer;border-radius:4px;padding:0 1px}
.ws-rw:active{background:var(--sand)}
.ws-rw.new{text-decoration:underline;text-decoration-color:var(--sun);text-decoration-thickness:2px;text-underline-offset:3px}
.ws-rw.chunk{text-decoration:underline;text-decoration-style:dotted;text-decoration-color:var(--tide);text-decoration-thickness:2px;text-underline-offset:3px}
.ws-read-play{vertical-align:middle;margin-left:5px;border:none;background:var(--foam);color:var(--tide);
  cursor:pointer;opacity:.55;padding:2px}
.ws-read-credit{margin-top:20px;font-size:11.5px;color:var(--ink-soft);border-top:1px solid var(--sand);padding-top:12px}
/* Read tab — comprehension quiz */
.ws-quiz{margin-top:24px;border-top:1px solid var(--sand);padding-top:16px}
.ws-quiz-q{margin-bottom:18px}
.ws-quiz-prompt{font-weight:600;font-size:14.5px;color:var(--ink);margin-bottom:9px}
.ws-quiz-opt{display:block;width:100%;text-align:left;margin-bottom:7px;padding:11px 13px;border-radius:11px;
  border:1.5px solid var(--sand-deep);background:var(--foam);color:var(--ink);font-size:14px;cursor:pointer;transition:.12s}
.ws-quiz-opt:disabled{cursor:default}
.ws-quiz-opt.correct{border-color:var(--jade);background:#e0f3ea;color:#2f7a57;font-weight:600}
.ws-quiz-opt.incorrect{border-color:var(--coral);background:#fae3de;color:var(--coral)}
.ws-gloss-bar{position:fixed;left:12px;right:12px;bottom:14px;max-width:600px;margin:0 auto;z-index:40;
  display:flex;align-items:center;gap:10px;background:var(--sea-ink);color:#fff;border-radius:14px;
  padding:12px 15px;box-shadow:0 6px 24px rgba(0,0,0,.25);cursor:pointer}
.ws-gloss-bar b{font-size:16px;flex:0 0 auto}
.ws-gloss-bar span{flex:1;font-size:13.5px;opacity:.9}
.ws-gloss-bar .ws-skip{background:rgba(255,255,255,.15);color:#fff;border:none;border-radius:8px;padding:4px 9px}
.ws-cta-t{font-weight:600;font-size:15.5px}
.ws-cta-d{font-size:12.5px;opacity:.78;margin-top:1px}
.ws-cta-sub{font-size:11.5px;opacity:.6;margin-top:1px}
.ws-cta-arrow{margin-left:auto;opacity:.5;flex-shrink:0}
.ws-cta-primary .ws-cta-arrow{opacity:.85}
.ws-badge{display:inline-block;background:var(--coral);color:#fff;font-size:11px;font-weight:700;
  border-radius:9px;padding:1px 7px;margin-left:5px;vertical-align:middle}

/* section label */
.ws-seclabel{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:var(--sea);margin:6px 0 11px}
.ws-seclabel svg{color:var(--tide)}

/* decks */
.ws-decks{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
.ws-deck{background:var(--foam);border:1px solid var(--sand-deep);border-radius:16px;
  padding:14px 15px;cursor:pointer;text-align:left;transition:.15s}
.ws-deck:active{transform:scale(.99)}
.ws-deck-top{display:flex;justify-content:space-between;align-items:center}
.ws-deck-name{font-family:'Fraunces',serif;font-weight:600;font-size:16px;color:var(--ink)}
.ws-deck-count{font-size:12px;color:var(--ink-soft);background:var(--sand);border-radius:20px;
  padding:2px 9px;font-weight:600}
.ws-deck-hint{font-size:12px;color:var(--ink-soft);margin:2px 0 9px}
.ws-deck-foot{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-soft);
  margin-top:7px;font-weight:500}
.ws-due-dot{color:var(--sun-deep);font-weight:600}

.ws-bar{height:7px;background:var(--sand);border-radius:20px;overflow:hidden}
.ws-bar-fill{height:100%;background:linear-gradient(90deg,var(--tide),var(--jade));
  border-radius:20px;transition:width .6s cubic-bezier(.2,.8,.2,1)}

/* distribution */
.ws-dist{margin-bottom:16px}
.ws-dist-bar{display:flex;height:13px;border-radius:20px;overflow:hidden;background:var(--sand)}
.ws-seg{transition:width .6s}
.ws-seg-m{background:var(--jade)} .ws-seg-l{background:var(--tide-soft)} .ws-seg-x{background:var(--coral)} .ws-seg-f{background:var(--sand-deep)}
.ws-dist-legend{display:flex;gap:14px;margin-top:9px;font-size:11.5px;color:var(--ink-soft);flex-wrap:wrap}
.ws-dist-legend span{display:flex;align-items:center;gap:5px}
.ws-dot{width:9px;height:9px;border-radius:3px;display:inline-block}
.ws-dot-m{background:var(--jade)} .ws-dot-l{background:var(--tide-soft)} .ws-dot-x{background:var(--coral)} .ws-dot-f{background:var(--sand-deep)}

/* constellation */
.ws-constel{display:grid;grid-template-columns:repeat(auto-fill,minmax(13px,1fr));gap:4px;margin-top:4px}
.ws-cell{aspect-ratio:1;border-radius:3px;transition:.3s}
.ws-cell-f{background:var(--sand-deep);opacity:.5}
.ws-cell-l1{background:var(--coral);opacity:.65}
.ws-cell-l3{background:var(--tide-soft)}
.ws-cell-m{background:var(--jade)}

/* bottom bar */
.ws-build{text-align:center;font-size:10.5px;color:var(--sand-deep);letter-spacing:.04em;
  font-variant-numeric:tabular-nums;margin:18px 0 84px}
.ws-bottombar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;
  background:rgba(9,24,28,.92);backdrop-filter:blur(10px);border-top:1px solid var(--sand-deep);
  display:flex;padding:8px 0 10px;z-index:20}
.ws-bb{flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;
  font-size:10.5px;color:var(--ink-soft);cursor:pointer;font-weight:500;font-family:inherit}
.ws-bb.active{color:var(--sea)}
.ws-bb.active svg{color:var(--tide)}
/* overflow menu opened from the bottom bar's ☰ */
/* ☰ side drawer — slides in from the right, X sits where the hamburger is */
.ws-drawer-scrim{position:fixed;inset:0;background:rgba(3,14,17,.5);z-index:40;opacity:0;pointer-events:none;transition:opacity .26s ease}
.ws-drawer-scrim.open{opacity:1;pointer-events:auto}
.ws-drawer{position:fixed;top:0;right:0;height:100%;width:min(86vw,340px);z-index:41;
  background:rgba(9,24,28,.99);backdrop-filter:blur(10px);border-left:1px solid var(--sand-deep);box-shadow:-16px 0 44px rgba(0,0,0,.5);
  transform:translateX(100%);transition:transform .28s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.ws-drawer.open{transform:translateX(0)}
@media(prefers-reduced-motion:reduce){.ws-drawer,.ws-drawer-scrim{transition:none}}
.ws-drawer[aria-hidden="true"]{pointer-events:none}
.ws-drawer-body{height:100%;overflow-y:auto;padding:8px 8px 24px}
.ws-drawer-x{position:absolute;top:12px;right:11px;width:34px;height:34px;border-radius:9px;z-index:2;
  border:1px solid var(--sand-deep);background:var(--foam);color:var(--ink);display:grid;place-items:center;cursor:pointer}
/* instructor dashboard */
.ws-dash-summary{display:flex;gap:10px;margin:2px 0 8px}
.ws-dash-stat{flex:1;background:var(--foam);border:1px solid var(--sand-deep);border-radius:12px;padding:12px 10px;text-align:center}
.ws-dash-stat b{display:block;font-family:'Fraunces',Georgia,serif;font-size:22px;color:var(--ink);font-variant-numeric:tabular-nums}
.ws-dash-stat span{font-size:11px;color:var(--ink-soft)}
.ws-dash-row{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--sand)}
.ws-dash-name{flex:1;min-width:0}
.ws-dash-name b{font-size:14px;font-weight:600;display:block}
.ws-dash-name i{font-size:11px;color:var(--ink-dim);font-style:normal}
.ws-dash-bar{width:64px;height:6px;border-radius:4px;background:var(--sand);overflow:hidden;flex:none}
.ws-dash-bar span{display:block;height:100%;background:var(--tide);border-radius:4px}
.ws-dash-score{width:44px;text-align:right;font-size:13px;font-weight:700;color:var(--sea);font-variant-numeric:tabular-nums;flex:none}
.ws-menu-top{display:flex;align-items:center;justify-content:space-between;padding:6px 12px 8px;border-bottom:1px solid var(--sand-deep);margin-bottom:4px}
.ws-menu-top b{font-family:'Fraunces',Georgia,serif;font-size:16px;color:var(--ink)}
.ws-menu-close{background:none;border:none;color:var(--ink-soft);cursor:pointer;padding:4px;display:flex}
.ws-menu-row{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:none;
  color:var(--ink);font-family:inherit;padding:11px 12px;border-radius:11px;cursor:pointer}
.ws-menu-row:hover{background:var(--sand)}
.ws-menu-ic{font-size:19px;width:26px;text-align:center;flex:none}
.ws-menu-tt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.ws-menu-tt b{font-size:14px;font-weight:600}
.ws-menu-tt i{font-size:11.5px;color:var(--ink-soft);font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ws-menu-badge{font-size:10px;font-weight:700;letter-spacing:.02em;color:var(--tide);background:var(--sand);border:1px solid var(--sand-deep);border-radius:20px;padding:2px 8px;flex:none}
.ws-menu-chev{color:var(--ink-dim);flex:none}
.ws-menu-acct .ws-menu-row{padding-bottom:5px}
.ws-menu-pills{display:flex;gap:6px;padding:0 12px 8px 50px;flex-wrap:wrap}
.ws-role-pill{display:inline-block;font-size:11.5px;font-weight:700;border-radius:999px;padding:4px 11px;font-family:inherit;
  border:1px solid var(--sand-deep);background:transparent;color:var(--ink-soft);opacity:.5}
.ws-role-pill.held{border-color:var(--jade);background:rgba(31,184,159,.14);color:var(--jade);opacity:1}
.ws-role-pill.pending{border-color:var(--sun);color:var(--sun);opacity:1}
/* Progress chart — accuracy trend + mastery bar */
.ws-chart{background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;padding:14px 14px 12px;margin-bottom:14px}
.ws-chart-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}
.ws-chart-head b{font-family:'Fraunces',Georgia,serif;font-size:26px;color:var(--ink);font-variant-numeric:tabular-nums}
.ws-chart-head span{font-size:11.5px;color:var(--ink-soft);margin-left:6px}
.ws-chart-delta{font-size:12px;font-weight:700}
.ws-chart-delta.up{color:var(--jade)} .ws-chart-delta.down{color:var(--coral)}
.ws-chart-svg{display:block;width:100%;height:96px}
.ws-chart-empty{font-size:12.5px;color:var(--ink-soft);padding:14px 4px}
.ws-chart-mastery{margin-top:10px}
.ws-chart-mastery-bar{height:7px;border-radius:5px;background:var(--sand);overflow:hidden}
.ws-chart-mastery-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--sea),var(--jade));border-radius:5px}
.ws-chart-mastery-lbl{font-size:11.5px;color:var(--ink-soft);margin-top:5px}
.ws-chart-mastery-lbl b{color:var(--ink);font-variant-numeric:tabular-nums}
/* bottom-bar slide-up sheet */
.ws-sheet-scrim{position:fixed;inset:0;background:rgba(3,14,17,.6);z-index:30;display:flex;align-items:flex-end;justify-content:center;animation:fade .2s ease}
@keyframes fade{from{opacity:0}to{opacity:1}}
.ws-sheet{width:100%;max-width:480px;max-height:85vh;background:var(--foam);border-radius:18px 18px 0 0;
  box-shadow:0 -18px 44px rgba(0,0,0,.55);display:flex;flex-direction:column;animation:sheetUp .28s cubic-bezier(.2,.85,.25,1)}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.ws-sheet-scrim.closing{animation:fadeOut .24s ease forwards}
.ws-sheet.closing{animation:sheetDown .24s cubic-bezier(.3,0,.7,1) forwards}
@keyframes sheetDown{from{transform:translateY(0)}to{transform:translateY(100%)}}
@keyframes fadeOut{from{opacity:1}to{opacity:0}}
@media(prefers-reduced-motion:reduce){.ws-sheet,.ws-sheet.closing{animation:none}.ws-sheet-scrim,.ws-sheet-scrim.closing{animation:none}}
.ws-sheet-grip{width:38px;height:4px;border-radius:3px;background:var(--sand-deep);margin:9px auto 2px}
.ws-sheet-head{display:flex;align-items:center;justify-content:space-between;padding:4px 16px 10px;border-bottom:1px solid var(--sand-deep)}
.ws-sheet-head b{font-family:'Fraunces',Georgia,serif;font-size:17px;color:var(--ink)}
.ws-sheet-x{background:none;border:none;color:var(--ink-soft);cursor:pointer;padding:4px;display:flex}
.ws-sheet-body{padding:14px 16px 26px;overflow-y:auto}
.ws-dict-hint{color:var(--ink-soft);font-size:13.5px;text-align:center;margin:22px 0}
.ws-dict-hit{display:block;width:100%;text-align:left;background:var(--sand);border:1px solid var(--sand-deep);border-radius:11px;
  padding:11px 13px;margin-bottom:8px;cursor:pointer;font-family:inherit}
.ws-dict-hit-main{display:flex;align-items:baseline;gap:9px}
.ws-dict-hit-main b{font-family:'Fraunces',Georgia,serif;font-size:17px;color:var(--ink)}
.ws-dict-hit-say{font-size:11.5px;color:var(--tide);font-family:ui-monospace,monospace}
.ws-dict-hit-eng{font-size:13px;color:var(--ink-soft);margin-top:2px}
.ws-sheet-back{background:none;border:none;color:var(--sea);font-family:inherit;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:3px;padding:0 0 10px}
.ws-dict-hw{font-family:'Fraunces',Georgia,serif;font-size:30px;font-weight:600;color:var(--ink)}
.ws-dict-hw-say{font-size:14px;color:var(--tide);font-family:ui-monospace,monospace;margin-top:3px}
.ws-dict-hw-eng{font-size:16px;color:var(--ink-soft);margin-top:8px}
.ws-dict-entry-meta{display:flex;gap:7px;margin-top:12px}
.ws-dict-tag{font-size:11px;color:var(--ink-soft);background:var(--sand);border:1px solid var(--sand-deep);border-radius:20px;padding:3px 10px}
.ws-dict-entry-acts{display:flex;gap:9px;margin-top:18px}
.ws-dict-entry-acts button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;background:var(--sand);border:1px solid var(--sand-deep);
  color:var(--ink);font-family:inherit;font-size:13.5px;font-weight:600;padding:11px;border-radius:11px;cursor:pointer}
.ws-dict-entry-acts button.on{color:var(--sun-deep);border-color:var(--sun-deep)}

/* topbar */
.ws-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.ws-topbar h2{font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:var(--ink)}

/* setup */
.ws-pick-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:22px}
.ws-pick{display:flex;align-items:center;gap:8px;padding:12px 12px;border-radius:13px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;transition:.15s;text-align:left}
.ws-pick.on{border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam))}
.ws-pick-check{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--sand-deep);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
.ws-pick.on .ws-pick-check{background:var(--tide);border-color:var(--tide)}
.ws-pick-name{font-weight:600;font-size:13.5px;flex:1}
.ws-pick-n{font-size:11px;color:var(--ink-soft)}

.ws-seg-toggle{display:flex;gap:8px;margin-bottom:22px}
.ws-seg-toggle button{flex:1;padding:13px 8px;border-radius:13px;border:1.5px solid var(--sand-deep);
  background:var(--foam);cursor:pointer;font-family:inherit;font-weight:600;font-size:13px;
  color:var(--ink);transition:.15s;line-height:1.3}
.ws-seg-toggle button em{display:block;font-style:normal;font-size:10.5px;font-weight:500;
  color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;margin-top:3px}
.ws-seg-toggle button.on{border-color:var(--sea);background:var(--sea);color:#fff}
.ws-seg-toggle button.on em{color:rgba(255,255,255,.8)}

.ws-mode-list{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.ws-mode{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:13px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;transition:.15s}
.ws-mode.on{border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam))}
.ws-mode-ic{width:36px;height:36px;border-radius:10px;background:var(--sand);color:var(--sea);
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ws-mode.on .ws-mode-ic{background:var(--tide);color:#fff}
.ws-mode-txt{flex:1}
.ws-mode-txt b{display:block;font-size:14px;font-weight:600}
.ws-mode-txt i{font-style:normal;font-size:12px;color:var(--ink-soft)}
.ws-mode-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--sand-deep);flex-shrink:0;
  display:flex;align-items:center;justify-content:center}
.ws-mode.on .ws-mode-radio{border-color:var(--tide)}
.ws-radio-on{width:10px;height:10px;border-radius:50%;background:var(--tide)}

.ws-setup-foot{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;
  gap:12px;padding-top:8px}
.ws-setup-meta{font-size:12.5px;color:var(--ink-soft);font-weight:500}
.ws-start{display:flex;align-items:center;gap:6px;padding:14px 26px;border-radius:14px;border:none;
  background:linear-gradient(135deg,var(--sun),var(--sun-deep));color:#3a2410;font-weight:700;font-size:15px;
  cursor:pointer;font-family:inherit;box-shadow:0 6px 18px -8px var(--sun-deep);transition:.15s}
.ws-start:active{transform:scale(.97)}
.ws-start:disabled{opacity:.4;box-shadow:none}
.ws-full{width:100%;justify-content:center;margin-bottom:16px}

/* session */
.ws-session{padding-top:16px}
.ws-remedy{margin:-10px 0 16px;padding:9px 13px;border-radius:11px;background:color-mix(in srgb,var(--sun) 15%,var(--foam));border:1px solid var(--sun);
  color:var(--sun-deep);font-size:12.5px;font-weight:600;text-align:center}
.ws-auto-bar{height:3px;border-radius:3px;background:currentColor;opacity:.35;margin-top:11px;
  transform-origin:left;animation:wsAuto linear forwards}
@keyframes wsAuto{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.ws-skip{display:block;margin:10px auto 0;background:none;border:none;color:var(--ink-soft);font-family:inherit;
  font-size:12.5px;text-decoration:underline;cursor:pointer}
.ws-mic-stt{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:10px;
  padding:12px 14px;border-radius:13px;border:1.5px solid var(--tide);background:var(--foam);color:var(--sea);
  font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:.15s}
.ws-mic-stt.on{background:var(--coral);border-color:var(--coral);color:#fff;animation:wsPulse 1.1s ease-in-out infinite}
@keyframes wsPulse{0%,100%{opacity:1}50%{opacity:.6}}
.ws-stt{display:flex;flex-direction:column;gap:11px;margin-bottom:8px}
.ws-stt-note{font-size:12.5px;color:var(--ink-soft);line-height:1.5}
.ws-sttdbg{margin-top:12px;padding:10px 12px;border-radius:11px;background:#0a2e34;color:#cfe8e6;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.5}
.ws-sttdbg-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;
  color:#7fc6c2;font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:10px}
.ws-sttdbg-head span{display:inline-flex;align-items:center;gap:5px}
.ws-sttdbg-head button{background:#16545c;border:none;color:#dff3f1;font-family:inherit;font-size:10px;
  padding:3px 9px;border-radius:6px;cursor:pointer;text-transform:none;letter-spacing:0}
.ws-sttdbg-heard,.ws-sttdbg-exp{margin-bottom:5px;word-break:break-word}
.ws-sttdbg-heard b,.ws-sttdbg-exp b{color:#7fc6c2;font-weight:700}
.ws-sttdbg-alt{display:flex;align-items:center;gap:7px;padding:2px 0;opacity:.7}
.ws-sttdbg-alt.ok{opacity:1;color:#a9e8c4}
.ws-sttdbg-n{width:15px;height:15px;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;
  background:#16545c;border-radius:4px;font-size:9.5px}
.ws-sttdbg-raw{font-weight:600}
.ws-sttdbg-arr{color:#5a9b97}
.ws-sttdbg-dist{margin-left:auto;display:inline-flex;align-items:center;gap:3px;flex-shrink:0}
.ws-session-top{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.ws-vk{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;
  border:1px solid var(--sand-deep);background:var(--foam);color:var(--ink-soft);cursor:pointer;flex:0 0 auto}
.ws-vk.on{background:var(--tide);border-color:var(--tide);color:#fff}
.ws-drillmode{display:flex;gap:6px;justify-content:center;margin:-12px 0 18px}
.ws-drillmode button{padding:6px 18px;border-radius:999px;border:1.5px solid var(--sand-deep);
  background:var(--foam);color:var(--ink-soft);font-size:13px;font-weight:600;cursor:pointer}
.ws-drillmode button.on{border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam));color:var(--sea)}
.ws-voice{display:flex;flex-direction:column;align-items:center;gap:14px;padding:18px 0 8px}
.ws-voice-orb{display:flex;align-items:center;justify-content:center;width:96px;height:96px;border-radius:50%;
  background:var(--foam);border:2px solid var(--sand-deep);color:var(--tide);cursor:pointer;transition:all .15s}
.ws-voice-orb.speaking{border-color:#f4a53a;color:#f4a53a}
.ws-voice-orb.starting{border-color:#f4a53a;color:#f4a53a;opacity:.6}
.ws-voice-orb.listening{background:#fdf0ec;border-color:#c0432b;color:#c0432b;animation:wsPulse 1.1s ease-in-out infinite}
.ws-voice-state{font-size:14px;color:var(--ink-soft);text-align:center}
.ws-voice-heard{font-size:18px;font-weight:600;color:var(--ink);margin-top:4px}
.ws-voice-acts{display:flex;gap:10px}
.ws-vk-fixed{position:fixed;top:max(10px,env(safe-area-inset-top));right:12px;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.ws-icon-btn.vk-on{background:var(--tide);border-color:var(--tide);color:#fff}
.ws-voice.compact{padding:4px 0 12px;gap:9px}
.ws-voice.compact .ws-voice-orb{width:62px;height:62px}
.ws-voice.compact .ws-voice-state{font-size:13px}
.ws-progress-track{flex:1;height:8px;background:var(--sand);border-radius:20px;overflow:hidden}
.ws-progress-fill{height:100%;background:linear-gradient(90deg,var(--tide),var(--sun));
  border-radius:20px;transition:width .4s}
.ws-session-count{font-size:12.5px;font-weight:600;color:var(--ink-soft);min-width:38px;text-align:right}

.ws-card{background:var(--foam);border:1px solid var(--sand-deep);border-radius:22px;
  padding:22px 20px;box-shadow:0 8px 24px -16px rgba(10,46,52,.4);animation:rise .35s ease}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ws-card-tag{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--tide);
  font-weight:600;margin-bottom:18px}

.ws-prompt{text-align:center;margin-bottom:22px}
.ws-prompt-waray{font-family:'Fraunces',serif;font-size:33px;font-weight:600;color:var(--ink);
  line-height:1.15}
.ws-prompt-eng{font-family:'Fraunces',serif;font-size:27px;font-weight:500;color:var(--ink);line-height:1.2}
.ws-say{font-size:14px;color:var(--tide);font-weight:500;margin-top:7px;letter-spacing:.02em}
.ws-mini-play{display:inline-flex;align-items:center;gap:5px;margin-top:10px;background:var(--sand);
  border:none;border-radius:20px;padding:6px 13px;font-size:12.5px;color:var(--sea);font-weight:600;
  cursor:pointer;font-family:inherit;transition:.15s}
.ws-mini-play:active{transform:scale(.95)}
.ws-mini-play.sq{padding:8px;border-radius:10px;margin:0}
.ws-mini-play.rec{background:var(--coral);color:#fff;animation:pulse 1.1s infinite}

.ws-options{display:flex;flex-direction:column;gap:9px}
.ws-opt{display:flex;align-items:center;padding:15px 16px;border-radius:13px;border:1.5px solid var(--sand-deep);
  background:var(--shell);font-size:15.5px;font-weight:500;color:var(--ink);cursor:pointer;text-align:left;
  transition:.15s;font-family:inherit}
.ws-opt-key{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;margin-right:11px;
  border-radius:5px;background:var(--sand);color:var(--ink-soft);font-size:11px;font-weight:700;flex-shrink:0}
.ws-opt.correct .ws-opt-key{background:var(--jade);color:#fff}
.ws-opt.incorrect .ws-opt-key{background:var(--coral);color:#fff}
.ws-opt:active{transform:scale(.99)}
.ws-opt.correct{border-color:var(--jade);background:#e7f6ee;color:#1f6b46;font-weight:600}
.ws-opt.incorrect{border-color:var(--coral);background:#fbe7e2;color:#a33422}

.ws-listen-big{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:26px;
  border-radius:16px;border:none;background:linear-gradient(135deg,var(--sea),var(--tide));color:#fff;
  cursor:pointer;margin-bottom:20px;font-family:inherit;font-size:14px;font-weight:600}
.ws-listen-big em{font-style:normal;font-size:11px;opacity:.85;background:rgba(255,255,255,.2);
  padding:2px 9px;border-radius:12px}
.ws-listen-big:active{transform:scale(.98)}

.ws-input{width:100%;padding:15px 16px;border-radius:13px;border:1.5px solid var(--sand-deep);
  font-size:17px;font-family:'Fraunces',serif;color:var(--ink);background:var(--shell);outline:none;
  transition:.15s}
.ws-input:focus{border-color:var(--tide);background:color-mix(in srgb,var(--tide) 8%,var(--foam))}
.ws-check{width:100%;margin-top:12px;padding:14px;border-radius:13px;border:none;background:var(--sea);
  color:#fff;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit;transition:.15s}
.ws-check:active{transform:scale(.99)}
.ws-check:disabled{opacity:.4}
.ws-yourans{text-align:center;font-family:'Fraunces',serif;font-size:22px;padding:10px;border-radius:12px;
  margin-bottom:14px}
.ws-yourans.right{color:#7fe0b0;background:rgba(31,184,159,.12)}.ws-yourans.wrong{color:#ff9c8a;background:rgba(240,122,102,.10);text-decoration:line-through;opacity:.85}

.ws-reveal{width:100%;padding:15px;border-radius:13px;border:1.5px dashed var(--tide);
  background:color-mix(in srgb, var(--tide) 16%, var(--foam));color:var(--sea);font-weight:600;font-size:14.5px;cursor:pointer;font-family:inherit}
.ws-answer-reveal{text-align:center;margin-bottom:6px;animation:rise .3s ease}
.ws-answer-text{font-family:'Fraunces',serif;font-size:30px;font-weight:600;color:var(--ink)}
.ws-subtext{text-align:center;font-size:13px;color:var(--ink-soft);font-style:italic;margin:8px 0;
  background:var(--sand);padding:8px 12px;border-radius:10px}
/* a book footnote that annotates the whole section — a subtle "*" tip shown under every question in the drill */
.ws-footnote{margin-top:18px;font-size:12px;line-height:1.5;color:var(--ink-soft)}
.ws-footnote > div{margin-top:2px}

.ws-verdict{margin-top:18px;padding-top:16px;border-top:1px solid var(--sand);animation:rise .3s ease}
.ws-verdict-head{display:flex;align-items:center;gap:7px;font-weight:700;font-size:15px}
.ws-verdict.ok .ws-verdict-head{color:var(--jade)}
.ws-verdict.no .ws-verdict-head{color:var(--coral)}
.ws-verdict-answer{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0;
  font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:var(--ink)}
.ws-verdict-yousaid{text-align:center;font-size:12.5px;color:var(--ink-soft);margin:4px 0 2px}
/* in-context example on a single-word card's verdict */
.ws-verdict-eg{display:flex;flex-direction:column;align-items:center;gap:2px;width:100%;
  margin:9px 0 2px;padding:9px 12px;border:0;border-radius:11px;background:var(--foam);
  cursor:pointer;font-family:inherit}
.ws-eg-war{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--sea);
  display:inline-flex;align-items:center;gap:6px}
.ws-eg-hi{color:var(--sun-deep,#c8791b);background:rgba(244,165,58,.18);border-radius:5px;padding:0 3px}
.ws-eg-en{font-size:13px;color:var(--ink-soft)}
.ws-eg-play{color:var(--tide);opacity:.65;flex-shrink:0}
/* history */
.ws-hist-overall{text-align:center;font-size:13px;font-weight:600;color:var(--tide);margin-bottom:16px}
.ws-hist-day{margin-bottom:14px}
.ws-hist-dayhead{display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:1px solid var(--sand-deep);padding-bottom:4px;margin-bottom:6px}
.ws-hist-date{font-weight:600;font-size:13.5px;color:var(--ink)}
.ws-hist-acc{font-size:12px;font-weight:700;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.ws-hist-miss{display:flex;align-items:center;gap:6px;font-size:12.5px;padding:3px 0}
.ws-hist-prompt{font-family:'Fraunces',serif;color:var(--sea);min-width:90px}
.ws-hist-yours{color:var(--coral);text-decoration:line-through}
.ws-hist-correct{color:var(--jade);font-weight:600}
.ws-verdict-actions{display:flex;gap:10px;margin-top:14px}
.ws-next-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:13px;
  border-radius:13px;border:none;background:var(--sea);color:#fff;font-weight:600;font-size:14.5px;
  cursor:pointer;font-family:inherit}
.ws-ghost-btn{padding:13px 16px;border-radius:13px;border:1.5px solid var(--sand-deep);background:var(--foam);
  color:var(--ink-soft);font-weight:600;font-size:13.5px;cursor:pointer;font-family:inherit}

.ws-selfgrade{display:flex;gap:10px;margin-top:18px}
.ws-sg{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:15px;border-radius:13px;
  border:none;font-weight:600;font-size:14.5px;cursor:pointer;font-family:inherit;transition:.15s}
.ws-sg:active{transform:scale(.98)}
.ws-sg-no{background:#fbe7e2;color:#a33422}
.ws-sg-ok{background:#e7f6ee;color:#1f6b46}

/* speak */
.ws-speak-prompt{text-align:center;margin-bottom:20px}
.ws-speak-instr{font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.08em;
  margin-bottom:6px;font-weight:600}
.ws-speak-controls{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:18px}
.ws-rec-btn{display:flex;align-items:center;gap:9px;padding:14px 24px;border-radius:30px;border:none;
  background:var(--coral);color:#fff;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit;
  box-shadow:0 6px 18px -8px var(--coral)}
.ws-rec-btn.recording{animation:pulse 1.1s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.ws-rec-playback{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ws-mic-err{text-align:center;font-size:12.5px;color:var(--ink-soft);background:var(--sand);
  padding:10px;border-radius:10px;margin-bottom:14px}

/* done */
.ws-done{display:flex;align-items:center;justify-content:center;min-height:80vh}
.ws-done-card{text-align:center;background:var(--foam);border:1px solid var(--sand-deep);border-radius:24px;
  padding:34px 28px;width:100%;box-shadow:0 12px 30px -18px rgba(10,46,52,.5)}
.ws-done-ring{width:120px;height:120px;border-radius:50%;margin:0 auto 18px;display:flex;
  align-items:center;justify-content:center;
  background:conic-gradient(var(--jade) calc(var(--p)*1%),var(--sand) 0)}
.ws-done-ring.fail{background:conic-gradient(var(--coral) calc(var(--p)*1%),var(--sand) 0)}
.ws-passpill{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;
  padding:5px 12px;border-radius:20px;margin-bottom:12px}
.ws-passpill.ok{background:#e7f6ee;color:var(--jade)}
.ws-passpill.no{background:#fae3de;color:var(--coral)}
.ws-done-ring span{width:92px;height:92px;border-radius:50%;background:var(--foam);display:flex;
  align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:32px;font-weight:600;
  color:var(--ink)}
.ws-done-ring i{font-style:normal;font-size:16px;color:var(--ink-soft)}
.ws-done-card h2{font-family:'Fraunces',serif;font-size:26px;color:var(--ink);margin:0 0 4px}
.ws-done-sub{font-size:13.5px;color:var(--ink-soft);margin-bottom:22px}
.ws-missed{text-align:left;width:100%;background:var(--shell);border:1px solid var(--sand-deep);
  border-radius:14px;padding:10px 12px;margin-bottom:18px;max-height:260px;overflow-y:auto}
.ws-missed-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--coral);
  font-weight:700;margin-bottom:8px}
.ws-missed-row{padding:7px 0;border-top:1px solid var(--sand-deep)}
.ws-missed-row:first-of-type{border-top:none}
.ws-missed-prompt{font-family:'Fraunces',serif;font-size:14.5px;color:var(--ink)}
.ws-missed-ans{display:flex;align-items:center;gap:6px;font-size:12.5px;margin-top:2px}
.ws-missed-yours{color:var(--coral);text-decoration:line-through}
.ws-missed-arr{color:var(--sand-deep);transform:rotate(180deg);flex-shrink:0}
.ws-missed-correct{color:var(--jade);font-weight:600}
.ws-missed-said{font-size:11.5px;color:var(--ink-soft);margin-top:2px}
.ws-hist-said{color:var(--ink-soft);font-style:italic}
.ws-done-actions{display:flex;gap:10px;justify-content:center}
.ws-done-actions .ws-start{padding:13px 20px}

/* needs work */
.ws-empty{text-align:center;padding:50px 24px;color:var(--ink-soft)}
.ws-empty svg{color:var(--tide);margin-bottom:14px}
.ws-empty p{font-size:14px;line-height:1.6}
.ws-nw-list{display:flex;flex-direction:column;gap:8px}
.ws-nw{display:flex;align-items:center;gap:11px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:13px;padding:11px 13px}
.ws-nw-body{flex:1;min-width:0}
.ws-nw-waray{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--ink)}
.ws-nw-eng{font-size:12.5px;color:var(--ink-soft)}
.ws-nw-meta{display:flex;align-items:center;gap:8px}
.ws-nw-recover{display:flex;align-items:center;gap:3px}
.ws-nw-pip{width:7px;height:7px;border-radius:50%;background:var(--sand-deep);opacity:.5}
.ws-nw-pip.on{background:var(--jade);opacity:1}
.ws-nw-miss{font-size:12px;color:var(--coral);font-weight:700;background:#fbe7e2;border-radius:8px;
  padding:3px 7px}
.ws-pin{width:32px;height:32px;border-radius:9px;border:1px solid var(--sand-deep);background:var(--foam);
  color:var(--sand-deep);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s}
.ws-pin.on{color:var(--sun);border-color:var(--sun);background:#fef4e3}
.ws-pin.on svg{fill:var(--sun)}
.ws-nw-remove{width:32px;height:32px;border-radius:9px;border:1px solid var(--sand-deep);background:var(--foam);
  color:var(--ink-soft);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s}
.ws-nw-remove:hover{color:var(--coral);border-color:var(--coral)}

/* browse */
.ws-search{width:100%;padding:13px 15px;border-radius:13px;border:1.5px solid var(--sand-deep);
  font-size:14.5px;font-family:inherit;background:var(--foam);outline:none;margin-bottom:12px;color:var(--ink)}
.ws-search:focus{border-color:var(--tide)}
.ws-filter-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px}
.ws-filter-row button{flex-shrink:0;padding:8px 14px;border-radius:20px;border:1.5px solid var(--sand-deep);
  background:var(--foam);font-size:12.5px;font-weight:600;color:var(--ink-soft);cursor:pointer;font-family:inherit}
.ws-filter-row button.on{background:var(--sea);color:#fff;border-color:var(--sea)}
.ws-browse-list{display:flex;flex-direction:column;gap:7px}
.ws-brow{display:flex;align-items:center;gap:11px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:13px;padding:11px 13px}
.ws-brow-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.ws-brow-body{flex:1;min-width:0}
.ws-brow-waray{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--ink);
  display:flex;align-items:center;gap:6px}
.ws-voiced{color:var(--jade);font-size:9px}
.ws-brow-eng{font-size:12.5px;color:var(--ink-soft)}
.ws-brow-say{font-size:11px;color:var(--tide);margin-top:1px}
.ws-brow-actions{display:flex;gap:5px;align-items:center}

/* pronounce */
.ws-pron-intro{font-size:13.5px;color:var(--ink-soft);line-height:1.55;background:var(--foam);
  border:1px solid var(--sand-deep);border-left:3px solid var(--tide);border-radius:12px;padding:13px 15px;
  margin-bottom:22px}
.ws-course-switch{margin-bottom:22px}
.ws-course-sel{width:100%;font-size:15px;font-weight:600;color:var(--ink);background:var(--foam);
  border:1px solid var(--sand-deep);border-radius:12px;padding:12px 14px;-webkit-appearance:none;appearance:none}
.ws-course-note{font-size:12.5px;color:var(--ink-soft);line-height:1.5;margin:8px 2px 0}
.ws-stt-meter{display:flex;align-items:center;gap:14px;font-size:13px;color:var(--ink-soft);margin-bottom:14px}
.ws-stt-meter b{color:var(--ink);font-size:15px}
.ws-stt-hit{color:#1f8a4c;display:inline-flex;align-items:center;gap:3px}
.ws-stt-mis{color:#c0432b;display:inline-flex;align-items:center;gap:3px}
.ws-stt-pct{margin-left:auto;font-weight:600;color:var(--ink)}
.ws-stt-card{background:var(--foam);border:1px solid var(--sand-deep);border-radius:18px;padding:26px 18px;
  text-align:center;transition:border-color .15s,background .15s}
.ws-stt-card.hit{border-color:#2faa63;background:rgba(47,170,99,.12)}
.ws-stt-card.miss{border-color:#d8745c;background:rgba(216,116,92,.12)}
.ws-stt-prompt{font-size:30px;font-weight:700;color:var(--ink);letter-spacing:-.5px}
.ws-stt-gloss{font-size:14.5px;color:var(--ink-soft);margin-top:5px}
.ws-stt-say{font-size:12.5px;color:var(--tide);margin-top:6px;font-style:italic}
.ws-stt-live{margin-top:16px;font-size:13px;color:var(--ink-soft);display:flex;flex-direction:column;align-items:center;gap:6px}
.ws-stt-dot{width:11px;height:11px;border-radius:50%;background:#c0432b;display:inline-block;margin-right:6px;
  animation:wsPulse 1s ease-in-out infinite}
@keyframes wsPulse{0%,100%{opacity:.35;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}
.ws-stt-heard{font-size:17px;color:var(--ink);font-weight:600}
.ws-stt-verdict{margin-top:16px;font-size:16px;font-weight:700;display:inline-flex;align-items:center;gap:6px}
.ws-stt-verdict.ok{color:#1f8a4c}
.ws-stt-verdict.no{color:#c0432b}
.ws-stt-controls{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
.ws-stt-btn{flex:1;min-width:120px;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  font-size:15px;font-weight:600;padding:13px 16px;border-radius:13px;border:1px solid var(--sand-deep);
  background:var(--foam);color:var(--ink);cursor:pointer}
.ws-stt-btn.primary{background:var(--tide);border-color:var(--tide);color:#fff}
.ws-stt-btn.ghost{flex:0 0 100%;background:transparent;border:none;color:var(--ink-soft);font-weight:500;font-size:13px;padding:6px}
.ws-phrase-exp{margin-left:auto;font-size:12px;font-weight:600;color:var(--tide);background:none;border:none;cursor:pointer}
.ws-phrase-card{background:var(--foam);border:1px solid var(--sand-deep);border-radius:18px;padding:20px 18px;margin-bottom:14px}
.ws-phrase-unit{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--tide);opacity:.85}
.ws-phrase-prompt{font-size:21px;font-weight:700;color:var(--ink);margin-top:6px;line-height:1.3}
.ws-phrase-hint{font-size:12.5px;color:var(--ink-soft);margin-top:6px}
.ws-phrase-hint b{color:var(--ink)}
.ws-phrase-edit{margin-top:14px}
.ws-phrase-edit label{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft)}
.ws-phrase-edit textarea{width:100%;box-sizing:border-box;margin-top:5px;font-size:18px;font-weight:600;color:var(--ink);
  background:var(--foam);border:1px solid var(--sand-deep);border-radius:12px;padding:11px 13px;resize:vertical}
.ws-phrase-export{width:100%;box-sizing:border-box;height:46vh;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;
  border:1px solid var(--sand-deep);border-radius:12px;padding:12px;margin-bottom:14px;background:var(--foam);color:var(--ink)}
.ws-stt-btn.flag{flex:0 0 100%;background:transparent;border:1px dashed var(--sand-deep);color:var(--ink-soft);font-weight:600}
.ws-stt-btn.flag.on{background:#fdf0ec;border-color:#d8745c;color:#c0432b}
.ws-rules{display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
.ws-rule{background:var(--foam);border:1px solid var(--sand-deep);border-radius:13px;padding:13px 15px}
.ws-rule-t{font-family:'Fraunces',serif;font-weight:600;font-size:15.5px;color:var(--sea);margin-bottom:3px}
.ws-rule-d{font-size:13px;color:var(--ink-soft);line-height:1.5}
.ws-pron-ex{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.ws-pron-row{display:flex;align-items:center;gap:13px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:13px;padding:13px 15px;cursor:pointer;text-align:left;font-family:inherit;transition:.15s}
.ws-pron-row:active{transform:scale(.99)}
.ws-pron-row svg{color:var(--tide);flex-shrink:0}
.ws-pron-w{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--ink)}
.ws-pron-s{font-size:12.5px;color:var(--ink-soft)}
.ws-pron-note{font-size:11px;color:var(--sand-deep);text-align:center;line-height:1.5;padding:0 10px}

/* header buttons */
.ws-head-btns{display:flex;gap:8px}

/* speed control */
.ws-speed{margin-bottom:24px}
.ws-speed-seg{display:flex;gap:8px;margin-bottom:10px}
.ws-speed-seg button{flex:1;padding:12px 8px;border-radius:12px;border:1.5px solid var(--sand-deep);
  background:var(--foam);cursor:pointer;font-family:inherit;font-weight:600;font-size:13.5px;color:var(--ink);
  transition:.15s}
.ws-speed-seg button.on{border-color:var(--tide);background:var(--sea);color:#fff}
.ws-speed-slider{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.ws-speed-slider input[type=range]{flex:1;accent-color:var(--tide);height:24px;cursor:pointer}
.ws-speed-glabel{font-size:12px;color:var(--ink-soft);min-width:88px}
.ws-voice-select{flex:1;min-width:0;padding:9px 10px;border-radius:10px;border:1.5px solid var(--sand-deep);
  background:var(--foam);font-family:inherit;font-size:13px;color:var(--ink);cursor:pointer}
.ws-voice-note{font-size:11.5px;line-height:1.5;color:var(--ink-soft);background:var(--foam);
  border:1px solid var(--sand-deep);border-radius:10px;padding:9px 11px;margin-bottom:12px}
.ws-voice-note.good{color:var(--ink);border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam))}
.ws-voice-now{display:flex;align-items:center;gap:8px;font-size:12.5px;line-height:1.45;border-radius:10px;padding:9px 11px;margin:2px 0 10px}
.ws-voice-now b{font-weight:700}
.ws-voice-now .ws-voice-lang{font-family:ui-monospace,monospace;font-size:11px;opacity:.75}
.ws-voice-now.ok{color:var(--ink);border:1px solid var(--jade);background:color-mix(in srgb,var(--jade) 12%,var(--foam))}
.ws-voice-now.warn{color:var(--ink);border:1px solid var(--sun);background:color-mix(in srgb,var(--sun) 12%,var(--foam))}
.ws-voice-now span{flex:1}
/* pronunciation A/B popup */
.ws-ab-scrim{position:fixed;inset:0;background:rgba(3,14,17,.62);z-index:60;display:flex;align-items:center;justify-content:center;padding:16px;animation:fade .18s ease}
.ws-ab{width:100%;max-width:440px;max-height:86vh;overflow-y:auto;background:var(--foam);border:1px solid var(--sand-deep);border-radius:16px;padding:16px;box-shadow:0 20px 50px rgba(0,0,0,.5)}
.ws-ab-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.ws-ab-head b{font-family:'Fraunces',Georgia,serif;font-size:17px;color:var(--ink)}
.ws-ab-toggle{display:flex;gap:0;border:1px solid var(--sand-deep);border-radius:999px;overflow:hidden;margin-bottom:14px}
.ws-ab-toggle button{flex:1;font-family:inherit;font-size:13px;font-weight:600;padding:9px;border:0;background:transparent;color:var(--ink-soft);cursor:pointer}
.ws-ab-toggle button.on{background:var(--tide);color:#052024}
.ws-ab-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--sand)}
.ws-ab-words{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline}
.ws-ab-word{font-family:Georgia,serif;font-size:16px;color:var(--ink)}
.ws-ab-word.has-ov{color:var(--sea);font-weight:600}
.ws-ab-word i{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--tide);font-style:normal}
.ws-ab-word.edit{cursor:pointer;border-bottom:1px dotted var(--sand-deep)}
.ws-ab-edit{margin-top:12px;background:var(--shell);border:1px solid var(--sand-deep);border-radius:11px;padding:12px}
.ws-ab-edit-lbl{font-size:12.5px;color:var(--ink-soft);margin-bottom:7px}
.ws-ab-edit-lbl b{color:var(--ink);font-family:Georgia,serif}
.ws-ab-edit-row{display:flex;gap:7px}
.ws-ab-edit-row input{flex:1;font-size:14px;color:var(--ink);background:var(--foam);border:1px solid var(--sand-deep);border-radius:9px;padding:9px 11px;font-family:inherit}
.ws-ab-try{flex:none;display:grid;place-items:center;width:38px;border:1px solid var(--tide);background:transparent;color:var(--sea);border-radius:9px;cursor:pointer}
.ws-ab-edit-btns{display:flex;gap:7px;margin-top:8px}
.ws-ab-save{flex:1;font-family:inherit;font-size:13px;font-weight:700;padding:8px;border:0;border-radius:9px;background:var(--tide);color:#052024;cursor:pointer}
.ws-ab-cancel{flex:none;font-family:inherit;font-size:13px;padding:8px 14px;border:1px solid var(--sand-deep);border-radius:9px;background:transparent;color:var(--ink-soft);cursor:pointer}
.ws-ab-msg{font-size:12px;color:var(--jade);margin-top:9px}
.ws-ab-note{font-size:11.5px;color:var(--ink-soft);line-height:1.5;margin-top:12px}
.ws-voice-test{flex:none;display:inline-flex;align-items:center;gap:5px;font-family:inherit;font-size:12px;font-weight:600;
  padding:6px 11px;border-radius:9px;border:1px solid var(--sand-deep);background:var(--card,var(--foam));color:var(--sea);cursor:pointer}
.ws-speed-val{font-variant-numeric:tabular-nums;font-weight:600;font-size:13.5px;color:var(--tide);
  min-width:52px;text-align:right}
.ws-speed-adapt{display:flex;align-items:flex-start;gap:11px;width:100%;padding:13px 14px;border-radius:13px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;font-family:inherit;
  transition:.15s}
.ws-speed-adapt.on{border-color:var(--tide);background:color-mix(in srgb, var(--tide) 16%, var(--foam))}
.ws-speed-adapt-box{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--sand-deep);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;color:#fff;margin-top:1px}
.ws-speed-adapt.on .ws-speed-adapt-box{background:var(--tide);border-color:var(--tide)}
.ws-speed-adapt b{display:block;font-size:14px;font-weight:600;color:var(--ink)}
.ws-speed-adapt i{font-style:normal;font-size:12px;color:var(--ink-soft)}

/* backup view */
.ws-backup-stat{display:flex;gap:10px;margin-bottom:20px}
.ws-backup-stat>div{flex:1;background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;
  padding:14px 10px;text-align:center;display:flex;flex-direction:column;gap:2px}
.ws-backup-stat b{font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:var(--ink)}
.ws-backup-stat span{font-size:11px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em}
.ws-backup-row{display:flex;align-items:center;gap:13px;width:100%;padding:14px 15px;border-radius:14px;
  border:1px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;transition:.15s;
  margin-bottom:9px;font-family:inherit}
.ws-backup-row:active{transform:scale(.99)}
.ws-backup-row:disabled{opacity:.55}
.ws-backup-ic{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;
  background:var(--sand);color:var(--sea);flex-shrink:0}
.ws-backup-txt{flex:1}
.ws-backup-txt b{display:block;font-size:14.5px;font-weight:600;color:var(--ink)}
.ws-backup-txt i{font-style:normal;font-size:12px;color:var(--ink-soft)}
.ws-backup-msg{display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:12px;font-size:13px;
  line-height:1.45;margin:14px 0 4px;font-weight:500}
.ws-backup-msg svg{flex-shrink:0;margin-top:1px}
.ws-backup-msg.ok{background:#e7f6ee;color:#1f6b46}
.ws-backup-msg.err{background:#fbe7e2;color:#a33422}
.ws-drive-note{font-size:13px;color:var(--ink-soft);line-height:1.6;background:var(--foam);
  border:1px solid var(--sand-deep);border-left:3px solid var(--sun);border-radius:12px;padding:13px 15px;}
.ws-drive-note b{color:var(--ink)}

/* gist sync */
.ws-gist-help{margin-top:12px;font-size:12.5px;color:var(--ink-soft);background:var(--foam);
  border:1px solid var(--sand-deep);border-radius:12px;padding:11px 14px}
.ws-gist-help summary{font-weight:600;color:var(--sea);cursor:pointer;font-size:13px}
.ws-gist-help ol{margin:10px 0 8px;padding-left:18px;line-height:1.6}
.ws-gist-help li{margin-bottom:4px}
.ws-gist-help b{color:var(--ink)}
.ws-diag{margin-top:8px;display:flex;flex-direction:column;gap:6px}
.ws-diag-row{display:flex;align-items:center;gap:8px;font-size:12.5px;background:var(--foam);
  border:1px solid var(--sand-deep);border-radius:10px;padding:8px 10px}
.ws-diag-row.ok{border-color:var(--jade);background:#eefaf3}
.ws-diag-row.err{border-color:var(--coral);background:#fdeeee}
.ws-diag-ic{display:flex;align-items:center;justify-content:center;width:18px;flex:0 0 auto;color:var(--ink-soft)}
.ws-diag-row.ok .ws-diag-ic{color:var(--jade)}
.ws-diag-row.err .ws-diag-ic{color:var(--coral)}
.ws-diag-name{flex:1;font-weight:600;color:var(--ink)}
.ws-diag-detail{font-size:10.5px;color:var(--ink-soft);font-family:ui-monospace,monospace;text-align:right}
.ws-sync-status{display:flex;align-items:center;gap:9px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:12px;padding:12px 14px;font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:10px}
.ws-sync-status code{margin-left:auto;font-size:11px;color:var(--ink-soft);background:var(--sand);
  padding:2px 7px;border-radius:7px;font-family:ui-monospace,monospace}
.ws-sync-dot{width:9px;height:9px;border-radius:50%;background:var(--jade);flex-shrink:0}
.ws-sync-status.syncing .ws-sync-dot{background:var(--sun);animation:pulse 1s infinite}
.ws-sync-status.error .ws-sync-dot{background:var(--coral)}
.ws-sync-btns{display:flex;gap:9px;margin-bottom:4px}
.ws-backup-row.compact{margin-bottom:0;justify-content:center;gap:7px;font-weight:600;font-size:13.5px;
  color:var(--sea);padding:12px}
.ws-start.ws-connected{background:linear-gradient(135deg,var(--jade),#3d9b73);color:#fff;
  box-shadow:0 6px 18px -8px var(--jade)}

@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    `}</style>
  );
}

/* ---- standalone mount ---- */
import { createRoot } from "react-dom/client";
const _root = document.getElementById("root");
if (_root) createRoot(_root).render(React.createElement(App));

// Offline (PWA) service worker — OPT-IN while we verify iOS + Google-OAuth end to end. To try it on
// a device: run  localStorage.setItem('sulog:offline','on')  in the console and reload (undo with
// removeItem). Default OFF, so normal users are unaffected. Flip the default (drop the flag check)
// after a joint iOS + auth test. To fully unregister on a device: localStorage.removeItem then, in
// the console, navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).
try {
  if ("serviceWorker" in navigator && localStorage.getItem("sulog:offline") === "on") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
} catch (e) { /* storage blocked (private mode) — skip */ }
