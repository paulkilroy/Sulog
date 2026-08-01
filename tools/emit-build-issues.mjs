/* BUILD-intake for the unified review queue: emits the pipeline's known issues as feedback rows
   (source='build') with cited a/b candidates in payload — the reviewer answers them in Native
   Review, the admin decides in the Review Queue.
   Idempotent: upsert on stable_key; rows that are already answered/resolved are NEVER touched or
   resurrected. Run after a content rebuild (or standalone):  SUPABASE_DB_URL=… node tools/emit-build-issues.mjs */
import pg from "pg";
import fs from "fs";

const EXPECTED_REF = "kdtzfaobcgprivsxkger";
if (!(process.env.SUPABASE_DB_URL || "").includes(EXPECTED_REF)) {
  console.error(`✗ SUPABASE_DB_URL must point at ${EXPECTED_REF}`); process.exit(1);
}
const slug = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const rows = [];
const add = (r) => rows.push(r);

// ---- 1) rejected sentences (docs/sources/peace-corps/rejected-sentences.json) ----
// no native answer yet → missing_answer; an AI draft is in the lesson → needs_native_confirm
const REJECTED = JSON.parse(fs.readFileSync("docs/sources/peace-corps/rejected-sentences.json", "utf8"));
for (const r of REJECTED) {
  if (r.ella) continue;                                  // already natively answered — not an issue
  const candidates = [];
  if (r.ai)      candidates.push({ key: "a", text: r.ai,      source: "Claude · draft (in the lesson, unconfirmed)" });
  if (r.suggest && r.suggest !== r.ai)
                 candidates.push({ key: candidates.length ? "b" : "a", text: r.suggest, source: "Claude · audit suggestion (verify)" });
  add({
    stable_key: `sent:${r.lesson}:${slug(r.waray)}`,
    kind: r.ai ? "needs_native_confirm" : "missing_answer",
    target_type: "exercise",
    target_ref: `${r.lesson} · ${r.where}`,
    payload: { en: r.en, removed_waray: r.waray, reason: r.reason, candidates },
    context: { lesson: r.lesson, where: r.where },
  });
}

// ---- 2) native-judgment questions (the manual Ask-a-native list; synth ones covered above) ----
// (single static question today — mirror of ella-questions.js's non-synth entries)
add({
  stable_key: "q:ngan-hi-marker",
  kind: "dialect_question",
  target_type: "sentence",
  target_ref: "ngan-hi-marker",
  payload: {
    q: "Joining two names: “Hira Nonoy ngan hi Inday” or “hira Nonoy ngan Inday” — is the second “hi” required?",
    detail: "The Peace Corps book prints “Hira Nonoy ngan hi Inday.” (Lesson 2 written exercise) — marker repeated after ngan.",
    candidates: [],
  },
  context: { topic: "Lesson 2 · markers" },
});

// ---- 3) unconfirmed dictionary entries USED BY THE COURSE (not the 25k Zorc reference rows) ----
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const unconf = (await c.query(`
  select distinct d.waray, d.meaning, d.pronunciation
  from dictionary d join block_items bi on bi.dict_waray = d.waray
  where d.confirmed = false order by d.waray`)).rows;
let cand = {};
try { cand = JSON.parse(fs.readFileSync("src/courses/waray/confirm-candidates.js", "utf8").replace(/^[\s\S]*?export const CONFIRM_CANDIDATES = /, "").replace(/;\s*$/, "")); } catch (e) {}
for (const d of unconf) {
  const cc = cand[d.waray] || {};
  const candidates = [{ key: "a", text: d.meaning, source: cc.origin || "course deck (unconfirmed)" }];
  if (cc.tramp?.gloss && cc.tramp.gloss.toLowerCase() !== (d.meaning || "").toLowerCase())
    candidates.push({ key: "b", text: cc.tramp.gloss, source: `Tramp dictionary${cc.tramp.page ? ` · p.${cc.tramp.page}` : ""}` });
  add({
    stable_key: `dict:${d.waray}`,
    kind: "dict_unconfirmed",
    target_type: "word",
    target_ref: d.waray,
    payload: { pronunciation: d.pronunciation || "", candidates },
    context: {},
  });
}

// ---- upsert: refresh open rows, never touch answered/resolved ones ----
let ins = 0, upd = 0, skip = 0;
for (const r of rows) {
  const res = await c.query(`
    insert into feedback (source, author_id, author_role, kind, target_type, target_ref, payload, context, stable_key)
    values ('build', null, 'build', $1, $2, $3, $4, $5, $6)
    on conflict (stable_key) do update
      set kind = excluded.kind, payload = excluded.payload, context = excluded.context
      where feedback.status = 'open'
    returning (xmax = 0) as inserted`, [r.kind, r.target_type, r.target_ref, r.payload, r.context, r.stable_key]);
  if (!res.rows.length) skip++;             // conflict on a non-open row → left alone
  else if (res.rows[0].inserted) ins++;
  else upd++;
}
const n = (await c.query(`select status, count(*)::int n from feedback where source='build' group by status`)).rows;
console.log(`✓ build issues: +${ins} new · ${upd} refreshed · ${skip} already answered/resolved (untouched)`);
console.log("  build rows by status:", n.map((x) => `${x.status} ${x.n}`).join(" · "));
await c.end();
