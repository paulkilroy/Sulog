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
let applied = 0, missing = [];
for (const r of recs) {
  const u = await c.query(
    `update dictionary set meaning=$2, pronunciation=coalesce($3, pronunciation), confirmed=true, confirmed_by=$4
     where waray=$1 and (meaning<>$2 or not confirmed or confirmed_by is distinct from $4)`,
    [r.waray, r.meaning, r.pronunciation, r.by_whom]);
  applied += u.rowCount;
  if (!(await c.query("select 1 from dictionary where waray=$1", [r.waray])).rowCount) missing.push(r.waray);
}
console.log(`✓ replayed ${recs.length} native confirmation(s): ${applied} row(s) updated`);
if (missing.length) console.log(`  ⚠ confirmed words no longer in the dictionary (course dropped them): ${missing.join(", ")}`);
await c.end();
