#!/usr/bin/env node
/* Ingestion: reload the Peace Corps course into the live DB from docs/schema/pc-seed.sql,
 * then regenerate the "Course vs. Book" verification page so it always reflects what's live.
 *
 * Pipeline:  node tools/gen-pc-seed.mjs      # rebuild pc-seed.sql from the Gemini blocks
 *            node tools/reload-pc.mjs        # THIS: load it, bump version, regen the preview
 *
 * One transaction: purge the old pc-* rows, load the fresh seed, drop orphaned unconfirmed
 * dictionary rows (parser artifacts), and bump courses.version so every connected app
 * auto-refetches its cache. Requires SUPABASE_DB_URL (never hardcode the password).
 */
import pg from "pg";
import fs from "fs";
import { execSync } from "child_process";

const seed = fs.readFileSync("docs/schema/pc-seed.sql", "utf8");
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
await c.connect();
const one = async (s) => (await c.query(s)).rows[0];
const counts = "select (select count(*) from lessons where id like 'pc-%') l, (select count(*) from lesson_blocks where lesson_id like 'pc-%') b, (select count(*) from block_items bi join lesson_blocks lb on lb.id=bi.block_id where lb.lesson_id like 'pc-%') i, (select count(*) from expressions where id>=20000) e";
console.log("BEFORE:", await one(counts));

try {
  await c.query("begin");
  await c.query("update lesson_blocks set review_target=null where lesson_id like 'pc-%'"); // drop self-refs first
  await c.query("delete from block_items where block_id in (select id from lesson_blocks where lesson_id like 'pc-%')");
  await c.query("delete from lesson_blocks where lesson_id like 'pc-%'");
  await c.query("delete from lessons where id like 'pc-%'");
  await c.query("delete from units where id like 'pc-%'");
  await c.query("delete from phases where id like 'pc-%'");
  await c.query("delete from expressions where id >= 20000");
  await c.query("delete from courses where id='pc'");
  await c.query("delete from dictionary where waray like '-%' and confirmed=false"); // stale hyphen roots from a buggy load
  await c.query(seed); // fresh pc-seed.sql
  // purge unconfirmed dictionary rows no lesson references anymore — parser artifacts (leaked example
  // sentences, garbled multi-word marker cells). confirmed rows are safe.
  const purged = await c.query(`delete from dictionary d where confirmed=false
      and not exists (select 1 from block_items   bi where bi.dict_waray=d.waray)
      and not exists (select 1 from expressions    e where e.focus=d.waray)
      and not exists (select 1 from lesson_blocks lb where lb.about=d.waray)
      returning waray`);
  console.log("purged", purged.rowCount, "orphaned dict rows:", purged.rows.map((r) => r.waray).join(", "));
  // bump the course version so every connected app auto-refreshes its cached copy on next load
  await c.query("update courses set version = (extract(epoch from clock_timestamp())*1000)::bigint where id='pc'");
  await c.query("commit");
  console.log("✓ committed");
} catch (e) { await c.query("rollback"); console.error("✗ rolled back:", e.message); process.exit(1); }

console.log("AFTER: ", await one(counts));
await c.end();

// regenerate the side-by-side verification page from the now-live DB
console.log("\nregenerating course preview…");
execSync("node tools/gen-course-preview.mjs", { stdio: "inherit", env: process.env });
