/* Data access over Supabase — reads the relational block model and assembles it into
   the shapes the app renders; writes per-user progress. Content is world-readable (RLS);
   progress is private to the signed-in user. */
import { supabase } from "../supabase.js";

const rows = async (q) => { const { data, error } = await q; if (error) throw error; return data || []; };

// Page through ALL rows — Supabase/PostgREST caps a single response at ~1000, so tables like
// expressions (1000+) and block_items (1900+) MUST be fetched in ranges or the block model
// silently loses items (e.g. a 21-word vocab block comes back with only 7). makeQuery() must
// rebuild the query each page so .range() applies fresh.
async function fetchAll(makeQuery) {
  const out = []; const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await makeQuery().range(from, from + size - 1);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < size) return out;
  }
}

// full lexicon (words + phrases). idiomatic set-phrases + words alike.
// .order() is REQUIRED under fetchAll: each page is a separate request, and without a stable
// total order Postgres may return rows differently per page — silently dropping/duplicating
// rows at page boundaries. Order by the primary key.
export const fetchDictionary = () => fetchAll(() => supabase.from("dictionary").select("*").order("waray"));

// Ella's queue: everything a native speaker still needs to confirm.
export const fetchReviewList = () =>
  fetchAll(() => supabase.from("dictionary").select("waray,kind,meaning,pronunciation,loan").eq("confirmed", false).order("kind", { ascending: false }).order("waray")); // words (drilled in lessons) before lexicon-only phrases; paginated defensively

export const fetchCourses = () => rows(supabase.from("courses").select("*"));

// Assemble one course into course › phases › units › lessons › blocks (+ resolved items).
export async function fetchCourse(courseId) {
  const [phases, dict, exprs] = await Promise.all([
    rows(supabase.from("phases").select("*").eq("course_id", courseId).order("ord")),
    fetchDictionary(),
    fetchAll(() => supabase.from("expressions").select("*").order("id")), // stable page order (see fetchDictionary)
  ]);
  const phaseIds = phases.map((p) => p.id);
  const units = await rows(supabase.from("units").select("*").in("phase_id", phaseIds).order("ord"));
  const unitIds = units.map((u) => u.id);
  const lessons = await rows(supabase.from("lessons").select("*").in("unit_id", unitIds).order("ord"));
  const lessonIds = lessons.map((l) => l.id);
  const blocks = await fetchAll(() => supabase.from("lesson_blocks").select("*").in("lesson_id", lessonIds).order("lesson_id").order("ord"));
  const blockIds = blocks.map((b) => b.id);
  const items = blockIds.length ? await fetchAll(() => supabase.from("block_items").select("*").in("block_id", blockIds).order("block_id").order("ord")) : [];

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
        const items = [], seen = new Set();          // flat list (home counts / card resolution)
        const gateItems = [], gseen = new Set();
        const steps = [];                            // the ORDERED lesson flow: teach / vocab / drill blocks
        let pendingTeach = null, words = 0, sentences = 0;
        // add a drillable item to the seed + flat list, return its waray id
        const addItem = (it) => {
          const waray = it.waray, english = it.meaning || it.translation || "";
          if (!waray || !english) return null;
          (it._ref === "expr" || /\s/.test(waray)) ? sentences++ : words++;
          if (!seed.has(waray)) seed.set(waray, [deck, waray, english, "", it.pronunciation || ""]);
          if (!seen.has(waray)) { seen.add(waray); items.push(waray); }
          return waray;
        };
        const flushTeach = () => { if (pendingTeach) { steps.push(pendingTeach); pendingTeach = null; } };
        for (const b of l.blocks || []) {
          // grammar → a teaching step (consecutive ones merge into one screen). NOTES always join
          // the lesson's most recent teach screen — the book prints them after the vocab list, but
          // they explain the grammar ("Ngan is a connector…"), so they belong on that screen.
          if (b.type === "grammar" || b.type === "note") {
            const part = { title: b.title || "", prose: b.body_md || "", formula: b.formula || "" };
            const prevTeach = b.type === "note" && !pendingTeach ? [...steps].reverse().find((st) => st.type === "teach") : null;
            if (prevTeach) prevTeach.parts.push(part);
            else (pendingTeach || (pendingTeach = { type: "teach", parts: [] })).parts.push(part);
            continue;
          }
          flushTeach();
          if (b.type === "assessment" && b.assess_gate) {   // the book's graded exit gate — its exact recall items
            for (const it of b.items || []) {
              const waray = it.waray, english = it.meaning || it.translation || "";
              if (!waray || !english) continue;
              if (!seed.has(waray)) seed.set(waray, [deck, waray, english, "", it.pronunciation || ""]);
              if (!gseen.has(waray)) { gseen.add(waray); gateItems.push(waray); }
            }
            continue;
          }
          if (b.type === "vocab" || b.type === "phrases") {
            const ids = (b.items || []).map(addItem).filter(Boolean);
            if (ids.length) {
              // back-to-back word lists read as ONE "learn the words" step (the book splits the
              // paradigm list from "also in this lesson" extras; the learner shouldn't have to)
              const prev = steps[steps.length - 1];
              if (prev && prev.type === "vocab") { for (const w of ids) if (!prev.items.includes(w)) prev.items.push(w); }
              else steps.push({ type: "vocab", title: b.title || "", items: ids, footnote: b.footnote || null });
            }
            continue;
          }
          if (b.type === "drill") {
            // drop the oral (production/voice) exercise — it's a teacher-led substitution drill that
            // doesn't self-study well; speaking stays available via the answer-by-voice toggle.
            if (b.drill_kind === "production" && b.drill_modality === "voice") continue;
            if (b.drill_modality === "cloze") {
              // marker drill ("Use the correct marker with: Lalake…") — its rows are exercise
              // forms, not vocabulary: they carry the book's CUE (often not English) in the
              // translation field, so they must never become translation cards. The step keeps
              // them inline; ClozeView quizzes the marker choice itself.
              const cloze = (b.items || []).map((it) => ({ full: it.waray, cue: it.translation || "" })).filter((x) => x.full);
              if (cloze.length) steps.push({ type: "drill", kind: b.drill_kind || "recognition", modality: "cloze", title: b.title || "", items: [], cloze, footnote: b.footnote || null });
              continue;
            }
            const ids = (b.items || []).map(addItem).filter(Boolean);
            if (ids.length) steps.push({ type: "drill", kind: b.drill_kind || "recognition", modality: b.drill_modality || "mc", dir: b.drill_direction || null, title: b.title || "", items: ids, footnote: b.footnote || null });
            continue;
          }
          // story / other → not a playable step
        }
        flushTeach();
        if (steps.length) lessons.push({ id: l.id, name: l.title, title: l.title, kind: sentences > words ? "apply" : "words", items, steps });
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

// the course's content version (bumped on every reload) — a cheap check for "is my cache stale?"
export const fetchCourseVersion = async (courseId) =>
  Number((await rows(supabase.from("courses").select("version").eq("id", courseId)))[0]?.version) || 0;

// ---- per-user progress (RLS: only your own rows) ----
export async function loadProgress(userId) {
  const data = await rows(supabase.from("progress").select("*").eq("user_id", userId));
  const m = {}; for (const r of data) m[r.waray] = r; return m;
}
export const saveProgress = (userId, waray, fields) =>
  rows(supabase.from("progress").upsert({ user_id: userId, waray, ...fields }, { onConflict: "user_id,waray" }));

// ---- admin (Ella / Paul) edits ----
// A human Confirm writes TWO places: the dictionary row (instant effect) and
// native_confirmations — the DURABLE judgment record. Content rebuilds wipe and re-derive
// the dictionary; they replay native_confirmations back over it, so her tap survives a
// from-scratch build. The record write asserts it landed (RLS-denied upsert = silent no-op).
export const confirmEntry = async (waray, patch = { confirmed: true }, by = "ella") => {
  const res = await rows(supabase.from("dictionary").update({ ...patch, confirmed_by: by }).eq("waray", waray).select());
  if (!res.length) throw new Error("not saved — are you signed in as the admin?");
  const rec = await rows(supabase.from("native_confirmations")
    .upsert({ waray, meaning: patch.meaning ?? res[0].meaning, pronunciation: patch.pronunciation ?? res[0].pronunciation, by_whom: by }).select());
  if (!rec.length) throw new Error("confirmation record not saved");
  return res;
};

// ---- dialect config (GLOBAL, from the dialect_forms table — no deploy needed to change) ----
// Catalog of grade-relevant regional forms; the Language door renders its checkboxes from
// this. Cached by the caller; variants.js DIALECT_FORMS is only the offline fallback.
export const fetchDialectForms = () =>
  rows(supabase.from("dialect_forms").select("*").eq("active", true).order("ord"));
// admin: the FULL catalog, dropped forms included (the Admin door manages them)
export const fetchAllDialectForms = () =>
  rows(supabase.from("dialect_forms").select("*").order("ord"));
// admin: verify (native-confirmed) or drop (active=false) a form — global, instant
export const setDialectForm = async (k, patch) => {
  const r = await rows(supabase.from("dialect_forms").update(patch).eq("k", k).select());
  if (!r.length) throw new Error("not saved — are you signed in as the admin?");
};

// ---- classroom: profile + roles ----
// On sign-in the app mirrors the auth user into `profiles` (so roster/queue can show a name).
export const upsertProfile = (user) =>
  rows(supabase.from("profiles").upsert(
    { user_id: user.id, email: user.email, display_name: user.user_metadata?.name || (user.email || "").split("@")[0] || null },
    { onConflict: "user_id" }));
// the caller's granted roles (student is implicit — never stored)
export const fetchMyRoles = async () =>
  (await rows(supabase.from("user_roles").select("role"))).map((r) => r.role);
// the caller's role requests (newest first)
export const fetchMyRequests = () =>
  rows(supabase.from("role_requests").select("*").order("id", { ascending: false }));
// ask for an elevated role → lands in the admin approval queue
export const requestRole = async (role, note = "") => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("sign in first");
  const r = await rows(supabase.from("role_requests").insert({ user_id: user.id, role, note }).select());
  if (!r.length) throw new Error("couldn't submit the request");
  return r[0];
};

// ---- classroom: feedback (one queue: learner flags + reviewer proposals → an admin decides) ----
// Context (which item, lesson, direction, what they answered) is captured automatically — the
// learner only picks a kind and optionally types a note.
export const submitFeedback = async ({ kind, targetType, targetRef, comment = "", payload = {}, context = {}, classId = null }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to send feedback.");
  const roles = await fetchMyRoles().catch(() => []);
  const authorRole = roles.includes("reviewer") ? "reviewer" : roles.includes("instructor") ? "instructor" : "student";
  const r = await rows(supabase.from("feedback").insert({
    author_id: user.id, author_role: authorRole, kind,
    target_type: targetType, target_ref: targetRef,
    comment, payload, context, class_id: classId,
  }).select());
  if (!r.length) throw new Error("couldn't send — try again");
  return r[0];
};

// the queue: admins see everything, instructors see their class's flags (RLS decides)
export const fetchFeedback = (status = "open") =>
  fetchAll(() => supabase.from("feedback").select("*").eq("status", status).order("id", { ascending: false }));

// an admin resolves an item (applying a proposal to the dictionary comes in a later step)
export const resolveFeedback = async (id, decision) => {
  const { data: { user } } = await supabase.auth.getUser();
  const r = await rows(supabase.from("feedback").update({
    status: "resolved", decision, decided_by: user?.id || null, decided_at: new Date().toISOString(),
  }).eq("id", id).select());
  if (!r.length) throw new Error("not saved — admin only");
  return r[0];
};

// Apply a queue fix to the dictionary AND record the traceability chain. Reuses what we already have
// (confirmEntry → dictionary + native_confirmations; feedback holds who-suggested/who-decided) and
// adds only the append-only before/after history, linked back to the flag.
export const applyFix = async ({ feedback, meaning }) => {
  const { data: { user } } = await supabase.auth.getUser();
  const waray = feedback.target_ref;
  const before = (await rows(supabase.from("dictionary").select("meaning, pronunciation, confirmed_by").eq("waray", waray)))[0] || null;
  await confirmEntry(waray, { confirmed: true, meaning }, "reviewer");        // provenance: a vetted queue fix
  await supabase.from("content_changes").insert({
    target_type: "dictionary", target_ref: waray,
    before_val: before, after_val: { meaning, confirmed_by: "reviewer" },
    feedback_id: feedback.id, reviewed_by: user?.id || null, approved_by: user?.id || null,
  });
  await resolveFeedback(feedback.id, "edited");
  return true;
};

// the change history with the full chain resolved to names: suggested (from feedback) → reviewed → approved
export const fetchChangeLog = async (limit = 60) => {
  const ch = await fetchAll(() => supabase.from("content_changes").select("*").order("id", { ascending: false }).limit(limit));
  if (!ch.length) return [];
  const fbIds = [...new Set(ch.map((c) => c.feedback_id).filter(Boolean))];
  const fbs = fbIds.length ? await rows(supabase.from("feedback").select("id, author_id, author_role, comment").in("id", fbIds)) : [];
  const fbById = new Map(fbs.map((f) => [f.id, f]));
  const uids = [...new Set(ch.flatMap((c) => [c.reviewed_by, c.approved_by]).concat(fbs.map((f) => f.author_id)).filter(Boolean))];
  const profs = uids.length ? await rows(supabase.from("profiles").select("user_id, display_name, email").in("user_id", uids)) : [];
  const nm = new Map(profs.map((p) => [p.user_id, p.display_name || p.email || p.user_id.slice(0, 8)]));
  const name = (id) => id ? (nm.get(id) || id.slice(0, 8)) : null;
  return ch.map((c) => {
    const fb = fbById.get(c.feedback_id);
    return { ...c, suggestion: fb?.comment || null, suggestedName: name(fb?.author_id), suggestedRole: fb?.author_role, reviewedName: name(c.reviewed_by), approvedName: name(c.approved_by) };
  });
};

// ---- classroom: classes & enrollment ----
// Join codes avoid look-alike glyphs (no I/O/0/1) so they survive being read aloud in class.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = () => "WARAY-" + Array.from({ length: 5 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");

// the class this user TEACHES (one per instructor for now)
export const fetchMyTaughtClass = async (userId) =>
  (await rows(supabase.from("classes").select("*").eq("instructor_id", userId).limit(1)))[0] || null;

// the classes this user is enrolled in as a student
export const fetchMyEnrolledClasses = async () => {
  const en = await rows(supabase.from("enrollments").select("class_id, joined_at"));
  if (!en.length) return [];
  return rows(supabase.from("classes").select("*").in("id", en.map((e) => e.class_id)));
};

export const createClass = async (name, courseId = "pc") => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("sign in first");
  for (let i = 0; i < 6; i++) {                       // retry on the (unlikely) code collision
    const id = (globalThis.crypto?.randomUUID?.() || `cls-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const { data, error } = await supabase.from("classes")
      .insert({ id, instructor_id: user.id, name, code: makeCode(), course_id: courseId }).select();
    if (!error && data?.length) return data[0];
    if (error && !/duplicate|unique/i.test(error.message)) throw new Error(error.message);
  }
  throw new Error("couldn't generate a unique class code — try again");
};

// students never SELECT classes directly; join_class() resolves the code server-side
export const joinClass = async (code) => {
  const { data, error } = await supabase.rpc("join_class", { p_code: (code || "").trim().toUpperCase() });
  if (error) throw new Error(/no active class/i.test(error.message) ? "That code didn't match a class." : error.message);
  return data;
};

// roster for a class the caller teaches (RLS returns nothing otherwise)
export const fetchRoster = async (classId) => {
  const en = await rows(supabase.from("enrollments").select("student_id, joined_at").eq("class_id", classId));
  if (!en.length) return [];
  const profs = await rows(supabase.from("profiles").select("user_id, display_name, email").in("user_id", en.map((e) => e.student_id)));
  const byId = new Map(profs.map((p) => [p.user_id, p]));
  return en.map((e) => ({ ...e, ...(byId.get(e.student_id) || {}) }))
           .sort((a, b) => (a.display_name || a.email || "").localeCompare(b.display_name || b.email || ""));
};

// admin: pending role requests, joined to the requester's name/email
export const fetchPendingRoleRequests = async () => {
  const reqs = await rows(supabase.from("role_requests").select("*").eq("status", "pending").order("id", { ascending: false }));
  if (!reqs.length) return [];
  const profs = await rows(supabase.from("profiles").select("user_id, display_name, email").in("user_id", reqs.map((r) => r.user_id)));
  const byId = new Map(profs.map((p) => [p.user_id, p]));
  return reqs.map((r) => ({ ...r, ...(byId.get(r.user_id) || {}) }));
};

// admin decision: approve → grant the role (user_roles) + mark approved; decline → mark declined
export const decideRoleRequest = async (req, approve) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (approve) {
    const { error } = await supabase.from("user_roles")
      .upsert({ user_id: req.user_id, role: req.role, granted_by: user?.id || null }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
  }
  const r = await rows(supabase.from("role_requests").update({
    status: approve ? "approved" : "declined", decided_by: user?.id || null, decided_at: new Date().toISOString(),
  }).eq("id", req.id).select());
  if (!r.length) throw new Error("not saved — admin only");
  return r[0];
};

// instructor dashboard: SRS boxes + unit-test rows for a set of students. RLS returns only the
// students enrolled in a class the caller teaches (teaches_student), so this is safe to call broad.
export const fetchClassProgress = async (studentIds) => {
  if (!studentIds || !studentIds.length) return { prog: [], units: [] };
  const [prog, units] = await Promise.all([
    fetchAll(() => supabase.from("progress").select("user_id, box, seen").in("user_id", studentIds)),
    fetchAll(() => supabase.from("unit_progress").select("user_id, unit_id, best, passed").in("user_id", studentIds)),
  ]);
  return { prog, units };
};

// open flags tagged to a class (instructor reads their class's flags; admin reads all)
export const fetchClassFlags = (classId) =>
  fetchAll(() => supabase.from("feedback").select("*").eq("class_id", classId).eq("status", "open").order("id", { ascending: false }));

// per-word TTS overrides live ON the dictionary word (dictionary.spoken): the spoken form fed to the
// engine, e.g. mga→'manga'. Keyed lowercase for per-word lookup in phrases.
export const fetchTtsOverrides = async () => {
  const r = await fetchAll(() => supabase.from("dictionary").select("waray, spoken").not("spoken", "is", null));
  const m = {}; for (const x of r) if (x.waray && x.spoken) m[x.waray.toLowerCase()] = x.spoken;
  return m;
};
export const saveTtsOverride = async (waray, spoken) => {
  const val = spoken && spoken.trim() ? spoken.trim() : null;   // empty → clear the override
  const r = await rows(supabase.from("dictionary").update({ spoken: val }).eq("waray", waray).select());
  if (!r.length) throw new Error("not saved — admin only (and the word must exist in the dictionary)");
  return r[0];
};

// ---- per-user settings that follow the user across devices (dialect selection) ----
export const loadUserSettings = async (userId) =>
  (await rows(supabase.from("user_settings").select("*").eq("user_id", userId)))[0] || null;
export const saveUserSettings = (userId, dialectForms) =>
  rows(supabase.from("user_settings").upsert(
    { user_id: userId, dialect_forms: dialectForms, updated: Date.now() }, { onConflict: "user_id" }));

// native-speaker answers for review-queue questions (missing exercise answers + dialect calls).
// World-readable; writes are RLS admin-gated — assert the row LANDED (an RLS-denied update is a
// silent no-op, not an error).
export const fetchEllaAnswers = async () => {
  const list = await fetchAll(() => supabase.from("ella_answers").select("*").order("id"));
  const m = {}; for (const r of list) m[r.id] = r.answer; return m;
};
export const saveEllaAnswer = async (id, answer) => {
  const r = await rows(supabase.from("ella_answers").upsert({ id, answer }).select());
  if (!r.length) throw new Error("not saved — are you signed in as the admin?");
};
