#!/usr/bin/env node
/* Replay native_confirmations (the durable judgment table — survives every content rebuild)
   onto the dictionary: her confirmed meaning/pronunciation win over whatever the extraction
   produced, confirmed=true, confirmed_by from the record. Runs inside `npm run reload` as the
   LAST confirmation step, so a from-scratch build ends with every human judgment restored. */
import pg from "pg";
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
if (process.env.SULOG_SEARCH_PATH) await c.query(`set search_path to ${process.env.SULOG_SEARCH_PATH}`); // rebuild-check points tools at the scratch schema
const recs = (await c.query("select waray, meaning, pronunciation, by_whom from native_confirmations")).rows;
let applied = 0, senses = 0, missing = [];
for (const r of recs) {
  const u = await c.query(
    `update dictionary set meaning=$2, pronunciation=coalesce($3, pronunciation), confirmed=true, confirmed_by=$4
     where waray=$1 and (meaning<>$2 or not confirmed or confirmed_by is distinct from $4)`,
    [r.waray, r.meaning, r.pronunciation, r.by_whom]);
  applied += u.rowCount;
  // Also confirm the matching SENSE row. build-meanings populated meanings from the dictionary
  // BEFORE this replay runs, so a from-scratch build leaves the human-confirmed sense unconfirmed
  // otherwise (the same propagation gap confirm-from-book had). Confirms the sense whose text the
  // native reviewer confirmed; if the reviewer corrected the gloss, build-meanings has its own row
  // for the new text, so ensure that exists and is confirmed.
  const s = await c.query(
    `insert into meanings (waray, meaning, pos, sources, confirmed, ord)
       select $1, $2, d.pos, coalesce((select array(select distinct unnest(sources) from meanings where waray=$1)), '{}'), true, 1
       from dictionary d where d.waray=$1
     on conflict (waray, meaning) do update set confirmed = true`,
    [r.waray, r.meaning]);
  senses += s.rowCount;
  if (!(await c.query("select 1 from dictionary where waray=$1", [r.waray])).rowCount) missing.push(r.waray);
}
console.log(`✓ replayed ${recs.length} native confirmation(s): ${applied} dictionary + ${senses} sense row(s) updated`);
if (missing.length) console.log(`  ⚠ confirmed words no longer in the dictionary (course dropped them): ${missing.join(", ")}`);
await c.end();
