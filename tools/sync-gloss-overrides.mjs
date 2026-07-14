#!/usr/bin/env node
/* Sync docs/dictionary/gloss-overrides.json (the COMMITTED per-sense truth for homograph /
   double-duty words) to the live DB — both layers:
   - dictionary.meaning gets the flattened display/grading string (`card`)
   - meanings gets ONE ROW PER SENSE with its sources, per-sense pronunciation, confirmed flag
   Idempotent; runs inside `npm run reload` so a scratch rebuild reproduces the homograph
   audit. Edit the JSON, never the DB. */
import pg from "pg";
import fs from "fs";
const G = JSON.parse(fs.readFileSync("docs/dictionary/gloss-overrides.json", "utf8"));
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
if (process.env.SULOG_SEARCH_PATH) await c.query(`set search_path to ${process.env.SULOG_SEARCH_PATH}`); // rebuild-check points tools at the scratch schema
let cards = 0, senses = 0;
for (const [w, v] of Object.entries(G)) {
  if (w.startsWith("_")) continue;
  const card = typeof v === "string" ? v : v.card;
  const r = await c.query("update dictionary set meaning=$2 where waray=$1 and meaning<>$2", [w, card]);
  cards += r.rowCount;
  // the combined string is a CARD rendering, not a sense — remove it from meanings if present
  if (card.includes("/")) await c.query("delete from meanings where waray=$1 and meaning=$2", [w, card]);
  const list = typeof v === "string"
    ? v.split("/").map((x, i) => ({ meaning: x.trim(), sources: [], confirmed: false, ord: i + 1 })).filter((x) => x.meaning)
    : v.senses;
  for (const s of list) {
    const q = await c.query(
      `insert into meanings (waray, meaning, pos, pronunciation, sources, confirmed, ord)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (waray, meaning) do update set ord = excluded.ord,
         pos = coalesce(excluded.pos, meanings.pos),
         pronunciation = coalesce(excluded.pronunciation, meanings.pronunciation),
         sources = (select array(select distinct unnest(meanings.sources || excluded.sources))),
         confirmed = meanings.confirmed or excluded.confirmed`,
      [w, s.meaning, s.pos || null, s.pronunciation || null, s.sources || [], !!s.confirmed, s.ord]);
    senses += q.rowCount;
  }
}
console.log(`✓ gloss-overrides: ${cards} card strings updated · ${senses} sense rows upserted across ${Object.keys(G).length - 1} words`);
await c.end();
