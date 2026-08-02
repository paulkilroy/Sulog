/* HARVEST: fold Review-Queue-APPROVED exercise answers back into the course source.
   The reviewer answers a build question (a/b/other) → the admin approves → applyAnswer writes an
   append-only content_changes row. This script collects those approvals into
   docs/sources/peace-corps/rejected-sentences.json's `.ella` field (the native-confirmed answer),
   which gen-pc-course.mjs restores into the lesson on the next rebuild.
   (Replaces the retired harvest-ella.mjs / ella_answers path.)
   Idempotent; prints "changed N" and exits 0. Run: SUPABASE_DB_URL=… node tools/harvest-approvals.mjs */
import pg from "pg";
import fs from "fs";

const EXPECTED_REF = "kdtzfaobcgprivsxkger";
if (!(process.env.SUPABASE_DB_URL || "").includes(EXPECTED_REF)) {
  console.error(`✗ SUPABASE_DB_URL must point at ${EXPECTED_REF}`); process.exit(1);
}
const slug = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const FILE = "docs/sources/peace-corps/rejected-sentences.json";
const REJECTED = JSON.parse(fs.readFileSync(FILE, "utf8"));

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const approvals = (await c.query(`
  select f.stable_key, cc.after_val, cc.approved_at
  from content_changes cc join feedback f on f.id = cc.feedback_id
  where f.source = 'build' and f.kind in ('missing_answer','needs_native_confirm')
    and cc.target_type = 'exercise' and f.decision = 'applied'
  order by cc.id`)).rows;
await c.end();

let changed = 0;
for (const a of approvals) {
  const text = a.after_val?.waray;
  if (!text || !a.stable_key) continue;
  const r = REJECTED.find((x) => `sent:${x.lesson}:${slug(x.waray)}` === a.stable_key);
  if (!r) { console.warn(`  ⚠ no rejected-sentences entry for ${a.stable_key}`); continue; }
  if (r.ella === text) continue;                               // already folded
  r.ella = text;                                               // native-confirmed answer — gen-pc-course restores it
  r.confirmed_via = "review-queue";
  r.approved_at = String(a.approved_at).slice(0, 10);
  changed++;
}
if (changed) fs.writeFileSync(FILE, JSON.stringify(REJECTED, null, 1) + "\n");
console.log(`harvest: ${approvals.length} approvals · changed ${changed}${changed ? " — regenerate pc-course.sql before reloading" : ""}`);
