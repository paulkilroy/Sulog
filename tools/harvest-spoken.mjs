#!/usr/bin/env node
/* Capture live per-word TTS overrides back into committed source.
 *
 * The in-app A/B editor writes dictionary.spoken LIVE (great for tuning). This tool folds those
 * values into docs/dictionary/lexicon-extras.json (attrs.<waray>.spoken) so a from-scratch rebuild
 * reproduces them and `npm run check` stays green. Run after tuning overrides, then commit the file.
 *
 * Read-only on the DB; only writes the local JSON. Needs SUPABASE_DB_URL.
 */
import pg from "pg";
import fs from "fs";

if (!(process.env.SUPABASE_DB_URL || "").includes("kdtzfaobcgprivsxkger")) {
  console.error("✗ SUPABASE_DB_URL is not the Sulog project — refusing to harvest.");
  process.exit(1);
}
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const live = (await c.query("select waray, spoken from dictionary where spoken is not null and spoken <> '' order by waray")).rows;
await c.end();

const path = "docs/dictionary/lexicon-extras.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));
data.attrs = data.attrs || {};
const liveSet = new Set(live.map((r) => r.waray));
let added = 0, changed = 0, cleared = 0;
for (const { waray, spoken } of live) {
  const a = data.attrs[waray] || (data.attrs[waray] = {});
  if (a.spoken === spoken) continue;
  if (a.spoken == null) added++; else changed++;
  a.spoken = spoken;
}
// a spoken override cleared live should be dropped from the committed file too
for (const [w, a] of Object.entries(data.attrs)) {
  if (a && a.spoken != null && !liveSet.has(w)) { delete a.spoken; cleared++; }
}
fs.writeFileSync(path, JSON.stringify(data, null, 1) + "\n");
console.log(`✓ harvested ${live.length} spoken override(s) → ${path}  (+${added} new · ${changed} changed · ${cleared} cleared)`);
if (added || changed || cleared) console.log("  commit lexicon-extras.json so the rebuild reproduces them.");
else console.log("  already in sync — nothing to commit.");
