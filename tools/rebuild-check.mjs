#!/usr/bin/env node
/* THE REPRODUCIBILITY ALARM. Rebuilds the entire content DB from committed sources into a
 * throwaway `scratch` schema (same seed, same enrichment tools, judgment tables copied in —
 * they're permanent by contract), then diffs scratch against live. Any difference means
 * someone hand-edited content in the DB that a from-scratch rebuild would NOT reproduce —
 * the class of drift that caused the word-bank archaeology of July 2026.
 *
 * Run: npm run check   (≈1 min; --keep leaves the scratch schema behind for inspection)
 * Exits 1 on drift. Compares content SHAPE — volatile fields (courses.version, meanings.id)
 * are excluded by design.
 */
import pg from "pg";
import fs from "fs";
import { execSync } from "child_process";

const url = process.env.SUPABASE_DB_URL || "";
if (!url) { console.error("Set SUPABASE_DB_URL (node --env-file=.env.local …)"); process.exit(1); }
if (!url.includes("kdtzfaobcgprivsxkger")) { console.error("✗ refusing: not the Sulog project"); process.exit(1); }
// the Supabase pooler drops startup options, so schema targeting uses SULOG_SEARCH_PATH
// (a hook in each enrichment tool) + explicit set search_path on this script's own clients

let c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, keepAlive: true });
await c.connect();
c.on("error", () => {});   // don't let a mid-flight pooler drop crash the process — queryRetry reconnects
// the Supabase pooler intermittently resets these heavier cross-schema EXCEPT reads. Reconnect and
// retry rather than fail the whole check on a transient drop (the scratch schema persists in the DB).
const CONN_CODES = new Set(["ECONNRESET", "EPIPE", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "57P01"]);
const isConnErr = (e) => CONN_CODES.has(e?.code) || /ECONNRESET|EPIPE|Connection terminated|terminating connection|timeout|server closed/i.test(e?.message || "");
async function queryRetry(sql, tries = 4) {
  for (let a = 1; ; a++) {
    try { return await c.query(sql); }
    catch (e) {
      if (a >= tries || !isConnErr(e)) throw e;
      try { await c.end(); } catch {}
      await new Promise((r) => setTimeout(r, 800 * a));
      c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, keepAlive: true });
      c.on("error", () => {});
      await c.connect();
    }
  }
}

console.log("building scratch schema from committed sources…");
await c.query("drop schema if exists scratch cascade; create schema scratch;");
// content tables + word_usage view (unqualified DDL lands in scratch via search_path)
const sc = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await sc.connect();
await sc.query("set search_path to scratch");
await sc.query(fs.readFileSync("docs/schema/schema.sql", "utf8"));
// judgment tables are PERMANENT by contract — a real from-scratch rebuild starts with them
await sc.query("create table scratch.native_confirmations as select * from public.native_confirmations");
console.log("  schema ✓ · judgment tables copied ✓");
process.stdout.write("  loading committed seed… ");
await sc.query(fs.readFileSync("docs/schema/pc-course.sql", "utf8"));
console.log("✓");
await sc.end();

// the exact enrichment pipeline reload runs, pointed at scratch
const STEPS = ["load-lexicon-extras.mjs", "build-meanings.mjs --apply", "sync-meaning-overrides.mjs", "fill-pronunciation.mjs --apply",
  "confirm-from-book.mjs --apply", "replay-confirmations.mjs"];
for (const s of STEPS) {
  process.stdout.write(`  ${s.split(" ")[0]}… `);
  execSync(`node tools/${s}`, { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, SULOG_SEARCH_PATH: "scratch" } });
  console.log("✓");
}

console.log("\ndiffing live vs scratch…");
// [table, comparable column list] — volatile/serial fields excluded by design
const TABLES = [
  ["courses", "id,name,lang,methodology"],
  ["phases", "id,course_id,ord,name,can_do"],
  ["units", "id,phase_id,ord,name,theme,can_do"],
  ["lessons", "id,unit_id,ord,title"],
  ["lesson_blocks", "id,lesson_id,ord,type,title,body_md,formula,footnote,about,drill_kind,drill_modality,drill_hint,drill_direction,assess_scope,assess_pool,assess_select,assess_n,assess_threshold,assess_gate,review_target,review_mode,story_id"],
  ["block_items", "block_id,ord,dict_waray,expr_id,role"],   // id is serial (not in the seed) — surface identity only
  ["expressions", "id,waray,translation,alt_translations,focus,components"],
  // `variants` is intentionally EXCLUDED: build-meanings UNIONS Tramp spelling-variant matches into it
  // every reload, so the live column is a monotonic accumulation across the whole history of runs (and
  // shifting Tramp data), which a single fresh build can never reproduce. It's a search/matching cache,
  // not source-of-truth — every meaning-bearing column below is still checked.
  ["dictionary", "waray,kind,meaning,pronunciation,spoken,pos,root,loan,confirmed,confirmed_by"],
  ["meanings", "waray,meaning,pos,pronunciation,(select array(select unnest(sources) order by 1)) as sources,confirmed,ord"],
];
let drift = 0;
for (const [t, cols] of TABLES) {
  const q = (schema) => `select ${cols} from ${schema}.${t}`;
  // sequential (not Promise.all) — one heavy EXCEPT at a time is easier on the pooler
  const live = await queryRetry(`select count(*) n from (${q("public")} except ${q("scratch")}) x`);
  const scratch = await queryRetry(`select count(*) n from (${q("scratch")} except ${q("public")}) x`);
  const l = +live.rows[0].n, s = +scratch.rows[0].n;
  if (l || s) {
    drift += l + s;
    console.log(`  ✗ ${t}: ${l} row(s) only in LIVE, ${s} only in SCRATCH`);
    const sample = await queryRetry(`(${q("public")} except ${q("scratch")}) limit 3`);
    for (const r of sample.rows) console.log(`      live-only: ${JSON.stringify(r).slice(0, 140)}`);
    const sample2 = await queryRetry(`(${q("scratch")} except ${q("public")}) limit 3`);
    for (const r of sample2.rows) console.log(`      scratch-only: ${JSON.stringify(r).slice(0, 140)}`);
  } else console.log(`  ✓ ${t}`);
}
if (!process.argv.includes("--keep")) await queryRetry("drop schema scratch cascade");
else console.log("\n(scratch schema kept — inspect with search_path=scratch, drop it when done)");
await c.end();
if (drift) { console.error(`\n✗ DRIFT: ${drift} row(s) differ — the live DB contains hand-edits a rebuild would not reproduce. Move them into committed sources (meaning-overrides / seed / judgment tables).`); process.exit(1); }
console.log("\n✓ NO DRIFT — a from-scratch rebuild reproduces the live content DB exactly.");
