#!/usr/bin/env node
/* Sync docs/dictionary/gloss-overrides.json to the live DB — BOTH layers:
   - dictionary.meaning gets the flattened display/grading string ("sense1 / sense2")
   - meanings gets ONE ROW PER SENSE (the relational truth the schema was designed for)
   Idempotent. Run after editing the overrides file. */
import pg from "pg";
import fs from "fs";
const G = JSON.parse(fs.readFileSync("docs/dictionary/gloss-overrides.json", "utf8"));
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
let cards = 0, senses = 0;
for (const [w, m] of Object.entries(G)) {
  if (w.startsWith("_")) continue;
  const r = await c.query("update dictionary set meaning=$2 where waray=$1 and meaning<>$2", [w, m]);
  cards += r.rowCount;
  // the combined string is a CARD rendering, not a sense — remove it from meanings if present
  await c.query("delete from meanings where waray=$1 and meaning=$2", [w, m]);
  const parts = m.split("/").map((x) => x.trim()).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const q = await c.query(`insert into meanings (waray, meaning, sources, confirmed, ord) values ($1,$2,$3,false,$4)
      on conflict (waray, meaning) do update set ord = excluded.ord`, [w, parts[i], ["waray"], i + 1]);
    senses += q.rowCount;
  }
}
console.log(`✓ ${cards} card strings updated · ${senses} sense rows upserted across ${Object.keys(G).length - 1} words`);
await c.end();
