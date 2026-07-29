#!/usr/bin/env node
/* Harvest Ella's saved answers (ella_answers table) back into the course sources.
 *
 * - synth-<slug> ids  → matched to docs/sources/peace-corps/rejected-sentences.json entries;
 *   her Waray is written into the entry's `ella` field. On the next `npm run course`,
 *   gen-pc-course.mjs REPLACES the rejected sentence with hers instead of dropping the item,
 *   and the verify site stops listing it as missing.
 * - other ids (dialect questions) → printed for manual application (each changes different
 *   things: variants, course words, dictionary…).
 *
 * Run: npm run harvest   (then `npm run all` to rebuild + reload with her answers)
 */
import pg from "pg";
import fs from "fs";

const JSON_PATH = "docs/sources/peace-corps/rejected-sentences.json";
const slug = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const answers = (await c.query("select id, answer from ella_answers order by id")).rows;
await c.end();

const rejected = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const bySlug = new Map(rejected.map((r) => ["synth-" + slug(r.waray), r]));
let applied = 0, dialect = [];
for (const a of answers) {
  const r = bySlug.get(a.id);
  if (r) { if (r.ella !== a.answer) { r.ella = a.answer; applied++; } }
  else if (a.id.startsWith("synth-")) console.warn("⚠ no rejected entry matches", a.id);
  else dialect.push(a);
}
if (applied) fs.writeFileSync(JSON_PATH, JSON.stringify(rejected, null, 1));
const answered = rejected.filter((r) => r.ella).length;
console.log(`✓ harvested ${answers.length} answer(s): ${applied} newly applied to rejected-sentences.json (${answered}/${rejected.length} answered total)`);
if (answered) console.log("  → run `npm run all` to fold them back into the course.");
for (const d of dialect) console.log(`  dialect answer [${d.id}]: ${d.answer}  ← apply manually (variants/courses/dictionary)`);
