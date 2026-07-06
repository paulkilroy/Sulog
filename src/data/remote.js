/* Data access over Supabase — reads the relational block model and assembles it into
   the shapes the app renders; writes per-user progress. Content is world-readable (RLS);
   progress is private to the signed-in user. */
import { supabase } from "../supabase.js";

const rows = async (q) => { const { data, error } = await q; if (error) throw error; return data || []; };

// full lexicon (words + phrases). idiomatic set-phrases + words alike.
export const fetchDictionary = () => rows(supabase.from("dictionary").select("*"));

// Ella's queue: everything a native speaker still needs to confirm.
export const fetchReviewList = () =>
  rows(supabase.from("dictionary").select("waray,kind,meaning,pronunciation,loan").eq("confirmed", false).order("kind"));

export const fetchCourses = () => rows(supabase.from("courses").select("*"));

// Assemble one course into course › phases › units › lessons › blocks (+ resolved items).
export async function fetchCourse(courseId) {
  const [phases, dict, exprs] = await Promise.all([
    rows(supabase.from("phases").select("*").eq("course_id", courseId).order("ord")),
    fetchDictionary(),
    rows(supabase.from("expressions").select("*")),
  ]);
  const phaseIds = phases.map((p) => p.id);
  const units = await rows(supabase.from("units").select("*").in("phase_id", phaseIds).order("ord"));
  const unitIds = units.map((u) => u.id);
  const lessons = await rows(supabase.from("lessons").select("*").in("unit_id", unitIds).order("ord"));
  const lessonIds = lessons.map((l) => l.id);
  const blocks = await rows(supabase.from("lesson_blocks").select("*").in("lesson_id", lessonIds).order("ord"));
  const blockIds = blocks.map((b) => b.id);
  const items = blockIds.length ? await rows(supabase.from("block_items").select("*").in("block_id", blockIds).order("ord")) : [];

  const dByW = new Map(dict.map((d) => [d.waray, d]));
  const eById = new Map(exprs.map((e) => [e.id, e]));
  const itemsByBlock = new Map();
  for (const it of items) {
    // _ref marks dict-vs-expr WITHOUT clobbering the dictionary row's own `kind` (word/phrase)
    const resolved = it.dict_waray ? { ...dByW.get(it.dict_waray), _ref: "dict" } : { ...eById.get(it.expr_id), _ref: "expr" };
    (itemsByBlock.get(it.block_id) || itemsByBlock.set(it.block_id, []).get(it.block_id)).push({ ord: it.ord, role: it.role, ...resolved });
  }
  const blocksByLesson = new Map();
  for (const b of blocks) {
    const withItems = { ...b, items: itemsByBlock.get(b.id) || [] };
    (blocksByLesson.get(b.lesson_id) || blocksByLesson.set(b.lesson_id, []).get(b.lesson_id)).push(withItems);
  }
  const lessonsByUnit = new Map();
  for (const l of lessons) (lessonsByUnit.get(l.unit_id) || lessonsByUnit.set(l.unit_id, []).get(l.unit_id)).push({ ...l, blocks: blocksByLesson.get(l.id) || [] });
  const unitsByPhase = new Map();
  for (const u of units) (unitsByPhase.get(u.phase_id) || unitsByPhase.set(u.phase_id, []).get(u.phase_id)).push({ ...u, lessons: lessonsByUnit.get(u.id) || [] });
  return { id: courseId, phases: phases.map((p) => ({ ...p, units: unitsByPhase.get(p.id) || [] })) };
}

/* ---- adapt a DB course into the bundled shape the learning engine consumes ----
   The engine runs on { seed:[[deck,waray,english,sub,say]], curriculum:[sections] }.
   We flatten the block model: every drillable item (vocab word or drilled sentence)
   becomes a card; each DB lesson becomes a curriculum lesson listing those items by
   Waray. Guides/gates/stories aren't cards — the engine supplies its own unit review.
   A sentence-heavy lesson is tagged "apply" (its cards are the review pool), else "words". */
export function dbCourseToBundled(db, name) {
  const seed = new Map();                 // waray -> [deck, waray, english, subtext, say]
  const sections = [];
  for (const ph of db.phases || []) {
    const units = [];
    for (const u of ph.units || []) {
      const deck = u.id;                  // one deck per unit; DECKS labels it from the unit name
      const lessons = [], gates = [];     // gates = end-of-lesson tests, attached to the lesson they follow
      for (const l of u.lessons || []) {
        const items = [], seen = new Set();
        const gateItems = [], gseen = new Set();
        let words = 0, sentences = 0;
        for (const b of l.blocks || []) {
          if (b.type === "assessment" && b.assess_gate) {   // the book's graded exit gate — its exact recall items
            for (const it of b.items || []) {
              const waray = it.waray, english = it.meaning || it.translation || "";
              if (!waray || !english) continue;
              if (!seed.has(waray)) seed.set(waray, [deck, waray, english, "", it.pronunciation || ""]);
              if (!gseen.has(waray)) { gseen.add(waray); gateItems.push(waray); }
            }
            continue;
          }
          if (!["vocab", "phrases", "drill"].includes(b.type)) continue;   // only drillable blocks yield cards
          for (const it of b.items || []) {
            const waray = it.waray, english = it.meaning || it.translation || "";
            if (!waray || !english) continue;
            (it._ref === "expr" || /\s/.test(waray)) ? sentences++ : words++;
            if (!seed.has(waray)) seed.set(waray, [deck, waray, english, "", it.pronunciation || ""]);
            if (!seen.has(waray)) { seen.add(waray); items.push(waray); }
          }
        }
        if (items.length) lessons.push({ id: l.id, name: l.title, title: l.title, kind: sentences > words ? "apply" : "words", items });
        if (gateItems.length) {
          const num = (/l(\d+)/i.exec(l.id) || [])[1];
          gates.push({ id: l.id + "-gate", after: l.id, name: num ? `Test · Lesson ${num}` : "Test", items: gateItems });
        }
      }
      if (lessons.length) units.push({ id: u.id, name: u.name, hint: "", can_do: u.can_do || "", lessons, gates });
    }
    if (units.length) sections.push({ name: ph.name, hint: "", units });
  }
  return { id: db.id, name, seed: [...seed.values()], forgotten: [], curriculum: sections };
}

// fetch a course from the DB and return it in the engine's bundled shape
export const fetchCourseBundled = async (courseId, name) => dbCourseToBundled(await fetchCourse(courseId), name);

// ---- per-user progress (RLS: only your own rows) ----
export async function loadProgress(userId) {
  const data = await rows(supabase.from("progress").select("*").eq("user_id", userId));
  const m = {}; for (const r of data) m[r.waray] = r; return m;
}
export const saveProgress = (userId, waray, fields) =>
  rows(supabase.from("progress").upsert({ user_id: userId, waray, ...fields }, { onConflict: "user_id,waray" }));

// ---- admin (Ella / Paul) edits ----
export const confirmEntry = (waray, patch = { confirmed: true }) =>
  rows(supabase.from("dictionary").update(patch).eq("waray", waray));
