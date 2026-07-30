/* Supabase client + auth helpers. URL + publishable key are injected at build time by
   build.sh via esbuild --define (__SUPABASE_URL__ / __SUPABASE_KEY__); they fall back to
   env vars (node) and finally the public project defaults. The publishable key is
   designed to be public — it ships in the browser. RLS is what protects the data. */
import { createClient } from "@supabase/supabase-js";

const pick = (defName, envName, fallback) => {
  // `typeof X` is safe on an undeclared identifier; && short-circuits so X is only
  // evaluated when esbuild has --define'd it to a literal.
  const d = defName();
  if (d) return d;
  if (typeof process !== "undefined" && process.env && process.env[envName]) return process.env[envName];
  return fallback;
};
const SUPABASE_URL = pick(() => (typeof __SUPABASE_URL__ !== "undefined" ? __SUPABASE_URL__ : ""), "SUPABASE_URL", "https://kdtzfaobcgprivsxkger.supabase.co");
const SUPABASE_KEY = pick(() => (typeof __SUPABASE_KEY__ !== "undefined" ? __SUPABASE_KEY__ : ""), "SUPABASE_ANON_KEY", "sb_publishable_mVYVK10OZfARWUl3PcfhHQ_zHa7bVpS");

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- auth ----
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
// passwordless email link — for students without a Google account
export const signInWithEmail = (email) =>
  supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
export const signOut = () => supabase.auth.signOut();
export const getUser = async () => (await supabase.auth.getUser()).data.user;
export const onAuth = (cb) => supabase.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
export const ADMIN_EMAIL = "paulkilroy@gmail.com";
export const isAdmin = (user) => !!user && user.email === ADMIN_EMAIL;

/* ---- per-user progress sync (normalized tables; RLS scopes rows to the signed-in user) ----
   The app keeps its localStorage records exactly as-is; these helpers map each record 1:1
   to a table row and back. Merge stays client-side (pull → mergeProg/etc → push), so a
   device that was offline never clobbers a newer record. Progress is namespaced per course. */

// pull this user's state for one course, shaped like the app's in-memory bundle
export async function pullProgress(courseId) {
  const [p, l, u, s] = await Promise.all([
    supabase.from("progress").select("*").eq("course_id", courseId),
    supabase.from("lesson_progress").select("*").eq("course_id", courseId),
    supabase.from("unit_progress").select("*").eq("course_id", courseId),
    supabase.from("user_streak").select("*").eq("course_id", courseId).maybeSingle(),
  ]);
  const err = [p, l, u, s].find((r) => r.error && r.status !== 406); // 406 = maybeSingle no-row
  if (err) throw new Error(err.error.message);
  const prog = {};
  for (const r of p.data || []) prog[r.waray] = {
    box: r.box, seen: r.seen, right: r.n_right, wrong: r.wrong, streak: r.streak,
    recall: r.recall, last: Number(r.last), due: Number(r.due), pinned: r.pinned,
  };
  const lessons = {}; for (const r of l.data || []) lessons[r.lesson_id] = r.parts;
  const units = {}; for (const r of u.data || []) units[r.unit_id] = { best: r.best, passed: r.passed, last: r.last, at: r.at };
  const streak = s.data ? { count: s.data.count, last: s.data.last, days: s.data.days || {} } : null;
  const reads = (s.data && s.data.reads) || {};   // { read:[ids], stories:[ids] } reader completion
  return { prog, lessons, units, streak, reads };
}

// upsert this user's current state for one course (only touched words, to keep rows bounded)
export async function pushProgress(userId, courseId, { prog, lessons, units, streak, reads }) {
  const progRows = Object.entries(prog || {})
    .filter(([, v]) => v && (v.seen > 0 || v.box > 0 || v.pinned || v.recall > 0))
    .map(([waray, v]) => ({
      user_id: userId, course_id: courseId, waray,
      box: v.box || 0, seen: v.seen || 0, n_right: v.right || 0, wrong: v.wrong || 0,
      streak: v.streak || 0, recall: v.recall || 0, last: v.last || 0, due: v.due || 0, pinned: !!v.pinned,
    }));
  const lessonRows = Object.entries(lessons || {}).map(([lesson_id, parts]) => ({ user_id: userId, course_id: courseId, lesson_id, parts: parts || 0 }));
  const unitRows = Object.entries(units || {}).map(([unit_id, v]) => ({ user_id: userId, course_id: courseId, unit_id, best: v.best || 0, passed: !!v.passed, last: v.last || 0, at: String(v.at || "") }));
  const ops = [];
  if (progRows.length) ops.push(supabase.from("progress").upsert(progRows));
  if (lessonRows.length) ops.push(supabase.from("lesson_progress").upsert(lessonRows));
  if (unitRows.length) ops.push(supabase.from("unit_progress").upsert(unitRows));
  if (streak || reads) ops.push(supabase.from("user_streak").upsert({ user_id: userId, course_id: courseId, count: streak?.count || 0, last: streak?.last || "", days: streak?.days || {}, reads: reads || {} }));
  const res = await Promise.all(ops);
  const bad = res.find((r) => r.error);
  if (bad) throw new Error(bad.error.message);
}
